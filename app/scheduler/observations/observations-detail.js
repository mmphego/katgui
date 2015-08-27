(function () {

    angular.module('katGui.scheduler')
        .controller('SubArrayObservationsDetail', SubArrayObservationsDetail);

    function SubArrayObservationsDetail($rootScope, $scope, $state, ObsSchedService, $stateParams, $mdDialog, $interval,
                                        NotifyService) {

        var vm = this;

        vm.draftListProcessingServerCall = false;
        vm.scheduleListProcessingServerCall = false;
        vm.selectedSchedule = null;
        vm.showEditMenu = false;
        vm.modeTypes = ['queue', 'manual'];

        vm.scheduleData = ObsSchedService.scheduleData;
        vm.scheduleCompletedData = ObsSchedService.scheduleCompletedData;
        vm.subarrays = ObsSchedService.subarrays;
        vm.subarray = {};

        vm.checkCASubarrays = function () {
            for (var i = 0; i < ObsSchedService.subarrays.length; i++) {
                if (ObsSchedService.subarrays[i]['delegated_ca'] === $rootScope.currentUser.email &&
                    $stateParams.subarray_id === ObsSchedService.subarrays[i].id) {
                    vm.subarray_id = parseInt(ObsSchedService.subarrays[i].id);
                    $scope.subarray = ObsSchedService.subarrays[i];
                }
            }
            if (vm.subarray_id) {
                vm.subarray = _.findWhere(vm.subarrays, {id: vm.subarray_id.toString()});
            }

            if ((!vm.subarray || !vm.subarray.id) && vm.subarray_id) {
                vm.checkSubarrayDataInterval = $interval(function () {
                    if (!vm.subarray.id) {
                        vm.subarray = _.findWhere(vm.subarrays, {id: vm.subarray_id.toString()});
                    } else {
                        $interval.cancel(vm.checkSubarrayDataInterval);
                    }
                }, 500);
            }
        };

        if ($stateParams.subarray_id !== '' && $rootScope.iAmLO) {
            vm.subarray_id = parseInt($stateParams.subarray_id);
        } else {
            vm.checkCASubarrays();
        }

        if (!vm.subarray_id) {
            $state.go('scheduler');
        } else {
            vm.unbindDelegateWatch = $scope.$watch('subarray.delegated_ca', function (newVal) {
                if (newVal !== $rootScope.currentUser.email && !$rootScope.iAmLO) {
                    $state.go('scheduler');
                } else {
                    vm.subarray = _.findWhere(vm.subarrays, {id: vm.subarray_id.toString()});
                }
            });
        }

        vm.unbindIAmCA = $rootScope.$watch('iAmCA', function () {
            vm.checkCASubarrays();
        });

        vm.completedFields = [
            {label: 'ID', value: 'id_code'},
            {label: 'Description', value: 'description'},
            {label: 'State', value: 'state'},
            {label: 'Outcome', value: 'outcome'},
            {label: 'Date', value: 'desired_start_time'},
            {label: 'State', value: 'state'},
            {label: 'Type', value: 'type'}
        ];

        vm.executeSchedule = function (item) {
            ObsSchedService.executeSchedule(vm.subarray_id, item.id_code);
        };

        vm.stopExecuteSchedule = function (item) {
            ObsSchedService.stopSchedule(vm.subarray_id, item.id_code);
        };

        vm.cancelExecuteSchedule = function (item) {
            ObsSchedService.cancelExecuteSchedule(vm.subarray_id, item.id_code);
        };

        vm.cloneSchedule = function (item) {
            ObsSchedService.cloneSchedule(item.id_code);
        };

        vm.moveScheduleRowToFinished = function (item) {
            ObsSchedService.scheduleToComplete(vm.subarray_id, item.id_code);
        };

        vm.moveScheduleRowToDraft = function (item) {
            ObsSchedService.scheduleToDraft(vm.subarray_id, item.id_code);
        };

        vm.setSelectedSchedule = function (selectedSchedule, dontDeselectOnSame) {
            if (vm.selectedSchedule === selectedSchedule && !dontDeselectOnSame) {
                vm.selectedSchedule = null;
            } else {
                vm.selectedSchedule = selectedSchedule;
            }
        };

        vm.markResourceFaulty = function (resource) {
            ObsSchedService.markResourceFaulty(resource.name, resource.faulty ? 'clear' : 'set');
        };

        vm.listResourceMaintenanceDevicesDialog = function (subarray, resource, event) {
            ObsSchedService.listResourceMaintenanceDevicesDialog(subarray.id, resource.name, event);
        };

        vm.setSchedulerMode = function (mode) {
            ObsSchedService.setSchedulerModeForSubarray(vm.subarray_id, mode);
        };

        vm.viewSBTaskLog = function (sb) {
            ObsSchedService.viewTaskLogForSBIdCode(sb.id_code, 'progress');
        };

        vm.verifySB = function (sb) {
            ObsSchedService.verifyScheduleBlock(vm.subarray_id, sb.id_code);
        };

        vm.freeSubarray = function () {
            ObsSchedService.freeSubarray(vm.subarray_id);
        };

        vm.activateSubarray = function () {
            ObsSchedService.activateSubarray(vm.subarray_id)
                .then(function (result) {
                    NotifyService.showSimpleToast(result.data.result);
                }, function (error) {
                    NotifyService.showSimpleDialog('Could not activate Subarray', error.data.result);
                });
        };

        vm.isResourceInMaintenance = function (resource) {
            resource.maintenance = ObsSchedService.resources_in_maintenance.indexOf(resource.name) !== -1;
            return resource.maintenance;
        };

        vm.isResourceFaulty = function (resource) {
            resource.faulty = ObsSchedService.resources_faulty.indexOf(resource.name) !== -1;
            return resource.faulty;
        };

        vm.sbProgress = function (sb) {
            var startDate = moment.utc(sb.actual_start_time);
            var startDateTime = startDate.toDate().getTime();
            var endDate = moment.utc(startDate).add(sb.expected_duration_seconds, 'seconds');
            var now = moment.utc(new Date());
            return (now.toDate().getTime() - startDateTime) / (endDate.toDate().getTime() - startDateTime) * 100;
        };

        vm.progressInterval = $interval(function () {
            ObsSchedService.scheduleData.forEach(function (sb) {
                if (sb.expected_duration_seconds && sb.actual_start_time) {
                    sb.progress = vm.sbProgress(sb);
                }
            });
        }, 1500);

        vm.setSubarrayMaintenance = function (maintenance) {
            ObsSchedService.setSubarrayMaintenance(vm.subarray_id, maintenance ? 'set' : 'clear');
        };

        vm.setPriority = function (sb, event) {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog) {
                        $scope.title = 'Set Priority - ' + sb.id_code + ' (current: ' + sb.priority + ')';
                        $scope.priorities = ["LOW", "HIGH"];
                        $scope.currentPriority = sb.priority;

                        $scope.hide = function () {
                            $mdDialog.hide();
                        };
                        $scope.setPriority = function (priority) {
                            ObsSchedService.setSchedulePriority(sb.id_code, priority);
                        };
                    },
                    template: '<md-dialog style="padding: 0;" md-theme="{{$root.themePrimary}}">' +
                    '   <div style="padding: 0; margin: 0; overflow: auto" layout="column">' +
                    '       <md-toolbar class="md-primary" layout="row" layout-align="center center">' +
                    '           <span flex style="margin: 8px;">{{::title}}</span>' +
                    '       </md-toolbar>' +
                    '       <div flex layout="column">' +
                    '           <div layout="row" layout-align="center center" ng-repeat="priority in priorities track by $index" ng-click="setPriority(priority); hide()" class="config-label-list-item">' +
                    '               <b>{{priority}}</b>' +
                    '           </div>' +
                    '       </div>' +
                    '       <div layout="row" layout-align="end" style="margin-top: 8px; margin-right: 8px; margin-bottom: 8px; min-height: 40px;">' +
                    '           <md-button style="margin-left: 8px;" class="md-primary md-raised" md-theme="{{$root.themePrimaryButtons}}" aria-label="OK" ng-click="hide()">Close</md-button>' +
                    '       </div>' +
                    '   </div>' +
                    '</md-dialog>',
                    targetEvent: event
                });
        };

        vm.cancelListeningToCompletedUpdates = $rootScope.$on('sb_completed_change',function () {
            ObsSchedService.getCompletedScheduleBlocks(vm.subarray_id, 30);
        });

        ObsSchedService.getCompletedScheduleBlocks(vm.subarray_id, 30);

        $scope.$on('$destroy', function () {
            if (vm.progressInterval) {
                $interval.cancel(vm.progressInterval);
            }
            vm.unbindIAmCA();
            vm.cancelListeningToCompletedUpdates();
            if (vm.unbindDelegateWatch) {
                vm.unbindDelegateWatch();
            }
        });
    }
})();
