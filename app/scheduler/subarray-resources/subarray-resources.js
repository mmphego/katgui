(function () {

    angular.module('katGui.scheduler')
        .controller('SubArrayResourcesCtrl', SubArrayResourcesCtrl);

    function SubArrayResourcesCtrl($state, $scope, ObsSchedService, $rootScope) {

        var vm = this;

        vm.subarrays = ObsSchedService.subarrays;
        vm.poolResourcesFree = ObsSchedService.poolResourcesFree;
        vm.resources_faulty = ObsSchedService.resources_faulty;
        vm.resources_in_maintenance = ObsSchedService.resources_in_maintenance;

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
                ObsSchedService.assignResourcesToSubarray(subarray.id, itemsString);
            }
            vm.selectAll = false;
        };

        vm.freeAssignedResource = function (subarray, resource) {
            ObsSchedService.unassignResourcesFromSubarray(subarray.id, resource.name);
        };

        vm.freeSubarray = function (subarray) {
            ObsSchedService.freeSubarray(subarray.id);
        };

        vm.activateSubarray = function (subarray) {
            ObsSchedService.activateSubarray(subarray.id);
        };

        vm.setSubarrayInMaintenance = function (subarray) {
            ObsSchedService.setSubarrayMaintenance(subarray.id, subarray.maintenance ? 'clear' : 'set');
        };

        vm.markResourceFaulty = function (resource) {
            ObsSchedService.markResourceFaulty(resource.name, resource.faulty? 'clear' : 'set');
        };

        vm.markResourceInMaintenance = function (resource) {
            ObsSchedService.markResourceInMaintenance(resource.name, resource.maintenance ? 'clear' : 'set');
        };

        vm.isResourceInMaintenance = function (resource) {
            resource.maintenance = ObsSchedService.resources_in_maintenance.indexOf(resource.name) !== -1;
            return resource.maintenance;
        };

        vm.isResourceFaulty = function (resource) {
            resource.faulty = ObsSchedService.resources_faulty.indexOf(resource.name) !== -1;
            return resource.faulty;
        };

        vm.navigateToSchedulerDetails = function (subarray_id) {
            $state.go('scheduler.observations.detail', {subarray_id: subarray_id});
        };

        vm.unbindShortcuts = $rootScope.$on("keydown", function (e, key) {
            if (key === 27) {
                //clear selection when pressing escape
                ObsSchedService.poolResourcesFree.forEach(function (item) {
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
    }

})();
