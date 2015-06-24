(function () {

    angular.module('katGui')
        .controller('WeatherCtrl', WeatherCtrl);

    function WeatherCtrl($rootScope, $scope, SensorsService, KatGuiUtil, $interval, $log) {

        var vm = this;
        vm.ancResource = {
            sensorList: [
                {python_identifier: 'anc.weather_pressure'},
                {python_identifier: 'anc.weather_temperature'},
                {python_identifier: 'anc.weather_relative_humidity'},
                {python_identifier: 'anc.weather_rainfall'},
                {python_identifier: 'anc.weather_wind_direction'},
                {python_identifier: 'anc.weather_wind_speed'}]
        };
        vm.guid = KatGuiUtil.generateUUID();
        vm.disconnectIssued = false;
        vm.connectInterval = null;

        vm.showTips = false;
        vm.showDots = false;
        vm.useFixedYAxis = true;
        vm.useFixedRightYAxis = true;
        vm.yAxisMinValue = 0;
        vm.yAxisMaxValue = 100;
        vm.yAxisRightMinValue = 0;
        vm.yAxisRightMaxValue = 1000;

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

        vm.connectListeners();

        vm.initSensors = function () {
            var sensorNameList = [];
            vm.ancResource.sensorList.forEach(function (sensor) {
                sensorNameList.push(sensor.python_identifier.replace('anc.', ''));
            });
            SensorsService.connectResourceSensorNamesLiveFeedWithList(
                'anc',
                sensorNameList,
                vm.guid,
                $rootScope.sensorListStrategyType,
                $rootScope.sensorListStrategyInterval,
                $rootScope.sensorListStrategyInterval);

        };

        var unbindUpdate = $rootScope.$on('sensorsServerUpdateMessage', function (event, sensor) {
            var strList = sensor.name.split(':');
            var windDirection, windSpeed;
            vm.ancResource.sensorList.forEach(function (oldSensor) {
                if (oldSensor.python_identifier === strList[1]) {
                    oldSensor.name = oldSensor.python_identifier.replace('anc.', '').replace('weather_', '').replace('_', ' ');
                    oldSensor.sensorValue = sensor.value;
                    oldSensor.status = sensor.value.status;
                    oldSensor.timestamp = moment.utc(sensor.value.timestamp, 'X').format('HH:mm:ss');
                    oldSensor.received_timestamp = moment.utc(sensor.value.received_timestamp, 'X').format('HH:mm:ss DD-MM-YYYY');
                    oldSensor.value = sensor.value.value;

                    if (oldSensor.python_identifier.indexOf('wind_direction') !== -1) {
                        windDirection = oldSensor.value;
                    }
                    if (oldSensor.python_identifier.indexOf('wind_speed') !== -1) {
                        windSpeed = oldSensor.value;
                    }
                }
            });

            if (windDirection || windSpeed) {
                vm.redrawCompass(windDirection, windSpeed);
            }

            if (strList[1].indexOf('temperature') > -1
                || strList[1].indexOf('humidity') > -1
                || strList[1].indexOf('pressure') > -1) {

                var newSensor = {
                    Sensor: strList[1].replace(/\./g, '_'),
                    ValueTimestamp: sensor.value.timestamp,
                    Timestamp: sensor.value.received_timestamp,
                    Value: sensor.value.value
                };

                if (strList[1].indexOf('pressure') !== -1) {
                    newSensor.rightAxis = true;
                }
                vm.redrawChart([newSensor], vm.showGridLines, 100);
            }
        });

        vm.sensorClass = function (status) {
            return status + '-sensor-list-item';
        };

        vm.classNameFromPythonID = function (sensor) {
            return sensor.python_identifier.replace(/\./g, '_');
        };

        $scope.$on('$destroy', function () {
            //SensorsService.removeResourceListeners(vm.resourceSensorsBeingDisplayed);
            //SensorsService.unsubscribe(vm.resourceSensorsBeingDisplayed + ".*", vm.guid);
            unbindUpdate();
            vm.disconnectIssued = true;
            SensorsService.disconnectListener();
        });
    }
})();
