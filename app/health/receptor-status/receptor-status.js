(function () {

    angular.module('katGui.health')
        .controller('ReceptorStatusCtrl', ReceptorStatusCtrl);

    function ReceptorStatusCtrl($scope, ConfigService, StatusService, MonitorService, $localStorage) {

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


                        for (var receptor in StatusService.statusData) {
                            console.log(StatusService.statusData[receptor]);

                            //subscribe to sensors_ok
                            MonitorService.subscribe(receptor + ":" + StatusService.statusData[receptor].sensor);

                            //recursively subscrive to all child sensors
                            subscribeToChildSensors(StatusService.statusData[receptor]);
                        }

                        function subscribeToChildSensors(parent) {
                            if (parent.status_children && parent.status_children.length > 0) {
                                parent.status_children.forEach(function(child) {
                                    subscribeToChildSensors(child);

                                });
                            } else if (parent.children && parent.children.length > 0) {
                                parent.children.forEach(function(child) {
                                    subscribeToChildSensors(child);
                                });
                            }

                            MonitorService.subscribe(receptor + ":" + parent.sensor.replace('.', '_').replace('-','_'));
                        }
                    });
            });
    }
})();
