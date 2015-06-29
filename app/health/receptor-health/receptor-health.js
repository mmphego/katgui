(function () {

    angular.module('katGui.health')
        .controller('ReceptorHealthCtrl', ReceptorHealthCtrl);

    function ReceptorHealthCtrl($scope, ConfigService, StatusService, MonitorService, $localStorage) {

        var vm = this;
        vm.receptorHealthTree = ConfigService.receptorHealthTree;
        vm.receptorList = ConfigService.receptorList;
        vm.mapTypes = ['Treemap', 'Pack', 'Partition', 'Icicle', 'Sunburst'];
        vm.treeChartSize = {width: 480, height: 480};

        if ($localStorage['receptorHealthDisplayMapType']) {
            vm.mapType = $localStorage['receptorHealthDisplayMapType'];
        }

        if (!vm.mapType) {
            vm.mapType = 'Partition';
        }

        vm.initStatusView = function () {
            ConfigService.getStatusTreeForReceptor()
                .success(function (statusTreeResult) {
                    ConfigService.getReceptorList()
                        .then(function (receptors) {
                            StatusService.setReceptorsAndStatusTree(statusTreeResult, receptors);
                            for (var receptor in StatusService.statusData) {
                                //subscribe to sensors_ok
                                MonitorService.subscribe(receptor + "." + StatusService.statusData[receptor].sensor);
                                //recursively subscribe to all child sensors
                                vm.subscribeToChildSensors(StatusService.statusData[receptor], receptor);
                            }
                        });
                });
        };

        vm.subscribeToChildSensors = function (parent, receptor) {
            if (parent.children && parent.children.length > 0) {
                parent.children.forEach(function (child) {
                    vm.subscribeToChildSensors(child, receptor);
                });
            } else if (parent.subs && parent.subs.length > 0) {
                parent.subs.forEach(function (sub) {
                    if (!parent.children) {
                        parent.children = [];
                    }
                    parent.children.push({name: sub, sensor: sub, hidden: true});
                    MonitorService.subscribe(receptor + "." + sub);
                });
            }
            MonitorService.subscribe(receptor + "." + parent.sensor);
        };

        $scope.$watch('vm.mapType', function (newVal) {
            $localStorage['receptorHealthDisplayMapType'] = newVal;
            vm.initStatusView();
        });
    }
})();
