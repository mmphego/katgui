(function () {

    angular.module('katGui')
        .controller('LoginFormCtrl', LoginFormCtrl);

    function LoginFormCtrl($state, Session, USER_ROLES) {

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
        };

        vm.forgotPassword = function () {
            alert('nothing to see here yet...');
        };
    }
})();
