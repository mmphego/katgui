(function () {
    angular.module('katGui.admin', [])
        .controller('AdminCtrl', AdminCtrl);

    function AdminCtrl() {

        var vm = this;
        vm.lastId = 0;

        vm.userData = [
            {
                username: 'testuser',
                email: 'test@ska.ac.za',
                role: 'control'
            },
            {
                username: 'monitor',
                email: 'cam@ska.ac.za',
                role: 'monitor'
            }];

        vm.createUser = function () {
            vm.userData.push({
                username: 'newuser' + vm.lastId++,
                email: 'new@ska.ac.za',
                role: 'monitor',
                editing: true
            });
        };

        vm.editUser = function (user) {
            user.editing = true;
        };

        vm.saveUser = function (user, event) {
            user.editing = false;
            event.stopPropagation();
        };
    }

})();
