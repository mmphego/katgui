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

        vm.selectAllUnassignedResources = function (selected) {
            vm.poolResourcesFree.forEach(function (item) {
                item.selected = selected;
            });
        };

        vm.assignSelectedResources = function (subarray) {
            var itemsAssigned = [];
            vm.poolResourcesFree.forEach(function (item) {
                if (item.selected) {
                    itemsAssigned.push(item.name);
                }
            });
            if (itemsAssigned.length > 0) {
                var itemsString = itemsAssigned.join(',');
                ObservationScheduleService.assignResourcesToSubarray(subarray.id, itemsString)
                    .then($rootScope.displayPromiseResult);
            }
            vm.selectAll = false;
        };

        vm.freeAssignedResource = function (subarray, resource) {
            ObservationScheduleService.unassignResourcesFromSubarray(subarray.id, resource.name)
                .then($rootScope.displayPromiseResult);
        };

        vm.freeSubarray = function (subarray) {
            ObservationScheduleService.freeSubarray(subarray.id)
                .then(function(result) {
                    $rootScope.displayPromiseResult(result);
                    vm.refreshResources();
                });
        };

        vm.activateSubarray = function (subarray) {
            ObservationScheduleService.activateSubarray(subarray.id)
                .then($rootScope.displayPromiseResult);
        };

        vm.setSubarrayInMaintenance = function (subarray) {
            ObservationScheduleService.setSubarrayMaintenance(subarray.id, subarray.in_maintenance ? 0 : 1)
                .then($rootScope.displayPromiseResult);
        };

        vm.markResourceFaulty = function (subarray, resource) {
            ObservationScheduleService.markResourceFaulty(
                subarray? subarray.id : '', resource.name, resource.state === 'faulty' ? 0 : 1)
                .then($rootScope.displayPromiseResult);
        };

        vm.markResourceInMaintenance = function (subarray, resource) {
            ObservationScheduleService.markResourceInMaintenance(
                subarray? subarray.id : '', resource.name, resource.in_maintenance ? 0 : 1)
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
                vm.selectAll = false;
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
