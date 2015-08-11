(function () {

    angular.module('katGui.health', ['katGui', 'katGui.d3'])
        .controller('HealthCtrl', HealthCtrl);

    function HealthCtrl(ConfigService, StatusService, NotifyService) {

        var vm = this;
        ConfigService.loadAggregateSensorDetail();
        vm.topStatusTrees = StatusService.topStatusTrees;
        vm.subscriptions = {};

        ConfigService.getStatusTreesForTop()
            .then(function (statusTreeResult) {
                StatusService.setTopStatusTrees(statusTreeResult);
            }, function () {
                NotifyService.showSimpleDialog("Error retrieving status tree structure from katconf-webserver, is the server running?");
            });
    }
})
();
