(function () {

    angular.module('katGui')
        .controller('UtilisationReportCtrl', UtilisationReportCtrl);

        function UtilisationReportCtrl($rootScope, $scope, $localStorage, $filter, DataService, ObsSchedService,
                                       $q, $log, $stateParams, NotifyService, $timeout, $state, ConfigService) {

            var vm = this;
            var DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
            vm.startTime = new Date();
            vm.startTime.setHours(0);
            vm.startTime.setMinutes(0);
            vm.startTime.setSeconds(0);
            vm.endTime = new Date();
            vm.startDatetimeReadable = moment(vm.startTime.getTime()).format(DATETIME_FORMAT);
            vm.endDatetimeReadable = moment(vm.endTime.getTime()).format(DATETIME_FORMAT);
            vm.reportTimeWindowMSDuration = 0;
            vm.creatingReceptorReport = false;
            vm.creatingSubarrayReport = false;
            vm.subarrayReportSensorsRegex = "subarray...state|subarray...maintenance|subarray...product|subarray...band|sched.mode..";
            vm.receptorsReportSensorsRegex = "^(m0..|ant.).windstow.active|^(m0..|ant.).mode|pool.resources.free|subarray...pool.resources|resources.faulty|resources.in.maintenance|sys.interlock.state";
            vm.scheduleReportSensorsRegex = "sched.active.schedule..";
            vm.poolResourcesAssignedDurations = {};
            vm.poolResourcesFreeDurations = {};
            vm.poolResourcesFaultyDurations = {};
            vm.poolResourcesMaintenanceDurations = {};
            vm.interlockReceptorReportResults = [];
            vm.receptorModeDurations = [];
            vm.SBDetails = [];
            vm.subarrayNrs = [];

            if ($stateParams.filter) {
                vm.searchInputText = $stateParams.filter;
            }

            vm.clearReportsData = function () {
                vm.SBDetails = [];
                vm.subarrayReportResults = [];
                vm.receptorReportResults = [];
                vm.scheduleReportResults = [];
                vm.poolResourcesAssignedDurations = {};
                vm.poolResourcesFreeDurations = {};
                vm.poolResourcesFaultyDurations = {};
                vm.poolResourcesMaintenanceDurations = {};
                vm.interlockReceptorReportResults = [];
                vm.receptorModeDurations = [];
                vm.poolResourcesAssignedToSubarraysDurations = {};
                for (var i = 0; i < vm.subarrayNrs.length; i++) {
                    vm.poolResourcesAssignedToSubarraysDurations['subarray_' + vm.subarrayNrs[i]] = {};
                }
            };

            vm.clearReportsData();

            vm.onStartTimeSet = function () {
                vm.startDatetimeReadable = moment(vm.startTime.getTime()).format(DATETIME_FORMAT);
            };

            vm.onEndTimeSet = function () {
                vm.endDatetimeReadable = moment(vm.endTime.getTime()).format(DATETIME_FORMAT);
            };

            vm.exportPdf = function(){
                vm.exportingPdf = true;
                var pdf = new jsPDF('l', 'pt');
                var exportTime = moment.utc().format(DATETIME_FORMAT);

                var sensorColumns = [
                    {title: "Sensor", dataKey: "sensorName"},
                    {title: "Value", dataKey: "value"},
                    {title: "Duration", dataKey: "duration"},
                    {title: "% of Total", dataKey: "percentageOfTotal"}
                ];

                pdf.setFontSize(20);
                pdf.text('Utilisation Report - ' + exportTime + ' (UTC)', 20, 25);
                pdf.setFontSize(12);
                pdf.setFontSize(12);
                pdf.text(('From: ' + vm.startDatetimeReadable + '     To: ' + vm.endDatetimeReadable), 20, 45);

                pdf.setFontSize(20);
                pdf.setFontStyle('italic');
                pdf.text('Subarray Sensors', 20, 75);

                pdf.autoTable(sensorColumns, vm.subarrayReportResults, {
                    startY: 85,
                    theme: 'striped',
                    margin: {top: 8, bottom: 8},
                    columnStyles: {
                        sensorName: {columnWidth: 200, overflow: 'linebreak'},
                        value: {},
                        duration: {columnWidth: 80},
                        percentageOfTotal: {columnWidth: 80}}});

                pdf.setFontSize(20);
                pdf.text('Resource Utilisation', 20, pdf.autoTableEndPosY() + 45);

                var assignedToSubColumns = [
                    {title: "Assigned to Subarray ", dataKey: "resourceName"},
                    {title: "Duration", dataKey: "duration"},
                    {title: "% of Total", dataKey: "percentageOfTotal"}
                ];

                vm.subarrayNrs.forEach(function (subNr) {
                    assignedToSubColumns[0].title = "Assigned to Subarray " + subNr;

                    var assignedToSubarray = [];
                    var resourcesAssignedToSub = Object.keys(vm.poolResourcesAssignedToSubarraysDurations['subarray_' + subNr]);

                    resourcesAssignedToSub.forEach(function (key) {
                        var resource = vm.poolResourcesAssignedToSubarraysDurations['subarray_' + subNr][key];
                        assignedToSubarray.push(resource);
                    });

                    if (assignedToSubarray.length > 0) {
                        pdf.autoTable(assignedToSubColumns, assignedToSubarray, {
                            startY: subNr === "1"? pdf.autoTableEndPosY() + 60 : pdf.autoTableEndPosY() + 8,
                            theme: 'striped',
                            margin: {top: 8, bottom: 8},
                            columnStyles: {
                                sensorName: {columnWidth: 200, overflow: 'linebreak'},
                                value: {},
                                duration: {columnWidth: 80},
                                percentageOfTotal: {columnWidth: 80}}});
                    }
                });

                assignedToSubColumns[0].title = "Free";
                var assignedToFree = [];
                var resourcesAssignedToFree = Object.keys(vm.poolResourcesFreeDurations);
                resourcesAssignedToFree.forEach(function (key) {
                    assignedToFree.push(vm.poolResourcesFreeDurations[key]);
                });

                if (assignedToFree.length > 0) {
                    pdf.autoTable(assignedToSubColumns, assignedToFree, {
                        startY: pdf.autoTableEndPosY() + 8,
                        theme: 'striped',
                        margin: {top: 8, bottom: 8},
                        columnStyles: {
                            sensorName: {columnWidth: 200, overflow: 'linebreak'},
                            value: {},
                            duration: {columnWidth: 80},
                            percentageOfTotal: {columnWidth: 80}}});
                }

                assignedToSubColumns[0].title = "Faulty";
                var assignedToFaulty = [];
                var resourcesAssignedToFaulty = Object.keys(vm.poolResourcesFaultyDurations);
                resourcesAssignedToFaulty.forEach(function (key) {
                    assignedToFaulty.push(vm.poolResourcesFaultyDurations[key]);
                });

                if (assignedToFaulty.length > 0) {
                    pdf.autoTable(assignedToSubColumns, assignedToFaulty, {
                        startY: pdf.autoTableEndPosY() + 8,
                        theme: 'striped',
                        margin: {top: 8, bottom: 8},
                        columnStyles: {
                            sensorName: {columnWidth: 200, overflow: 'linebreak'},
                            value: {},
                            duration: {columnWidth: 80},
                            percentageOfTotal: {columnWidth: 80}}});
                }

                assignedToSubColumns[0].title = "In Maintenance";
                var assignedToInMaintenance = [];
                var resourcesAssignedToInMaintenance = Object.keys(vm.poolResourcesMaintenanceDurations);
                resourcesAssignedToInMaintenance.forEach(function (key) {
                    assignedToInMaintenance.push(vm.poolResourcesMaintenanceDurations[key]);
                });

                if (assignedToInMaintenance.length > 0) {
                    pdf.autoTable(assignedToSubColumns, assignedToInMaintenance, {
                        startY: pdf.autoTableEndPosY() + 8,
                        theme: 'striped',
                        margin: {top: 8, bottom: 8},
                        columnStyles: {
                            sensorName: {columnWidth: 200, overflow: 'linebreak'},
                            value: {},
                            duration: {columnWidth: 80},
                            percentageOfTotal: {columnWidth: 80}}});
                }

                pdf.text('Receptor Modes', 20, pdf.autoTableEndPosY() + 45);
                pdf.autoTable(sensorColumns, vm.receptorModeDurations, {
                    startY: pdf.autoTableEndPosY() + 60,
                    theme: 'striped',
                    margin: {top: 8, bottom: 8},
                    columnStyles: {
                        sensorName: {columnWidth: 200, overflow: 'linebreak'},
                        value: {},
                        duration: {columnWidth: 80},
                        percentageOfTotal: {columnWidth: 80}}});

                pdf.text('Interlock / Windstow', 20, pdf.autoTableEndPosY() + 45);
                pdf.autoTable(sensorColumns, vm.interlockReceptorReportResults, {
                    startY: pdf.autoTableEndPosY() + 60,
                    theme: 'striped',
                    margin: {top: 8, bottom: 8},
                    columnStyles: {
                        sensorName: {columnWidth: 200, overflow: 'linebreak'},
                        value: {},
                        duration: {columnWidth: 80},
                        percentageOfTotal: {columnWidth: 80}}});

                pdf.text('Active Schedule Blocks', 20, pdf.autoTableEndPosY() + 45);
                pdf.autoTable(sensorColumns, vm.scheduleReportResults, {
                    startY: pdf.autoTableEndPosY() + 60,
                    theme: 'striped',
                    margin: {top: 8, bottom: 8},
                    columnStyles: {
                        sensorName: {columnWidth: 200, overflow: 'linebreak'},
                        value: {},
                        duration: {columnWidth: 80},
                        percentageOfTotal: {columnWidth: 80}}});

                var sbColumns = [
                    {title: "Id Code", dataKey: "id_code"},
                    {title: "Owner", dataKey: "owner"},
                    {title: "Description", dataKey: "description"},
                    {title: "State", dataKey: "state"},
                    {title: "Outcome", dataKey: "outcome"},
                    {title: "Duration", dataKey: "duration"},
                    {title: "% of Total", dataKey: "percentageOfTotal"},
                ];

                pdf.text('Active Schedule Block Details', 20, pdf.autoTableEndPosY() + 45);
                pdf.autoTable(sbColumns, vm.SBDetails, {
                    startY: pdf.autoTableEndPosY() + 60,
                    theme: 'striped',
                    margin: {top: 8, bottom: 8},
                    columnStyles: {
                        id_code: {columnWidth: 85},
                        owner: {columnWidth: 85},
                        description: {overflow: 'linebreak'},
                        state: {columnWidth: 85},
                        outcome: {columnWidth: 85},
                        duration: {columnWidth: 80},
                        percentageOfTotal: {columnWidth: 80}}});

                pdf.save('utilisation_report_' + exportTime.replace(/ /g, '.') + '.pdf');
                vm.exportingPdf = false;
            };

            vm.createReport = function () {
                vm.clearReportsData();
                vm.createSubarraysReport().then(vm.createReceptorsReport).then(vm.createScheduleReport);
            };

            vm.createSubarraysReport = function () {
                var deferred = $q.defer();
                vm.creatingSubarrayReport = true;
                $state.go('utilisation-report', {
                        startTime: vm.startDatetimeReadable,
                        endTime: vm.endDatetimeReadable,
                        filter: vm.searchInputText},
                        { notify: false, reload: false });

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
                    deferred.resolve();
                }, function (result) {
                    vm.creatingSubarrayReport = false;
                    NotifyService.showSimpleDialog('Error creating report', result.data);
                    $log.error(result);
                    deferred.reject();
                });
                return deferred.promise;
            };

            vm.createReceptorsReport = function () {
                var deferred = $q.defer();
                vm.creatingReceptorReport = true;
                $state.go('utilisation-report', {
                        startTime: vm.startDatetimeReadable,
                        endTime: vm.endDatetimeReadable,
                        filter: vm.searchInputText},
                        { notify: false, reload: false });

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
                                        vm.poolResourcesAssignedDurations[resources[i]][subarray] = {sensorName: resources[i], value: subarray, durationSeconds: 0, duration: '0:00:00'};
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
                                        vm.poolResourcesFreeDurations[resources[i]] = {resourceName: resources[i], value: value, durationSeconds: 0, duration: '0:00:00'};
                                    }
                                    vm.poolResourcesFreeDurations[resources[i]].durationSeconds += item[2];
                                }
                            }
                            else if (reportItem.sensorName.search('resources.faulty') > -1 && reportItem.value.length > 0) {
                                resources = reportItem.value.split(',');
                                value = 'faulty';
                                for (i = 0; i < resources.length; i++) {
                                    if (!vm.poolResourcesFaultyDurations[resources[i]]) {
                                        vm.poolResourcesFaultyDurations[resources[i]] = {resourceName: resources[i], value: value, durationSeconds: 0, duration: '0:00:00'};
                                    }
                                    vm.poolResourcesFaultyDurations[resources[i]].durationSeconds += item[2];
                                }
                            }
                            else if (reportItem.sensorName.search('resources.in.maintenance') > -1 && reportItem.value.length > 0) {
                                resources = reportItem.value.split(',');
                                value = 'in_maintenance';
                                for (i = 0; i < resources.length; i++) {
                                    if (!vm.poolResourcesMaintenanceDurations[resources[i]]) {
                                        vm.poolResourcesMaintenanceDurations[resources[i]] = {resourceName: resources[i], value: value, durationSeconds: 0, duration: '0:00:00'};
                                    }
                                    vm.poolResourcesMaintenanceDurations[resources[i]].durationSeconds += item[2];
                                }
                            } else if (reportItem.sensorName.search('windstow.active') > -1) {
                                vm.interlockReceptorReportResults.push(reportItem);
                            } else if (reportItem.sensorName.search('sys.interlock.state') > -1) {
                                vm.interlockReceptorReportResults.push(reportItem);
                            } else if (reportItem.sensorName.search('^(m0..|ant.).mode') > -1) {
                                vm.receptorModeDurations.push(reportItem);
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
                    deferred.resolve();
                }, function (result) {
                    vm.creatingReceptorReport = false;
                    NotifyService.showSimpleDialog('Error creating report', result.data);
                    $log.error(result);
                    deferred.reject();
                });
                return deferred.promise;
            };

            vm.createScheduleReport = function () {
                var deferred = $q.defer();
                vm.creatingScheduleReport = true;
                $state.go('utilisation-report', {
                        startTime: vm.startDatetimeReadable,
                        endTime: vm.endDatetimeReadable,
                        filter: vm.searchInputText},
                        { notify: false, reload: false });

                var startDate = moment(vm.startDatetimeReadable).toDate().getTime();
                var endDate =  moment(vm.endDatetimeReadable).toDate().getTime();
                DataService.sampleValueDuration(vm.scheduleReportSensorsRegex, startDate, endDate).then(function (result) {
                    vm.reportTimeWindowSecondsDuration = Math.abs(endDate - startDate) / 1000;
                    var SBIdCodes = {};
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
                            vm.scheduleReportResults.push(reportItem);
                            if (reportItem.value.length > 0) {
                                reportItem.value.split(',').forEach(function (idCode) {
                                    SBIdCodes[idCode] = true;
                                });
                            }
                        });
                        vm.fetchSBDetails(Object.keys(SBIdCodes));
                    }
                    vm.creatingScheduleReport = false;
                    deferred.resolve();
                }, function (result) {
                    vm.creatingScheduleReport = false;
                    NotifyService.showSimpleDialog('Error creating report', result.data);
                    $log.error(result);
                    deferred.reject();
                });
                return deferred.promise;
            };

            vm.fetchSBDetails = function (sbIdCodes) {
                ObsSchedService.getScheduleBlockDetails(sbIdCodes).then(function (result) {
                    vm.SBDetails = JSON.parse(result.data.result);
                    vm.SBDetails.forEach(function (sb) {
                        if (sb.actual_end_time && sb.actual_start_time) {
                            var startSeconds = moment.utc(sb.actual_start_time, DATETIME_FORMAT).toDate().getTime() / 1000;
                            var endSeconds = moment.utc(sb.actual_end_time, DATETIME_FORMAT).toDate().getTime() / 1000;
                            sb.durationSeconds = Math.abs(endSeconds - startSeconds);
                            var duration = moment.duration(sb.durationSeconds, 's');
                            sb.duration = Math.floor(duration.asHours()) + moment.utc(duration.asMilliseconds()).format(":mm:ss");
                            sb.percentageOfTotal = parseFloat(100 * sb.durationSeconds / vm.reportTimeWindowSecondsDuration).toFixed(2) + '%';
                        }
                    });
                });
            };

            vm.afterInit = function() {
                ConfigService.getSystemConfig().then(function (systemConfig) {
                    vm.subarrayNrs = systemConfig.system.subarray_nrs.split(',');

                    var startTimeParam = moment($stateParams.startTime, DATETIME_FORMAT, true);
                    var endTimeParam = moment($stateParams.startTime, DATETIME_FORMAT, true);
                    if (startTimeParam.isValid() && endTimeParam.isValid()) {
                        vm.startTime = startTimeParam.toDate();
                        vm.endTime = endTimeParam.toDate();
                        vm.startDatetimeReadable = $stateParams.startTime;
                        vm.endDatetimeReadable = $stateParams.endTime;
                        vm.createReport();
                    } else if ($stateParams.startTime && $stateParams.endTime) {
                        NotifyService.showSimpleDialog('Invalid Datetime URL Parameters',
                            'Invalid datetime strings: ' + $stateParams.startTime + ' or ' + $stateParams.endTime + '. Format should be ' + DATETIME_FORMAT);
                    }
                });
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
