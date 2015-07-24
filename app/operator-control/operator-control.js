(function () {

    angular.module('katGui')
        .controller('OperatorControlCtrl', OperatorControlCtrl);

    function OperatorControlCtrl($scope, $interval, ReceptorStateService, ControlService) {

        var vm = this;
        vm.receptorsData = ReceptorStateService.receptorsData;
        vm.floodLightSensor = {value: false};

        ReceptorStateService.getReceptorList();
        vm.floodLightSensor = ReceptorStateService.floodLightSensor;

        vm.stowAll = function () {
            ControlService.stowAll();
        };

        vm.inhibitAll = function () {
            ControlService.inhibitAll();
        };

        vm.stopAll = function () {
            ControlService.stopAll();
        };

        vm.resumeOperations = function () {
            ControlService.resumeOperations();
        };

        vm.shutdownComputing = function () {
            ControlService.shutdownComputing();
        };

        vm.toggleFloodLights = function () {
            ControlService.floodlightsOn(ReceptorStateService.floodLightSensor.value ? 'off' : 'on');
        };

        var stopInterval = $interval(function () {
            ReceptorStateService.updateReceptorDates();
        }, 1000);

        $scope.$on('$destroy', function () {
            if (!vm.connectInterval) {
                $interval.cancel(vm.connectInterval);
            }
            $interval.cancel(stopInterval);
        });
    }
})();
