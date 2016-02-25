(function () {

    angular.module('katGui')
        .controller('WeatherCtrl', WeatherCtrl);

    function WeatherCtrl($rootScope, $scope, DataService, SensorsService, KatGuiUtil, $interval, $log, $q,
                         DATETIME_FORMAT, ConfigService, NotifyService, $timeout, $localStorage) {

        var vm = this;
        vm.ancResource = {
            sensorList: [
                {python_identifier: 'anc_air_pressure', color: '#1f77b4'},
                {python_identifier: 'anc_air_temperature', color: '#ff7f0e'},
                {python_identifier: 'anc_air_relative_humidity', color: '#2ca02c'},
                {python_identifier: 'anc_weather_rainfall', skipHistory: true},
                {python_identifier: 'anc_gust_wind_speed', color: '#ff7f0e'},
                {python_identifier: 'anc_wind_direction', skipHistory: true},
                {python_identifier: 'anc_mean_wind_speed', color: '#1f77b4'}]
        };
        vm.resourcesHistoriesCount = 4;
        vm.guid = KatGuiUtil.generateUUID();
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
        if (!$localStorage['weatherHistoricalRange']) {
            vm.historicalRange = '2h';
        } else {
            vm.historicalRange = $localStorage['weatherHistoricalRange'];
        }
        if (!$localStorage['sensorGroupingInterval']) {
            vm.sensorGroupingInterval = 30;
        } else {
            vm.sensorGroupingInterval = $localStorage['sensorGroupingInterval'];
        }
        vm.dataTimeWindow = new Date().getTime();

        ConfigService.getWindstowLimits()
            .then(function (result) {
                vm.windSpeedLimitLine = parseFloat(result.data.stow_speed_m_s);
                vm.windGustLimitLine = parseFloat(result.data.stow_gust_speed_m_s);
                vm.redrawWindChart([], vm.showWindGridLines, true, vm.useFixedWindYAxis, null, 1000, [vm.windSpeedLimitLine, vm.windGustLimitLine], true);
            }, function(error) {
                NotifyService.showSimpleDialog('Could not retrieve windstow limits from katconf_ws', error);
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

        vm.connectListeners();

        vm.initSensors = function (skipConnectSensorListeners) {
            var startDate = vm.getTimestampFromHistoricalRange();
            vm.dataTimeWindow = new Date().getTime() - startDate;

            var dataRegexSearch = '';
            var samplingRegexSearch = '';
            for (var i = 0; i < vm.ancResource.sensorList.length; i++) {
                var sensor = vm.ancResource.sensorList[i];
                var sensorName = sensor.python_identifier;
                if (!sensor.skipHistory) {
                    if (i < vm.ancResource.sensorList.length - 1) {
                        dataRegexSearch += sensorName + '|';
                    } else {
                        dataRegexSearch += sensorName;
                    }
                }
                if (i < vm.ancResource.sensorList.length - 1) {
                    samplingRegexSearch += sensorName + '|';
                } else {
                    samplingRegexSearch += sensorName;
                }
            }

            DataService.sensorDataRegex(SensorsService.guid, dataRegexSearch, startDate, new Date().getTime(), 0, vm.sensorGroupingInterval? vm.sensorGroupingInterval : 30)
                .then(function (result) {
                    if (result.data.error) {
                        NotifyService.showPreDialog('Error retrieving historical weather data', result.data.error);
                    } else {
                        if (result.data instanceof Array) {
                            vm.sensorDataReceived(null, {value: result.data});
                        } else {
                            $log.info('Waiting for ' + result.data.row_count + ' data points on websocket.');
                        }
                    }
                }, function (error) {
                    $log.error(error);
                    NotifyService.showPreDialog('Error retrieving historical weather data', error);
                });
            if (!skipConnectSensorListeners) {
                $timeout(function () {
                    SensorsService.setSensorStrategies(
                        samplingRegexSearch,
                        $rootScope.sensorListStrategyType,
                        $rootScope.sensorListStrategyInterval,
                        $rootScope.sensorListStrategyInterval);

                }, 1000);
            }
        };

        vm.sensorDataReceived = function (event, sensor) {
            if (sensor.value && sensor.value instanceof Array) {
                var newData = [];
                var newWindData = [];
                var newSensorNames = {};
                for (var attr in sensor.value) {
                    var sensorName = sensor.value[attr][3];
                    var latestSensor = null;
                    if (sensorName.indexOf('wind_speed') === -1 &&
                        sensorName.indexOf('gust_speed') === -1) {
                        latestSensor = {
                            status: sensor.value[attr][4],
                            sensor: sensorName,
                            value: sensor.value[attr][2],
                            sample_ts: sensor.value[attr][1] / 1000,
                        };
                        if (sensorName.indexOf('pressure') !== -1) {
                            latestSensor.rightAxis = true;
                        }
                        newData.push(latestSensor);
                    } else {
                        latestSensor = {
                            status: sensor.value[attr][4],
                            sensor: sensorName,
                            value: sensor.value[attr][2],
                            sample_ts: sensor.value[attr][1] / 1000,
                        };
                        newWindData.push(latestSensor);
                    }
                    if (!vm.maxSensorValue[sensorName]) {
                        vm.maxSensorValue[sensorName] = {timestamp: latestSensor.sample_ts, value: latestSensor.value};
                    } else if (latestSensor.value >= vm.maxSensorValue[latestSensor.sensor].value) {
                        vm.maxSensorValue[latestSensor.sensor] = {timestamp: latestSensor.sample_ts, value: latestSensor.value};
                    }
                }
                if (newData) {
                    vm.redrawChart(newData, vm.showGridLines, vm.dataTimeWindow);
                }
                if (newWindData) {
                    vm.redrawWindChart(newWindData, vm.showWindGridLines, true, vm.useFixedWindYAxis, null, 1000, [vm.windSpeedLimitLine, vm.windGustLimitLine]);
                }
            } else {
                var strList = sensor.name.split(':');
                var windDirection = null,
                    windSpeed = null,
                    gustSpeed = null;
                vm.ancResource.sensorList.forEach(function (oldSensor) {
                    if (oldSensor.python_identifier === strList[1]) {
                        oldSensor.name = oldSensor.python_identifier.replace('anc_', '').replace('weather_', '').replace(/_/g, ' ');
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
                var newSensor;
                if (windSpeed || gustSpeed) {
                    newSensor = {
                        sensor: strList[1].replace(/\./g, '_'),
                        sample_ts: sensor.value.timestamp * 1000,
                        received_timestamp: sensor.value.received_timestamp * 1000,
                        value: sensor.value.value,
                        color: sensor.color
                    };
                    vm.redrawWindChart([newSensor], vm.showWindGridLines, true, vm.useFixedWindYAxis, null, 1000, [vm.windSpeedLimitLine, vm.windGustLimitLine]);
                } else if (strList[1].indexOf('temperature') > -1 ||
                    strList[1].indexOf('humidity') > -1 ||
                    strList[1].indexOf('pressure') > -1) {

                    newSensor = {
                        sensor: strList[1].replace(/\./g, '_'),
                        sample_ts: sensor.value.timestamp * 1000,
                        received_timestamp: sensor.value.received_timestamp * 1000,
                        value: sensor.value.value,
                        color: sensor.color
                    };

                    if (strList[1].indexOf('pressure') !== -1) {
                        newSensor.rightAxis = true;
                    }
                    vm.redrawChart([newSensor], vm.showGridLines, vm.dataTimeWindow);
                }
            }
        };

        var unbindUpdate = $rootScope.$on('sensorsServerUpdateMessage', vm.sensorDataReceived);

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
            $localStorage['weatherHistoricalRange'] = vm.historicalRange;
            $localStorage['sensorGroupingInterval'] = vm.sensorGroupingInterval;
            vm.clearWindChart();
            vm.clearChart();
            vm.initSensors(true);
        };

        //create it to be bound to, but we dont use it on this screen
        vm.removeSensorLine = function () {};

        $scope.$on('$destroy', function () {
            vm.ancResource.sensorList.forEach(function (sensor) {
                SensorsService.unsubscribe(sensor.python_identifier, vm.guid);
            });
            unbindUpdate();
            SensorsService.disconnectListener();
        });
    }
})();
