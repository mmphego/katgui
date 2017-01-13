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
                vm.showProgress = true;
                SensorsService.listSensors(vm.sensorGroups[vm.sensorsGroupBeingDisplayed].sensors).then(function (result) {
                    if (result.data) {
                        result.data.forEach(function (sensor) {
                            sensor.received_timestamp = moment.utc(sensor.received_timestamp, 'X').format(DATETIME_FORMAT);
                            sensor.timestamp = moment.utc(sensor.timestamp, 'X').format(DATETIME_FORMAT);
                            vm.sensorValues[sensor.python_identifier] = sensor;
                        });
                        vm.sensorsToDisplay = result.data;
                        SensorsService.setSensorStrategies(
                            vm.sensorGroups[vm.sensorsGroupBeingDisplayed].sensors,
                            $rootScope.sensorListStrategyType,
                            $rootScope.sensorListStrategyInterval,
                            10);
                    }
                    vm.showProgress = false;
                });
            }
        };

        vm.setSensorGroupStrategy = function (sensorGroupName) {

            if (vm.sensorsGroupBeingDisplayed && sensorGroupName !== vm.sensorsGroupBeingDisplayed) {
                SensorsService.removeSensorStrategies(vm.sensorGroups[vm.sensorsGroupBeingDisplayed].sensors);
                vm.sensorValues = {};
            }
            vm.sensorsGroupBeingDisplayed = sensorGroupName;
            vm.sensorsToDisplay = [];
            vm.showProgress = true;
            $timeout(function () {
                SensorsService.listSensors(vm.sensorGroups[vm.sensorsGroupBeingDisplayed].sensors).then(function (result) {
                    if (result.data) {
                        result.data.forEach(function (sensor) {
                            sensor.received_timestamp = moment.utc(sensor.received_timestamp, 'X').format(DATETIME_FORMAT);
                            sensor.timestamp = moment.utc(sensor.timestamp, 'X').format(DATETIME_FORMAT);
                            vm.sensorValues[sensor.python_identifier] = sensor;
                        });
                        vm.sensorsToDisplay = result.data;
                        SensorsService.setSensorStrategies(
                            vm.sensorGroups[vm.sensorsGroupBeingDisplayed].sensors,
                            $rootScope.sensorListStrategyType,
                            $rootScope.sensorListStrategyInterval,
                            10);
                    }
                    vm.showProgress = false;
                }, function (error) {
                    vm.showProgress = false;
                    NotifyService.showPreDialog('Error displaying Sensor Group', error.data.err_msg);
                });
            }, 500);
        };

        vm.displaySensorValue = function ($event, sensor) {
            NotifyService.showHTMLPreSensorDialog(sensor.python_identifier + ' value at ' + sensor.received_timestamp, sensor, $event);
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
                vm.sensorValues[sensorName].received_timestamp = moment.utc(sensor.value.received_timestamp, 'X').format(DATETIME_FORMAT);
                vm.sensorValues[sensorName].status = sensor.value.status;
                vm.sensorValues[sensorName].timestamp = moment.utc(sensor.value.timestamp, 'X').format(DATETIME_FORMAT);
                vm.sensorValues[sensorName].value = sensor.value.value;
            }
        });

        vm.filterByNotNominal = function (sensor) {
            return !vm.hideNominalSensors || vm.hideNominalSensors && sensor.status !== 'nominal';
        };

        vm.connectListeners();

        $scope.$on('$destroy', function () {
            unbindUpdate();
            SensorsService.disconnectListener();
        });
    }
})();
