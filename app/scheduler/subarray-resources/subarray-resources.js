(function(){

    angular.module('katGui.scheduler')
        .controller('SubArrayResourcesCtrl', SubArrayResourcesCtrl);

    function SubArrayResourcesCtrl(ObservationScheduleService, $timeout, $mdDialog) {

        var vm = this;
        vm.resourcePoolData1 = ObservationScheduleService.resourcePoolData1;
        vm.resourcePoolData2 = ObservationScheduleService.resourcePoolData2;
        vm.resourcePoolDataFree = ObservationScheduleService.resourcePoolDataFree;
        vm.allocations = ObservationScheduleService.allocations;
        vm.subarraysFree = ObservationScheduleService.subarraysFree;
        vm.subarraysInUse = ObservationScheduleService.subarraysInUse;
        vm.subarraysMaintenance = ObservationScheduleService.subarraysMaintenance;

        vm.refreshResources = function () {

            //chain the calls otherwise the server gives us grief
            //TODO: figure out why the server is being silly
            ObservationScheduleService.listPoolResourcesForSubarray(1)
                .then(listProcessingComplete, listProcessingError)
                .then(function () {
                    ObservationScheduleService.listPoolResourcesForSubarray(2)
                        .then(listProcessingComplete, listProcessingError)
                        .then(function () {
                            ObservationScheduleService.listPoolResourcesForSubarray('free')
                                .then(listProcessingComplete, listProcessingError)
                                .then(function () {
                                    ObservationScheduleService.listAllocations()
                                        .then(listProcessingComplete, listProcessingError)
                                        .then(function () {
                                            ObservationScheduleService.listSubArraysByState('free')
                                                .then(listProcessingComplete, listProcessingError)
                                                .then(function () {
                                                    ObservationScheduleService.listSubArraysByState('in_use')
                                                        .then(listProcessingComplete, listProcessingError)
                                                        .then(function () {
                                                            ObservationScheduleService.listSubArraysByState('maintenance')
                                                                .then(listProcessingComplete, listProcessingError);
                                                        });
                                                });
                                        });
                                });
                        });
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

        $timeout(vm.refreshResources, 100);
    }

})();
