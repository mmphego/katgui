(function() {

    angular.module('katGui')
        .controller('CamComponentsCtrl', CamComponentsCtrl);

    function CamComponentsCtrl($rootScope, $scope, MonitorService, KatGuiUtil, $interval, $log, ConfigService,
        ControlService, NotifyService, $state, USER_ROLES, $timeout) {

        var vm = this;
        vm.resourcesNames = {};
        vm.subscribedSensors = [];
        vm.resourceSensorsRegex = 'katcpmsgs|version|build';

        vm.initSensors = function() {
            vm.nodes = ConfigService.resourceGroups;
            ConfigService.listResourcesFromConfig()
                .then(function(resources) {
                    for (var key in resources) {
                        vm.resourcesNames[key] = {
                            name: key,
                            sensors: {},
                            host: resources[key].host,
                            port: resources[key].port,
                            node: resources[key].node
                        };
                    }
                    MonitorService.listSensorsHttp(Object.keys(resources).join(','), vm.resourceSensorsRegex, true)
                        .then(function(result) {
                            result.data.forEach(function(sensor) {
                                MonitorService.subscribeSensor(sensor);
                                vm.subscribedSensors.push(sensor);
                                var sensorName = sensor.name.replace(sensor.component + '_', '');
                                if (vm.resourcesNames[sensor.component]) {
                                    vm.resourcesNames[sensor.component].sensors[sensorName] = {
                                        name: sensorName,
                                        value: sensor.value
                                    };
                                }
                            });
                        }, function(error) {
                            $log.error(error);
                        });
                    MonitorService.listSensorsHttp('sys', '^sys_monitor_', true)
                        .then(function(result) {
                            result.data.forEach(function(sensor) {
                                MonitorService.subscribeSensor(sensor);
                                vm.subscribedSensors.push(sensor);
                                var connectedComponent = sensor.name.replace('sys_monitor_', '');
                                vm.resourcesNames[connectedComponent].connected = sensor.value;
                            });
                        }, function(error) {
                            $log.error(error);
                        });
                });
        };

        // TODO nm_monctl shouldnt work on multinode system???
        vm.stopProcess = function(resourceName) {
            ControlService.stopProcess(vm.getNmForResource(resourceName), resourceName);
        };

        vm.startProcess = function(resourceName) {
            ControlService.startProcess(vm.getNmForResource(resourceName), resourceName);
        };

        vm.restartProcess = function(resourceName) {
            ControlService.restartProcess(vm.getNmForResource(resourceName), resourceName);
        };

        vm.killProcess = function(resourceName) {
            ControlService.killProcess(vm.getNmForResource(resourceName), resourceName);
        };

        vm.getNmForResource = function(resourceName) {
            var systemNodes = $rootScope.systemConfig.system.system_nodes.split(',');
            for (var i = 0; i < systemNodes.length; i++) {
                var systemNode = systemNodes[i];
                if ($rootScope.systemConfig['monitor:' + systemNode][resourceName]) {
                    return 'nm_' + systemNode;
                }
            }
        };

        vm.toggleKATCPMessageDevices = function(resourceName, newValue) {
            ControlService.toggleKATCPMessageDevices(resourceName, newValue ? 'enable' : 'disable').then(
                function(result) {
                    vm.resourcesNames[resourceName].sensors.logging_katcpmsgs_devices_enabled.value = newValue;
                },
                function(error) {
                    vm.resourcesNames[resourceName].sensors.logging_katcpmsgs_devices_enabled.value = !newValue;
                }
            );
        };

        vm.toggleKATCPMessageProxy = function(resourceName, newValue) {
            ControlService.toggleKATCPMessageProxy(resourceName, newValue ? 'enable' : 'disable').then(
                function(result) {
                    vm.resourcesNames[resourceName].sensors.logging_katcpmsgs_proxy_enabled.value = newValue;
                },
                function(error) {
                    vm.resourcesNames[resourceName].sensors.logging_katcpmsgs_proxy_enabled.value = !newValue;
                }
            );
        };

        var unbindUpdate = $rootScope.$on('sensorUpdateMessage', function(event, sensor, subject) {
            if (!sensor.name.startsWith('sys_monitor_') && sensor.name.search(vm.resourceSensorsRegex) < 0) {
                return;
            }
            var component;
            if (sensor.name.indexOf('sys_monitor_') > -1) {
                component = sensor.name.replace('sys_monitor_', '');
                vm.resourcesNames[component].connected = sensor.value;
            } else {
                // e.g. sensor.normal.cbf_2.logging_katcpmsgs_devices_enabled
                var subjectSplit = subject.split('.');
                component = subjectSplit[subjectSplit.length - 2];
                var sensorNameFromSubject = subjectSplit[subjectSplit.length - 1];
                vm.resourcesNames[component].sensors[sensorNameFromSubject] = {
                    name: sensorNameFromSubject,
                    value: sensor.value
                };
            }
        });

        vm.collapseAll = function() {
            for (var key in vm.resourcesNames) {
                vm.resourcesNames[key].showDetails = false;
            }
        };

        vm.expandAll = function() {
            for (var key in vm.resourcesNames) {
                vm.resourcesNames[key].showDetails = true;
            }
        };

        vm.disableAllKATCPMessageLogging = function() {
            for (var name in vm.resourcesNames) {
                var devicesKatcpmsgsSensor = vm.resourcesNames[name].sensors.logging_katcpmsgs_devices_enabled;
                var proxyKatcpmsgsSensor = vm.resourcesNames[name].sensors.logging_katcpmsgs_proxy_enabled;
                if (devicesKatcpmsgsSensor && devicesKatcpmsgsSensor.value) {
                    ControlService.toggleKATCPMessageDevices(name, 'disable');
                }
                if (proxyKatcpmsgsSensor && proxyKatcpmsgsSensor.value) {
                    ControlService.toggleKATCPMessageProxy(name, 'disable');
                }
            }
        };

        vm.initSensors();

        var unbindReconnected = $rootScope.$on('websocketReconnected', vm.initSensors);

        $scope.$on('$destroy', function() {
            vm.subscribedSensors.forEach(function(sensor) {
                MonitorService.unsubscribeSensor(sensor);
            });
            unbindUpdate();
            unbindReconnected();
        });
    }
})();
