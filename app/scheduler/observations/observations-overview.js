(function () {

    angular.module('katGui.scheduler')
        .controller('SubArrayExecutorOverview', SubArrayExecutorOverview);

    function SubArrayExecutorOverview($state, ObsSchedService) {

        var vm = this;
        vm.subarrays = ObsSchedService.subarrays;
        vm.scheduleData = ObsSchedService.scheduleData;

        vm.refreshScheduleBlocks = function () {
            ObsSchedService.listSubarrays()
                .then(function () {
                    ObsSchedService.getScheduleBlocks();
                });
        };

        vm.navigateToSchedulerDetails = function (subarray_id) {
            $state.go('scheduler.observations.detail', {subarray_id: subarray_id});
        };

        vm.refreshScheduleBlocks();
    }

})();
