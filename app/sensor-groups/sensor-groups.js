(function () {

    angular.module('katGui')
        .controller('SensorGroupsCtrl', SensorGroupsCtrl);

    function SensorGroupsCtrl($scope, $rootScope, SensorsService, $timeout, $interval, NotifyService,
                              ConfigService, $log, DATETIME_FORMAT, KatGuiUtil) {

        var vm = this;
        vm.sensorGroups = {};
        vm.sensorGroupList = [];
        vm.sensorsToDisplay = [];
        vm.sensorsGroupBeingDisplayed = '';
        vm.sensorValues = {};
        vm.guid = KatGuiUtil.generateUUID();
        vm.connectInterval = null;
        vm.hideNominalSensors = false;

        ConfigService.loadSensorGroups().then(function (result) {
            vm.sensorGroupList = Object.keys(result);
            vm.sensorGroups = result;
        });

        vm.sensorsOrderByFields = [
            {label: 'Name', value: 'name'},
            {label: 'Timestamp', value: 'timestamp'},
            {label: 'Received Timestamp', value: 'received_timestamp'},
            {label: 'Status', value: 'status'},
            {label: 'Value', value: 'value'}
        ];

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
            if (vm.sensorsGroupBeingDisplayed.length > 0) {
                SensorsService.listSensors(vm.sensorGroups[vm.sensorsGroupBeingDisplayed].sensors).then(function (result) {
                    if (result.data) {
                        result.data.forEach(function (sensor) {
                            vm.sensorValues[sensor.python_identifier] = sensor;
                        });
                        SensorsService.setSensorStrategies(
                            vm.sensorGroups[vm.sensorsGroupBeingDisplayed].sensors,
                            $rootScope.sensorListStrategyType,
                            $rootScope.sensorListStrategyInterval,
                            10);
                    }
                });
            }
        };

        vm.setSensorGroupStrategy = function (sensorGroupName) {

            if (vm.sensorsGroupBeingDisplayed && sensorGroupName !== vm.sensorsGroupBeingDisplayed) {
                SensorsService.removeSensorStrategies(vm.sensorGroups[vm.sensorsGroupBeingDisplayed].sensors);
                vm.sensorValues = {};
            }
            vm.sensorsGroupBeingDisplayed = sensorGroupName;
            $timeout(function () {
                SensorsService.listSensors(vm.sensorGroups[vm.sensorsGroupBeingDisplayed].sensors).then(function (result) {
                    if (result.data) {
                        result.data.forEach(function (sensor) {
                            vm.sensorValues[sensor.python_identifier] = sensor;
                        });
                        SensorsService.setSensorStrategies(
                            vm.sensorGroups[vm.sensorsGroupBeingDisplayed].sensors,
                            $rootScope.sensorListStrategyType,
                            $rootScope.sensorListStrategyInterval,
                            10);
                    }
                });
            }, 500);
        };

        vm.setSensorsOrderBy = function (column) {
            var newOrderBy = _.findWhere(vm.sensorsOrderByFields, {value: column});
            if ((vm.sensorsOrderBy || {}).value === column) {
                if (newOrderBy.reverse === undefined) {
                    newOrderBy.reverse = true;
                } else if (newOrderBy.reverse) {
                    newOrderBy.reverse = undefined;
                    newOrderBy = null;
                }
            }
            vm.sensorsOrderBy = newOrderBy;
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        };

        vm.setSensorsOrderBy('name');

        vm.sensorClass = function (status) {
            return status + '-sensor-list-item';
        };

        var unbindUpdate = $rootScope.$on('sensorsServerUpdateMessage', function (event, sensor) {
            var strList = sensor.name.split(':');
            var sensorName = strList[1];
            if (vm.sensorValues[sensorName]) {
                vm.sensorValues[sensorName].name = sensorName;
                vm.sensorValues[sensorName].received_timestamp = moment.utc(sensor.value.received_timestamp, 'X').format(DATETIME_FORMAT);
                vm.sensorValues[sensorName].status = sensor.value.status;
                vm.sensorValues[sensorName].timestamp = moment.utc(sensor.value.timestamp, 'X').format(DATETIME_FORMAT);
                vm.sensorValues[sensorName].value = sensor.value.value;
            }
        });

        vm.filterByNotNominal = function (sensorName) {
            return !vm.hideNominalSensors || vm.hideNominalSensors && vm.sensorValues[sensorName].status !== 'nominal';
        };

        vm.connectListeners();

        $scope.$on('$destroy', function () {
            unbindUpdate();
            SensorsService.disconnectListener();
        });
    }
})();
