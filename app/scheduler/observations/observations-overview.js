(function () {

    angular.module('katGui.scheduler')
        .controller('SubArrayExecutorOverview', SubArrayExecutorOverview);

    function SubArrayExecutorOverview($state, ObservationScheduleService) {

        var vm = this;
        vm.subarrays = ObservationScheduleService.subarrays;
        vm.scheduleData = ObservationScheduleService.scheduleData;

        vm.refreshScheduleBlocks = function () {
            ObservationScheduleService.listSubarrays()
                .then(function () {
                    ObservationScheduleService.getScheduleBlocks();
                });
        };

        vm.navigateToSchedulerDetails = function (subarray_id) {
            $state.go('scheduler.observations.detail', {subarray_id: subarray_id});
        };

        vm.refreshScheduleBlocks();
    }

})();
