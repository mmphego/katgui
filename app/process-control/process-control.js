(function () {

    angular.module('katGui')
        .controller('ProcessControlCtrl', ProcessControlCtrl);

    function ProcessControlCtrl($rootScope, $scope, SensorsService, KatGuiUtil, $interval, $log, $timeout, ConfigService, $q,
                                ControlService, MOMENT_DATETIME_FORMAT, NotifyService, $state, USER_ROLES) {

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
            var nodeNames = [];
            for (var node in ConfigService.systemConfig.nodes) {
                var nodeName = 'nm_' + node;
                vm.detailedProcesses[nodeName] = {};
                vm.nodemans.push(nodeName);
                SensorsService.resources[nodeName] = {};
                nodeNames.push(nodeName);
            }
            vm.listResourceSensors(nodeNames);
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

        vm.listResourceSensors = function (resources) {
            var resultPromise = $q.defer();
            var listResourcesPromises = [];

            for (var i in resources) {
                listResourcesPromises.push(SensorsService.listResourceSensors(resources[i]));
            }
            $q.all(listResourcesPromises).then(function () {
                for (var i in resources) {
                    var resource = resources[i];
                    for (var k in SensorsService.resources[resource].sensorsList) {
                        var sensorItem = SensorsService.resources[resource].sensorsList[k];
                        if (sensorItem.name.indexOf('.') > -1) {
                            var processName = sensorItem.name.split('.')[0];
                            if (!vm.detailedProcesses[resource][processName]) {
                                vm.detailedProcesses[resource][processName] = {sensors: {}};
                            }
                            vm.sensorsToDisplay[resource + '_' + sensorItem.python_identifier] = sensorItem;
                            vm.detailedProcesses[resource][processName].sensors[sensorItem.python_identifier] = sensorItem;
                        }
                    }
                }
            });

            $q.all(listResourcesPromises).then(function () {
                var detailSensorNamesToSetStrategies = [];
                for (var i in resources) {
                    var resource = resources[i];
                    detailSensorNamesToSetStrategies = detailSensorNamesToSetStrategies.concat(
                        SensorsService.resources[resource].sensorsList.map(function (sensor) {
                            return sensor.python_identifier;
                        }));
                }

                var runningSensorNamesToSetStrategies = detailSensorNamesToSetStrategies.filter(function (sensorName) {
                    return sensorName.indexOf('running') > -1;
                });

                if (runningSensorNamesToSetStrategies.length > 0) {
                    SensorsService.setSensorStrategies(runningSensorNamesToSetStrategies.join('|'), 'event-rate', 1, 360);
                }
                if (detailSensorNamesToSetStrategies.length > 0) {
                    $timeout(function () {
                        if (SensorsService.connection) {
                            SensorsService.setSensorStrategies(detailSensorNamesToSetStrategies.join('|'), 'event-rate', 1, 360);
                        }
                    }, 1000);
                }
                resultPromise.resolve();
            });
            return resultPromise;
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
                    NotifyService.showPreDialog('Tail of ' + nm + '_' + resource + ' (last 30 lines)', message);
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
                vm.sensorsToDisplay[strList[1]].date = moment.utc(sensor.value.timestamp, 'X').format(MOMENT_DATETIME_FORMAT);
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
