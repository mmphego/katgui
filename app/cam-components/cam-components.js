(function () {

    angular.module('katGui')
        .controller('CamComponentsCtrl', CamComponentsCtrl);

    function CamComponentsCtrl($rootScope, $scope, SensorsService, MonitorService, KatGuiUtil, $interval, $log, ConfigService,
                               ControlService, NotifyService, $state, USER_ROLES, $timeout) {

        var vm = this;
        vm.resourcesNames = {};
        vm.subscribedSensors = [];

        vm.initSensors = function () {
            vm.nodes = ConfigService.resourceGroups;
            SensorsService.listResourcesFromConfig()
                .then(function (resources) {
                  ConfigService.getSystemConfig().then(function () {
                      for (var key in resources) {
                          vm.resourcesNames[key] = {
                              name: key,
                              sensors: {},
                              host: resources[key].host,
                              port: resources[key].port,
                              node: resources[key].node
                          };
                          vm.resourcesNames[key].nodeman = $rootScope.systemConfig['monitor:monctl'][key]? 'nm_monctl' : 'nm_proxy';
                      }
                      MonitorService.listSensors('sys', '^monitor_');
                      MonitorService.listSensors('all', 'katcpmsgs|version|build');
                  });
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

        var unbindUpdate = $rootScope.$on('sensorUpdateMessage', function (event, sensor, subject) {
            if (subject.startsWith('req.reply')) {
                MonitorService.subscribeSensor(sensor);
                vm.subscribedSensors.push(sensor);
                var sensorName = sensor.name.replace(sensor.component + '_', '');
                if (sensorName.indexOf('monitor_') > -1) {
                    var connectedComponent = sensorName.replace('monitor_', '');
                    vm.resourcesNames[connectedComponent].connected = sensor.value;
                } else {
                    vm.resourcesNames[sensor.component].sensors[sensorName] = {
                        name: sensorName,
                        value: sensor.value
                    };
                }
            } else {
                var component;
                if (sensor.name.indexOf('monitor_') > -1) {
                    component = sensor.name.replace('sys_monitor_', '');
                    vm.resourcesNames[component].connected = sensor.value;
                } else {
                    // sensor.archive.cbf_2.logging_katcpmsgs_devices_enabled
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

        $scope.$on('$destroy', function () {
            vm.subscribedSensors.forEach(function (sensor) {
                MonitorService.unsubscribeSensor(sensor);
            });
            unbindUpdate();
            unbindReconnected();
        });
    }
})();
