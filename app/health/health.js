(function () {

    angular.module('katGui.health', ['katGui', 'katGui.d3'])
        .controller('HealthCtrl', HealthCtrl);

    function HealthCtrl(ConfigService, StatusService, $rootScope) {

        var vm = this;
        ConfigService.loadAggregateSensorDetail();
        vm.topStatusTrees = StatusService.topStatusTrees;
        vm.subscriptions = {};

        ConfigService.getStatusTreesForTop()
            .success(function (statusTreeResult) {
                StatusService.setTopStatusTrees(statusTreeResult);
            })
            .error(function () {
                $rootScope.showSimpleDialog("Error retrieving status tree structure from katconf-webserver, is the server running?");
            });
    }
})
();
