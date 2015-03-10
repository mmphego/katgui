(function () {

    angular.module('katGui')
        .controller('LoginFormCtrl', LoginFormCtrl);

    function LoginFormCtrl(SessionService) {

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
    }
})();
