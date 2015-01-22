(function(){

    angular.module('katGui.scheduler')
        .controller('SubArrayResourcesCtrl', SubArrayResourcesCtrl);

    function SubArrayResourcesCtrl(ObservationScheduleService, $timeout, $mdDialog) {

        var vm = this;
        vm.resourcePoolData1 = ObservationScheduleService.resourcePoolData1;
        vm.resourcePoolData2 = ObservationScheduleService.resourcePoolData2;
        vm.resourcePoolDataFree = ObservationScheduleService.resourcePoolDataFree;

        vm.refreshResources = function () {
            ObservationScheduleService.listPoolResourcesForSubarray(1)
                .then(listProcessingComplete, listProcessingError);

            //send call on next digest cycle
            //server doesnt like it in quick succession for some reason
            //TODO: figure out why
            $timeout(function() {
                ObservationScheduleService.listPoolResourcesForSubarray(2)
                    .then(listProcessingComplete, listProcessingError);
            }, 100);

            //send call on next digest cycle
            //server doesnt like it in quick succession for some reason
            //TODO: figure out why
            $timeout(function() {
                ObservationScheduleService.listPoolResourcesForSubarray('free')
                    .then(listProcessingComplete, listProcessingError);
            }, 200);
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
