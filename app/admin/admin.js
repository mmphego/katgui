(function () {
    angular.module('katGui.admin', ['katGui.services', 'katGui.util'])
        .controller('AdminCtrl', AdminCtrl);

    function AdminCtrl(UserService, $timeout, KatGuiUtil, $mdDialog, $rootScope) {

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

        vm.userRoles = [
            {"id": 1, "name": "User Administrator", value: "user_admin", "assignable": true},
            {"id": 2, "name": "Control Authority", value: "control_authority", "assignable": true},
            {"id": 3, "name": "Lead Operator", value: "lead_operator", "assignable": true},
            {"id": 3, "name": "Operator", value: "operator", "assignable": true},
            {"id": 1, "name": "Read Only", value: "read_only", "assignable": true}
        ];

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

        vm.createUser = function () {

            UserService.addTempCreatedUser({
                id: 'ztemp_' + KatGuiUtil.generateUUID(),
                name: 'new user',
                email: 'new_user@ska.ac.za',
                roles: ['read_only'],
                activated: true,
                temp: true
            });

            vm.editUser(vm.userData[vm.userData.length - 1]);
        };

        vm.editUser = function (user) {
            if (!user.editing) {
                user.originalUser = {
                    name: user.name,
                    email: user.email,
                    roles: user.roles
                };
                user.editing = true;
            }
        };

        vm.saveUser = function (user) {
            user.editing = false;
            user.originalUser = {};

            var newUser = {
                id: user.id,
                name: user.name,
                email: user.email,
                activated: true,
                roles: user.roles
            };

            if (typeof user.id !== 'string') {
                UserService.updateUser(newUser).then(function (result) {
                    UserService.listUsers(); //TODO: replace user list call with the newly edited user
                });
            } else {
                if (!newUser.roles) {
                    newUser.roles = ['read_only'];
                }
                newUser.id = null;

                UserService.createUser(newUser).then(function () {
                    UserService.listUsers(); //TODO: replace user list call with the newly created user
                });
            }
        };

        vm.listUsers = function () {
            vm.userListProcessingServerCall = true;
            UserService.listUsers().then(function () {
                vm.userListProcessingServerCall = false;
            });
        };

        vm.undoUserChanges = function (user) {

            if (user.temp) {
                UserService.removeTempUser(user);
            } else {
                user.editing = false;
                user.name = user.originalUser.name;
                user.email = user.originalUser.email;
                user.roles = user.originalUser.roles;
            }
        };

        vm.deactivateUser = function (user) {

            user.activated = false;

            UserService.updateUser(user).then(function (result) {
                UserService.listUsers(); //TODO: replace user list call with the newly edited user
            });
        };

        vm.resetPassword = function (event, user) {

            var passwordHash = null;

            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog) {

                        $scope.themePrimary = $rootScope.themePrimaryButtons;
                        $scope.themePrimaryButtons = $rootScope.themePrimaryButtons;

                        /* istanbul ignore next */
                        $scope.hide = function () {
                            $mdDialog.hide();
                        };
                        /* istanbul ignore next */
                        $scope.cancel = function () {
                            $mdDialog.cancel();
                        };
                        /* istanbul ignore next */
                        $scope.answer = function (answer) {
                            $mdDialog.hide(answer);
                        };
                    },
                    template: "<md-dialog style='padding: 0;' md-theme='{{themePrimary}}' aria-label='Password Reset'><md-content style='padding: 0px; margin: 0px; width: 396px; ' layout='column' layout-padding >" +
                    "<md-toolbar class='md-primary long-input' layout='row' layout-align='center center'><span style='font-weight: bold;'>Password Reset</span></md-toolbar>" +
                    "<md-input-container id='resetPasswordInput' type='password' class='long-input' style='margin: 16px;'>" +
                        "<label>New Password</label>" +
                        "<input type='password' focus ng-model='password'>" +
                    "</md-input-container>" +
                    "<div layout='row' layout-align='end' style='margin-top: 8px; margin-right: 8px; margin-bottom: 8px;'>" +
                    "<md-button style='margin-left: 8px;' md-theme='{{themePrimaryButtons}}' aria-label='Cancel Reset' ng-click='cancel()'>Cancel</md-button>" +
                    "<md-button style='margin-left: 8px;' md-theme='{{themePrimaryButtons}}' class='md-primary' aria-label='Reset Password' ng-click='answer(password)'><span>Reset</span></md-button>" +
                    "</div>" +
                    "</md-content></md-dialog>",
                    targetEvent: event
                })
                .then(function (answer) {
                    passwordHash = CryptoJS.SHA256(answer).toString();

                    /* istanbul ignore next */
                    UserService.resetPassword(user, passwordHash).then(function (result) {
                        $rootScope.showSimpleToast('Password successfully reset.');
                    }, function (result) {
                        $rootScope.showSimpleToast('There was an error resetting the password.');
                        console.log(result);
                    });

                }, function () {
                    $rootScope.showSimpleToast('Cancelled Password reset.');
                });

        };

        vm.closeDropdownMenus = function () {

            var els = document.getElementsByClassName('dropdown-menu');
            //angular.element()
        };

        //list users on the next digest cycle, i.e. after controller init
        $timeout(afterInitFunction, 200);
        $rootScope.$on('loginSuccess', afterInitFunction);

        vm.inited = false;
        function afterInitFunction() {
            if ($rootScope.currentUser && !vm.inited) {
                vm.inited = true;
                vm.isUserAdmin = $rootScope.currentUser.roles.indexOf('user_admin') !== -1;
                if (vm.isUserAdmin) {
                    vm.listUsers();
                }
                console.log('inited admin page');
            }
        }
    }
})();
