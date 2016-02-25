(function () {

    angular.module('katGui')
        .directive('fileModel', ['$parse', function ($parse) {
            return {
                restrict: 'A',
                link: function(scope, element, attrs) {
                    var model = $parse(attrs.fileModel);
                    var modelSetter = model.assign;

                    element.bind('change', function(){
                        scope.$apply(function(){
                            modelSetter(scope, element[0].files);
                        });
                    });
                }
            };
        }])
        .controller('UserlogCtrl', UserlogCtrl);

    function UserlogCtrl(MonitorService, $localStorage, $interval, $mdDialog, $scope, $rootScope, $filter, $log, $timeout, UserLogService) {

        var vm = this;
        var datetime_format = 'yyyy-MM-dd HH:mm:ss';
        UserLogService.userlogs = [];
        vm.userLogs = UserLogService.userlogs;
        vm.tags = UserLogService.tags;
        if ($localStorage.filterTags) {
            vm.filterTags = $localStorage.filterTags;
        } else {
            vm.filterTags = [];
        }

        vm.chosen_tags = [];
        vm.includeActivityLogs = false;
        vm.newLogStartTimeText = '';
        vm.lastQueryDay = moment.utc();
        vm.lastQueryDayText = vm.lastQueryDay.format('YYYY-MM-DD');
        vm.lastFutureQueryDay = moment.utc();
        vm.lastFutureQueryDayText = vm.lastFutureQueryDay.format('YYYY-MM-DD');

        MonitorService.subscribe('userlogs', '*');
        vm.subscribeToUserlogs = function () {
            if (MonitorService.connection) {

            } else {
                $timeout(vm.subscribeToUserlogs, 2000);
            }
        };

        vm.onTimeSet = function (value, target, attribute) {
            target[attribute] = $filter('date')(value, datetime_format);
        };

        vm.addNewInlineLog = function () {
            if (!vm.newLogContent) {
                return;
            }
            // TODO check datetime formats
            if (!vm.newLogStartTimeText) {
                vm.newLogStartTime = $rootScope.utcDateTime;
                vm.newLogStartTimeText = $filter('date')(vm.newLogStartTime, datetime_format);
            }
            var tagIdList = [];
            vm.filterTags.forEach(function (tag) {
                tagIdList.push(tag.id);
            });
            var newLog = {
                user: $rootScope.currentUser.id,
                start_time: vm.newLogStartTimeText,
                end_time: vm.newLogEndTimeText,
                content: vm.newLogContent,
                tag_ids: tagIdList
            };
            UserLogService.addUserLog(newLog).then(function (result) {
                vm.newLogStartTime = $rootScope.utcDateTime;
                vm.newLogEndTime = '';
                vm.newLogContent = '';
            });
        };

        vm.querySearch = function (query) {
            var results = query ? vm.tags.filter(vm.createFilterFor(query)) : [];
            return results;
        };

        vm.createFilterFor = function (query) {
            return function filterFn(tag) {
                return (tag.name.indexOf(query) === 0 && tag.activated);
            };
        };

        vm.tagFilterChanged = function () {
            $localStorage.filterTags = vm.filterTags;
        };

        vm.filterByTag = function (userlog) {
            if (vm.filterTags.length === 0) {
                return true;
            }
            var matchCount = 0;
            for (var i = 0; i < userlog.tags.length; i++) {
                if (_.findIndex(vm.filterTags, {name: userlog.tags[i].name}) > -1) {
                    matchCount++;
                }
            }
            return matchCount > 0 && matchCount === vm.filterTags.length;
        };

        vm.filterAfterNow = function (userlog) {
            return userlog.start_time > vm.newLogStartTimeText || (!vm.newLogStartTimeText || vm.newLogStartTimeText.length === 0);
        };

        vm.filterBeforeNow = function (userlog) {
            return userlog.start_time <= vm.newLogStartTimeText;
        };

        vm.addUserLog = function (event) {
            var newUserLog = {
                start_time: vm.newLogStartTimeText,
                end_time: '',
                tags: vm.filterTags,
                user_id: $rootScope.currentUser.id,
                content: '',
                attachments: []
            };
            vm.editUserLog(newUserLog, event);
        };

        vm.editUserLog = function (userlog, event) {
            UserLogService.editUserLog(userlog, $rootScope.currentUser.id === userlog.user_id, event);
        };

        vm.afterInit = function() {
            UserLogService.listTags().then(function () {
                var start = vm.lastQueryDay.format('YYYY-MM-DD 00:00:00');
                var end = vm.lastQueryDay.format('YYYY-MM-DD 23:59:59');
                UserLogService.listUserLogsForTimeRange(start, end);
                vm.lastQueryDay = vm.lastQueryDay.subtract(1, 'd');
                vm.lastQueryDayText = vm.lastQueryDay.format('YYYY-MM-DD');
                vm.lastFutureQueryDay = vm.lastFutureQueryDay.add(1, 'd');
                vm.lastFutureQueryDayText = vm.lastFutureQueryDay.format('YYYY-MM-DD');
            });
        };

        $interval(function () {
            if (vm.chatMode) {
                vm.newLogStartTimeText = $rootScope.utcDateTime;
            }
        }, 1000);

        $scope.$watchCollection('vm.filterTags', function (newValue) {
            vm.chatMode = _.findIndex(vm.filterTags, {name: 'chat'}) > -1;
        });

        if ($rootScope.utcDateTime) {
            vm.newLogStartTimeText = $rootScope.utcDateTime;
        } else {
            vm.undbindutcDateTimeSet = $rootScope.$on('utcDateTimeSet', function (event, value) {
                vm.newLogStartTimeText = value;
            });
        }

        if ($rootScope.currentUser) {
            vm.afterInit();
        } else {
            vm.unbindLoginSuccess = $rootScope.$on('loginSuccess', vm.afterInit);
        }

        vm.fetchMoreLogs = function () {
            var start = vm.lastQueryDay.format('YYYY-MM-DD 00:00:00');
            var end = vm.lastQueryDay.format('YYYY-MM-DD 23:59:59');
            UserLogService.listUserLogsForTimeRange(start, end);
            vm.lastQueryDay = vm.lastQueryDay.subtract(1, 'd');
            vm.lastQueryDayText = vm.lastQueryDay.format('YYYY-MM-DD');
        };

        vm.fetchMoreFutureLogs = function () {
            var start = vm.lastFutureQueryDay.format('YYYY-MM-DD 00:00:00');
            var end = vm.lastFutureQueryDay.format('YYYY-MM-DD 23:59:59');
            UserLogService.listUserLogsForTimeRange(start, end);
            vm.lastFutureQueryDay = vm.lastFutureQueryDay.add(1, 'd');
            vm.lastFutureQueryDayText = vm.lastFutureQueryDay.format('YYYY-MM-DD');
        };

        $scope.$on('$destroy', function () {
            if (vm.unbindLoginSuccess) {
                vm.unbindLoginSuccess();
            }
            if (vm.undbindutcDateTimeSet) {
                vm.undbindutcDateTimeSet();
            }
            MonitorService.unsubscribe('userlogs', '*');
        });
        //TODO keyboard shortcuts
    }
})();
