(function () {

    angular.module('katGui')
        .controller('WeatherCtrl', WeatherCtrl);

    function WeatherCtrl($rootScope, $scope, DataService, SensorsService, KatGuiUtil, $interval, $log, $q, DATETIME_FORMAT, ConfigService) {

        var vm = this;
        vm.ancResource = {
            sensorList: [
                {python_identifier: 'anc.weather_pressure', color: '#1f77b4'},
                {python_identifier: 'anc.weather_temperature', color: '#ff7f0e'},
                {python_identifier: 'anc.weather_relative_humidity', color: '#2ca02c'},
                {python_identifier: 'anc.weather_rainfall', skipHistory: true},
                {python_identifier: 'anc.gust_wind_speed', color: '#ff7f0e'},
                {python_identifier: 'anc.mean_wind_speed', color: '#1f77b4'},
                {python_identifier: 'anc.weather_wind_direction', skipHistory: true}]
        };
        vm.resourcesHistoriesCount = 4;
        vm.guid = KatGuiUtil.generateUUID();
        vm.disconnectIssued = false;
        vm.connectInterval = null;

        vm.showTips = false;
        vm.showGridLines = false;
        vm.showWindGridLines = false;
        vm.useFixedYAxis = true;
        vm.useFixedRightYAxis = true;
        vm.useFixedWindYAxis = true;
        vm.yAxisMinValue = 0;
        vm.yAxisMaxValue = 100;
        vm.yAxisRightMinValue = 0;
        vm.yAxisRightMaxValue = 1000;
        vm.yAxisWindMinValue = 0;
        vm.yAxisWindMaxValue = 20;
        vm.windSpeedLimitLine = 0;
        vm.windGustLimitLine = 0;
        vm.maxSensorValue = {};
        vm.historicalRange = '2h';
        vm.sensorGroupingInterval = 30;
        vm.dataTimeWindow = new Date().getTime();

        ConfigService.getWindstowLimits()
            .success(function (result) {
                vm.windSpeedLimitLine = parseFloat(result.stow_speed_m_s);
                vm.windGustLimitLine = parseFloat(result.stow_gust_speed_m_s);
                vm.redrawWindChart([], vm.showWindGridLines, true, vm.useFixedWindYAxis, null, 1000, [vm.windSpeedLimitLine, vm.windGustLimitLine], true);
            })
            .error(function(error) {
                $rootScope.showSimpleDialog('Could not retrieve windstow limits from katconf_ws', error);
            });

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

        vm.initSensors = function (skipConnectSensorListeners) {
            var startDate = vm.getTimestampFromHistoricalRange();
            vm.dataTimeWindow = new Date().getTime() - startDate;
            var sensorNameList = [];
            var deferred = $q.defer();
            var resourcesHistoriesReceived = 0;

            if (!skipConnectSensorListeners) {
                deferred.promise.then(function () {
                    SensorsService.setSensorStrategy(
                        'anc',
                        sensorNameList,
                        $rootScope.sensorListStrategyType,
                        $rootScope.sensorListStrategyInterval,
                        $rootScope.sensorListStrategyInterval);
                });
            }

            vm.ancResource.sensorList.forEach(function (sensor) {
                sensorNameList.push(sensor.python_identifier.replace('anc.', ''));
                if (!sensor.skipHistory) {
                    var katstoreSensorName = sensor.python_identifier.replace(/\./g, '_');
                    DataService.findSensor(katstoreSensorName, startDate, new Date().getTime(), 0, 'ms', 'json', vm.sensorGroupingInterval? vm.sensorGroupingInterval : 30)
                        .success(function (result) {
                            resourcesHistoriesReceived++;
                            var newData = [];
                            //pack the result in the way our chart needs it
                            //because the json we receive is not good enough for d3
                            for (var attr in result) {
                                var name = attr.replace('anc_', '').replace('weather_', '').replace(/_/g, ' ');
                                for (var i = 0; i < result[attr].length; i++) {
                                    var newSensor = {
                                        name: name,
                                        Sensor: attr,
                                        Timestamp: result[attr][i][0],
                                        Value: result[attr][i][1],
                                        timestamp: moment.utc(result[attr][i][0], 'X').format(DATETIME_FORMAT),
                                        color: sensor.color
                                    };
                                    if (sensor.python_identifier.indexOf('pressure') !== -1) {
                                        newSensor.rightAxis = true;
                                    }
                                    newData.push(newSensor);

                                    if (!vm.maxSensorValue[name]) {
                                        vm.maxSensorValue[name] = {
                                            timestamp: newSensor.timestamp,
                                            value: newSensor.Value
                                        };
                                    } else if (newSensor.Value >= vm.maxSensorValue[newSensor.name].value) {
                                        vm.maxSensorValue[name] = {
                                            timestamp: newSensor.timestamp,
                                            value: newSensor.Value
                                        };
                                    }
                                }
                            }
                            if (sensor.python_identifier.indexOf('wind_speed') > -1 ||
                                sensor.python_identifier.indexOf('gust_speed') > -1) {
                                vm.redrawWindChart(newData, vm.showWindGridLines, true, vm.useFixedWindYAxis, null, 1000, [vm.windSpeedLimitLine, vm.windGustLimitLine]);
                            } else {
                                vm.redrawChart(newData, vm.showGridLines, vm.dataTimeWindow);
                            }

                            if (resourcesHistoriesReceived >= vm.resourcesHistoriesCount) {
                                deferred.resolve();
                            }
                        })
                        .error(function (error) {
                            resourcesHistoriesReceived++;
                            if (resourcesHistoriesReceived >= vm.resourcesHistoriesCount) {
                                deferred.resolve();
                            }
                            $log.error(error);
                        });
                }
            });
        };

        var unbindUpdate = $rootScope.$on('sensorsServerUpdateMessage', function (event, sensor) {
            var strList = sensor.name.split(':');
            var windDirection = null,
                windSpeed = null,
                gustSpeed = null;
            vm.ancResource.sensorList.forEach(function (oldSensor) {
                if (oldSensor.python_identifier === strList[1]) {
                    oldSensor.name = oldSensor.python_identifier.replace('anc.', '').replace('weather_', '').replace(/_/g, ' ');
                    oldSensor.sensorValue = sensor.value;
                    oldSensor.status = sensor.value.status;
                    oldSensor.timestamp = moment.utc(sensor.value.timestamp, 'X').format('HH:mm:ss');
                    oldSensor.received_timestamp = moment.utc(sensor.value.received_timestamp, 'X').format(DATETIME_FORMAT);
                    oldSensor.value = sensor.value.value;
                    sensor.color = oldSensor.color;

                    if (oldSensor.python_identifier.indexOf('wind_direction') !== -1) {
                        windDirection = oldSensor.value;
                        vm.latestWindDirection = windDirection;
                    }
                    if (oldSensor.python_identifier.indexOf('wind_speed') !== -1) {
                        windSpeed = oldSensor.value;
                    }
                    if (oldSensor.python_identifier.indexOf('gust_speed') !== -1) {
                        gustSpeed = oldSensor.value;
                    }

                    if (!vm.maxSensorValue[oldSensor.name]) {
                        vm.maxSensorValue[oldSensor.name] = {timestamp: oldSensor.timestamp, value: oldSensor.value};
                    } else if (oldSensor.value >= vm.maxSensorValue[oldSensor.name].value) {
                        vm.maxSensorValue[oldSensor.name] = {timestamp: oldSensor.timestamp, value: oldSensor.value};
                    }
                }
            });

            if (windDirection) {
                vm.redrawCompass(windDirection);
            }

            if (windSpeed || gustSpeed) {
                var newSensor = {
                    Sensor: strList[1].replace(/\./g, '_'),
                    ValueTimestamp: sensor.value.timestamp,
                    Timestamp: sensor.value.received_timestamp,
                    Value: sensor.value.value,
                    color: sensor.color
                };
                vm.redrawWindChart([newSensor], vm.showWindGridLines, true, vm.useFixedWindYAxis, null, 1000, [vm.windSpeedLimitLine, vm.windGustLimitLine]);
            } else if (strList[1].indexOf('temperature') > -1
                || strList[1].indexOf('humidity') > -1
                || strList[1].indexOf('pressure') > -1) {

                var newSensor = {
                    Sensor: strList[1].replace(/\./g, '_'),
                    ValueTimestamp: sensor.value.timestamp,
                    Timestamp: sensor.value.received_timestamp,
                    Value: sensor.value.value,
                    color: sensor.color
                };

                if (strList[1].indexOf('pressure') !== -1) {
                    newSensor.rightAxis = true;
                }
                vm.redrawChart([newSensor], vm.showGridLines, vm.dataTimeWindow);
            }
        });

        vm.showOptionsChanged = function () {
            vm.redrawChart(null, vm.showGridLines, vm.dataTimeWindow);
        };

        vm.showWindOptionsChanged = function () {
            vm.redrawWindChart(null, vm.showWindGridLines, true, vm.useFixedWindYAxis, null, 1000, [vm.windSpeedLimitLine, vm.windGustLimitLine]);
        };

        vm.sensorClass = function (status) {
            return status + '-sensor-list-item';
        };

        vm.classNameFromPythonID = function (sensor) {
            return sensor.python_identifier.replace(/\./g, '_');
        };

        vm.getTimestampFromHistoricalRange = function () {
            var now = new Date().getTime();
            switch (vm.historicalRange) {
                case '1h':
                    return now - (60 * 60 * 1000);
                case '2h':
                    return now - (2 * 60 * 60 * 1000);
                case '8h':
                    return now - (8 * 60 * 60 * 1000);
                case '1d':
                    return now - (24 * 60 * 60 * 1000);
                case '2d':
                    return now - (48 * 60 * 60 * 1000);
                case '1w':
                    return now - (168 * 60 * 60 * 1000);
            }
        };

        vm.historicalRangeChanged = function () {
            vm.clearWindChart();
            vm.clearChart();
            vm.maxSensorValue = {};
            vm.initSensors(true);
        };

        $scope.$on('$destroy', function () {
            vm.ancResource.sensorList.forEach(function (sensor) {
                SensorsService.unsubscribe(sensor.python_identifier, vm.guid);
            });
            unbindUpdate();
            vm.disconnectIssued = true;
            SensorsService.disconnectListener();
        });
    }
})();
