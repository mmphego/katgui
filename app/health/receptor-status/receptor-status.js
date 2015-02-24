(function () {

    angular.module('katGui.health')
        .controller('ReceptorStatusCtrl', ReceptorStatusCtrl);

    function ReceptorStatusCtrl($scope, $rootScope, ConfigService, MonitorService, StatusService, $localStorage) {

        var vm = this;
        vm.receptorStatusTree = ConfigService.receptorStatusTree;
        vm.receptorList = ConfigService.receptorList;
        vm.statusData = StatusService.statusData;

        vm.mapTypes = ['Treemap', 'Pack', 'Partition', 'Icicle', 'Sunburst'];

        vm.treeChartSize = {width: 580, height: 580};

        if ($localStorage['receptorStatusDisplayMapType']) {
            vm.mapType = $localStorage['receptorStatusDisplayMapType'];
        } else {
            vm.mapType = 'partition';
        }

        $scope.$watch('vm.mapType', function () {
            $localStorage['receptorStatusDisplayMapType'] = vm.mapType;
        });

        ConfigService.getStatusTreeForReceptor()
            .success(function (statusTreeResult) {
                ConfigService.getReceptorList()
                    .then(function (receptors) {
                        StatusService.setReceptorsAndStatusTree(statusTreeResult, receptors);

                        receptors.forEach(function (item) {
                            MonitorService.subscribe(item + ":" + StatusService.statusData[item].sensor);
                        });

                        receptors.forEach(function (item) {
                            MonitorService.subscribe('mon_*:agg_' + item + '*');
                        });
                    });
            });
    }
})();
