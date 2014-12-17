(function () {

    angular.module('katGui')
        .controller('LoginFormCtrl', LoginFormCtrl);

    function LoginFormCtrl($state, $mdDialog, SessionService, USER_ROLES) {

        var vm = this;
        vm.loginResult = "";
        vm.loginDetails = "";
        vm.credentials = {
            username: '',
            password: ''
        };

        vm.login = function () {
            SessionService.login(vm.credentials.username, vm.credentials.password);
        };

        vm.forgotPassword = function (event, email) {
            $mdDialog
                .show({
                    controller: DialogController,
                    template: "<md-dialog style='padding: 0;' md-theme='indigo' aria-label='Password Recovery'><md-content style='padding: 0px; margin: 0px; width: 396px; ' layout='column' layout-padding >" +
                    "<md-toolbar class='md-primary long-input' layout='row' layout-align='center center'><span style='font-weight: bold;'>Password Recovery</span></md-toolbar>" +
                    "<md-text-float focus id='recoveryEmailInput' style='margin: 16px;' class='long-input' label='Email Address' ng-model='email' value='{{email}}'></md-text-float>" +
                    "<div layout='row' layout-align='end' style='margin-top: 8px; margin-right: 8px; margin-bottom: 8px;'>" +
                    "<md-button style='margin-left: 8px;' md-theme='blue' class='md-primary' aria-label='Cancel Recovery' ng-click='cancel()'>Cancel</md-button>" +
                    "<md-button style='margin-left: 8px;' md-theme='blue' class='md-primary md-raised' aria-label='Recover Password' ng-click='answer(email)'><span>Recover</span></md-button>" +
                    "</div>" +
                    "</md-content></md-dialog>",
                    targetEvent: event
                })
                .then(function (answer) {
                    console.log('send email recovery answer: ' + answer);
                }, function () {
                    console.log('User canceled email recovery dialog.');
                });
        };

    }

    function DialogController($scope, $mdDialog) {

        $scope.hide = function () {
            $mdDialog.hide();
        };
        $scope.cancel = function () {
            $mdDialog.cancel();
        };
        $scope.answer = function (answer) {
            $mdDialog.hide(answer);
        };


    }
})();
