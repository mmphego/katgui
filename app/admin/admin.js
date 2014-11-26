(function () {
    angular.module('katGui.admin', [])
        .controller('AdminCtrl', AdminCtrl);

    function AdminCtrl() {

        var vm = this;
        vm.showDeactivatedUsers = false;
        vm.lastId = 0;

        vm.orderByFields = [
            {label: 'Name', value: 'name'},
            {label: 'Email', value: 'email'},
            {label: 'Roles', value: 'roles'},
            {label: 'Active State', value: 'active'}
        ];

        vm.userRoles = [
            {"id": 1, "name": "Monitor", "assignable": true},
            {"id": 2, "name": "Control", "assignable": true},
            {"id": 3, "name": "Operator", "assignable": true}
        ];

        vm.userData = [
            {
                name: 'testuser',
                email: 'test@ska.ac.za',
                active: true,
                roles: []
            },
            {
                name: 'monitor',
                email: 'cam@ska.ac.za',
                active: false,
                roles: []
            }];

        vm.createUser = function () {
            event.stopPropagation();
            vm.userData.push({
                name: 'newuser' + vm.lastId++,
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
        };

        vm.undoUserChanges = function (user) {
            event.stopPropagation();
            user.name = user.originalUser.name;
            user.email = user.originalUser.email;
            user.roles = user.originalUser.roles;
            user.editing = false;
        };


    }

})();
