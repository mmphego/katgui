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
            vm.creatingReceptorReport = false;
            vm.creatingSubarrayReport = false;
            vm.subarrayReportSensorsRegex = "subarray...state|subarray...maintenance|subarray...product|subarray...band|sched.mode..";
            vm.receptorsReportSensorsRegex = "katpool.pool.resources.[1-4]|katpool.resources.faulty|katpool.resources.in.maintenance";
            vm.interlockReportSensorsRegex = "sys.interlock.state";
            vm.scheduleReportSensorsRegex = "sched.active.schedule..";
            vm.poolResourcesAssignedDurations = {};
            vm.interlockReceptorReportResults = {};
            vm.SBDetails = [];
            vm.subarrayNrs = [];
            vm.schedModeDurations = {};
            vm.subarrayStateDurations = {};
            vm.subarrayBandDurations = {};
            vm.subarrayProductDurations = {};
            vm.subarrayMaintenanceDurations = {};
            vm.resourceItemColumns = [];

            if ($stateParams.filter) {
                vm.searchInputText = $stateParams.filter;
            }

            vm.clearReportsData = function () {
                vm.schedModeDurations = {};
                vm.subarrayStateDurations = {};
                vm.subarrayMaintenanceDurations = {};
                vm.subarrayBandDurations = {};
                vm.subarrayProductDurations = {};
                vm.SBDetails = [];
                vm.scheduleReportResults = [];
                vm.poolResourcesAssignedDurations = {};
                vm.interlockReceptorReportResults = {};
                vm.resourceItemColumns = [];

                vm.subarrayNrs.forEach(function (subNr) {
                    vm.subarrayMaintenanceDurations[subNr] = {};
                    vm.resourceItemColumns.push(subNr);
                });
                vm.resourceItemColumns = vm.resourceItemColumns.concat(['faulty', 'in_maintenance']);
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
                pdf.text('Resource Utilisation', 20, pdf.autoTableEndPosY() + 45);

                var assignedToSubColumns = [
                    {title: "Assigned to Subarray ", dataKey: "resourceName"},
                    {title: "Duration", dataKey: "duration"},
                    {title: "% of Total", dataKey: "percentageOfTotal"}
                ];


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
                $state.go('utilisation-report', {
                        startTime: vm.startDatetimeReadable,
                        endTime: vm.endDatetimeReadable,
                        filter: vm.searchInputText},
                        { notify: false, reload: false });
                var startDate = moment(vm.startDatetimeReadable).toDate().getTime();
                var endDate =  moment(vm.endDatetimeReadable).toDate().getTime();
                vm.reportTimeWindowSecondsDuration = Math.abs(endDate - startDate) / 1000;
                vm.createSubarraysReport(startDate, endDate);
                vm.createReceptorsReport(startDate, endDate);
                vm.createInterlockReport(startDate, endDate);
                vm.createScheduleReport(startDate, endDate);
            };

            vm.createSubarraysReport = function (startDate, endDate) {
                var deferred = $q.defer();
                vm.creatingSubarrayReport = true;

                DataService.sampleValueDuration(vm.subarrayReportSensorsRegex, startDate, endDate).then(function (result) {
                    if (result.data) {
                        result.data.forEach(function (item) {
                            var subNr;
                            var duration = moment.duration(item[2], 's');
                            var reportItem = {
                                sensorName: item[0],
                                value: item[1],
                                durationSeconds: item[2],
                                duration: vm.durationToString(duration)
                            };

                            if (reportItem.duration) {
                                reportItem.percentageOfTotal = vm.percentageOfTotalToString(reportItem.durationSeconds);
                            }
                            if (reportItem.sensorName.search('_mode_.') > -1) {
                                subNr = _.last(reportItem.sensorName.split('_'));
                                if (!vm.schedModeDurations[reportItem.value]) {
                                    vm.schedModeDurations[reportItem.value] = {};
                                    vm.subarrayNrs.forEach(function (item) {
                                        vm.schedModeDurations[reportItem.value][item] = {};
                                    });
                                }
                                vm.schedModeDurations[reportItem.value][subNr] = reportItem;
                            } else if (reportItem.sensorName.endsWith('maintenance') && reportItem.value.toLowerCase() === 'true') {
                                subNr = reportItem.sensorName.split('_')[1];
                                vm.subarrayMaintenanceDurations[subNr] = reportItem;
                            } else if (reportItem.sensorName.search('subarray...state') > -1) {
                                subNr = reportItem.sensorName.split('_')[1];
                                if (!vm.subarrayStateDurations[reportItem.value]) {
                                    vm.subarrayStateDurations[reportItem.value] = {};
                                    vm.subarrayNrs.forEach(function (item) {
                                        vm.subarrayStateDurations[reportItem.value][item] = {};
                                    });
                                }
                                vm.subarrayStateDurations[reportItem.value][subNr] = reportItem;
                            } else if (reportItem.sensorName.search('subarray...band') > -1) {
                                subNr = reportItem.sensorName.split('_')[1];
                                if (!vm.subarrayBandDurations[reportItem.value]) {
                                    vm.subarrayBandDurations[reportItem.value] = {};
                                    vm.subarrayNrs.forEach(function (item) {
                                        vm.subarrayBandDurations[reportItem.value][item] = {};
                                    });
                                }
                                vm.subarrayBandDurations[reportItem.value][subNr] = reportItem;
                            } else if (reportItem.sensorName.search('subarray...product') > -1) {
                                subNr = reportItem.sensorName.split('_')[1];
                                if (!vm.subarrayProductDurations[reportItem.value]) {
                                    vm.subarrayProductDurations[reportItem.value] = {};
                                    vm.subarrayNrs.forEach(function (item) {
                                        vm.subarrayProductDurations[reportItem.value][item] = {};
                                    });
                                }
                                vm.subarrayProductDurations[reportItem.value][subNr] = reportItem;
                            }
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

            vm.createReceptorsReport = function (startDate, endDate) {
                var deferred = $q.defer();
                vm.creatingReceptorReport = true;

                DataService.sampleValueDuration(vm.receptorsReportSensorsRegex, startDate, endDate).then(function (result) {
                    vm.creatingReceptorReport = false;
                    if (result.data) {
                        result.data.forEach(function (item) {
                            var subNr;
                            var duration = moment.duration(item[2], 's');
                            var reportItem = {
                                sensorName: item[0],
                                value: item[1],
                                durationSeconds: item[2] !== null? item[2]: 0,
                                duration: vm.durationToString(duration)
                            };

                            if (reportItem.duration) {
                                reportItem.percentageOfTotal = vm.percentageOfTotalToString(reportItem.durationSeconds);
                            }
                            $log.info(reportItem);
                            if (reportItem.sensorName.search('katpool.pool.resources..|katpool.resources.faulty|katpool.resources.in.maintenance') > -1 && reportItem.value.length > 0) {
                                var resources = reportItem.value.split(',');
                                var key;
                                if (reportItem.sensorName.endsWith('faulty')) {
                                    key = 'faulty';
                                } else if (reportItem.sensorName.endsWith('in_maintenance')) {
                                    key = 'in_maintenance';
                                } else {
                                    key = _.last(reportItem.sensorName.split('_'));
                                }

                                resources.forEach(function (resource) {
                                    if (!vm.poolResourcesAssignedDurations[resource]) {
                                        vm.poolResourcesAssignedDurations[resource] = {durationTotalSeconds: 0, percentageTotal: '0%', durationTotal: '0:00:00'};
                                        vm.resourceItemColumns.forEach(function (col) {
                                            vm.poolResourcesAssignedDurations[resource][col] = {};
                                        });
                                    }
                                    if (vm.subarrayNrs.indexOf(key) > -1) {
                                        vm.poolResourcesAssignedDurations[resource].durationTotalSeconds += reportItem.durationSeconds;
                                        duration = moment.duration(vm.poolResourcesAssignedDurations[resource].durationTotalSeconds, 's');
                                        vm.poolResourcesAssignedDurations[resource].durationTotal = vm.durationToString(duration);
                                        vm.poolResourcesAssignedDurations[resource].percentageTotal = vm.percentageOfTotalToString(vm.poolResourcesAssignedDurations[resource].durationTotalSeconds);
                                    }

                                    if (!vm.poolResourcesAssignedDurations[resource][key].value) {
                                        vm.poolResourcesAssignedDurations[resource][key] = {
                                            duration: reportItem.duration,
                                            durationSeconds: reportItem.durationSeconds,
                                            percentageOfTotal: reportItem.percentageOfTotal,
                                            sensorName: reportItem.sensorName,
                                            value: resource
                                        };
                                    } else {
                                        var existingResourceItem = vm.poolResourcesAssignedDurations[resource][key];
                                        existingResourceItem.durationSeconds += reportItem.durationSeconds;
                                        duration = moment.duration(existingResourceItem.durationSeconds, 's');
                                        existingResourceItem.duration = vm.durationToString(duration);
                                        existingResourceItem.percentageOfTotal = vm.percentageOfTotalToString(existingResourceItem.durationSeconds);
                                        vm.poolResourcesAssignedDurations[resource][key] = existingResourceItem;
                                    }
                                });
                            }
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

            vm.createScheduleReport = function (startDate, endDate) {
                var deferred = $q.defer();
                vm.creatingScheduleReport = true;

                DataService.sampleValueDuration(vm.scheduleReportSensorsRegex, startDate, endDate).then(function (result) {
                    var SBIdCodes = {};
                    if (result.data) {
                        result.data.forEach(function (item) {
                            var duration = moment.duration(item[2], 's');
                            var reportItem = {
                                sensorName: item[0],
                                value: item[1],
                                durationSeconds: item[2],
                                duration: vm.durationToString(duration)
                            };

                            if (reportItem.duration) {
                                reportItem.percentageOfTotal = vm.percentageOfTotalToString(reportItem.durationSeconds);
                            }
                            vm.scheduleReportResults.push(reportItem);
                            if (reportItem.value.length > 0) {
                                reportItem.value.split(',').forEach(function (idCode) {
                                    SBIdCodes[idCode] = true;
                                });
                            }
                        });
                        var SBIdCodesList = Object.keys(SBIdCodes);
                        if (SBIdCodesList.length > 0) {
                            vm.fetchSBDetails(SBIdCodesList);
                        }
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

            vm.createInterlockReport = function (startDate, endDate) {
                var deferred = $q.defer();
                vm.creatingReceptorReport = true;

                DataService.sampleValueDuration(vm.interlockReportSensorsRegex, startDate, endDate).then(function (result) {
                    vm.creatingInterlockReport = false;
                    if (result.data) {
                        result.data.forEach(function (item) {
                            var duration = moment.duration(item[2], 's');
                            var reportItem = {
                                sensorName: item[0],
                                value: item[1],
                                durationSeconds: item[2] !== null? item[2]: 0,
                                duration: vm.durationToString(duration)
                            };

                            if (reportItem.duration) {
                                reportItem.percentageOfTotal = vm.percentageOfTotalToString(reportItem.durationSeconds);
                            }
                            vm.interlockReceptorReportResults[reportItem.value] = reportItem;
                        });
                    }
                    deferred.resolve();
                }, function (result) {
                    vm.creatingInterlockReport = false;
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
                            sb.duration = vm.durationToString(duration);
                            sb.percentageOfTotal = vm.percentageOfTotalToString(sb.durationSeconds);
                        }
                    });
                });
            };

            vm.durationToString = function (duration) {
                return Math.floor(duration.asHours()) + moment.utc(duration.asMilliseconds()).format(":mm:ss");
            };

            vm.percentageOfTotalToString = function (durationSeconds, totalSeconds) {
                if (totalSeconds === undefined) {
                    totalSeconds = vm.reportTimeWindowSecondsDuration;
                }
                return parseFloat(100 * durationSeconds / totalSeconds).toFixed(2) + '%';
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
