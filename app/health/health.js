(function () {

    angular.module('katGui.health', ['katGui', 'katGui.d3'])
        .controller('HealthCtrl', HealthCtrl);

    function HealthCtrl(ConfigService, StatusService, NotifyService) {

        var vm = this;
        ConfigService.loadAggregateSensorDetail();
        vm.topStatusTrees = StatusService.topStatusTrees;
        vm.subscriptions = {};

        ConfigService.getStatusTreeForReceptor()
            .then(function (result) {
                ConfigService.getReceptorList()
                    .then(function (receptors) {
                        StatusService.setReceptorsAndStatusTree(result.data, receptors);
                    });
            });

        ConfigService.getStatusTreesForTop()
            .then(function (result) {
                StatusService.setTopStatusTrees(result.data);
            }, function () {
                NotifyService.showSimpleDialog("Error retrieving status tree structure from katconf-webserver, is the server running?");
            });
    }
})
();
