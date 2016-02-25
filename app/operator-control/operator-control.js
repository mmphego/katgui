(function () {

    angular.module('katGui')
        .controller('OperatorControlCtrl', OperatorControlCtrl);

    function OperatorControlCtrl($rootScope, $scope, $state, USER_ROLES, ReceptorStateService, ControlService, NotifyService) {

        var vm = this;

        vm.receptorsData = ReceptorStateService.receptorsData;
        vm.sensorValues = ReceptorStateService.sensorValues;
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

        vm.shutdownComputing = function (event) {
            NotifyService.showImportantConfirmDialog(event, 'Confirm Shutdown',
                'Are you sure you want to shutdown all computing?',
                'Yes', 'Cancel')
                    .then(function () {
                        vm.waitingForRequestResult = true;
                        vm.handleRequestResponse(ControlService.shutdownComputing());
                    }, function () {
                        NotifyService.showSimpleToast('Cancelled Shutdown');
                    });
        };

        vm.shutdownSPCorr = function (event) {
            NotifyService.showImportantConfirmDialog(event, 'Confirm Shutdown',
                'Are you sure you want to powerdown SP and the Correlators?',
                'Yes', 'Cancel')
                    .then(function () {
                        vm.waitingForRequestResult = true;
                        vm.handleRequestResponse(ControlService.shutdownSPCorr());
                    }, function () {
                        NotifyService.showSimpleToast('Cancelled Shutdown');
                    });
        };

        vm.handleRequestResponse = function (request) {
            request
                .then(function (result) {
                    vm.waitingForRequestResult = false;
                    NotifyService.showSimpleToast(result.data.result.replace(/\\_/g, ' '));
                }, function (error) {
                    vm.waitingForRequestResult = false;
                    NotifyService.showSimpleDialog('Error sending request', error);
                });
        };

        vm.afterInit = function() {
            if ($rootScope.currentUser) {
                if ($rootScope.currentUser.req_role !== USER_ROLES.lead_operator &&
                    $rootScope.currentUser.req_role !== USER_ROLES.operator) {
                    $state.go('home');
                }
            }
        };

        vm.unbindLoginSuccess = $rootScope.$on('loginSuccess', vm.afterInit);
        vm.afterInit();

        $scope.$on('$destroy', function () {
            if (vm.unbindLoginSuccess) {
                vm.unbindLoginSuccess();
            }
        });
    }
})();
