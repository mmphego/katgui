(function () {

    angular.module('katGui.scheduler')
        .controller('SubArrayObservationsDetail', SubArrayObservationsDetail);

    function SubArrayObservationsDetail(ObsSchedService, $stateParams, $rootScope) {

        var vm = this;
        vm.subarray_id = parseInt($stateParams.subarray_id);
        vm.draftListProcessingServerCall = false;
        vm.scheduleListProcessingServerCall = false;
        vm.selectedSchedule = null;
        vm.showEditMenu = false;
        vm.subarray = {};
        vm.modeTypes = ['queue', 'manual'];

        vm.scheduleCompletedData = ObsSchedService.scheduleCompletedData;
        vm.scheduleData = ObsSchedService.scheduleData;
        vm.poolResources = ObsSchedService.poolResources;
        vm.allocations = ObsSchedService.allocations;
        vm.schedulerModes = ObsSchedService.schedulerModes;

        vm.completedOrderByFields = [
            {label: 'ID', value: 'id_code'},
            {label: 'Description', value: 'description'},
            {label: 'Date', value: 'desired_start_time'},
            {label: 'State', value: 'state'},
            {label: 'Type', value: 'type'}
        ];

        vm.refreshScheduleBlocks = function () {
            ObsSchedService.getScheduleBlocks()
                .then(ObsSchedService.getScheduleBlocksFinished)
                .then(ObsSchedService.listPoolResources)
                .then(function () {
                    ObsSchedService.listAllocationsForSubarray(vm.subarray_id)
                        .then(function () {
                            ObsSchedService.getSchedulerModeForSubarray(vm.subarray_id)
                                .then(function () {
                                    vm.selectedMode = ObsSchedService.schedulerModes[vm.subarray_id];
                                    if (ObsSchedService.subarrays.length === 0) {
                                        ObsSchedService.listSubarrays()
                                            .then(function () {
                                                vm.subarray = _.findWhere(ObsSchedService.subarrays, {id: vm.subarray_id.toString()});
                                                vm.subarrayState = vm.subarray.state.toUpperCase();
                                            });
                                    } else {
                                        vm.subarray = _.findWhere(ObsSchedService.subarrays, {id: vm.subarray_id.toString()});
                                        vm.subarrayState = vm.subarray.state.toUpperCase();
                                    }
                                });
                        });
                });
        };

        vm.executeSchedule = function (item) {
            ObsSchedService.executeSchedule(vm.subarray_id, item.id_code)
                .then($rootScope.displayPromiseResult);
        };

        vm.stopExecuteSchedule = function (item) {
            ObsSchedService.cancelExecuteSchedule(vm.subarray_id, item.id_code)
                .then($rootScope.displayPromiseResult);
        };

        vm.cloneSchedule = function (item) {
            ObsSchedService.cloneSchedule(item.id_code)
                .then($rootScope.displayPromiseResult);
        };

        vm.moveScheduleRowToFinished = function (item) {
            ObsSchedService.scheduleToComplete(vm.subarray_id, item.id_code)
                .then($rootScope.displayPromiseResult);
        };

        vm.moveScheduleRowToDraft = function (item) {
            ObsSchedService.scheduleToDraft(vm.subarray_id, item.id_code)
                .then($rootScope.displayPromiseResult);
        };

        vm.setCompletedOrderBy = function (column, reverse) {
            var newOrderBy = _.findWhere(vm.completedOrderByFields, {value: column});
            if ((vm.completedOrderBy || {}).value === column) {
                if (newOrderBy.reverse === undefined) {
                    newOrderBy.reverse = true;
                } else if (newOrderBy.reverse) {
                    newOrderBy.reverse = undefined;
                    newOrderBy = null;
                }
            }
            vm.completedOrderBy = newOrderBy;
        };

        vm.setCompletedOrderBy('id_code', true);

        vm.setSelectedSchedule = function (selectedSchedule, dontDeselectOnSame) {
            if (vm.selectedSchedule === selectedSchedule && !dontDeselectOnSame) {
                vm.selectedSchedule = null;
            } else {
                vm.selectedSchedule = selectedSchedule;
            }
        };

        vm.markResourceFaulty = function (resource) {
            ObsSchedService.markResourceFaulty(vm.subarray_id, resource.name, resource.state === 'faulty' ? 0 : 1)
                .then($rootScope.displayPromiseResult);
        };

        vm.schedulerModeChanged = function () {
            ObsSchedService.setSchedulerModeForSubarray(vm.subarray_id, vm.selectedMode)
                .then($rootScope.displayPromiseResult);
        };

        vm.viewSBTaskLog = function (sb) {
            ObsSchedService.viewTaskLogForSBIdCode(sb.id_code);
        };

        vm.verifySB = function (sb) {
            ObsSchedService.verifyScheduleBlock(vm.subarray_id, sb.id_code)
                .then($rootScope.displayPromiseResult);
        };

        vm.freeSubarray = function () {
            ObsSchedService.freeSubarray(vm.subarray_id)
                .then(function (result) {
                    $rootScope.displayPromiseResult(result);
                    ObsSchedService.listSubarrays()
                        .then(function () {
                            vm.subarray = _.findWhere(ObsSchedService.subarrays, {id: vm.subarray_id.toString()});
                            vm.subarrayState = vm.subarray.state.toUpperCase();
                        });
                });
        };

        vm.activateSubarray = function () {
            ObsSchedService.activateSubarray(vm.subarray_id)
                .then(function (result) {
                    $rootScope.displayPromiseResult(result);
                    ObsSchedService.listSubarrays()
                        .then(function () {
                            vm.subarray = _.findWhere(ObsSchedService.subarrays, {id: vm.subarray_id.toString()});
                            vm.subarrayState = vm.subarray.state.toUpperCase();
                        });
                });
        };

        vm.refreshScheduleBlocks();
    }
})();
