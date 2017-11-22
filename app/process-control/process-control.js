(function () {

    angular.module('katGui')
        .controller('ProcessControlCtrl', ProcessControlCtrl);

    function ProcessControlCtrl($rootScope, $scope, MonitorService, KatGuiUtil, $interval, $log, $timeout, ConfigService,
                                ControlService, MOMENT_DATETIME_FORMAT, NotifyService, $state, USER_ROLES) {

        var vm = this;
        var processSensors = ['running', 'args', 'pid', 'return_code'];
        vm.sensorValues = {};
        vm.nodemans = {};
        vm.showProgress = false;

        vm.initSensors = function () {
            vm.nodemans = {};
            vm.showProgress = true;
            ConfigService.getSystemConfig()
                .then(function () {
                    for (var node in ConfigService.systemConfig.nodes) {
                        var nodeName = 'nm_' + node;
                        if (!vm.nodemans[nodeName]) {
                          vm.nodemans[nodeName] = {processes: []};
                        }
                        MonitorService.listSensors(nodeName, '(' + processSensors.join('|') + ')$');
                    }
                });
        };

        vm.collapseAll = function (nm_name) {
            vm.nodemans[nm_name].processes.forEach(function (process) {
                vm.toggleProcessDetail(process, false);
            });
        };

        vm.expandAll = function (nm_name) {
            vm.nodemans[nm_name].processes.forEach(function (process) {
                vm.toggleProcessDetail(process, true);
            });
        };

        vm.toggleProcessDetail = function (process, show) {
          if (show !== undefined) {
              vm.sensorValues[process.runningSensor].showDetail = show;
          } else {
              vm.sensorValues[process.runningSensor].showDetail = !vm.sensorValues[process.runningSensor].showDetail;
          }
          if (vm.sensorValues[process.runningSensor].showDetail) {
            process.sensors = processSensors.map(function (processSensor) {
                var sensor = vm.sensorValues[[process.nm, process.name, processSensor].join('_')];
                sensor.shortName = processSensor;
                return sensor;
            });
          }
        };

        vm.stopProcess = function (nm, process) {
            ControlService.stopProcess(nm, process.name);
        };

        vm.startProcess = function (nm, process) {
            ControlService.startProcess(nm, process.name);
        };

        vm.restartProcess = function (nm, process) {
            ControlService.restartProcess(nm, process.name);
        };

        vm.killProcess = function (nm, process) {
            ControlService.killProcess(nm, process.name);
        };

        vm.tailProcess = function (nm, process) {
            ControlService.tailProcess(nm, process.name, 30).then(function (result) {
                var splitMessage = result.data.result.split(' ');
                var message = KatGuiUtil.sanitizeKATCPMessage(splitMessage[2]);
                if (splitMessage.length > 2 && splitMessage[1] !== 'ok') {
                    NotifyService.showPreDialog('Error tailing file', message);
                } else {
                    NotifyService.showPreDialog('Tail of ' + process.name + ' (last 30 lines)', message);
                }
            }, function (error) {
                NotifyService.showPreDialog('Error displaying tail of ' + process.name, error.data.err_msg);
            });
        };

        var unbindUpdate = $rootScope.$on('sensorUpdateMessage', function (event, sensor, subject) {
            if (subject.startsWith('req.reply')) {
                MonitorService.subscribeSensor(sensor);
                if (sensor.name.endsWith('running')) {
                    // e.g. nm_monctl.anc.running
                    var splitName = sensor.original_name.split('.');
                    var processName = splitName[1];
                    if (!vm.nodemans[sensor.component]) {
                      vm.nodemans[sensor.component] = {processes: []};
                    }
                    vm.nodemans[sensor.component].processes.push(
                      {name: processName, runningSensor: sensor.name, nm: sensor.component});
                }
                vm.showProgress = false;
            }
            if (!vm.sensorValues[sensor.name]) {
                vm.sensorValues[sensor.name] = sensor;
            } else {
                vm.sensorValues[sensor.name].value = sensor.value;
            }

        });

        vm.initSensors();

        var unbindReconnected = $rootScope.$on('websocketReconnected', vm.initSensors);

        $scope.$on('$destroy', function () {
            for (var sensorName in vm.sensorValues) {
              MonitorService.unsubscribeSensor(vm.sensorValues[sensorName]);
            }
            unbindUpdate();
            unbindReconnected();
        });
    }
})();
