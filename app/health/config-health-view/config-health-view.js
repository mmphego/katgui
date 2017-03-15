(function() {

    angular.module('katGui.health')
        .controller('ConfigHealthViewCtrl', ConfigHealthViewCtrl);

    function ConfigHealthViewCtrl($log, $interval, $rootScope, $scope, $localStorage, SensorsService,
                                  ConfigService, StatusService, NotifyService, $stateParams) {

        var vm = this;

        vm.mapTypes = ['Treemap', 'Pack', 'Partition', 'Icicle', 'Sunburst', 'Force Layout'];
        vm.connectInterval = null;
        vm.configHealhViews = {};
        vm.configItemsSelect = [];
        vm.selectedConfigView = $stateParams.configItem ? $stateParams.configItem : '';

        if ($localStorage['configHealthDisplayMapType']) {
            vm.mapType = $localStorage['configHealthDisplayMapType'];
        }

        if ($localStorage['configHealthDisplaySize']) {
            vm.treeChartSize = JSON.parse($localStorage['configHealthDisplaySize']);
        } else {
            vm.treeChartSize = {
                width: 480,
                height: 480
            };
        }

        if (!vm.mapType) {
            vm.mapType = 'Sunburst';
        }

        vm.populateSensorNames = function(containerName, parent) {
            if (!StatusService.configHealthSensors[containerName]) {
                StatusService.configHealthSensors[containerName] = {};
            }
            StatusService.configHealthSensors[containerName][parent.sensor] = 1;
            if (parent.children && parent.children.length > 0) {
                parent.children.forEach(function(child) {
                    vm.populateSensorNames(containerName, child);
                });
            }
        };

        vm.chartSizeChanged = function() {
            $localStorage['configHealthDisplaySize'] = JSON.stringify(vm.treeChartSize);
            vm.redrawCharts();
        };

        vm.mapTypeChanged = function() {
            $localStorage['configHealthDisplayMapType'] = vm.mapType;
            vm.redrawCharts();
        };

        ConfigService.getConfigHealthViews().then(
            function(result) {
                vm.configItemsSelect = [];
                vm.configHealhViews = result.data;
                _.each(result.data, function (value, key, obj) {
                    vm.configItemsSelect.push(key);
                    if (value instanceof Array) {
                        value.forEach(function (item) {
                            vm.populateSensorNames(key, item);
                        });
                    } else {
                        vm.populateSensorNames(key, value);
                    }
                });
                vm.redrawCharts();
                vm.connectListeners();
            },
            function(error) {
                $log.error(error);
                NotifyService.showSimpleDialog("Error retrieving config health views from katconf-webserver, is the service running?");
            });

        vm.connectListeners = function() {
            SensorsService.connectListener()
                .then(function() {
                    vm.initSensors();
                    if (vm.connectInterval) {
                        $interval.cancel(vm.connectInterval);
                        vm.connectInterval = null;
                        NotifyService.showSimpleToast('Reconnected :)');
                    }
                }, function() {
                    $log.error('Could not establish sensor connection. Retrying every 10 seconds.');
                    if (!vm.connectInterval) {
                        vm.connectInterval = $interval(vm.connectListeners, 10000);
                    }
                });
            vm.handleSocketTimeout();
        };

        vm.handleSocketTimeout = function() {
            SensorsService.getTimeoutPromise()
                .then(function() {
                    NotifyService.showSimpleToast('Connection timeout! Attempting to reconnect...');
                    if (!vm.connectInterval) {
                        vm.connectInterval = $interval(vm.connectListeners, 10000);
                        vm.connectListeners();
                    }
                });
        };

        vm.initSensors = function() {
            if (vm.selectedConfigView) {
                SensorsService.setSensorStrategies(Object.keys(StatusService.configHealthSensors[vm.selectedConfigView]).join('|'), 'event-rate', 1, 360);
            }
        };

        vm.redrawCharts = function () {
            $rootScope.$emit('redrawChartMessage', {size: vm.treeChartSize});
        };

        vm.pendingUpdatesInterval = $interval(StatusService.applyPendingUpdates, 300);

        var unbindUpdate = $rootScope.$on('sensorsServerUpdateMessage', function(event, sensor) {
            var sensorName = sensor.name.split(':')[1];
            sensor.status = sensor.value.status;
            sensor.received_timestamp = sensor.value.received_timestamp;
            sensor.timestamp = sensor.value.timestamp;
            sensor.value = sensor.value.value;
            StatusService.sensorValues[sensorName] = sensor;
            StatusService.addToUpdateQueue(sensorName);
        });

        $scope.$on('$destroy', function() {
            // $interval.cancel(vm.pendingUpdatesInterval);
            unbindUpdate();
            SensorsService.disconnectListener();
            StatusService.sensorValues = {};
        });
    }
})();
