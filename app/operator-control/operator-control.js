(function () {

    angular.module('katGui')
        .controller('OperatorControlCtrl', OperatorControlCtrl);

    function OperatorControlCtrl($rootScope, $scope, $interval, ReceptorStateService, ControlService) {

        var vm = this;
        vm.receptorsData = ReceptorStateService.receptorsData;
        vm.waitingForRequestResult = false;

        ReceptorStateService.getReceptorList();

        vm.stowAll = function () {
            vm.waitingForRequestResult = true;
            vm.handleRequestResponse(ControlService.stowAll());
        };

        vm.inhibitAll = function () {
            vm.waitingForRequestResult = true;
            vm.handleRequestResponse(ControlService.inhibitAll());
        };

        vm.stopAll = function () {
            vm.waitingForRequestResult = true;
            vm.handleRequestResponse(ControlService.stopAll());
        };

        vm.resumeOperations = function () {
            vm.waitingForRequestResult = true;
            vm.handleRequestResponse(ControlService.resumeOperations());
        };

        vm.shutdownComputing = function () {
            vm.waitingForRequestResult = true;
            vm.handleRequestResponse(ControlService.shutdownComputing());
        };

        vm.shutdownSPCorr = function () {
            vm.waitingForRequestResult = true;
            vm.handleRequestResponse(ControlService.shutdownSPCorr());
        };

        vm.handleRequestResponse = function (request) {
            request
                .success(function (result) {
                    vm.waitingForRequestResult = false;
                    $rootScope.showSimpleToast(result.result.replace(/\\_/g, ' '));
                })
                .error(function (error) {
                    vm.waitingForRequestResult = false;
                    $rootScope.showSimpleDialog('Error sending request', error);
                });
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
