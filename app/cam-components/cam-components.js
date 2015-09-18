(function () {

    angular.module('katGui')
        .controller('CamComponentsCtrl', CamComponentsCtrl);

    function CamComponentsCtrl($rootScope, $scope, SensorsService, KatGuiUtil, $interval, $log, ConfigService,
                               ControlService, NotifyService, $state, USER_ROLES) {

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

        var sensorNameList = ['version', 'build'];

        vm.connectListeners = function () {
            SensorsService.connectListener()
                .then(function () {
                    vm.initSensors();

                    if (vm.connectInterval) {
                        $interval.cancel(vm.connectInterval);
                        vm.connectInterval = null;
                        if (!vm.disconnectIssued) {
                            NotifyService.showSimpleToast('Reconnected :)');
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
                        NotifyService.showSimpleToast('Connection timeout! Attempting to reconnect...');
                        if (!vm.connectInterval) {
                            vm.connectInterval = $interval(vm.connectListeners, 10000);
                            vm.connectListeners();
                        }
                    }
                });
        };

        vm.initSensors = function () {
            vm.nodes = ConfigService.resourceGroups;
            SensorsService.listResourcesFromConfig()
                .then(function (result) {
                    for (var key in result) {
                        vm.resourcesNames[key] = {
                            name: key,
                            sensors: {},
                            host: result[key].host,
                            port: result[key].port,
                            node: result[key].node
                        };
                        vm.resourcesNames[key].nodeman = $rootScope.systemConfig['monitor:monctl'][key]? 'nm_monctl' : 'nm_proxy';
                    }

                    SensorsService.setSensorStrategies(
                        'version|build|katcpmsgs|sys_monitor_|config_label', 'event-rate', 1, 120);
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

        var unbindUpdate = $rootScope.$on('sensorsServerUpdateMessage', function (event, sensor) {
            var strList = sensor.name.split(':');
            var sensorName = strList[1];
            $scope.$apply(function () {
                if (sensorName.indexOf('monitor_') > -1) {
                    var resource = sensorName.split('monitor_')[1];
                    vm.resourcesNames[resource].connected = sensor.value.value;
                } else {
                    var parentName = KatGuiUtil.getParentNameFromSensor(sensorName);
                    sensorName = sensorName.replace(parentName + '_', '');
                    vm.resourcesNames[parentName].sensors[sensorName] = {
                        name: sensorName,
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
                if (vm.resourcesNames[name].sensors.logging_katcpmsgs_devices_enabled &&
                    vm.resourcesNames[name].sensors.logging_katcpmsgs_devices_enabled.value) {
                    ControlService.toggleKATCPMessageDevices(name, 'disable');
                }
                if (vm.resourcesNames[name].sensors.logging_katcpmsgs_proxy_enabled &&
                    vm.resourcesNames[name].sensors.logging_katcpmsgs_proxy_enabled.value) {
                    ControlService.toggleKATCPMessageProxy(name, 'disable');
                }
            }
        };

        vm.afterInit = function() {
            if ($rootScope.currentUser) {
                if ($rootScope.currentUser.req_role !== USER_ROLES.lead_operator) {
                    $state.go('home');
                } else {
                    vm.connectListeners();
                }
            } else {
                vm.undbindLoginSuccess = $rootScope.$on('loginSuccess', vm.afterInit);
            }
        };

        vm.afterInit();

        $scope.$on('$destroy', function () {
            for (var key in SensorsService.resources) {
                SensorsService.removeResourceListeners(key);
            }
            SensorsService.unsubscribe('*', vm.guid);
            unbindUpdate();
            vm.disconnectIssued = true;
            SensorsService.disconnectListener();
            if (vm.undbindLoginSuccess) {
                vm.undbindLoginSuccess();
            }
        });
    }
})();
