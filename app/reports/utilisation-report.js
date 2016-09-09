(function () {

    angular.module('katGui')
        .controller('UtilisationReportCtrl', UtilisationReportCtrl);

        function UtilisationReportCtrl($rootScope, $scope, $localStorage, $filter, DataService,
                                    $log, $stateParams, NotifyService, $timeout, $state) {

            var vm = this;
            var DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
            vm.startTime = new Date();
            vm.startTime.setHours(0);
            vm.startTime.setMinutes(0);
            vm.startTime.setSeconds(0);
            vm.endTime = new Date();
            vm.endTime.setHours(23);
            vm.endTime.setMinutes(59);
            vm.endTime.setSeconds(59);
            vm.startDatetimeReadable = moment(vm.startTime.getTime()).format(DATETIME_FORMAT);
            vm.endDatetimeReadable = moment(vm.endTime.getTime()).format(DATETIME_FORMAT);
            vm.reportTimeWindowMSDuration = 0;
            vm.creatingReceptorReport = false;
            vm.creatingSubarrayReport = false;
            vm.subarrayReportSensorsRegex = "sched.active.schedule..|subarray...state|subarray...maintenance|subarray...product|subarray...band|sched.mode..";
            vm.receptorsReportSensorsRegex = "^(m0..|ant.).windstow.active|pool.resources.free|subarray...pool.resources|resources.faulty|resources.in.maintenance|sys.interlock.state";
            vm.poolResourcesAssignedDurations = {};
            vm.poolResourcesFreeDurations = {};
            vm.poolResourcesFaultyDurations = {};
            vm.poolResourcesMaintenanceDurations = {};
            vm.interlockReceptorReportResults = [];

            //TODO probably get from config
            vm.poolResourcesAssignedToSubarraysDurations = {
                subarray_1: {},
                subarray_2: {},
                subarray_3: {},
                subarray_4: {}
            };

            vm.reportFields = [
                {label: 'Sensor', value: 'sensorName'},
                {label: 'Value', value: 'value'},
                {label: 'Duration', value: 'duration'},
                {label: '% of total', value: 'percentageOfTotal'}
            ];

            if ($stateParams.filter) {
                vm.searchInputText = $stateParams.filter;
            }

            vm.clearReportsData = function () {
                vm.subarrayReportResults = [];
                vm.receptorReportResults = [];
                vm.poolResourcesAssignedDurations = {};
                vm.poolResourcesFreeDurations = {};
                vm.poolResourcesFaultyDurations = {};
                vm.poolResourcesMaintenanceDurations = {};
                vm.interlockReceptorReportResults = [];
                vm.poolResourcesAssignedToSubarraysDurations = {
                    subarray_1: {},
                    subarray_2: {},
                    subarray_3: {},
                    subarray_4: {}
                };
            };

            vm.onStartTimeSet = function () {
                vm.startDatetimeReadable = moment(vm.startTime.getTime()).format(DATETIME_FORMAT);
            };

            vm.onEndTimeSet = function () {
                vm.endDatetimeReadable = moment(vm.endTime.getTime()).format(DATETIME_FORMAT);
            };

            vm.exportPdf = function(){
                alert("UNIMPLEMENTED");
                // vm.exportingPdf = true;
                // var pdf = new jsPDF('l', 'pt');
                // var exportTime = moment.utc().format(DATETIME_FORMAT);
                // var query = "?start_time=" + vm.startDatetimeReadable + "&end_time=" + vm.endDatetimeReadable;
                //
                // vm.filteredReportUserlogs.forEach(function (userlog) {
                //     userlog.userName = userlog.user.name;
                //     var tagNames = [];
                //     userlog.tags.forEach(function (tag) {
                //         tagNames.push(tag.name);
                //     });
                //     userlog.tag_list = tagNames.join(',');
                // });
                //
                // var columns = [
                //     {title: "User", dataKey: "userName"},
                //     {title: "Start", dataKey: "start_time"},
                //     {title: "End", dataKey: "end_time"},
                //     {title: "Content", dataKey: "content"},
                //     {title: "Tags", dataKey: "tag_list"}
                // ];
                //
                // pdf.setFontSize(20);
                // pdf.text('Userlog Report - ' + exportTime + ' (UTC)', 20, 25);
                // pdf.setFontSize(12);
                // pdf.setFontSize(12);
                // pdf.text(('From: ' + vm.startDatetimeReadable + '     To: ' + vm.endDatetimeReadable), 20, 45);
                //
                // pdf.autoTable(columns, vm.filteredReportUserlogs, {
                //     startY: 55,
                //     theme: 'striped',
                //     margin: {top: 8, bottom: 8},
                //     columnStyles: {
                //         userName: {columnWidth: 80, overflow: 'linebreak'},
                //         start_time: {columnWidth: 120},
                //         end_time: {columnWidth: 120},
                //         content: {overflow: 'linebreak'},
                //         tag_list: {overflow: 'linebreak'}}});
                //
                // if (vm.includeActivityLogs) {
                //     columns = [{title: "System Activity Logs", key: "msg"}];
                //
                //     UserLogService.queryActivityLogs(query).then(
                //         function (result) {
                //             pdf.autoTable(columns, result.data, {
                //                 startY: pdf.autoTableEndPosY() + 50,
                //                 theme: 'striped',
                //                 margin: {top: 8, bottom: 8}});
                //             pdf.save('Userlog_Report_' + exportTime.replace(/ /g, '.') + '.pdf');
                //             vm.exportingPdf = false;
                //         }, function (error) {
                //             $log.error(error);
                //             vm.exportingPdf = false;
                //         });
                // } else {
                //     pdf.save('Userlog_Report_' + exportTime.replace(/ /g, '.') + '.pdf');
                //     vm.exportingPdf = false;
                // }
            };

            vm.createReport = function () {
                vm.createSubarraysReport();
                vm.createReceptorsReport();
            };

            vm.createSubarraysReport = function () {
                vm.creatingSubarrayReport = true;
                $state.go('utilisation-report', {
                        startTime: vm.startDatetimeReadable,
                        endTime: vm.endDatetimeReadable,
                        filter: vm.searchInputText},
                        { notify: false, reload: false });
                vm.clearReportsData();
                var startDate = moment(vm.startDatetimeReadable).toDate().getTime();
                var endDate =  moment(vm.endDatetimeReadable).toDate().getTime();
                DataService.sampleValueDuration(vm.subarrayReportSensorsRegex, startDate, endDate).then(function (result) {
                    vm.reportTimeWindowSecondsDuration = Math.abs(endDate - startDate) / 1000;
                    if (result.data) {
                        result.data.forEach(function (item) {
                            var duration = moment.duration(item[2], 's');
                            var reportItem = {
                                sensorName: item[0],
                                value: item[1],
                                durationSeconds: item[2],
                                duration: Math.floor(duration.asHours()) + moment.utc(duration.asMilliseconds()).format(":mm:ss")
                            };

                            if (reportItem.duration) {
                                //convert to milliseconds and then to percentageOfTotal
                                reportItem.percentageOfTotal = parseFloat(100 * reportItem.durationSeconds / vm.reportTimeWindowSecondsDuration).toFixed(2) + '%';
                            }
                            vm.subarrayReportResults.push(reportItem);
                        });
                    }
                    vm.creatingSubarrayReport = false;
                }, function (result) {
                    vm.creatingSubarrayReport = false;
                    NotifyService.showSimpleDialog('Error creating report', result.data);
                    $log.error(result);
                });
            };

            vm.createReceptorsReport = function () {
                vm.creatingReceptorReport = true;
                $state.go('utilisation-report', {
                        startTime: vm.startDatetimeReadable,
                        endTime: vm.endDatetimeReadable,
                        filter: vm.searchInputText},
                        { notify: false, reload: false });
                vm.clearReportsData();
                var startDate = moment(vm.startDatetimeReadable).toDate().getTime();
                var endDate =  moment(vm.endDatetimeReadable).toDate().getTime();
                DataService.sampleValueDuration(vm.receptorsReportSensorsRegex, startDate, endDate).then(function (result) {
                    vm.creatingReceptorReport = false;
                    vm.reportTimeWindowSecondsDuration = Math.abs(endDate - startDate) / 1000;
                    if (result.data) {
                        result.data.forEach(function (item) {
                            var duration = moment.duration(item[2], 's');
                            var reportItem = {
                                sensorName: item[0],
                                value: item[1],
                                durationSeconds: item[2],
                                duration: Math.floor(duration.asHours()) + moment.utc(duration.asMilliseconds()).format(":mm:ss")
                            };

                            if (reportItem.duration) {
                                //convert to milliseconds and then to percentageOfTotal
                                reportItem.percentageOfTotal = parseFloat(100 * reportItem.durationSeconds / vm.reportTimeWindowSecondsDuration).toFixed(2) + '%';
                            }
                            var resources, subarray, i, value;
                            if (reportItem.sensorName.search('subarray...pool.resources') > -1 && reportItem.value.length > 0) {
                                resources = reportItem.value.split(',');
                                subarray = reportItem.sensorName.split('_', 2).join('_');
                                for (i = 0; i < resources.length; i++) {
                                    if (!vm.poolResourcesAssignedDurations[resources[i]]) {
                                        vm.poolResourcesAssignedDurations[resources[i]] = { value: 'assigned to a subarray', durationSeconds: 0, duration: '0:00:00'};
                                    }
                                    if (!vm.poolResourcesAssignedDurations[resources[i]][subarray]) {
                                        vm.poolResourcesAssignedDurations[resources[i]][subarray] = { sensorName: resources[i], value: subarray, durationSeconds: 0, duration: '0:00:00'};
                                    }
                                    vm.poolResourcesAssignedDurations[resources[i]].durationSeconds += item[2];
                                    vm.poolResourcesAssignedDurations[resources[i]][subarray].durationSeconds += item[2];
                                }
                            }
                            else if (reportItem.sensorName.search('pool.resources.free') > -1 && reportItem.value.length > 0) {
                                resources = reportItem.value.split(',');
                                value = 'free';
                                for (i = 0; i < resources.length; i++) {
                                    if (!vm.poolResourcesFreeDurations[resources[i]]) {
                                        vm.poolResourcesFreeDurations[resources[i]] = { value: value, durationSeconds: 0, duration: '0:00:00'};
                                    }
                                    vm.poolResourcesFreeDurations[resources[i]].durationSeconds += item[2];
                                }
                            }
                            else if (reportItem.sensorName.search('resources.faulty') > -1 && reportItem.value.length > 0) {
                                resources = reportItem.value.split(',');
                                value = 'faulty';
                                for (i = 0; i < resources.length; i++) {
                                    if (!vm.poolResourcesFaultyDurations[resources[i]]) {
                                        vm.poolResourcesFaultyDurations[resources[i]] = { value: value, durationSeconds: 0, duration: '0:00:00'};
                                    }
                                    vm.poolResourcesFaultyDurations[resources[i]].durationSeconds += item[2];
                                }
                            }
                            else if (reportItem.sensorName.search('resources.in.maintenance') > -1 && reportItem.value.length > 0) {
                                resources = reportItem.value.split(',');
                                value = 'in_maintenance';
                                for (i = 0; i < resources.length; i++) {
                                    if (!vm.poolResourcesMaintenanceDurations[resources[i]]) {
                                        vm.poolResourcesMaintenanceDurations[resources[i]] = { value: value, durationSeconds: 0, duration: '0:00:00'};
                                    }
                                    vm.poolResourcesMaintenanceDurations[resources[i]].durationSeconds += item[2];
                                }
                            } else if (reportItem.sensorName.search('windstow.active') > -1) {
                                vm.interlockReceptorReportResults.push(reportItem);
                            } else if (reportItem.sensorName.search('sys.interlock.state') > -1) {
                                vm.interlockReceptorReportResults.push(reportItem);
                            }
                            vm.receptorReportResults.push(reportItem);
                        });
                        Object.keys(vm.poolResourcesAssignedDurations).forEach(function (key) {
                            var item = vm.poolResourcesAssignedDurations[key];
                            var duration = moment.duration(item.durationSeconds, 's');
                            vm.poolResourcesAssignedDurations[key].duration = Math.floor(duration.asHours()) + moment.utc(duration.asMilliseconds()).format(":mm:ss");
                            vm.poolResourcesAssignedDurations[key].percentageOfTotal = parseFloat(100 * item.durationSeconds / vm.reportTimeWindowSecondsDuration).toFixed(2) + '%';
                            for (var j = 1; j <= 4; j++) {
                                var subarrayItem = vm.poolResourcesAssignedDurations[key]['subarray_' + j];
                                if (subarrayItem) {
                                    duration = moment.duration(subarrayItem.durationSeconds, 's');
                                    vm.poolResourcesAssignedDurations[key]['subarray_' + j].duration = Math.floor(duration.asHours()) + moment.utc(duration.asMilliseconds()).format(":mm:ss");
                                    vm.poolResourcesAssignedDurations[key]['subarray_' + j].percentageOfTotal = parseFloat(100 * subarrayItem.durationSeconds / vm.reportTimeWindowSecondsDuration).toFixed(2) + '%';
                                    vm.poolResourcesAssignedToSubarraysDurations['subarray_' + j][key] = vm.poolResourcesAssignedDurations[key]['subarray_' + j];
                                    vm.poolResourcesAssignedToSubarraysDurations['subarray_' + j][key].resourceName = key;
                                    vm.poolResourcesAssignedToSubarraysDurations['subarray_' + j][key].subarray = j;
                                }
                            }
                        });
                        Object.keys(vm.poolResourcesFreeDurations).forEach(function (key) {
                            var item = vm.poolResourcesFreeDurations[key];
                            var duration = moment.duration(item.durationSeconds, 's');
                            vm.poolResourcesFreeDurations[key].duration = Math.floor(duration.asHours()) + moment.utc(duration.asMilliseconds()).format(":mm:ss");
                            vm.poolResourcesFreeDurations[key].percentageOfTotal = parseFloat(100 * item.durationSeconds / vm.reportTimeWindowSecondsDuration).toFixed(2) + '%';
                        });
                        Object.keys(vm.poolResourcesFaultyDurations).forEach(function (key) {
                            var item = vm.poolResourcesFaultyDurations[key];
                            var duration = moment.duration(item.durationSeconds, 's');
                            vm.poolResourcesFaultyDurations[key].duration = Math.floor(duration.asHours()) + moment.utc(duration.asMilliseconds()).format(":mm:ss");
                            vm.poolResourcesFaultyDurations[key].percentageOfTotal = parseFloat(100 * item.durationSeconds / vm.reportTimeWindowSecondsDuration).toFixed(2) + '%';
                        });
                        Object.keys(vm.poolResourcesMaintenanceDurations).forEach(function (key) {
                            var item = vm.poolResourcesMaintenanceDurations[key];
                            var duration = moment.duration(item.durationSeconds, 's');
                            vm.poolResourcesMaintenanceDurations[key].duration = Math.floor(duration.asHours()) + moment.utc(duration.asMilliseconds()).format(":mm:ss");
                            vm.poolResourcesMaintenanceDurations[key].percentageOfTotal = parseFloat(100 * item.durationSeconds / vm.reportTimeWindowSecondsDuration).toFixed(2) + '%';
                        });
                    }
                }, function (result) {
                    vm.creatingReceptorReport = false;
                    NotifyService.showSimpleDialog('Error creating report', result.data);
                    $log.error(result);
                });
            };

            vm.afterInit = function() {
                var startTimeParam = moment($stateParams.startTime, DATETIME_FORMAT, true);
                var endTimeParam = moment($stateParams.startTime, DATETIME_FORMAT, true);
                if (startTimeParam.isValid() && endTimeParam.isValid()) {
                    vm.startTime = startTimeParam.toDate();
                    vm.endTime = endTimeParam.toDate();
                    vm.startDatetimeReadable = $stateParams.startTime;
                    vm.endDatetimeReadable = $stateParams.endTime;
                    // vm.createReport();
                } else if ($stateParams.startTime && $stateParams.endTime) {
                    NotifyService.showSimpleDialog('Invalid Datetime URL Parameters',
                        'Invalid datetime strings: ' + $stateParams.startTime + ' or ' + $stateParams.endTime + '. Format should be ' + DATETIME_FORMAT);
                }
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
