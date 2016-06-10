(function () {

    angular.module('katGui.scheduler')
        .controller('SubArrayExecutorOverview', SubArrayExecutorOverview);

    function SubArrayExecutorOverview($scope, $state, ObsSchedService, $interval) {

        var vm = this;
        vm.subarrays = ObsSchedService.subarrays;
        vm.scheduleData = ObsSchedService.scheduleData;
        $scope.$parent.vm.subarray = null;
        $scope.parent = $scope.$parent;

        vm.navigateToSchedulerDetails = function (subarray_id) {
            $state.go('scheduler.observations.detail', {subarray_id: subarray_id});
        };
    }

})();
