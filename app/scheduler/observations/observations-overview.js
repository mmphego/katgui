(function () {

    angular.module('katGui.scheduler')
        .controller('SubArrayExecutorOverview', SubArrayExecutorOverview);

    function SubArrayExecutorOverview($state, ObsSchedService, $interval) {

        var vm = this;
        vm.subarrays = ObsSchedService.subarrays;
        vm.scheduleData = ObsSchedService.scheduleData;

        vm.navigateToSchedulerDetails = function (subarray_id) {
            $state.go('scheduler.observations.detail', {subarray_id: subarray_id});
        };

        vm.progressInterval = $interval(function () {
            ObsSchedService.scheduleData.forEach(function (sb) {
                sb.progress = vm.sbProgress(sb);
            });
        }, 1500);

        $scope.$on('$destroy', function () {
            if (vm.progressInterval) {
                $interval.cancel(vm.progressInterval);
            }
        });
    }

})();
