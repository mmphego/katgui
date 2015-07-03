(function () {

    angular.module('katGui.scheduler')
        .controller('SubArrayObservationsDetail', SubArrayObservationsDetail);

    function SubArrayObservationsDetail(ObservationScheduleService, $stateParams, $rootScope) {

        var vm = this;
        vm.subarray_id = parseInt($stateParams.subarray_id);
        vm.draftListProcessingServerCall = false;
        vm.scheduleListProcessingServerCall = false;
        vm.selectedSchedule = null;
        vm.showEditMenu = false;
        vm.subarray = {};
        vm.modeTypes = ['queue', 'manual'];

        vm.scheduleCompletedData = ObservationScheduleService.scheduleCompletedData;
        vm.scheduleData = ObservationScheduleService.scheduleData;
        vm.poolResources = ObservationScheduleService.poolResources;
        vm.allocations = ObservationScheduleService.allocations;
        vm.schedulerModes = ObservationScheduleService.schedulerModes;

        vm.completedOrderByFields = [
            {label: 'ID', value: 'id_code'},
            {label: 'Description', value: 'description'},
            {label: 'Date', value: 'desired_start_time'},
            {label: 'State', value: 'state'},
            {label: 'Type', value: 'type'}
        ];

        vm.refreshScheduleBlocks = function () {
            ObservationScheduleService.getScheduleBlocks()
                .then(ObservationScheduleService.getScheduleBlocksFinished)
                .then(ObservationScheduleService.listPoolResources)
                .then(function () {
                    ObservationScheduleService.listAllocationsForSubarray(vm.subarray_id)
                        .then(function () {
                            ObservationScheduleService.getSchedulerModeForSubarray(vm.subarray_id)
                                .then(function () {
                                    vm.selectedMode = ObservationScheduleService.schedulerModes[vm.subarray_id];
                                    if (ObservationScheduleService.subarrays.length === 0) {
                                        ObservationScheduleService.listSubarrays()
                                            .then(function () {
                                                vm.subarray = _.findWhere(ObservationScheduleService.subarrays, {id: vm.subarray_id.toString()});
                                                vm.subarrayState = vm.subarray.state.toUpperCase();
                                            });
                                    } else {
                                        vm.subarray = _.findWhere(ObservationScheduleService.subarrays, {id: vm.subarray_id.toString()});
                                        vm.subarrayState = vm.subarray.state.toUpperCase();
                                    }
                                });
                        });
                });
        };

        vm.executeSchedule = function (item) {
            ObservationScheduleService.executeSchedule(vm.subarray_id, item.id_code)
                .then($rootScope.displayPromiseResult);
        };

        vm.stopExecuteSchedule = function (item) {
            ObservationScheduleService.cancelExecuteSchedule(vm.subarray_id, item.id_code)
                .then($rootScope.displayPromiseResult);
        };

        vm.cloneSchedule = function (item) {
            ObservationScheduleService.cloneSchedule(item.id_code)
                .then($rootScope.displayPromiseResult);
        };

        vm.moveScheduleRowToFinished = function (item) {
            ObservationScheduleService.scheduleToComplete(vm.subarray_id, item.id_code)
                .then($rootScope.displayPromiseResult);
        };

        vm.moveScheduleRowToDraft = function (item) {
            ObservationScheduleService.scheduleToDraft(vm.subarray_id, item.id_code)
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
            ObservationScheduleService.markResourceFaulty(vm.subarray_id, resource.name, resource.state === 'faulty' ? 0 : 1)
                .then($rootScope.displayPromiseResult);
        };

        vm.schedulerModeChanged = function () {
            ObservationScheduleService.setSchedulerModeForSubarray(vm.subarray_id, vm.selectedMode)
                .then($rootScope.displayPromiseResult);
        };

        vm.viewSBTaskLog = function (sb) {
            ObservationScheduleService.viewTaskLogForSBIdCode(sb.id_code);
        };

        vm.verifySB = function (sb) {
            ObservationScheduleService.verifyScheduleBlock(vm.subarray_id, sb.id_code)
                .then($rootScope.displayPromiseResult);
        };

        vm.freeSubarray = function () {
            ObservationScheduleService.freeSubarray(vm.subarray_id)
                .then(function (result) {
                    $rootScope.displayPromiseResult(result);
                    ObservationScheduleService.listSubarrays()
                        .then(function () {
                            vm.subarray = _.findWhere(ObservationScheduleService.subarrays, {id: vm.subarray_id.toString()});
                            vm.subarrayState = vm.subarray.state.toUpperCase();
                        });
                });
        };

        vm.activateSubarray = function () {
            ObservationScheduleService.activateSubarray(vm.subarray_id)
                .then(function (result) {
                    $rootScope.displayPromiseResult(result);
                    ObservationScheduleService.listSubarrays()
                        .then(function () {
                            vm.subarray = _.findWhere(ObservationScheduleService.subarrays, {id: vm.subarray_id.toString()});
                            vm.subarrayState = vm.subarray.state.toUpperCase();
                        });
                });
        };

        vm.refreshScheduleBlocks();
    }
})();
