(function () {

    angular.module('katGui.health', ['katGui', 'katGui.d3'])
        .controller('HealthCtrl', HealthCtrl);

    function HealthCtrl(ConfigService, StatusService, NotifyService) {

        var vm = this;
        ConfigService.loadAggregateSensorDetail();
        vm.topStatusTrees = StatusService.topStatusTrees;
        vm.subscriptions = {};

        ConfigService.getStatusTreesForTop()
            .success(function (statusTreeResult) {
                StatusService.setTopStatusTrees(statusTreeResult);
            })
            .error(function () {
                NotifyService.showSimpleDialog("Error retrieving status tree structure from katconf-webserver, is the server running?");
            });
    }
})
();
