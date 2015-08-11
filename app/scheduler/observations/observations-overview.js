(function () {

    angular.module('katGui.scheduler')
        .controller('SubArrayExecutorOverview', SubArrayExecutorOverview);

    function SubArrayExecutorOverview($scope, $state, ObsSchedService, $interval) {

        var vm = this;
        vm.subarrays = ObsSchedService.subarrays;
        vm.scheduleData = ObsSchedService.scheduleData;

        vm.navigateToSchedulerDetails = function (subarray_id) {
            $state.go('scheduler.observations.detail', {subarray_id: subarray_id});
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

        $scope.$on('$destroy', function () {
            if (vm.progressInterval) {
                $interval.cancel(vm.progressInterval);
            }
        });
    }

})();
