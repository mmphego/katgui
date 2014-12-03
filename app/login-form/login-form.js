(function () {

    angular.module('katGui')
        .controller('LoginFormCtrl', LoginFormCtrl);

    function LoginFormCtrl($state, $mdDialog, Session, USER_ROLES) {

        var vm = this;
        vm.loginResult = "";
        vm.loginDetails = "";
        vm.credentials = {
            username: '',
            password: ''
        };

        vm.login = function () {
            Session.create('sessionid1', 'userid1', USER_ROLES.expert);
            $state.go('landing');
            //hash the password for now until we can get SSL going
            var sha256Pass =  CryptoJS.SHA256(vm.credentials.password).toString();
            //console.log(sha256Pass);
        };

        vm.forgotPassword = function (event, email) {
            $mdDialog
                .show({
                    controller: DialogController,
                    template: "<md-dialog style='padding: 0;' md-theme='{{themePrimary}}' aria-label='Password Recovery'><md-content style='padding: 0px; margin: 0px; width: 396px; ' layout='column' layout-padding >" +
                    "<md-toolbar class='md-primary long-input' layout='row' layout-align='center center'><span style='font-weight: bold;'>Password Recovery</span></md-toolbar>" +
                    "<md-text-float focus id='recoveryEmailInput' style='margin: 16px;' class='long-input' label='Email Address' ng-model='email' value='{{email}}'></md-text-float>" +
                    "<div layout='row' layout-align='end' style='margin-top: 8px; margin-right: 8px; margin-bottom: 8px;'>" +
                    "<md-button style='margin-left: 8px;' md-theme='{{themePrimaryButtons}}' class='md-primary' aria-label='Cancel Recovery' ng-click='cancel()'>Cancel</md-button>" +
                    "<md-button style='margin-left: 8px;' md-theme='{{themePrimaryButtons}}' class='md-primary md-raised' aria-label='Recover Password' ng-click='answer(email)'><span>Recover</span></md-button>" +
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

    function DialogController($rootScope, $scope, $mdDialog, $timeout) {

        $scope.themePrimaryButtons = $rootScope.themePrimaryButtons;
        $scope.themePrimary = $rootScope.themePrimary;
        $scope.themeSecondary = $rootScope.themeSecondary;

        $scope.hide = function() {
            $mdDialog.hide();
        };
        $scope.cancel = function() {
            $mdDialog.cancel();
        };
        $scope.answer = function(answer) {
            $mdDialog.hide(answer);
        };
    }
})();
