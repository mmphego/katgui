(function () {

    angular.module('katGui.health')
        .controller('ReceptorHealthCtrl', ReceptorHealthCtrl);

    function ReceptorHealthCtrl($log, $interval, $rootScope, $scope, $localStorage, MonitorService,
                                ConfigService, StatusService, NotifyService) {

        var vm = this;
        vm.receptorHealthTree = ConfigService.receptorHealthTree;
        vm.receptorList = StatusService.receptors;
        vm.subscribedSensors = [];
        vm.mapTypes = ['Treemap', 'Pack', 'Partition', 'Icicle', 'Sunburst'];
        vm.receptorSensorsRegex = '';
        vm.receptorAggSensorsRegex = '';

        if ($localStorage['receptorHealthDisplayMapType']) {
            vm.mapType = $localStorage['receptorHealthDisplayMapType'];
        }

        if ($localStorage['receptorHealthDisplaySize']) {
            vm.treeChartSize = JSON.parse($localStorage['receptorHealthDisplaySize']);
        } else {
            vm.treeChartSize = {width: 480, height: 480};
        }

        if (!vm.mapType) {
            vm.mapType = 'Sunburst';
        }

        vm.populateTree = function (parent, receptor) {
            if (parent.prefix) {
                StatusService.receptorAggSensors.push(parent.sensor);
            } else {
                StatusService.receptorSensors.push(parent.sensor);
            }
            if (parent.children && parent.children.length > 0) {
                parent.children.forEach(function (child) {
                    vm.populateTree(child, receptor);
                });
            } else if (parent.subs && parent.subs.length > 0) {
                parent.subs.forEach(function (sub) {
                    if (!parent.children) {
                        parent.children = [];
                    }
                    parent.children.push({name: sub, sensor: sub, hidden: true});
                    StatusService.receptorSensors[sub] = 1;
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

        ConfigService.getSystemConfig().then(function (systemConfig) {
            StatusService.controlledResources = systemConfig.katobs.controlled_resources.split(',');
            ConfigService.getStatusTreeForReceptor()
                .then(function (result) {
                    ConfigService.getReceptorList()
                        .then(function (receptors) {
                            StatusService.receptorSensors = ['marked_in_maintenance'];
                            StatusService.receptorAggSensors = [];
                            StatusService.setReceptorsAndStatusTree(result.data, receptors);
                            StatusService.receptors.forEach(function (receptor) {
                                vm.populateTree(StatusService.statusData[receptor], receptor);
                            });
                            vm.initSensors();
                            vm.redrawCharts();
                        });
                });
        });

        vm.initSensors = function () {
            if (StatusService.receptorSensors) {
                vm.receptorSensorsRegex = StatusService.receptorSensors.join('|');
                StatusService.receptors.forEach(function (receptor) {
                    MonitorService.listSensors(receptor, vm.receptorSensorsRegex);
                });
                ConfigService.getSystemConfig().then(function(systemConfig) {
                    vm.receptorAggSensorsRegex = StatusService.receptorAggSensors.join('|');
                    systemConfig.monitor.system_nodes.split(',').forEach(function (monitorNode) {
                        MonitorService.listSensors('mon_' + monitorNode, vm.receptorAggSensorsRegex);
                    });
                });
            }
        };

        vm.pendingUpdatesInterval = $interval(StatusService.applyPendingUpdates, 150);

        var unbindUpdate = $rootScope.$on('sensorUpdateMessage', function (event, sensor, subject) {
            if (sensor.name.search(vm.receptorSensorsRegex) < 0 && sensor.name.search(vm.receptorAggSensorsRegex) < 0) {
                return;
            }
            if (subject.startsWith('req.reply')) {
                MonitorService.subscribeSensor(sensor);
                vm.subscribedSensors.push(sensor);
            }
            StatusService.addToUpdateQueue(sensor.name);
            // remove the mon_proxyN from the sensor name
            if (sensor.name.startsWith('mon_')) {
              sensor.name = sensor.name.replace(/^mon_.*agg_/, 'agg_');
            }
            StatusService.sensorValues[sensor.name] = sensor;
        });

        var unbindReconnected = $rootScope.$on('websocketReconnected', vm.initSensors);

        $scope.$on('$destroy', function () {
            vm.subscribedSensors.forEach(function (sensor) {
                MonitorService.unsubscribeSensor(sensor);
            });
            $interval.cancel(vm.pendingUpdatesInterval);
            unbindUpdate();
            unbindReconnected();
            StatusService.sensorValues = {};
        });
    }
})();
