(function() {

    angular.module('katGui.services')
        .service('UserService', UserService);

    function UserService($http, $q, $rootScope, $log, $mdDialog, NotifyService) {

        function urlBase() {
            return $rootScope.portalUrl ? $rootScope.portalUrl + '/katauth' : '';
        }

        var api = {};
        api.users = [];
        api.userRoles = [
            {"name": "User Administrator", value: "user_admin"},
            {"name": "Control Authority", value: "control_authority"},
            {"name": "Lead Operator", value: "lead_operator"},
            {"name": "Operator", value: "operator"},
            {"name": "Expert", value: "expert"},
            {"name": "Read Only", value: "read_only"}
        ];

        api.listUsers = function() {
            var def = $q.defer();
            $http(createRequest('get', urlBase() + '/user/list')).then(
                function(result) {

                    if (result && result.data) {
                        api.users.splice(0, api.users.length);
                        result.data.forEach(function(user) {
                            api.users.push(user);
                        });
                        def.resolve();
                    } else {
                        $log.error('Could not retrieve any users.');
                        def.reject();
                    }
                },
                function(error) {
                    $log.error(error);
                });
            return def.promise;
        };

        api.createUser = function(user) {
            $http(createRequest('post',
                    urlBase() + '/user/add', {
                        name: user.name,
                        email: user.email,
                        roles: user.roles.join(',')
                    }))
                .then(function(result) {
                    api.listUsers();
                    NotifyService.showSimpleToast("Created user " + result.data.name);
                }, function(result) {
                    NotifyService.showSimpleDialog("Error creating user", result);
                });
        };

        api.updateUser = function(user) {
            $http(createRequest('post', urlBase() + '/user/modify/' + user.id, {
                    name: user.name,
                    email: user.email,
                    activated: user.activated,
                    roles: user.roles.join(',')
                }))
                .then(function(result) {
                    var oldUser = _.findWhere(api.users, {
                        id: result.data.id
                    });
                    for (var attr in result.data) {
                        oldUser[attr] = result.data[attr];
                    }
                    NotifyService.showSimpleToast("Updated user " + result.data.name);
                }, function(result) {
                    NotifyService.showSimpleDialog("Error sending request", "Error updating user " + result.data.name);
                });
        };

        api.resetPassword = function(user, passwordHash) {
            return $http(createRequest('post',
                urlBase() + '/user/reset/' + user.id, {
                    'password': passwordHash
                }));
        };

        api.editUserDialog = function(oldUser, event) {
            $mdDialog
                .show({
                    controller: function($rootScope, $scope, $mdDialog) {
                        $scope.user = {
                            id: oldUser.id,
                            name: oldUser.name,
                            email: oldUser.email,
                            roles: oldUser.roles,
                            activated: oldUser.activated
                        };
                        $scope.userRoles = api.userRoles;

                        $scope.accept = function() {
                            if ($scope.user.id) {
                                api.updateUser($scope.user);
                            } else {
                                api.createUser($scope.user);
                            }
                            $mdDialog.hide();
                        };

                        $scope.cancel = function() {
                            $mdDialog.hide();
                        };
                    },
                    template: [
                        '<md-dialog>',
                            '<form name="userForm">',
                            '<md-toolbar md-theme="{{$root.themePrimary}}" class="md-primary"><div class="md-toolbar-tools">{{user.id? "Edit User - " + user.name : "Add User"}}</div></md-toolbar>',
                            '<md-dialog-content style="padding: 32px" md-theme="{{$root.themePrimaryButtons}}" layout="column">',
                                '<md-input-container class="long-input">',
                                    '<label>Name</label>',
                                    '<input md-autofocus required ng-model="user.name" name="name" minlength="3" type="text"/>',
                                    '<div ng-messages="userForm.name.$error">',
                                        '<div ng-message-exp="[\'required\', \'minlength\']">',
                                            'You must enter a name that is 3 characters or more.',
                                        '</div>',
                                    '</div>',
                                '</md-input-container>',
                                '<md-input-container class="long-input">',
                                    '<label>Email</label>',
                                    '<input required ng-model="user.email" minlength="5" ng-pattern="/^.+@.+\..+$/" name="email" type="email"/>',
                                    '<div ng-messages="userForm.email.$error">',
                                        '<div ng-message-exp="[\'required\', \'minlength\', \'pattern\']">',
                                            'You must enter a valid email address that is 5 characters or more.',
                                        '</div>',
                                    '</div>',
                                '</md-input-container>',
                                '<md-select ng-model="user.roles" multiple class="md-primary" placeholder="No Roles Assigned">',
                                    '<md-option ng-value="role.value" ng-repeat="role in userRoles">{{role.name}}</md-option>',
                                '</md-select>',
                                '<md-checkbox ng-if="user.id" class="md-primary" ng-model="user.activated">Active</md-checkbox>',
                            '</md-dialog-content>',
                            '<md-dialog-actions  md-theme="{{$root.themePrimaryButtons}}" layout="row">',
                                '<span flex></span>',
                                '<md-button ng-disabled="userForm.$invalid" ng-click="accept()">{{user.id? "Edit User": "Create User"}}</md-button>',
                                '<md-button ng-click="cancel()">Cancel</md-button>',
                            '</md-dialog-actions>',
                            '</form>',
                        '</md-dialog>'
                    ].join(''),
                    targetEvent: event
                });
        };

        api.resetPasswordDialog = function (user, password) {
            var passwordHash = null;
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog) {
                        $scope.cancel = function () {
                            $mdDialog.cancel();
                        };
                        $scope.accept = function () {
                            $mdDialog.hide($scope.newPassword);
                        };
                    },
                    template: [
                        '<md-dialog>',
                            '<form name="passwordForm">',
                            '<md-toolbar md-theme="{{$root.themePrimary}}" class="md-primary"><div class="md-toolbar-tools">Reset Password</div></md-toolbar>',
                            '<md-dialog-content style="padding: 32px" md-theme="{{$root.themePrimaryButtons}}" layout="column">',
                                '<md-input-container class="long-input">',
                                    '<label>Password</label>',
                                    '<input md-autofocus required ng-model="newPassword" minlength="3" name="password" type="password"/>',
                                    '<div ng-messages="passwordForm.password.$error">',
                                        '<div ng-message-exp="[\'required\', \'minlength\']">',
                                            'You must enter a password that is 3 characters or more.',
                                        '</div>',
                                    '</div>',
                                '</md-input-container>',
                            '</md-dialog-content>',
                            '<md-dialog-actions  md-theme="{{$root.themePrimaryButtons}}" layout="row">',
                                '<span flex></span>',
                                '<md-button ng-disabled="passwordForm.$invalid" ng-click="accept()">Set Password</md-button>',
                                '<md-button ng-click="cancel()">Cancel</md-button>',
                            '</md-dialog-actions>',
                            '</form>',
                        '</md-dialog>'
                    ].join(''),
                    targetEvent: event
                })
                .then(function (answer) {
                    passwordHash = CryptoJS.SHA256(answer).toString();
                    api.resetPassword(user, passwordHash).then(function (result) {
                        NotifyService.showSimpleToast('Password successfully reset.');
                    }, function (result) {
                        NotifyService.showSimpleToast('There was an error resetting the password.');
                        $log.error(result);
                    });
                }, function () {
                    $log.info('Cancelled Password reset.');
                });
        };

        function createRequest(method, url, data) {
            var req = {
                method: method,
                url: url,
                headers: {
                    'Authorization': 'CustomJWT ' + $rootScope.jwt
                }
            };

            if (data && method === 'post') {
                req.headers['Content-Type'] = 'application/json';
                req.data = data;
            }

            return req;
        }

        return api;
    }

})();
