(function () {

    angular.module('katGui')
        .controller('LoginFormCtrl', LoginFormCtrl);

    function LoginFormCtrl(SessionService) {

        var vm = this;
        vm.loginResult = "";
        vm.loginDetails = "";
        vm.loginAs = "";
        vm.credentials = {
            username: '',
            password: ''
        };

        vm.verify = function () {
            SessionService.verify(vm.credentials.username, vm.credentials.password, vm.loginAs);
        };
    }
})();
