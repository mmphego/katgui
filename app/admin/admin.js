(function () {
    angular.module('katGui.admin', ['katGui.services', 'katGui.util'])
        .controller('AdminCtrl', AdminCtrl);

    function AdminCtrl(UserService, $timeout, KatGuiUtil) {

        var vm = this;
        vm.showDeactivatedUsers = false;
        vm.lastId = 0;

        vm.orderByFields = [
            {label: 'Name', value: 'name'},
            {label: 'Email', value: 'email'},
            {label: 'Roles', value: 'roles'}
        ];

        vm.orderBy = null;

        vm.userRoles = [
            {"id": 2, "name": "Control Authority", value: "control_authority", "assignable": true},
            {"id": 3, "name": "Lead Operator", value: "lead_operator", "assignable": true},
            {"id": 3, "name": "Operator", value: "operator", "assignable": true},
            {"id": 1, "name": "Read Only", value: "read_only", "assignable": true}
        ];

        vm.userData = UserService.users;

        vm.setOrderBy = function (column) {
            var newOrderBy = _.findWhere(vm.orderByFields, {value: column});
            if (newOrderBy === undefined) {
                newOrderBy.reverse = false;
            } else {
                newOrderBy.reverse = !newOrderBy.reverse;
            }
            vm.orderBy = newOrderBy;
        };

        vm.createUser = function () {

            UserService.addTempCreatedUser({
                id: 'temp_' + KatGuiUtil.generateUUID(),
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
                password: '1234',
                activated: true,
                roles: user.roles
            };

            if (typeof user.id !== 'string') {
                UserService.updateUser(newUser).then(function (result) {
                    UserService.listUsers();
                    console.log('updated user called, result: ');
                    console.log(result);
                });
            } else {
                if (!newUser.roles) {
                    newUser.roles = ['read_only'];
                }
                newUser.id = null;

                UserService.createUser(newUser).then(function () {
                    UserService.listUsers();
                });
            }
        };

        vm.listUsers = function () {
            vm.userListProcessingServerCall = true;
            UserService.listUsers().then(function () {
                $timeout(function () {
                    vm.userListProcessingServerCall = false;
                }, 200);
            });
        };

        vm.undoUserChanges = function (user) {

            if (typeof user.id === 'string' && user.id.indexOf('temp_') === 0) {
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
                UserService.listUsers();
                console.log('dectivated and updated user called, result: ');
                console.log(result);
            });
        };

        $timeout(vm.listUsers, 0);
    }

})();
