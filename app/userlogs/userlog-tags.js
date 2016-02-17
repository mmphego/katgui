(function () {

    angular.module('katGui')
        .controller('UserlogTagsCtrl', UserlogTagsCtrl);

        function UserlogTagsCtrl(UserLogService) {

            var vm = this;

            vm.tags = UserLogService.tags;

            UserLogService.listTags();
        }
})();
