(function () {

    angular.module('katGui')
        .controller('UserlogReportsCtrl', UserlogReportsCtrl);

        function UserlogReportsCtrl($rootScope, $scope, $localStorage, $filter,
                                    UserLogService, ConfigService, MonitorService,
                                    $log, $stateParams, NotifyService, $timeout,
                                    $state, MOMENT_DATETIME_FORMAT) {

            var vm = this;
            vm.startTime = new Date();
            vm.endTime = vm.startTime;
            vm.startDatetimeReadable = moment(vm.startTime.getTime()).format('YYYY-MM-DD 00:00:00');
            vm.endDatetimeReadable = moment(vm.endTime.getTime()).format('YYYY-MM-DD 23:59:59');
            vm.tags = UserLogService.tags;
            vm.logFiles = ['activity', 'alarm'];
            vm.sensorsRegex = 'running';
            vm.selectedLogFiles = [];
            vm.filterTags = [];
            vm.reportUserlogs = [];
            vm.andTagFiltering = false;

            if ($stateParams.filter) {
                vm.searchInputText = $stateParams.filter;
            }

            vm.userLogsFields = [
                {label: 'Start Time', value: 'start_time'},
                {label: 'Name', value: 'user.name'},
                {label: 'End Time', value: 'end_time'},
                {label: 'Content', value: 'content'}
            ];

            vm.onStartTimeSet = function () {
                vm.startDatetimeReadable = moment(vm.startTime.getTime()).format(MOMENT_DATETIME_FORMAT);
            };

            vm.onEndTimeSet = function () {
                vm.endDatetimeReadable = moment(vm.endTime.getTime()).format(MOMENT_DATETIME_FORMAT);
            };

            vm.getLogFiles = function () {
                ConfigService.getSystemConfig()
                    .then(function() {
                        var nodeNames = Object.keys(ConfigService.systemConfig.nodes).map(function(node) {
                            return 'nm_' + node;
                        });
                        MonitorService.listSensorsHttp(nodeNames.join(','), vm.sensorsRegex).then(function(result) {
                            result.data.forEach(function(sensor) {
                                if (sensor.name.endsWith('running') && sensor.original_name) {
                                    // e.g. nm_monctl.anc.running
                                    var splitName = sensor.original_name.split('.');
                                    var processName = splitName[1];
                                    vm.logFiles.push('kat.'+processName);
                                }
                            });
                        }, function(error) {
                            $log.error(error);
                        });
                    });
            };

            vm.getLogFiles();

            vm.querySearch = function (query) {
                var results = query ? vm.tags.filter(vm.createFilterFor(query)) : [];
                return results;
            };

            vm.createFilterFor = function (query) {
                return function filterFn(tag) {
                    return (tag.name.toLowerCase().indexOf(query.toLowerCase()) === 0 && tag.activated);
                };
            };

            vm.editUserLog = function (userlog, event) {
                UserLogService.editUserLog(userlog, userlog.user.email === $rootScope.currentUser.email, 'userlogDialogContentElement', event).then(
                    function() {
                        vm.queryUserlogs();
                    });
            };

            vm.exportPdf = function(){
                vm.exportingPdf = true;
                var pdf = new jsPDF('l', 'pt');
                var exportTime = moment.utc().format(MOMENT_DATETIME_FORMAT);
                var query = "?start_time=" + vm.startDatetimeReadable + "&end_time=" + vm.endDatetimeReadable;

                vm.filteredReportUserlogs.forEach(function (userlog) {
                    userlog.userName = userlog.user.name;
                    var tagNames = [];
                    userlog.tags.forEach(function (tag) {
                        tagNames.push(tag.name);
                    });
                    userlog.tag_list = tagNames.join(',');
                });

                var columns = [
                    {title: "User", dataKey: "userName"},
                    {title: "Start", dataKey: "start_time"},
                    {title: "End", dataKey: "end_time"},
                    {title: "Content", dataKey: "content"},
                    {title: "Tags", dataKey: "tag_list"}
                ];

                pdf.setFontSize(20);
                pdf.text('Userlog Report - ' + exportTime + ' (UTC)', 20, 25);
                pdf.setFontSize(12);
                pdf.setFontSize(12);
                pdf.text(('From: ' + vm.startDatetimeReadable + '     To: ' + vm.endDatetimeReadable), 20, 45);

                pdf.autoTable(columns, vm.filteredReportUserlogs, {
                    startY: 55,
                    theme: 'striped',
                    margin: {top: 8, bottom: 8},
                    columnStyles: {
                        userName: {columnWidth: 80, overflow: 'linebreak'},
                        start_time: {columnWidth: 120},
                        end_time: {columnWidth: 120},
                        content: {overflow: 'linebreak'},
                        tag_list: {overflow: 'linebreak'}}});

                if (vm.selectedLogFiles.length > 0) {

                    UserLogService.queryLogFiles(
                        vm.selectedLogFiles, vm.startDatetimeReadable, vm.endDatetimeReadable).then(
                        function (result) {
                            var logLines = [];
                            for (var key in result.data){
                                columns = [{title: key, key: "line"}];
                                result.data[key].forEach(function (line) {
                                    logLines.push({line: line});
                                });
                                pdf.autoTable(columns, logLines, {
                                    startY: pdf.autoTableEndPosY() + 50,
                                    theme: 'striped',
                                    margin: {top: 8, bottom: 8},
                                    overflow: 'linebreak'});
                                    logLines = [];
                            }
                            pdf.save('Userlog_Report_' + exportTime.replace(/ /g, '.') + '.pdf');
                            vm.exportingPdf = false;
                        }, function (error) {
                            $log.error(error);
                            vm.exportingPdf = false;
                        });
                } else {
                    pdf.save('Userlog_Report_' + exportTime.replace(/ /g, '.') + '.pdf');
                    vm.exportingPdf = false;
                }
            };

            vm.queryUserlogs = function () {
                var filterTagsList = vm.filterTags.map(function (tag) {
                    return tag.id;
                }).join(',');
                $state.go('userlogs-report', {
                        startTime: vm.startDatetimeReadable,
                        endTime: vm.endDatetimeReadable,
                        tagIds: filterTagsList? filterTagsList : ',',
                        filter: vm.searchInputText,
                        matchAllTags: vm.andTagFiltering},
                        { notify: false, reload: false });
                vm.reportUserlogs = [];
                var query = "?";
                query += "start_time=" + vm.startDatetimeReadable + "&";
                query += "end_time=" +  vm.endDatetimeReadable;
                UserLogService.queryUserLogs(query).then(function (result) {
                    if (result.data) {
                        result.data.forEach(function (userlog) {
                            vm.reportUserlogs.push(UserLogService.populateUserlogTagsFromMap(userlog));
                        });
                    }
                });
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
                if (vm.andTagFiltering) { //and tag filtering, e.g. m011 && m012
                    return matchCount > 0 && matchCount === vm.filterTags.length;
                } else { //or tag filtering, e.g. m011 || m012
                    return matchCount > 0;
                }
            };

            vm.afterInit = function() {
                UserLogService.listTags().then(function () {
                    if ($stateParams.tagIds) {
                        var tagIdsList = $stateParams.tagIds.split(',');
                        vm.filterTags = UserLogService.tags.filter(function (tag) {
                            return tagIdsList.indexOf(tag.id.toString()) > -1;
                        });
                    } else if ($stateParams.tags) {
                        var tagsList = $stateParams.tags.split(',');
                        vm.filterTags = UserLogService.tags.filter(function (tag) {
                            return tagsList.indexOf(tag.name) > -1;
                        });
                    }
                });
                UserLogService.getLogFiles();
                $timeout(function () {
                    var startTimeParam = moment($stateParams.startTime, MOMENT_DATETIME_FORMAT, true);
                    var endTimeParam = moment($stateParams.startTime, MOMENT_DATETIME_FORMAT, true);
                    if (startTimeParam.isValid() && endTimeParam.isValid()) {
                        vm.startTime = startTimeParam.toDate();
                        vm.endTime = endTimeParam.toDate();
                        vm.startDatetimeReadable = $stateParams.startTime;
                        vm.endDatetimeReadable = $stateParams.endTime;
                        vm.andTagFiltering = $stateParams.matchAllTags === 'true';
                        var query = "?";
                        query += "start_time=" + vm.startDatetimeReadable + "&";
                        query += "end_time=" +  vm.endDatetimeReadable;
                        UserLogService.queryUserLogs(query).then(function (result) {
                            if (result.data) {
                                result.data.forEach(function (userlog) {
                                    vm.reportUserlogs.push(UserLogService.populateUserlogTagsFromMap(userlog));
                                });
                            }
                        });
                    } else if ($stateParams.startTime && $stateParams.endTime) {
                        NotifyService.showSimpleDialog('Invalid Datetime URL Parameters',
                            'Invalid datetime strings: ' + $stateParams.startTime + ' or ' + $stateParams.endTime + '. Format should be ' + MOMENT_DATETIME_FORMAT);
                    }
                }, 1000);
            };

            if ($rootScope.currentUser) {
                vm.afterInit();
            } else {
                vm.unbindLoginSuccess = $rootScope.$on('loginSuccess', vm.afterInit);
            }

            $scope.$on('$destroy', function () {
                if (vm.unbindLoginSuccess) {
                    vm.unbindLoginSuccess();
                }
            });
        }
})();
