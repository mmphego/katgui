(function () {

    angular.module('katGui.scheduler')
        .controller('SubArrayResourcesCtrl', SubArrayResourcesCtrl);

    function SubArrayResourcesCtrl($scope, ObservationScheduleService, $timeout, $mdDialog) {

        var vm = this;

        vm.subarrays = ObservationScheduleService.subarrays;
        vm.poolResourcesFree = ObservationScheduleService.poolResourcesFree;

        vm.refreshResources = function () {

            //chain the calls otherwise the server gives us grief
            //TODO: figure out why the server is being silly

            //ObservationScheduleService.listAllocations()
            //    .then(listProcessingComplete, listProcessingError);

            ObservationScheduleService.listSubarrays()
                .then(function () {
                    ObservationScheduleService.listPoolResources()
                        .then(listProcessingComplete, listProcessingError)
                        .then(combineResults);
                });
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
            ObservationScheduleService.subarrays.forEach(function (subarray) {
                ObservationScheduleService.poolResources.forEach(function (poolResources) {
                    if (poolResources.sub_nr === subarray.id) {
                        if (!subarray.poolResources) {
                            subarray.poolResources = [];
                        }
                        subarray.poolResources.push(poolResources.pool_resources);
                    }
                });
            });
        }

        vm.getSubarrayPoolResourceString = function (subarrayId) {
            if (!vm['resourcePoolData' + subarrayId]) {
                return [];
            }
            return vm['resourcePoolData' + subarrayId];
        };

        $timeout(vm.refreshResources, 100);
    }

})();
