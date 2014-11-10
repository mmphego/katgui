(function () {
    angular.module('katGui.admin', [])
        .controller('AdminCtrl', AdminCtrl);

    function AdminCtrl($timeout) {

        var vm = this;
        vm.lastId = 0;

        vm.userData = [
            {
                name: 'testuser',
                email: 'test@ska.ac.za',
                role: 'control'
            },
            {
                name: 'monitor',
                email: 'cam@ska.ac.za',
                role: 'monitor'
            }];

        vm.createUser = function () {
            event.stopPropagation();
            vm.userData.push({
                name: 'newuser' + vm.lastId++,
                email: 'new@ska.ac.za',
                role: 'monitor'
            });

            vm.editUser(vm.userData[vm.userData.length - 1]);
        };

        vm.editUser = function (user) {
            event.stopPropagation();
            if (!user.editing) {
                user.originalUser = {
                    name: user.name,
                    email: user.email,
                    role: user.role
                };
                user.editing = true;
                //$timeout(function () {
                //    $('#user-name-input-' + user.name).focus();
                //}, 0);

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
            user.role = user.originalUser.role;
            user.editing = false;
        };
    }

})();
