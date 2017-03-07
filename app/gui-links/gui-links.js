(function () {

    angular.module('katGui')
        .controller('GuiLinksCtrl', GuiLinksCtrl);

    function GuiLinksCtrl($rootScope, $scope, $interval, $log, SensorsService, DATETIME_FORMAT, NotifyService, $timeout) {

        var vm = this;

        vm.sortedSensorNames = [];
        vm.disconnectIssued = false;
        vm.connectInterval = null;
        vm.sensorValues = {};

        vm.sensorsOrderByFields = [
            {label: 'Name', value: 'name'},
            {label: 'Value', value: 'value'}
        ];

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
            SensorsService.setSensorStrategies('gui.urls$', 'event-rate', 1, 360);
        };

        vm.connectListeners();

        var unbindUpdate = $rootScope.$on('sensorsServerUpdateMessage', function (event, sensor) {
            sensor.value.name = sensor.name.split(':')[1];
            sensor.value.date = moment.utc(sensor.value.timestamp, 'X').format(DATETIME_FORMAT);
            try {
                sensor.value.value = JSON.parse(sensor.value.value);
                vm.sensorValues[sensor.value.name] = sensor.value;
            }
            catch (Exception) {
                $log.error('Error parsing sensor message value: ' + sensor.value.value);
            }
        });

        vm.refreshGuiLinks = function () {
            vm.sensorValues = {};
            SensorsService.removeSensorStrategies('gui.urls$');
            $timeout(function (){
                SensorsService.setSensorStrategies('gui.urls$', 'event-rate', 1, 360);
            }, 500);
        };

        $scope.$on('$destroy', function () {
            unbindUpdate();
            vm.disconnectIssued = true;
            SensorsService.disconnectListener();
            if (vm.connectInterval) {
                $interval.cancel(vm.connectInterval);
            }
        });
    }
})();
