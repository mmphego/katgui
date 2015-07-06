(function () {

    angular.module('katGui')
        .controller('CamComponentsCtrl', CamComponentsCtrl);

    function CamComponentsCtrl($rootScope, $scope, SensorsService, KatGuiUtil, $interval, $log, ConfigService, ControlService) {

        var vm = this;

        vm.resourcesNames = {};
        vm.guid = KatGuiUtil.generateUUID();
        vm.disconnectIssued = false;
        vm.connectInterval = null;
        ControlService.connectListener();

        ConfigService.getSystemConfig().then(function (systemConfig) {
            vm.systemConfig = systemConfig;
        });

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
                            address: SensorsService.resources[key].address,
                            connected: false
                        };
                        vm.resourcesNames[key].nodeman = vm.systemConfig['monitor:monctl'][key]? 'nm_monctl' : 'nm_proxy';
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

        vm.sendControlCommand = function (resource, command, params) {
            ControlService.sendControlCommand(resource, command, params);
        };

        vm.toggleKATCPMessageDevices = function (resource, newValue) {
            vm.sendControlCommand(resource, 'enable_katcpmsgs_devices_logging', newValue? '1' : '0');
        };

        vm.toggleKATCPMessageProxy = function (resource, newValue) {
            vm.sendControlCommand(resource, 'enable_katcpmsgs_proxy_logging', newValue? '1' : '0');
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

        vm.processCommand = function (key, command) {
            if (vm.resourcesNames[key].nodeman) {
                ControlService.sendControlCommand(vm.resourcesNames[key].nodeman, command, key);
            } else {
                $rootScope.showSimpleDialog(
                    'Error Sending Request',
                    'Could not send process request because KATGUI does not know which node manager to use for ' + key + '.');
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

        $scope.objectKeys = function (obj) {
            return Object.keys(obj);
        };

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
                    vm.sendControlCommand(name, 'enable_katcpmsgs_devices_logging', '0');
                }
                if (vm.resourcesNames[name].sensors.logging_katcpmsgs_proxy_enabled
                    && vm.resourcesNames[name].sensors.logging_katcpmsgs_proxy_enabled.value) {
                    vm.sendControlCommand(name, 'enable_katcpmsgs_proxy_logging', '0');
                }
            }
        };

        $scope.$on('$destroy', function () {
            for (var key in SensorsService.resources) {
                SensorsService.removeResourceListeners(key);
            }
            SensorsService.unsubscribe('sys.config_label', vm.guid);
            SensorsService.unsubscribe('sys.monitor*', vm.guid);
            unbindUpdate();
            vm.disconnectIssued = true;
            SensorsService.disconnectListener();
        });
    }
})();