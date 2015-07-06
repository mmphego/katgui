(function () {

    angular.module('katGui.health')
        .controller('ReceptorHealthCtrl', ReceptorHealthCtrl);

    function ReceptorHealthCtrl(ConfigService, StatusService, MonitorService, $localStorage) {

        var vm = this;
        vm.receptorHealthTree = ConfigService.receptorHealthTree;
        vm.receptorList = ConfigService.receptorList;
        vm.mapTypes = ['Treemap', 'Pack', 'Partition', 'Icicle', 'Sunburst'];

        if ($localStorage['receptorHealthDisplayMapType']) {
            vm.mapType = $localStorage['receptorHealthDisplayMapType'];
        }

        if ($localStorage['receptorHealthDisplaySize']) {
            vm.treeChartSize = JSON.parse($localStorage['receptorHealthDisplaySize']);
        } else {
            vm.treeChartSize = {width: 480, height: 480};
        }

        if (!vm.mapType) {
            vm.mapType = 'Partition';
        }

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
                });
            }
        };

        vm.chartSizeChanged = function () {
            //this function is implemented in receptor-health-items
            //this works because receptor-health-items inherits scope
            $localStorage['receptorHealthDisplaySize'] = JSON.stringify(vm.treeChartSize);
            vm.redrawCharts();
        };

        vm.mapTypeChanged = function () {
            $localStorage['receptorHealthDisplayMapType'] = vm.mapType;
            vm.redrawCharts();
        };

        ConfigService.getStatusTreeForReceptor()
            .success(function (statusTreeResult) {
                ConfigService.getReceptorList()
                    .then(function (receptors) {
                        StatusService.setReceptorsAndStatusTree(statusTreeResult, receptors);
                        for (var receptor in StatusService.statusData) {
                            //recursively subscribe to all child sensors
                            vm.subscribeToChildSensors(StatusService.statusData[receptor], receptor);
                        }
                        vm.redrawCharts();
                    });
            });
    }
})();
