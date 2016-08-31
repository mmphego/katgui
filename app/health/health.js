(function () {

    angular.module('katGui.health', ['katGui', 'katGui.d3'])
        .controller('HealthCtrl', HealthCtrl);

    function HealthCtrl($interval, $log, $rootScope, $scope, KatGuiUtil, ConfigService, StatusService, NotifyService, SensorsService) {

        var vm = this;
        ConfigService.loadAggregateSensorDetail();
        vm.topStatusTrees = StatusService.topStatusTrees;
        vm.connectInterval = null;
        vm.sensorValues = {};

        ConfigService.getStatusTreesForTop()
            .then(function (result) {
                StatusService.setTopStatusTrees(result.data);
                vm.connectListeners();
            }, function () {
                NotifyService.showSimpleDialog("Error retrieving status tree structure from katconf-webserver, is the server running?");
            });

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
            if (StatusService.topStatusTreesSensors) {
                SensorsService.setSensorStrategies(Object.keys(StatusService.topStatusTreesSensors).join('|'), 'event', 1, 360);
            }
        };

        vm.pendingUpdatesInterval = $interval(StatusService.applyPendingUpdates, 150);

        var unbindUpdate = $rootScope.$on('sensorsServerUpdateMessage', function (event, sensor) {
            var sensorName = sensor.name.split(':')[1];
            sensor.status = sensor.value.status;
            sensor.received_timestamp = sensor.value.received_timestamp;
            sensor.timestamp = sensor.value.timestamp;
            sensor.value = sensor.value.value;
            StatusService.sensorValues[sensorName] = sensor;
            StatusService.addToUpdateQueue(sensorName);
        });

        $scope.$on('$destroy', function () {
            $interval.cancel(vm.pendingUpdatesInterval);
            unbindUpdate();
            SensorsService.disconnectListener();
            StatusService.sensorValues = {};
        });
    }
})
();
