(function () {

    angular.module('katGui.scheduler')
        .controller('SubArrayResourcesCtrl', SubArrayResourcesCtrl);

    function SubArrayResourcesCtrl($state, $scope, ObsSchedService, $rootScope, $stateParams,
                                   NotifyService, ConfigService) {

        var vm = this;

        vm.poolResourcesFree = ObsSchedService.poolResourcesFree;
        vm.resources_faulty = ObsSchedService.resources_faulty;
        vm.resources_in_maintenance = ObsSchedService.resources_in_maintenance;
        if (!$scope.$parent.vm.subarray) {
            $scope.$parent.vm.waitForSubarrayToExist().then(function () {
                vm.subarray = $scope.$parent.vm.subarray;
            });
        } else {
            vm.subarray = $scope.$parent.vm.subarray;
        }
        $scope.parentScope = $scope.$parent;

        vm.selectAllUnassignedResources = function (selected) {
            vm.poolResourcesFree.forEach(function (item) {
                item.selected = selected;
            });
        };

        vm.assignSelectedResources = function () {
            var itemsAssigned = [];
            vm.poolResourcesFree.forEach(function (item) {
                if (item.selected) {
                    itemsAssigned.push(item.name);
                }
            });
            if (itemsAssigned.length > 0) {
                var itemsString = itemsAssigned.join(',');
                ObsSchedService.assignResourcesToSubarray(vm.subarray.id, itemsString);
            }
            vm.selectAll = false;
        };

        vm.freeAssignedResource = function (resource) {
            ObsSchedService.unassignResourcesFromSubarray(vm.subarray.id, resource.name);
        };

        vm.freeSubarray = function () {
            ObsSchedService.freeSubarray(vm.subarray.id);
        };

        vm.activateSubarray = function () {
            vm.subarray.showProgress = true;
            ObsSchedService.activateSubarray(vm.subarray.id)
                .then(function (result) {
                    NotifyService.showSimpleToast(result.data.result);
                    vm.subarray.showProgress = false;
                }, function (error) {
                    NotifyService.showSimpleDialog('Could not activate Subarray', error.data.result);
                    vm.subarray.showProgress = false;
                });
        };

        vm.setSubarrayInMaintenance = function () {
            ObsSchedService.setSubarrayMaintenance(vm.subarray.id, vm.subarray.maintenance ? 'clear' : 'set');
        };

        vm.markResourceFaulty = function (resource) {
            ObsSchedService.markResourceFaulty(resource.name, resource.faulty? 'clear' : 'set');
        };

        vm.markResourceInMaintenance = function (resource) {
            ObsSchedService.markResourceInMaintenance(resource.name, resource.maintenance ? 'clear' : 'set');
        };

        vm.listResourceMaintenanceDevicesDialog = function (resource, event) {
            ObsSchedService.listResourceMaintenanceDevicesDialog(vm.subarray.id, resource.name, event);
        };

        vm.isResourceInMaintenance = function (resource) {
            if (ObsSchedService.resources_in_maintenance) {
                resource.maintenance = ObsSchedService.resources_in_maintenance.indexOf(resource.name) !== -1;
                return resource.maintenance;
            } else {
                resource.maintenance = false;
                return false;
            }
        };

        vm.isResourceFaulty = function (resource) {
            resource.faulty = ObsSchedService.resources_faulty.indexOf(resource.name) !== -1;
            return resource.faulty;
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
            if (vm.unbindDelegateWatch) {
                vm.unbindDelegateWatch();
            }
        });
    }

})();
