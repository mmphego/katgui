(function () {

    angular.module('katGui.scheduler')
        .controller('SubArrayResourcesCtrl', SubArrayResourcesCtrl);

    function SubArrayResourcesCtrl($scope, ObservationScheduleService, $timeout, $mdDialog) {

        var vm = this;

        vm.subarrays = ObservationScheduleService.subarrays;
        vm.poolResourcesFree = ObservationScheduleService.poolResourcesFree;
        vm.poolResources = ObservationScheduleService.poolResources;

        vm.refreshResources = function () {

            //chain the calls otherwise the server gives us grief
            //TODO: figure out why the server is being silly

            //ObservationScheduleService.listAllocations()
            //    .then(listProcessingComplete, listProcessingError);

            ObservationScheduleService.listSubarrays()
                .then(function () {
                    $timeout(function () {
                        ObservationScheduleService.listPoolResources()
                            .then(listProcessingComplete, listProcessingError)
                            .then(combineResults);
                    }, 400);
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
                .then(vm.refreshResources);
        };

        vm.removeSubarray = function (subarray) {
            //vm.subarrays.splice(vm.subarrays.indexOf(subarray), 1);
        };

        vm.createSubarray = function () {

            //vm.subarrays.push({id:'' + lastId++, state:'free', scheduleBlocks: []});
        };

        vm.freeAssignedResource = function (subarray, resource) {

            ObservationScheduleService.unassignResourcesFromSubarray(subarray.id, resource.name)
                .then(vm.refreshResources);
        };

        function listProcessingComplete(result) {
            $timeout(function () {
                //vm.draftListProcessingServerCall = false;
            }, 100);
        }

        function listProcessingError(result) {
            $timeout(function () {
                //vm.draftListProcessingServerCall = false;

                var alert = $mdDialog.alert()
                    .title('Server Request Failed!')
                    .content(result)
                    .ok('Close');
                $mdDialog
                    .show(alert)
                    .finally(function () {
                        alert = undefined;
                    });
            }, 100);
        }

        function combineResults() {
            //ObservationScheduleService.subarrays.forEach(function (subarray) {
            //    if (!subarray.poolResources) {
            //        subarray.poolResources = [];
            //    }
                //ObservationScheduleService.poolResources.forEach(function (poolResources) {
                //    if (poolResources.sub_nr === subarray.id) {
                //        if (poolResources.pool_resources !== "") {
                //            subarray.poolResources.push(poolResources.pool_resources);
                //        }
                //    }
                //});
            //});
        }

        $timeout(vm.refreshResources, 500);
    }

})();
