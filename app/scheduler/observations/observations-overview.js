(function () {

    angular.module('katGui.scheduler')
        .controller('SubArrayExecutorOverview', SubArrayExecutorOverview);

    function SubArrayExecutorOverview($state, ObservationScheduleService, $timeout) {

        var vm = this;

        vm.subarrays = ObservationScheduleService.subarrays;
        vm.scheduleData = ObservationScheduleService.scheduleData;

        vm.refreshResources = function () {

            ObservationScheduleService.listSubarrays()
                .then(function () {
                    ObservationScheduleService.getScheduleBlocks();
                });
        };

        vm.navigateToSchedulerDetails = function (subarray_id) {
            $state.go('scheduler.observations.detail', {subarray_id: subarray_id});
        };

        $timeout(vm.refreshResources, 0);
    }

})();
