(function () {

    angular.module('katGui')
        .controller('CamComponentsCtrl', CamComponentsCtrl);

    function CamComponentsCtrl($rootScope, $scope, SensorsService, KatGuiUtil, $interval, $log, ConfigService, ControlService) {

        var vm = this;

        vm.resourcesNames = {};
        vm.guid = KatGuiUtil.generateUUID();
        vm.disconnectIssued = false;
        vm.connectInterval = null;

        if (!$rootScope.systemConfig) {
            ConfigService.getSystemConfig().then(function (systemConfig) {
                $rootScope.systemConfig = systemConfig;
            });
        }

        var sensorNameList = ['version*', 'build*'];

        vm.connectListeners = function () {
            SensorsService.connectListener()
                .then(function () {
                    vm.initSensors();

                    if (vm.connectInterval) {
                        $interval.cancel(vm.connectInterval);
                        vm.connectInterval = null;
                        if (!vm.disconnectIssued) {
                            $rootScope.showSimpleToast('Reconnected :)');
                        }
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
                    if (!vm.disconnectIssued) {
                        $rootScope.showSimpleToast('Connection timeout! Attempting to reconnect...');
                        if (!vm.connectInterval) {
                            vm.connectInterval = $interval(vm.connectListeners, 10000);
                            vm.connectListeners();
                        }
                    }
                });
        };

        vm.initSensors = function () {
            SensorsService.listResources()
                .then(function () {
                    for (var key in SensorsService.resources) {
                        vm.resourcesNames[key] = {
                            name: key,
                            sensors: {},
                            host: SensorsService.resources[key].host,
                            port: SensorsService.resources[key].port,
                            build_state: SensorsService.resources[key].build_state,
                            api_version: SensorsService.resources[key].api_version,
                            connected: SensorsService.resources[key].synced
                        };
                        vm.resourcesNames[key].nodeman = $rootScope.systemConfig['monitor:monctl'][key]? 'nm_monctl' : 'nm_proxy';
                        SensorsService.setSensorStrategy(
                            key, sensorNameList[0], 'event', 0, 0);
                        SensorsService.setSensorStrategy(
                            key, sensorNameList[1], 'event', 0, 0);
                        SensorsService.setSensorStrategy(
                            key, 'logging_katcpmsgs_devices_enabled', 'event-rate', 1, 10);
                        SensorsService.setSensorStrategy(
                            key, 'logging_katcpmsgs_proxy_enabled', 'event-rate', 1, 10);
                    }

                    SensorsService.setSensorStrategy(
                        'sys', 'monitor_*', 'event', 0, 0);
                    SensorsService.setSensorStrategy(
                        'sys', 'config_label', 'event', 0, 0);
                });

        };

        vm.stopProcess = function (resource) {
            ControlService.stopProcess('nm_monctl', resource);
        };

        vm.startProcess = function (resource) {
            ControlService.startProcess('nm_monctl', resource);
        };

        vm.restartProcess = function (resource) {
            ControlService.restartProcess('nm_monctl', resource);
        };

        vm.killProcess = function (resource) {
            ControlService.killProcess('nm_monctl', resource);
        };

        vm.toggleKATCPMessageDevices = function (resource, newValue) {
            ControlService.toggleKATCPMessageDevices(resource, newValue? 'enable' : 'disable');
        };

        vm.toggleKATCPMessageProxy = function (resource, newValue) {
            ControlService.toggleKATCPMessageProxy(resource, newValue? 'enable' : 'disable');
        };

        vm.openKatsnifferLogger = function (logFileName) {
            if (ConfigService.KATObsPortalURL) {
                window.open(ConfigService.KATObsPortalURL + "/logfile/" + logFileName + "/tail/" + $rootScope.logNumberOfLines).focus();
            } else {
                $rootScope.showSimpleDialog('Error Viewing Progress', 'There is no KATObsPortal IP defined in config, please contact CAM support.');
            }
        };

        vm.openSystemLogger = function () {
            if (ConfigService.KATObsPortalURL) {
                window.open(ConfigService.KATObsPortalURL + "/logfile/" ).focus();
            } else {
                $rootScope.showSimpleDialog('Error Viewing Logfiles', 'There is no KATObsPortal IP defined in config, please contact CAM support.');
            }
        };

        vm.connectListeners();

        var unbindUpdate = $rootScope.$on('sensorsServerUpdateMessage', function (event, sensor) {
            var strList = sensor.name.split(':');
            var sensorNameList = strList[1].split('.');
            $scope.$apply(function () {
                if (sensorNameList[1].indexOf('monitor_') === 0) {
                    var resource = sensorNameList[1].split('monitor_')[1];
                    vm.resourcesNames[resource].connected = sensor.value.value;
                } else {
                    vm.resourcesNames[sensorNameList[0]].sensors[sensorNameList[1]] = {
                        name: sensorNameList[1],
                        value: sensor.value.value
                    };
                }
            });
        });

        vm.collapseAll = function () {
            for (var key in vm.resourcesNames) {
                vm.resourcesNames[key].showDetails = false;
            }
        };

        vm.expandAll = function () {
            for (var key in vm.resourcesNames) {
                vm.resourcesNames[key].showDetails = true;
            }
        };

        vm.disableAllKATCPMessageLogging = function () {
            for (var name in vm.resourcesNames) {
                if (vm.resourcesNames[name].sensors.logging_katcpmsgs_devices_enabled
                    && vm.resourcesNames[name].sensors.logging_katcpmsgs_devices_enabled.value) {
                    ControlService.toggleKATCPMessageDevices(name, 'disable');
                }
                if (vm.resourcesNames[name].sensors.logging_katcpmsgs_proxy_enabled
                    && vm.resourcesNames[name].sensors.logging_katcpmsgs_proxy_enabled.value) {
                    ControlService.toggleKATCPMessageProxy(name, 'disable');
                }
            }
        };

        $scope.$on('$destroy', function () {
            for (var key in SensorsService.resources) {
                SensorsService.removeResourceListeners(key);
            }
            SensorsService.unsubscribe('*', vm.guid);
            unbindUpdate();
            vm.disconnectIssued = true;
            SensorsService.disconnectListener();
        });
    }
})();
