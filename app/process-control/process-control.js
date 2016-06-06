(function () {

    angular.module('katGui')
        .controller('ProcessControlCtrl', ProcessControlCtrl);

    function ProcessControlCtrl($rootScope, $scope, SensorsService, KatGuiUtil, $interval, $log, $timeout, ConfigService,
                                ControlService, DATETIME_FORMAT, NotifyService, $state, USER_ROLES) {

        var vm = this;

        vm.resourcesNames = {};
        vm.guid = KatGuiUtil.generateUUID();
        vm.connectInterval = null;
        vm.detailedProcesses = {};
        vm.sensorsToDisplay = {};
        vm.nodemans = [];

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
            SensorsService.resources = {};
            vm.detailedProcesses = {};
            vm.nodemans.splice(0, vm.nodemans.length);

            ConfigService.getSystemConfig()
                .then(function () {
                    vm.loadNodes();
                });
        };

        vm.loadNodes = function () {
            for (var node in ConfigService.systemConfig.nodes) {
                var nodeName = 'nm_' + node;
                vm.detailedProcesses[nodeName] = {};
                vm.nodemans.push(nodeName);
                SensorsService.resources[nodeName] = {};
                vm.listResourceSensors(nodeName);
            }
        };

        vm.collapseAll = function (nm_name) {
            for (var key in vm.detailedProcesses[nm_name]) {
                vm.detailedProcesses[nm_name][key].showDetail = false;
            }
        };

        vm.expandAll = function (nm_name) {
            for (var key in vm.detailedProcesses[nm_name]) {
                vm.detailedProcesses[nm_name][key].showDetail = true;
            }
        };

        vm.listResourceSensors = function (resource) {
            SensorsService.listResourceSensors(resource)
                .then(function () {
                    var runningSensorNamesToSetStrategies = [];
                    var detailSensorNamesToSetStrategies = [];
                    SensorsService.resources[resource].sensorsList.forEach(function (item, index) {
                        if (item.name.indexOf('.') > -1) {
                            var processName = item.name.split('.')[0];
                            if (!vm.detailedProcesses[resource][processName]) {
                                vm.detailedProcesses[resource][processName] = {sensors: {}};
                            }
                            vm.sensorsToDisplay[resource + '_' + item.python_identifier] = item;
                            vm.detailedProcesses[resource][processName].sensors[item.python_identifier] = item;
                            if (item.python_identifier.indexOf('running') !== -1) {
                                runningSensorNamesToSetStrategies.push(resource + '_' + item.python_identifier);
                            } else {
                                detailSensorNamesToSetStrategies.push(resource + '_' + item.python_identifier);
                            }
                        }
                    });
                    if (runningSensorNamesToSetStrategies.length > 0) {
                        SensorsService.setSensorStrategies(runningSensorNamesToSetStrategies.join('|'), 'event-rate', 1, 120);
                    }
                    if (detailSensorNamesToSetStrategies.length > 0) {
                        $timeout(function () {
                            if (SensorsService.connection) {
                                SensorsService.setSensorStrategies(detailSensorNamesToSetStrategies.join('|'), 'event-rate', 1, 120);
                            }
                        }, 3000);
                    } else {
                        vm.detailedProcesses[resource]['None'] = {sensors: {}};
                    }
                });
        };

        vm.stopProcess = function (nm, resource) {
            ControlService.stopProcess(nm, resource);
        };

        vm.startProcess = function (nm, resource) {
            ControlService.startProcess(nm, resource);
        };

        vm.restartProcess = function (nm, resource) {
            ControlService.restartProcess(nm, resource);
        };

        vm.killProcess = function (nm, resource) {
            ControlService.killProcess(nm, resource);
        };

        vm.tailProcess = function (nm, resource) {
            ControlService.tailProcess(nm, resource, 30).then(function (result) {
                var splitMessage = result.data.result.split(' ');
                var message = KatGuiUtil.sanitizeKATCPMessage(splitMessage[2]);
                if (splitMessage.length > 2 && splitMessage[1] !== 'ok') {
                    NotifyService.showPreDialog('Error tailing file', message);
                } else {
                    NotifyService.showPreDialog('Tail of ' + nm + '_' + resource, message);
                }
            }, function (error) {
                NotifyService.showPreDialog('Error displaying Sensor Group', error.data.err_msg);
            });
        };

        vm.afterInit = function() {
            vm.connectListeners();
        };

        vm.unbindLoginSuccess = $rootScope.$on('loginSuccess', vm.afterInit);
        vm.afterInit();

        var unbindUpdate = $rootScope.$on('sensorsServerUpdateMessage', function (event, sensor) {
            var strList = sensor.name.split(':');
            $scope.$apply(function () {
                if (!vm.sensorsToDisplay[strList[1]]) {
                    vm.sensorsToDisplay[strList[1]] = {};
                }
                vm.sensorsToDisplay[strList[1]].value = sensor.value.value;
                vm.sensorsToDisplay[strList[1]].timestamp = sensor.value.timestamp;
                vm.sensorsToDisplay[strList[1]].date = moment.utc(sensor.value.timestamp, 'X').format(DATETIME_FORMAT);
                vm.sensorsToDisplay[strList[1]].received_timestamp = sensor.value.received_timestamp;
                vm.sensorsToDisplay[strList[1]].status = sensor.value.status;
                vm.sensorsToDisplay[strList[1]].name = strList[1];
            });
        });

        $scope.$on('$destroy', function () {
            unbindUpdate();
            if (vm.unbindLoginSuccess) {
                vm.unbindLoginSuccess();
            }
            SensorsService.disconnectListener();
        });
    }
})();
