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
        vm.newLogEndTimeText = '';
        vm.lastQueryDayStart = moment.utc();
        vm.lastQueryDayEnd = moment.utc();
        vm.lastQueryDayTextStart = vm.lastQueryDayStart.format('YYYY-MM-DD');
        vm.lastQueryDayTextEnd = vm.lastQueryDayEnd.format('YYYY-MM-DD');
        vm.lastFutureQueryDayStart = moment.utc();
        vm.lastFutureQueryDayTextStart = vm.lastFutureQueryDayStart.format('YYYY-MM-DD');
        vm.lastFutureQueryDayEnd = moment.utc();
        vm.lastFutureQueryDayTextEnd = vm.lastFutureQueryDayEnd.format('YYYY-MM-DD');
        vm.validInlineStartTime = true;
        vm.validInlineEndTime = true;

        MonitorService.subscribe('userlogs', '*');

        vm.onTimeSet = function (value, target, attribute) {
            target[attribute] = $filter('date')(value, datetime_format);
        };

        vm.verifyDateTimeString = function (input) {
            return moment.utc(input, 'YYYY-MM-DD HH:mm:ss', true).isValid();
        };

        vm.verifyInlineInputs = function () {
            vm.validInlineStartTime = vm.verifyDateTimeString(vm.newLogStartTimeText);
            vm.validInlineEndTime = vm.verifyDateTimeString(vm.newLogEndTimeText) || vm.newLogEndTimeText.length === 0;
            return vm.validInlineStartTime && vm.validInlineEndTime;
        };

        vm.addNewInlineLog = function () {
            if (!vm.newLogContent) {
                return;
            }

            if (!vm.newLogStartTimeText) {
                vm.newLogStartTime = $rootScope.utcDateTime;
                vm.newLogStartTimeText = $filter('date')(vm.newLogStartTime, datetime_format);
            }

            if (!vm.verifyInlineInputs()) {
                return;
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
                return (tag.name.toLowerCase().indexOf(query.toLowerCase()) === 0 && tag.activated);
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
                var start = vm.lastQueryDayStart.format('YYYY-MM-DD 00:00:00');
                var end = vm.lastQueryDayEnd.format('YYYY-MM-DD 23:59:59');
                UserLogService.listUserLogsForTimeRange(start, end).then(function () {
                    vm.lastQueryDayStart = vm.lastQueryDayStart.subtract(1, 'w').subtract(1, 'd');
                    vm.lastQueryDayEnd = vm.lastQueryDayEnd.subtract(1, 'd');
                    vm.lastQueryDayTextStart = vm.lastQueryDayStart.format('YYYY-MM-DD');
                    vm.lastQueryDayTextEnd = vm.lastQueryDayEnd.format('YYYY-MM-DD');
                    vm.lastFutureQueryDayStart = vm.lastFutureQueryDayStart.add(1, 'd');
                    vm.lastFutureQueryDayTextStart = vm.lastFutureQueryDayStart.format('YYYY-MM-DD');
                    vm.lastFutureQueryDayEnd = vm.lastFutureQueryDayEnd.add(1, 'w').add(1, 'd');
                    vm.lastFutureQueryDayTextEnd = vm.lastFutureQueryDayEnd.format('YYYY-MM-DD');
                });
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
            vm.fetchingPastLogs = true;
            var start = vm.lastQueryDayStart.format('YYYY-MM-DD 00:00:00');
            var end = vm.lastQueryDayEnd.format('YYYY-MM-DD 23:59:59');
            UserLogService.listUserLogsForTimeRange(start, end).then(function () {
                vm.lastQueryDayStart = vm.lastQueryDayStart.subtract(1, 'w');
                vm.lastQueryDayEnd = vm.lastQueryDayEnd.subtract(1, 'w').subtract(1, 'd');
                vm.lastQueryDayTextStart = vm.lastQueryDayStart.format('YYYY-MM-DD');
                vm.lastQueryDayTextEnd = vm.lastQueryDayEnd.format('YYYY-MM-DD');
                vm.fetchingPastLogs = false;
            }, function () {
                vm.fetchingPastLogs = false;
            });
        };

        vm.fetchMoreFutureLogs = function () {
            vm.fetchingFutureLogs = true;
            var start = vm.lastFutureQueryDayStart.format('YYYY-MM-DD 00:00:00');
            var end = vm.lastFutureQueryDayEnd.format('YYYY-MM-DD 23:59:59');
            UserLogService.listUserLogsForTimeRange(start, end).then(function () {
                vm.lastFutureQueryDayStart = vm.lastFutureQueryDayStart.add(1, 'w').add(1, 'd');
                vm.lastFutureQueryDayTextStart = vm.lastFutureQueryDayStart.format('YYYY-MM-DD');
                vm.lastFutureQueryDayEnd = vm.lastFutureQueryDayEnd.add(1, 'w').add(1, 'd');
                vm.lastFutureQueryDayTextEnd = vm.lastFutureQueryDayEnd.format('YYYY-MM-DD');
                vm.fetchingFutureLogs = false;
            }, function () {
                vm.fetchingFutureLogs = false;
            });
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
