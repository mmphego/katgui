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
                        vm.resourcesNames[key].nodeman = ConfigService.systemConfig['monitor:monctl'][key] ? 'nm_monctl' : 'nm_proxy';
                    }
                    for (var resourceName in resources) {
                        MonitorService.listSensors(resourceName, vm.resourceSensorsRegex);
                    }
                    MonitorService.listSensors('sys', '^sys_monitor_');
                });
        };

        // TODO nm_monctl shouldnt work on multinode system???
        vm.stopProcess = function(resourceName) {
            ControlService.stopProcess('nm_monctl', resourceName);
        };

        vm.startProcess = function(resourceName) {
            ControlService.startProcess('nm_monctl', resourceName);
        };

        vm.restartProcess = function(resourceName) {
            ControlService.restartProcess('nm_monctl', resourceName);
        };

        vm.killProcess = function(resourceName) {
            ControlService.killProcess('nm_monctl', resourceName);
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
            if (subject.startsWith('req.reply')) {
                MonitorService.subscribeSensor(sensor);
                vm.subscribedSensors.push(sensor);
                var sensorName = sensor.name.replace(sensor.component + '_', '');
                if (sensor.name.indexOf('monitor_') > -1) {
                    var connectedComponent = sensorName.replace('monitor_', '');
                    vm.resourcesNames[connectedComponent].connected = sensor.value;
                } else {
                    if (vm.resourcesNames[sensor.component]) {
                        vm.resourcesNames[sensor.component].sensors[sensorName] = {
                            name: sensorName,
                            value: sensor.value
                        };
                    }
                }
            } else {
                var component;
                if (sensor.name.indexOf('sys_monitor_') > -1) {
                    component = sensor.name.replace('sys_monitor_', '');
                    vm.resourcesNames[component].connected = sensor.value;
                } else {
                    // e.g. sensor.archive.cbf_2.logging_katcpmsgs_devices_enabled
                    var subjectSplit = subject.split('.');
                    component = subjectSplit[subjectSplit.length - 2];
                    var sensorNameFromSubject = subjectSplit[subjectSplit.length - 1];
                    vm.resourcesNames[component].sensors[sensorNameFromSubject] = {
                        name: sensorNameFromSubject,
                        value: sensor.value
                    };
                }
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
