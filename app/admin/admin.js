(function () {
    angular.module('katGui.admin', ['katGui.services', 'katGui.util'])
        .controller('AdminCtrl', AdminCtrl);

    function AdminCtrl($scope, $mdDialog, $rootScope, $log, UserService, KatGuiUtil, NotifyService) {

        var vm = this;
        vm.showDeactivatedUsers = false;
        vm.isUserAdmin = false;
        vm.orderByFields = [
            {label: 'Id', value: 'id'},
            {label: 'Name', value: 'name'},
            {label: 'Email', value: 'email'},
            {label: 'Roles', value: 'roles'}
        ];
        vm.orderBy = vm.orderByFields[0];
        vm.userData = UserService.users;

        vm.setOrderBy = function (column) {
            var newOrderBy = _.findWhere(vm.orderByFields, {value: column});
            if ((vm.orderBy || {}).value === column) {
                if (newOrderBy.reverse === undefined) {
                    newOrderBy.reverse = true;
                } else if (newOrderBy.reverse) {
                    newOrderBy.reverse = undefined;
                    newOrderBy = null;
                }
            }
            vm.orderBy = newOrderBy;
        };

        vm.setOrderBy('name');

        vm.addUser = function (event) {
            UserService.editUserDialog({
                name: '',
                email: '',
                roles: ['read_only'],
                activated: true
            }, event);
        };

        vm.editUser = function (user) {
            UserService.editUserDialog(user, event);
        };

        vm.saveUser = function (user) {
            user.editing = false;
            user.originalUser = {};

            var newUser = {
                id: user.id,
                name: user.name,
                email: user.email,
                activated: user.activated,
                roles: user.roles
            };

            if (typeof user.id !== 'string') {
                UserService.updateUser(newUser);
            } else {
                if (!newUser.roles) {
                    newUser.roles = ['read_only'];
                }

                UserService.createUser(newUser);
            }
        };

        vm.listUsers = function () {
            UserService.listUsers();
        };

        vm.deactivateUser = function (user) {
            user.activated = false;
            vm.saveUser(user);
        };

        vm.activateUser = function (user) {
            user.activated = true;
            vm.saveUser(user);
        };

        vm.resetPassword = function (user, event) {
            UserService.resetPasswordDialog(user, event);
        };

        vm.afterInit = function() {
            if ($rootScope.currentUser) {
                vm.isUserAdmin = $rootScope.currentUser.roles.indexOf('user_admin') !== -1 || $rootScope.expertOrLO;
                if (vm.isUserAdmin) {
                    vm.listUsers();
                }
            }
        };

        vm.unbindLoginSuccess = $rootScope.$on('loginSuccess', vm.afterInit);
        vm.afterInit();

        $scope.$on('$destroy', function () {
            vm.unbindShortcuts('keydown');
            if (vm.unbindLoginSuccess) {
                vm.unbindLoginSuccess();
            }
        });
    }
})();
