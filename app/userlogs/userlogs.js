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

    function UserlogCtrl($localStorage, $interval, $mdDialog, $scope, $rootScope, $filter, $log, $timeout, UserLogService) {

        var vm = this;
        var datetime_format = 'yyyy-MM-dd HH:mm:ss';
        vm.userLogs = UserLogService.userlogs;
        vm.tags = UserLogService.tags;
        if ($localStorage.filterTags) {
            vm.filterTags = $localStorage.filterTags;
        } else {
            vm.filterTags = [];
        }
        vm.tagChips = [];
        vm.chosen_tags = [];
        vm.activity_logs = UserLogService.activity_logs;
        vm.include_activity_logs = false;
        vm.newLogStartTimeText = '';

        vm.onTimeSet = function (value, target, attribute) {
            target[attribute] = $filter('date')(value, datetime_format);
        };

        vm.addNewInlineLog = function () {
            if (!vm.newLogContent) {
                return;
            }
            // TODO check datetime formats
            if (!vm.newLogStartTime) {
                vm.newLogStartTime = $rootScope.utcDateTime;
            }
            var tagList = [];
            vm.filterTags.forEach(function (tag) {
                tagList.push(tag.name);
            });
            var newLog = {
                user: $rootScope.currentUser.id,
                start_time: $filter('date')(vm.newLogStartTime, datetime_format),
                end_time: $filter('date')(vm.newLogEndTime, datetime_format),
                userlog_content: vm.newLogContent,
                tags: tagList
            };
            UserLogService.addUserLog(newLog).then(function (result) {
                vm.newLogStartTime = $rootScope.utcDateTime;
                vm.newLogEndTime = '';
                vm.newLogContent = '';
            });
            vm.newLogStartTimeText = $filter('date')(vm.newLogStartTime, datetime_format);
        };

        vm.exportPdf = function(reportStart, reportEnd){
            var pdf = new jsPDF('l', 'mm', 'a4');
            var export_time = $filter('date')(new Date(), "yyyy-MM-dd_HH'h'mm");
            var start_time = $filter('date')(reportStart, 'yyyy-MM-dd HH:mm');
            var end_time = $filter('date')(reportEnd, 'yyyy-MM-dd HH:mm');
            var a_query = "?";
            if (start_time) {a_query += "start_time=" + start_time + "&";}
            if (end_time) {a_query += "end_time=" + end_time + "&";}

            UserLogService.queryUserLogs(a_query).then(function (result) {
                var report_markup = '<table id=basic-table border="1px" style="width:100%; font-family:verdana,arial,sans-serif;">' +
                '<thead>' +
                    '<tr>' +
                        '<th>Log Timestamp</th>' +
                        '<th>User</th>' +
                        '<th>Event Started</th>' +
                        '<th>Event Ended</th>' +
                        '<th>Userlog Content</th>' +
                    '</tr>' +
                '</thead>';

                vm.filtered_report_userlogs.forEach(function (item) {
                    report_markup += '<tr>' +
                    '<td>' + item.timestamp + '</td>' +
                    '<td>' + item.name + '</td>' +
                    '<td>' + item.start_time + '</td>' +
                    '<td>' + item.end_time + '</td>' +
                    '<td>' + item.userlog_content + '</td>' +
                    '</tr>';
                });

                report_markup += '</table>';

                pdf.setFontSize(20);
                pdf.text('Userlog Report - ' + export_time, 20, 25);
                pdf.setFontSize(12);
                pdf.setFontSize(12);
                pdf.text(('From: ' + reportStart + '     To: ' + reportEnd), 20, 45);
                var report_element = document.createElement('div');
                report_element.innerHTML = report_markup;
                var res = pdf.autoTableHtmlToJson(report_element.firstChild, true);
                pdf.autoTable(res.columns, res.data, {
                    startY: 60,
                    margins: {horizontal: 15, top: 25, bottom: 20},
                    overflow: 'linebreak',
                    padding: 2,
                    lineHeight: 10,
                    fontSize: 8
                    }
                );
            }).then(function (result) {
                if (vm.include_activity_logs) {
                    var columns = [{title: "System Activity Logs", key: "msg"}];

                    UserLogService.queryActivityLogs(a_query).then(function (result) {
                        pdf.autoTable(columns, vm.activity_logs, {
                            startY: pdf.autoTableEndPosY() + 50,
                            margins: {horizontal: 15, top: 25, bottom: 20},
                            overflow: 'linebreak',
                            padding: 1,
                            lineHeight: 9,
                            fontSize: 7
                            }
                        );
                        pdf.save('Userlog_Report_' + export_time + '.pdf');
                    });
                } else {
                    pdf.save('Userlog_Report_' + export_time + '.pdf');
                }
            });
        };

        vm.addTagFromList = function (listed_tag) {
            vm.tagChips.push(listed_tag);
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

        vm.chipsToList = function () {
            vm.chosen_tags.splice(0, vm.chosen_tags.length);
            vm.tagChips.forEach(function (tag) {
                if (tag.name) {
                    vm.chosen_tags.push(tag.name);
                }
            });
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

        vm.taxonomies = UserLogService.taxonomies;
        vm.getTaxonomies = function () {
            UserLogService.listTaxonomies();
        };

        vm.queryUserlogs = function (event, b_query) {
            var query = "?";
            var start_time = $filter('date')(b_query.start_time, datetime_format);
            var end_time = $filter('date')(b_query.end_time, datetime_format);
            vm.chipsToList();
            if (start_time) {query += "start_time=" + start_time + "&";}
            if (end_time) {query += "end_time=" + end_time + "&";}
            if (vm.chosen_tags.length > 0) {query += "tags=" + vm.chosen_tags + "&";}
            UserLogService.queryUserLogs(query).then(function (result) {
                vm.report_userlogs = UserLogService.report_userlogs;
                $log.info('User log query result length: ' + vm.report_userlogs.length);
            });
        };

        vm.editUserLog = function (log, event) {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog, $filter, UserLogService, $log) {
                        $scope.log = log;
                        $scope.metadata_to_del = [];
                        $scope.toggle = function (item, list) {
                            var idx = list.indexOf(item);
                            if (idx > -1) {
                                list.splice(idx, 1);
                            }
                            else {
                                list.push(item);
                            }
                        };
                        $scope.exists = function (item, list) {
                            return list.indexOf(item) > -1;
                        };
                        $scope.tags = vm.tags;
                        $scope.start_time = log.start_time;
                        $scope.end_time = log.end_time;
                        $scope.userlog_content = log.userlog_content;
                        $scope.selectedTags = log.tags;

                        $scope.addTagFromList = function (listed_tag) {
                            $scope.selectedTags.push(listed_tag);
                        };

                        $scope.hide = function () {
                            $mdDialog.hide();
                        };

                        $scope.add = function () {
                            var newTagList = [];
                            $scope.selectedTags.forEach(function (tag) {
                                if (tag.name) {
                                    newTagList.push(tag.name);
                                }
                            });
                            var newLog = {
                                id: log.id,
                                user: $rootScope.currentUser.id,
                                start_time: $filter('date')($scope.start_time, datetime_format),
                                end_time: $filter('date')($scope.end_time, datetime_format),
                                userlog_content: $scope.userlog_content,
                                tags: newTagList,
                                metadata_to_del: $scope.metadata_to_del
                            };
                            var file = $scope.myFile;
                            if (log.id) {
                                UserLogService.modifyUserLog(newLog).then(function () {
                                    if (file) {
                                        UserLogService.uploadFileToUrl(file, log.id);
                                    }
                                });
                            } else {
                                UserLogService.addUserLog(log).then(function () {
                                    if (file) {
                                        UserLogService.uploadFileToUrl(file, log.id);
                                    }
                                });
                            }
                            $mdDialog.hide();
                        };

                        $scope.querySearch = function (query) {
                            var results = query ? $scope.tags.filter($scope.createFilterFor(query)) : [];
                            return results;
                        };

                        $scope.createFilterFor = function (query) {
                            return function filterFn(tag) {
                                return (tag.name.indexOf(query) === 0);
                            };
                        };

                        $scope.onTimeSet = function (value, attribute) {
                            $scope[attribute] = $filter('date')(value, datetime_format);
                            if (!$scope.end_time || $scope.start_time <= $scope.end_time) {
                                $scope.endDateTimeError = false;
                            } else {
                                $scope.endDateTimeError = true;
                            }
                        };

                        $scope.onTimeChange = function () {
                            if (!$scope.end_time || $scope.start_time <= $scope.end_time) {
                                $scope.endDateTimeError = false;
                            } else {
                                $scope.endDateTimeError = true;
                            }
                        };

                        $scope.file_url = UserLogService.file_url;
                        $scope.getFile = function(downloadPath, name, log_id) {
                            UserLogService.getFileFromUrl(downloadPath, name, log_id);
                        };
                    },
                    templateUrl: 'app/userlogs/userlogdialog.tmpl.html',
                    targetEvent: event
                });
        };

        vm.afterInit = function() {
            if ($rootScope.currentUser) {
                UserLogService.listUserLogsForToday();
                UserLogService.listTags();
            }
        };

        $interval(function () {
            if (vm.chatMode) {
                vm.newLogStartTimeText = $rootScope.utcDateTime;
            }
        }, 1000);

        $scope.$watchCollection('vm.filterTags', function (newValue) {
            vm.chatMode = _.findIndex(vm.filterTags, {name: 'chat'}) > -1;
        });

        vm.undbindLoginSuccess = $rootScope.$on('loginSuccess', vm.afterInit);
        vm.undbindutcDateTimeSet = $rootScope.$on('utcDateTimeSet', function (event, value) {
            vm.newLogStartTimeText = value;
        });
        vm.afterInit();

        $scope.$on('$destroy', function () {
            vm.undbindLoginSuccess();
            vm.undbindutcDateTimeSet();
        });

        //TODO fix uploads, realtime updates from katportal, update log correctly after edit, keyboard shortcuts, fixup reports display, fetch future and past userlogs
    }
})();
