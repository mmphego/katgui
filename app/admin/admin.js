(function () {
    angular.module('katGui.admin', ['katGui.services'])
        .controller('AdminCtrl', AdminCtrl);

    function AdminCtrl(UserService, $timeout) {

        var vm = this;
        vm.showDeactivatedUsers = false;
        vm.lastId = 0;

        vm.orderByFields = [
            {label: '-- Order By --', value: 'userId'},
            {label: 'Name', value: 'name'},
            {label: 'Email', value: 'email'},
            {label: 'Roles', value: 'roles'},
            {label: 'Active State', value: 'active'}
        ];

        vm.orderBy = vm.orderByFields[0];

        vm.userRoles = [
            {"id": 1, "name": "Monitor", "assignable": true},
            {"id": 2, "name": "Control", "assignable": true},
            {"id": 3, "name": "Operator", "assignable": true}
        ];

        vm.userData = UserService.users;

        vm.createUser = function () {
            event.stopPropagation();
            vm.userData.push({
                userId: vm.lastId++,
                name: 'newuser' + vm.lastId,
                email: 'new@ska.ac.za',
                role: 'monitor',
                active: true
            });

            vm.editUser(vm.userData[vm.userData.length - 1]);
        };

        vm.editUser = function (user, $event) {
            event.stopPropagation();
            if (!user.editing) {
                user.originalUser = {
                    name: user.name,
                    email: user.email,
                    roles: user.roles
                };
                user.editing = true;
            }
        };

        vm.saveUser = function (user, event) {
            event.stopPropagation();
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

            if (newUser.id) {
                UserService.updateUser(newUser).then(function (result) {
                    console.log('updated user called, result: ');
                    console.log(result);
                });
            } else {
                newUser.roles = ['read_only'];
                UserService.createUser(newUser);
            }
        };

        vm.listUsers = function () {
            UserService.listUsers();
        };

        vm.undoUserChanges = function (user) {
            event.stopPropagation();
            user.name = user.originalUser.name;
            user.email = user.originalUser.email;
            user.roles = user.originalUser.roles;
            user.editing = false;
        };

        $timeout(vm.listUsers, 100);
    }

})();
