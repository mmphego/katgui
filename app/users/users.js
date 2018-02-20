(function() {
    angular.module('katGui.user', ['katGui.services', 'katGui.util'])
        .controller('UserCtrl', UserCtrl);

    function UserCtrl($scope, $mdDialog, $rootScope, $log, UserService, KatGuiUtil, NotifyService, SessionService) {

        var vm = this;
        vm.showDeactivatedUsers = false;
        vm.isUserAdmin = false;
        vm.orderByFields = [{
                label: 'Id',
                value: 'id'
            },
            {
                label: 'Name',
                value: 'name'
            },
            {
                label: 'Email',
                value: 'email'
            },
            {
                label: 'Roles',
                value: 'roles'
            }
        ];
        vm.userData = UserService.users;
        vm.userSessions = SessionService.userSessions;

        vm.setOrderBy = function(column) {
            var newOrderBy = _.findWhere(vm.orderByFields, {
                value: column
            });
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

        vm.addUser = function(event) {
            UserService.editUserDialog({
                name: '',
                email: '',
                roles: ['read_only'],
                activated: true
            }, event);
        };

        vm.editUser = function(user, event) {
            UserService.editUserDialog(user, event);
        };

        vm.listUsers = function() {
            UserService.listUsers();
        };

        vm.deactivateUser = function(user) {
            user.activated = false;
            UserService.updateUser(user);
        };

        vm.activateUser = function(user) {
            user.activated = true;
            UserService.updateUser(user);
        };

        vm.resetPassword = function(user, event) {
            UserService.resetPasswordDialog(user, event);
        };

        vm.showSessionDetails = function(user) {
            SessionService.showSessionDetails(user);
        };

        vm.afterInit = function() {
            if ($rootScope.currentUser) {
                vm.isUserAdmin = $rootScope.currentUser.roles.indexOf('user_admin') !== -1 || $rootScope.expertOrLO;
                if (vm.isUserAdmin) {
                    vm.listUsers();
                    SessionService.listUserSessions();
                }
            }
        };

        vm.afterInit();

        $scope.$on('$destroy', function() {
        });
    }
})();
