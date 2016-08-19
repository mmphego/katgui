(function () {

    angular.module('katGui.health')
        .controller('ReceptorHealthCtrl', ReceptorHealthCtrl);

    function ReceptorHealthCtrl($log, $interval, $rootScope, $scope, $localStorage, SensorsService, ConfigService, StatusService, NotifyService) {

        var vm = this;
        vm.receptorHealthTree = ConfigService.receptorHealthTree;
        vm.receptorList = StatusService.receptors;
        vm.mapTypes = ['Treemap', 'Pack', 'Partition', 'Icicle', 'Sunburst', 'Force Layout'];
        vm.connectInterval = null;
        vm.sensorValues = {};

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
            StatusService.receptorTreesSensors.push(parent.sensor);
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
                    StatusService.receptorTreesSensors.push(sub);
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
                            StatusService.receptorTreesSensors = [];
                            StatusService.setReceptorsAndStatusTree(result.data, receptors);
                            StatusService.receptors.forEach(function (receptor) {
                                vm.populateTree(StatusService.statusData[receptor], receptor);
                            });
                            vm.connectListeners();
                            vm.redrawCharts();
                        });
                });
        });

        vm.connectListeners = function () {
            SensorsService.connectListener()
                .then(function () {
                    vm.initSensors();
                    if (vm.connectInterval) {
                        $interval.cancel(vm.connectInterval);
                        vm.connectInterval = null;
                        NotifyService.showSimpleToast('Reconnected :)');
                    }
                }, function () {
                    $log.error('Could not establish sensor connection. Retrying every 10 seconds.');
                    if (!vm.connectInterval) {
                        vm.connectInterval = $interval(vm.connectListeners, 10000);
                    }
                });
            vm.handleSocketTimeout();
        };

        vm.handleSocketTimeout = function () {
            SensorsService.getTimeoutPromise()
                .then(function () {
                    NotifyService.showSimpleToast('Connection timeout! Attempting to reconnect...');
                    if (!vm.connectInterval) {
                        vm.connectInterval = $interval(vm.connectListeners, 10000);
                        vm.connectListeners();
                    }
                });
        };

        vm.initSensors = function () {
            if (StatusService.receptorTreesSensors.length > 0) {
                SensorsService.setSensorStrategies(
                    StatusService.receptorTreesSensors.join('|'),
                    'event-rate', 1, 360);
            }
        };

        var unbindUpdate = $rootScope.$on('sensorsServerUpdateMessage', function (event, sensor) {
            var sensorName = sensor.name.split(':')[1];
            sensor.status = sensor.value.status;
            sensor.received_timestamp = sensor.value.received_timestamp;
            sensor.timestamp = sensor.value.timestamp;
            sensor.value = sensor.value.value;

            StatusService.sensorValues[sensorName] = sensor;
            StatusService.itemsToUpdate[sensorName] = sensor;
            if (!StatusService.stopUpdating) {
                StatusService.stopUpdating = $interval(StatusService.applyPendingUpdates, 500);
            }
            $rootScope.$emit('sensorUpdateReceived', {name: sensor.name, sensorValue: sensor});
        });

        $scope.$on('$destroy', function () {
            unbindUpdate();
            SensorsService.disconnectListener();
            StatusService.sensorValues = {};
        });
    }
})();
