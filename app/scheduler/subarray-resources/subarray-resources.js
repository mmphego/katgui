(function () {

    angular.module('katGui.scheduler')
        .controller('SubArrayResourcesCtrl', SubArrayResourcesCtrl);

    function SubArrayResourcesCtrl($state, $scope, ObservationScheduleService, $rootScope) {

        var vm = this;

        vm.subarrays = ObservationScheduleService.subarrays;
        vm.poolResourcesFree = ObservationScheduleService.poolResourcesFree;
        vm.poolResources = ObservationScheduleService.poolResources;

        vm.refreshResources = function () {
            ObservationScheduleService.listSubarrays()
                .then(function () {
                    ObservationScheduleService.listPoolResources();
                });
        };

        vm.assignSelectedResources = function (subarray) {
            var itemsAssigned = [];
            vm.poolResourcesFree.forEach(function (item) {
                if (item.selected) {
                    itemsAssigned.push(item.name);
                }
            });
            var itemsString = itemsAssigned.join(',');
            ObservationScheduleService.assignResourcesToSubarray(subarray.id, itemsString)
                .then($rootScope.displayPromiseResult);
        };

        vm.freeAssignedResource = function (subarray, resource) {
            ObservationScheduleService.unassignResourcesFromSubarray(subarray.id, resource.name)
                .then($rootScope.displayPromiseResult);
        };

        vm.freeSubarray = function (subarray) {
            ObservationScheduleService.freeSubarray(subarray.id)
                .then(vm.refreshResources);
        };

        vm.setSubarrayInUse = function (subarray) {
            ObservationScheduleService.setSubarrayInUse(subarray.id, subarray.state === "in_use" ? 0 : 1)
                .then($rootScope.displayPromiseResult);
        };

        vm.setSubarrayInMaintenance = function (subarray) {
            ObservationScheduleService.setSubarrayMaintenance(subarray.id, subarray.in_maintenance ? 0 : 1)
                .then($rootScope.displayPromiseResult);
        };

        vm.markResourceFaulty = function (resource) {
            ObservationScheduleService.markResourceFaulty(resource.name, resource.state === 'faulty' ? 0 : 1)
                .then($rootScope.displayPromiseResult);
        };

        vm.markResourceInMaintenance = function (resource) {
            ObservationScheduleService.markResourceInMaintenance(resource.name, resource.in_maintenance ? 0 : 1)
                .then($rootScope.displayPromiseResult);
        };

        vm.navigateToSchedulerDetails = function (subarray_id) {
            $state.go('scheduler.observations.detail', {subarray_id: subarray_id});
        };

        vm.unbindShortcuts = $rootScope.$on("keydown", function (e, key) {
            if (key === 27) {
                //clear selection when pressing escape
                ObservationScheduleService.poolResourcesFree.forEach(function (item) {
                    item.selected = false;
                });
            }
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        });

        $scope.$on('$destroy', function () {
            vm.unbindShortcuts('keydown');
        });

        vm.refreshResources();
    }

})();
