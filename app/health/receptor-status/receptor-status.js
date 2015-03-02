(function () {

    angular.module('katGui.health')
        .controller('ReceptorStatusCtrl', ReceptorStatusCtrl);

    function ReceptorStatusCtrl($scope, ConfigService, StatusService, MonitorService, $localStorage) {

        var vm = this;
        vm.receptorStatusTree = ConfigService.receptorStatusTree;
        vm.receptorList = ConfigService.receptorList;
        vm.mapTypes = ['Treemap', 'Pack', 'Partition', 'Icicle', 'Sunburst'];
        vm.treeChartSize = {width: 880, height: 880};

        if ($localStorage['receptorStatusDisplayMapType']) {
            vm.mapType = $localStorage['receptorStatusDisplayMapType'];
        }

        if (!vm.mapType) {
            vm.mapType = 'Partition';
        }

        $scope.$watch('vm.mapType', function (newVal) {
            $localStorage['receptorStatusDisplayMapType'] = newVal;
            initStatusView();
        });

        function initStatusView() {
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
                                    parent.children.forEach(function (child) {
                                        subscribeToChildSensors(child);
                                    });
                                } else if (parent.subs && parent.subs.length > 0) {
                                    parent.subs.forEach(function(sub) {
                                        if (!parent.children) {
                                            parent.children = [];
                                        }
                                        parent.children.push({name: sub, sensor: sub, hidden: true});
                                        MonitorService.subscribe(receptor + ":" + sub);
                                    });
                                }

                                MonitorService.subscribe(receptor + ":" + parent.sensor);
                            }
                        });
                });
        }
    }
})();
