(function () {

    angular.module('katGui')
        .controller('LoginFormCtrl', LoginFormCtrl);

    function LoginFormCtrl(SessionService, $localStorage, $rootScope) {

        var vm = this;
        vm.loginResult = "";
        vm.loginDetails = "";
        vm.loginAs = $localStorage.loginAs? $localStorage.loginAs : "read_only";
        vm.credentials = {
            username: '',
            password: ''
        };

        vm.verify = function () {
            $localStorage.loginAs = vm.loginAs;
            SessionService.verify(vm.credentials.username, vm.credentials.password, vm.loginAs);
        };

        $rootScope.getSystemConfig();
    }
})();
