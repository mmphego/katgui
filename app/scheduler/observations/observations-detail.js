(function () {

    angular.module('katGui.scheduler')
        .controller('SubArrayObservationsDetail', SubArrayObservationsDetail);

    function SubArrayObservationsDetail($scope, ObsSchedService, $stateParams) {

        var vm = this;
        vm.subarray_id = parseInt($stateParams.subarray_id);
        vm.draftListProcessingServerCall = false;
        vm.scheduleListProcessingServerCall = false;
        vm.selectedSchedule = null;
        vm.showEditMenu = false;
        vm.modeTypes = ['queue', 'manual'];

        vm.scheduleData = ObsSchedService.scheduleData;
        vm.scheduleCompletedData = ObsSchedService.scheduleCompletedData;
        vm.subarrays = ObsSchedService.subarrays;
        vm.subarray = {};

        var unbindWatch = $scope.$watchCollection('vm.subarrays', function (newVal, oldVal) {
            vm.subarray = _.findWhere(vm.subarrays, {id: '' + vm.subarray_id});
            if (vm.subarray) {
                unbindWatch();
            }
        });

        vm.completedOrderByFields = [
            {label: 'ID', value: 'id_code'},
            {label: 'Description', value: 'description'},
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
            ObsSchedService.markResourceFaulty(resource.name, resource.faulty ? 'clear' : 'set');
        };

        vm.setSchedulerMode = function (mode) {
            ObsSchedService.setSchedulerModeForSubarray(vm.subarray_id, mode);
        };

        vm.viewSBTaskLog = function (sb) {
            ObsSchedService.viewTaskLogForSBIdCode(sb.id_code);
        };

        vm.verifySB = function (sb) {
            ObsSchedService.verifyScheduleBlock(vm.subarray_id, sb.id_code);
        };

        vm.freeSubarray = function () {
            ObsSchedService.freeSubarray(vm.subarray_id);
        };

        vm.activateSubarray = function () {
            ObsSchedService.activateSubarray(vm.subarray_id);
        };

        vm.isResourceInMaintenance = function (resource) {
            resource.maintenance = ObsSchedService.resources_in_maintenance.indexOf(resource.name) !== -1;
            return resource.maintenance;
        };

        vm.isResourceFaulty = function (resource) {
            resource.faulty = ObsSchedService.resources_faulty.indexOf(resource.name) !== -1;
            return resource.faulty;
        };
    }
})();
