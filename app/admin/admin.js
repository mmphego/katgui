(function () {
    angular.module('katGui.admin', [])
        .controller('AdminCtrl', AdminCtrl);

    function AdminCtrl() {

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

        vm.userData = [
            {
                userId: 0,
                name: 'testuser',
                email: 'test@ska.ac.za',
                active: true,
                roles: []
            },
            {
                userId: 1,
                name: 'monitor',
                email: 'cam@ska.ac.za',
                active: false,
                roles: []
            }];

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
