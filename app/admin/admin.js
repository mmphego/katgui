(function () {
    angular.module('katGui.admin', ['katGui.services', 'katGui.util'])
        .controller('AdminCtrl', AdminCtrl);

    function AdminCtrl($scope, $mdDialog, $rootScope, $log, UserService, KatGuiUtil, ObsSchedService, ConfigService,
                       NotifyService) {

        var vm = this;
        vm.showDeactivatedUsers = false;
        vm.isUserAdmin = false;
        vm.isCurrentUserLO = false;
        vm.orderByFields = [
            {label: 'Id', value: 'id'},
            {label: 'Name', value: 'name'},
            {label: 'Email', value: 'email'},
            {label: 'Roles', value: 'roles'}
        ];
        vm.orderBy = vm.orderByFields[0];
        vm.userRoles = [
            {"name": "User Administrator", value: "user_admin"},
            {"name": "Control Authority", value: "control_authority"},
            {"name": "Lead Operator", value: "lead_operator"},
            {"name": "Operator", value: "operator"},
            {"name": "Read Only", value: "read_only"}
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
                if (user.originalUser) {
                    user.name = user.originalUser.name;
                    user.email = user.originalUser.email;
                    user.roles = user.originalUser.roles;
                }
                user.originalUser = undefined;
            }
        };

        vm.deactivateUser = function (user) {
            user.activated = false;
            vm.saveUser(user);
        };

        vm.activateUser = function (user) {
            user.activated = true;
            vm.saveUser(user);
        };

        vm.resetPassword = function (event, user) {
            var passwordHash = null;
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog) {
                        $scope.themePrimary = $rootScope.themePrimary;
                        $scope.themePrimaryButtons = $rootScope.themePrimaryButtons;
                        $scope.hide = function () {
                            $mdDialog.hide();
                        };
                        $scope.cancel = function () {
                            $mdDialog.cancel();
                        };
                        $scope.answer = function (answer) {
                            $mdDialog.hide(answer);
                        };
                    },
                    template: "<md-dialog style='padding: 0;' md-theme='{{themePrimary}}'><md-content style='padding: 0; margin: 0; width: 396px;' layout='column' layout-padding>" +
                    "<md-toolbar class='md-primary long-input' layout='row' layout-align='center center'><span style='font-weight: bold;'>Password Reset</span></md-toolbar>" +
                    "<md-input-container md-no-float md-theme='{{themePrimaryButtons}}' id='resetPasswordInput' type='password' class='long-input' style='padding: 16px'>" +
                    "<input placeholder='New Password' type='password' focus ng-model='password'>" +
                    "</md-input-container>" +
                    "<div layout='row' layout-align='end' style='margin-top: 8px; margin-right: 8px; margin-bottom: 8px;'>" +
                    "<md-button style='margin-left: 8px;' md-theme='{{themePrimaryButtons}}' class='md-primary' ng-click='cancel()'>Cancel</md-button>" +
                    "<md-button style='margin-left: 8px;' md-theme='{{themePrimaryButtons}}' class='md-primary' ng-click='answer(password)'><span>Reset</span></md-button>" +
                    "</div>" +
                    "</md-content></md-dialog>",
                    targetEvent: event
                })
                .then(function (answer) {
                    passwordHash = CryptoJS.SHA256(answer).toString();
                    UserService.resetPassword(user, passwordHash).then(function (result) {
                        NotifyService.showSimpleToast('Password successfully reset.');
                    }, function (result) {
                        NotifyService.showSimpleToast('There was an error resetting the password.');
                        $log.error(result);
                    });
                }, function () {
                    $log.info('Cancelled Password reset.');
                });
        };

        vm.keydown = function (e, key) {
            if (key === 27 && vm.sortedUserData) {
                //escape
                for (var i = vm.sortedUserData.length - 1; i > -1; i--) {
                    if (vm.sortedUserData[i].temp || vm.sortedUserData[i].originalUser) {
                        vm.undoUserChanges(vm.sortedUserData[i]);
                        break;
                    }
                }
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            }
        };

        vm.unbindShortcuts = $rootScope.$on("keydown", vm.keydown);

        vm.afterInit = function() {
            if ($rootScope.currentUser) {
                vm.isCurrentUserLO = $rootScope.currentUser.req_role === 'lead_operator';
                vm.isUserAdmin = $rootScope.currentUser.roles.indexOf('user_admin') !== -1 || vm.isCurrentUserLO;
                if (vm.isUserAdmin) {
                    vm.listUsers();
                }
            } else {
                vm.undbindLoginSuccess = $rootScope.$on('loginSuccess', vm.afterInit);
            }
        };

        vm.afterInit();

        $scope.$on('$destroy', function () {
            vm.unbindShortcuts('keydown');
            if (vm.undbindLoginSuccess) {
                vm.undbindLoginSuccess('loginSuccess');
            }
        });
    }
})();
