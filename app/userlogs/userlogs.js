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
        var momentjsFormat = 'YYYY-MM-DD HH:mm:ss';
        UserLogService.userlogs = [];
        vm.userLogs = UserLogService.userlogs;
        vm.tags = UserLogService.tags;
        vm.filterTags = $localStorage.filterTags;
        vm.inlineTags = $localStorage.inlineTags;
        if (!vm.filterTags) {
            vm.filterTags = [];
        }
        if (!vm.inlineTags) {
            vm.inlineTags = [];
        }

        vm.chatMode = _.findIndex(vm.inlineTags, {name: 'chat'}) > -1;
        vm.containsInvalidInlineTagSelection = false;
        vm.mandatoryTagsListString = UserLogService.mandatoryTagsListString;

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

        vm.orderByFields = [
            { value: 'start_time', reverse: true },
            { value: 'end_time', reverse: false },
        ];
        vm.orderBy = vm.orderByFields[0];

        vm.setOrderBy = function (name) {
            var index = _.findIndex(vm.orderByFields, {value: name});
            if (index > -1) {
                vm.orderByFields[index].reverse = vm.orderBy.value === name ? !vm.orderBy.reverse : vm.orderBy.reverse;
                vm.orderBy = vm.orderByFields[index];
                if (vm.orderBy.value === 'end_time' && !vm.newLogEndTimeText) {
                    vm.newLogEndTimeText = $rootScope.utcDateTime;
                }
            }
        };

        vm.orderByValueFunction = function (userlog) {
            //if there is no end time, we sort it as if it is in the future
            return userlog[vm.orderBy.value] ? userlog[vm.orderBy.value] : '9999-01-01 00:00:00';
        };

        MonitorService.subscribe('userlogs', '*');

        vm.onTimeSet = function (value, target, attribute) {
            target[attribute] = $filter('date')(value, 'yyyy-MM-dd HH:mm:ss');
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
            vm.inlineTagFilterChanged();
            if (!vm.newLogContent || !vm.verifyInlineInputs() || vm.containsInvalidInlineTagSelection) {
                return;
            }

            if (!vm.newLogStartTimeText) {
                vm.newLogStartTimeText = moment($rootScope.utcDateTime, momentjsFormat).subtract(5, 'm').format(momentjsFormat);
            }
            if (!vm.newLogEndTimeText) {
                vm.newLogEndTimeText = $rootScope.utcDateTime;
            }

            var tagIdList = [];
            vm.filterTags.forEach(function (tag) {
                tagIdList.push(tag.id);
            });
            vm.inlineTags.forEach(function (tag) {
                tagIdList.push(tag.id);
            });
            tagIdList = _.uniq(tagIdList);

            var newLog = {
                user: $rootScope.currentUser.id,
                start_time: vm.newLogStartTimeText,
                end_time: vm.newLogEndTimeText,
                content: vm.newLogContent,
                tag_ids: tagIdList
            };
            UserLogService.addUserLog(newLog).then(function (result) {
                if (vm.chatMode) {
                    vm.newLogStartTimeText = $rootScope.utcDateTime;
                } else {
                    vm.newLogStartTimeText = moment($rootScope.utcDateTime, momentjsFormat).subtract(5, 'm').format(momentjsFormat);
                }

                vm.newLogEndTimeText = '';
                vm.newLogContent = '';
            });
        };

        vm.querySearch = function (query, resultsCollection) {
            var results = query ? vm.tags.filter(vm.createFilterFor(query, resultsCollection)) : [];
            return results;
        };

        vm.createFilterFor = function (query, resultsCollection) {
            return function filterFn(tag) {
                return (tag.name.toLowerCase().indexOf(query.toLowerCase()) === 0 && tag.activated) &&
                    !_.findWhere(resultsCollection, {id: tag.id});
            };
        };

        vm.tagFilterChanged = function () {
            $localStorage.filterTags = vm.filterTags;
            vm.containsInvalidInlineTagSelection = !vm.checkForMandatoryInlineTag();
            vm.showMandatoryTooltip = vm.containsInvalidInlineTagSelection;
        };

        vm.inlineTagFilterChanged = function () {
            $localStorage.inlineTags = vm.inlineTags;
            vm.containsInvalidInlineTagSelection = !vm.checkForMandatoryInlineTag();
            vm.showMandatoryTooltip = vm.containsInvalidInlineTagSelection;
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
            if (vm.orderBy.value === 'start_time' && vm.orderBy.reverse) {
                return userlog.start_time > vm.newLogStartTimeText || (!vm.newLogStartTimeText || vm.newLogStartTimeText.length === 0);
            } else if (vm.orderBy.value === 'start_time') {
                return userlog.start_time <= vm.newLogStartTimeText || (!vm.newLogStartTimeText || vm.newLogStartTimeText.length === 0);
            } else if (vm.orderBy.value === 'end_time' && vm.orderBy.reverse) {
                return userlog.end_time > vm.newLogEndTimeText || userlog.end_time.length === 0;
            } else if (vm.orderBy.value === 'end_time') {
                return userlog.end_time && userlog.end_time <= vm.newLogEndTimeText;
            }
        };

        vm.filterBeforeNow = function (userlog) {
            if (vm.orderBy.value === 'start_time' && vm.orderBy.reverse) {
                return userlog.start_time <= vm.newLogStartTimeText;
            } else if (vm.orderBy.value === 'start_time'){
                return userlog.start_time > vm.newLogStartTimeText;
            } else if (vm.orderBy.value === 'end_time' && vm.orderBy.reverse) {
                return userlog.end_time && userlog.end_time <= vm.newLogEndTimeText || (!vm.newLogEndTimeText || vm.newLogEndTimeText.length === 0);
            } else if (vm.orderBy.value === 'end_time') {
                return userlog.end_time > vm.newLogEndTimeText || userlog.end_time.length === 0;
            }
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
                    vm.lastQueryDayStart = vm.lastQueryDayStart.subtract(1, 'M').subtract(1, 'd');
                    vm.lastQueryDayEnd = vm.lastQueryDayEnd.subtract(1, 'd');
                    vm.lastQueryDayTextStart = vm.lastQueryDayStart.format('YYYY-MM-DD');
                    vm.lastQueryDayTextEnd = vm.lastQueryDayEnd.format('YYYY-MM-DD');
                    vm.lastFutureQueryDayStart = vm.lastFutureQueryDayStart.add(1, 'd');
                    vm.lastFutureQueryDayTextStart = vm.lastFutureQueryDayStart.format('YYYY-MM-DD');
                    vm.lastFutureQueryDayEnd = vm.lastFutureQueryDayEnd.add(1, 'M').add(1, 'd');
                    vm.lastFutureQueryDayTextEnd = vm.lastFutureQueryDayEnd.format('YYYY-MM-DD');
                });
            });
        };

        $interval(function () {
            if (vm.chatMode) {
                vm.newLogStartTimeText = $rootScope.utcDateTime;
            }
        }, 1000);

        $scope.$watchCollection('vm.inlineTags', function (newValue) {
            vm.chatMode = _.findIndex(vm.inlineTags, {name: 'chat'}) > -1;
        });

        if ($rootScope.utcDateTime) {
            vm.newLogStartTimeText = moment($rootScope.utcDateTime, momentjsFormat).subtract(5, 'm').format(momentjsFormat);
            vm.verifyInlineInputs();
        } else {
            vm.undbindutcDateTimeSet = $rootScope.$on('utcDateTimeSet', function (event, value) {
                vm.newLogStartTimeText = moment(value, momentjsFormat).subtract(5, 'm').format(momentjsFormat);
                vm.verifyInlineInputs();
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
                vm.lastQueryDayStart = vm.lastQueryDayStart.subtract(1, 'M').subtract(1, 'd');
                vm.lastQueryDayEnd = vm.lastQueryDayEnd.subtract(1, 'M').subtract(1, 'd');
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
                vm.lastFutureQueryDayStart = vm.lastFutureQueryDayStart.add(1, 'M').add(1, 'd');
                vm.lastFutureQueryDayTextStart = vm.lastFutureQueryDayStart.format('YYYY-MM-DD');
                vm.lastFutureQueryDayEnd = vm.lastFutureQueryDayEnd.add(1, 'M').add(1, 'd');
                vm.lastFutureQueryDayTextEnd = vm.lastFutureQueryDayEnd.format('YYYY-MM-DD');
                vm.fetchingFutureLogs = false;
            }, function () {
                vm.fetchingFutureLogs = false;
            });
        };

        vm.setNewLogStartTimeAfterFocus = function () {
            if (!vm.chatMode && !vm.newLogContent) {
                vm.newLogStartTimeText = moment($rootScope.utcDateTime, momentjsFormat).subtract(5, 'm').format(momentjsFormat);
                vm.verifyInlineInputs();
            }
        };

        vm.setInlineStartTimeBeforeLog = function (userlog) {
            var userlogsContainer = document.querySelector('#userlogsContainer');
            var scrollTopToKeep = userlogsContainer.scrollTop;
            if (vm.orderBy.value === 'start_time' && vm.orderBy.reverse) {
                vm.newLogStartTimeText = moment(userlog.start_time, momentjsFormat).subtract(1, 's').format(momentjsFormat);
            } else if (vm.orderBy.value === 'start_time'){
                vm.newLogStartTimeText = moment(userlog.start_time, momentjsFormat).add(1, 's').format(momentjsFormat);
            } else if (vm.orderBy.value === 'end_time' && vm.orderBy.reverse) {
                vm.newLogEndTimeText = moment(userlog.end_time, momentjsFormat).subtract(1, 's').format(momentjsFormat);
            } else if (vm.orderBy.value === 'end_time') {
                vm.newLogEndTimeText = moment(userlog.end_time, momentjsFormat).add(1, 's').format(momentjsFormat);
            }
            if (vm.orderBy.value === 'start_time' && !vm.verifyDateTimeString(vm.newLogStartTimeText)) {
                vm.newLogStartTimeText = $rootScope.utcDateTime;
            } else if (vm.orderBy.value === 'end_time' && !vm.verifyDateTimeString(vm.newLogEndTimeText)) {
                vm.newLogEndTimeText = $rootScope.utcDateTime;
            }
            vm.focusInlineContentInput();
            userlogsContainer.scrollTop = scrollTopToKeep;
        };

        vm.setInlineStartTimeAfterLog = function (userlog) {
            var userlogsContainer = document.querySelector('#userlogsContainer');
            var scrollTopToKeep = userlogsContainer.scrollTop;
            if (vm.orderBy.value === 'start_time' && vm.orderBy.reverse) {
                vm.newLogStartTimeText = moment(userlog.start_time, momentjsFormat).add(1, 's').format(momentjsFormat);
            } else if (vm.orderBy.value === 'start_time'){
                vm.newLogStartTimeText = moment(userlog.start_time, momentjsFormat).subtract(1, 's').format(momentjsFormat);
            } else if (vm.orderBy.value === 'end_time' && vm.orderBy.reverse) {
                vm.newLogEndTimeText = moment(userlog.end_time, momentjsFormat).add(1, 's').format(momentjsFormat);
            } else if (vm.orderBy.value === 'end_time') {
                vm.newLogEndTimeText = moment(userlog.end_time, momentjsFormat).subtract(1, 's').format(momentjsFormat);
            }
            if (vm.orderBy.value === 'start_time' && !vm.verifyDateTimeString(vm.newLogStartTimeText)) {
                vm.newLogStartTimeText = $rootScope.utcDateTime;
            } else if (vm.orderBy.value === 'end_time' && !vm.verifyDateTimeString(vm.newLogEndTimeText)) {
                vm.newLogEndTimeText = $rootScope.utcDateTime;
            }
            vm.focusInlineContentInput();
            userlogsContainer.scrollTop = scrollTopToKeep;
        };

        vm.focusInlineContentInput = function () {
            document.getElementById("inlineContentInput").focus();
        };

        vm.checkForMandatoryInlineTag = function () {
            var containsMandatoryTags = false;
            vm.filterTags.forEach(function (tag) {
                if (UserLogService.mandatoryTagsList.indexOf(tag.name.toLowerCase()) > -1) {
                    containsMandatoryTags = true;
                }
            });
            if (!containsMandatoryTags) {
                vm.inlineTags.forEach(function (tag) {
                    if (UserLogService.mandatoryTagsList.indexOf(tag.name.toLowerCase()) > -1) {
                        containsMandatoryTags = true;
                    }
                });
            }
            return containsMandatoryTags;
        };

        $timeout(function () {
            vm.inlineTagFilterChanged();
        }, 5000);

        $scope.$on('$destroy', function () {
            if (vm.unbindLoginSuccess) {
                vm.unbindLoginSuccess();
            }
            if (vm.undbindutcDateTimeSet) {
                vm.undbindutcDateTimeSet();
            }
            MonitorService.unsubscribe('userlogs', '*');
        });
    }
})();
