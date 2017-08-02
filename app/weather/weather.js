(function() {

    angular.module('katGui')
        .controller('WeatherCtrl', WeatherCtrl);

    function WeatherCtrl($rootScope, $scope, DataService, SensorsService, KatGuiUtil, $interval, $log, $q,
        MOMENT_DATETIME_FORMAT, ConfigService, NotifyService, $timeout, $localStorage) {

        var vm = this;
        vm.ancResource = {
            sensorList: [{
                python_identifier: 'anc_air_pressure',
                color: '#1f77b4'
            }, {
                python_identifier: 'anc_air_temperature',
                color: '#ff7f0e'
            }, {
                python_identifier: 'anc_air_relative_humidity',
                color: '#2ca02c'
            }, {
                python_identifier: 'anc_weather_rainfall',
                skipHistory: true
            }, {
                python_identifier: 'anc_gust_wind_speed',
                color: '#ff7f0e'
            }, {
                python_identifier: 'anc_wind_direction',
                skipHistory: true
            }, {
                python_identifier: 'anc_mean_wind_speed',
                color: '#1f77b4'
            }]
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
            .then(function(result) {
                vm.windSpeedLimitLine = parseFloat(result.data.stow_speed_m_s);
                vm.windGustLimitLine = parseFloat(result.data.stow_gust_speed_m_s);
                vm.loadWindOptions({
                    showGridLines: vm.showWindGridLines,
                    hideContextZoom: true,
                    useFixedYAxis: vm.useFixedWindYAxis,
                    yAxisValues: null,
                    dataLimit: 750,
                    limitOverlayValues: [vm.windSpeedLimitLine, vm.windGustLimitLine],
                    hasMinMax: false
                }, true);
            }, function(error) {
                NotifyService.showSimpleDialog('Could not retrieve windstow limits from katconf_ws', error);
            });

        vm.connectListeners = function() {
            SensorsService.connectListener()
                .then(function() {
                    vm.initSensors();
                    if (vm.connectInterval) {
                        $interval.cancel(vm.connectInterval);
                        vm.connectInterval = null;
                        NotifyService.showSimpleToast('Reconnected :)');
                    }
                }, function() {
                    $log.error('Could not establish sensor connection. Retrying every 10 seconds.');
                    if (!vm.connectInterval) {
                        vm.connectInterval = $interval(vm.connectListeners, 10000);
                    }
                });
            vm.handleSocketTimeout();
        };

        vm.handleSocketTimeout = function() {
            SensorsService.getTimeoutPromise()
                .then(function() {
                    NotifyService.showSimpleToast('Connection timeout! Attempting to reconnect...');
                    if (!vm.connectInterval) {
                        vm.connectInterval = $interval(vm.connectListeners, 10000);
                        vm.connectListeners();
                    }
                });
        };

        vm.connectListeners();

        vm.initSensors = function(skipConnectSensorListeners) {
            var startDate = vm.getTimestampFromHistoricalRange();
            vm.dataTimeWindow = new Date().getTime() - startDate;

            var dataRegexSearch = [];
            var samplingRegexSearch = [];
            for (var i = 0; i < vm.ancResource.sensorList.length; i++) {
                var sensor = vm.ancResource.sensorList[i];
                var sensorName = sensor.python_identifier;
                if (!sensor.skipHistory) {
                    dataRegexSearch.push(sensorName);
                }
                samplingRegexSearch.push(sensorName);
            }
            dataRegexSearch.forEach(function(dataSensorName) {
                var interval = vm.relativeTimeToSeconds(vm.sensorGroupingInterval, vm.historicalRange);
                var dataLimit = vm.dataTimeWindow / (interval * 1000);
                var requestParams = [SensorsService.guid, dataSensorName, startDate, new Date().getTime(), dataLimit, interval];
                vm.loadWindOptions({
                    dataLimit: dataLimit
                });
                DataService.sensorData.apply(this, requestParams)
                    .then(function(result) {
                        if (result.data instanceof Array) {
                            vm.sensorDataReceived(null, {
                                value: result.data
                            });
                        }
                    }, function(error) {
                        $log.info(error);
                        NotifyService.showPreDialog('Error retrieving historical weather data', error);
                    });
            });

            if (!skipConnectSensorListeners) {
                $timeout(function() {
                    SensorsService.setSensorStrategies(
                        samplingRegexSearch.join('|'),
                        $rootScope.sensorListStrategyType,
                        $rootScope.sensorListStrategyInterval,
                        $rootScope.sensorListStrategyInterval);

                }, 1000);
            }
        };

        vm.sensorDataReceived = function(event, sensor) {
            if (sensor.value && sensor.value instanceof Array) {
                var newData = [];
                var newWindData = [];
                var newSensorNames = {};
                for (var attr in sensor.value) {
                    var sensorName = sensor.value[attr][4];
                    var latestSensor = null;
                    if (sensorName.indexOf('wind_speed') === -1 &&
                        sensorName.indexOf('gust_speed') === -1) {
                        latestSensor = {
                            status: sensor.value[attr][5],
                            sensor: sensorName,
                            value: sensor.value[attr][3],
                            sample_ts: sensor.value[attr][0],
                        };
                        if (sensorName.indexOf('pressure') !== -1) {
                            latestSensor.rightAxis = true;
                        }
                        newData.push(latestSensor);
                    } else {
                        latestSensor = {
                            status: sensor.value[attr][5],
                            sensor: sensorName,
                            value: sensor.value[attr][3],
                            sample_ts: sensor.value[attr][0],
                        };
                        newWindData.push(latestSensor);
                    }
                    if (!vm.maxSensorValue[sensorName]) {
                        vm.maxSensorValue[sensorName] = {
                            timestamp: latestSensor.sample_ts,
                            value: latestSensor.value
                        };
                    } else if (latestSensor.value >= vm.maxSensorValue[latestSensor.sensor].value) {
                        vm.maxSensorValue[latestSensor.sensor] = {
                            timestamp: latestSensor.sample_ts,
                            value: latestSensor.value
                        };
                    }
                }
                if (newData.length > 0) {
                    vm.redrawChart(newData, vm.showGridLines, vm.dataTimeWindow);
                }
                if (newWindData.length > 0) {
                    vm.redrawWindChart(newWindData);
                }
            } else {
                var strList = sensor.name.split(':');
                var windDirection = null,
                    windSpeed = null,
                    gustSpeed = null;
                vm.ancResource.sensorList.forEach(function(oldSensor) {
                    if (oldSensor.python_identifier === strList[1]) {
                        oldSensor.name = oldSensor.python_identifier.replace('anc_', '').replace('weather_', '').replace(/_/g, ' ');
                        oldSensor.sensorValue = sensor.value;
                        oldSensor.status = sensor.value.status;
                        oldSensor.timestamp = moment.utc(sensor.value.timestamp, 'X').format('HH:mm:ss');
                        oldSensor.received_timestamp = moment.utc(sensor.value.received_timestamp, 'X').format(MOMENT_DATETIME_FORMAT);
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
                            vm.maxSensorValue[oldSensor.name] = {
                                timestamp: oldSensor.timestamp,
                                value: oldSensor.value
                            };
                        } else if (oldSensor.value >= vm.maxSensorValue[oldSensor.name].value) {
                            vm.maxSensorValue[oldSensor.name] = {
                                timestamp: oldSensor.timestamp,
                                value: oldSensor.value
                            };
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
                    vm.redrawWindChart([newSensor]);
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

        vm.showOptionsChanged = function() {
            vm.redrawChart(null, vm.showGridLines, vm.dataTimeWindow);
        };

        vm.showWindOptionsChanged = function() {
            vm.loadWindOptions({
                showGridLines: vm.showWindGridLines,
                hideContextZoom: true,
                useFixedYAxis: vm.useFixedWindYAxis,
                yAxisValues: null,
                dataLimit: 5000,
                limitOverlayValues: [vm.windSpeedLimitLine, vm.windGustLimitLine],
                hasMinMax: false
            }, true);
        };

        vm.sensorClass = function(status) {
            return status + '-sensor-list-item';
        };

        vm.classNameFromPythonID = function(sensor) {
            return sensor.python_identifier.replace(/\./g, '_');
        };

        vm.getTimestampFromHistoricalRange = function() {
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

        vm.relativeTimeToSeconds = function (count, type) {
            switch (type) {
                case 's':
                    return (count);
                case 'm':
                    return (60 * count);
                case 'h':
                    return (60 * 60 * count);
                case 'd':
                    return (60 * 60 * 24 * count);
                default:
                    return (count);
            }
        };

        vm.historicalRangeChanged = function() {
            $localStorage['weatherHistoricalRange'] = vm.historicalRange;
            $localStorage['sensorGroupingInterval'] = vm.sensorGroupingInterval;
            vm.clearWindChart();
            vm.clearChart();
            vm.initSensors(true);
        };

        //create it to be bound to, but we dont use it on this screen
        vm.removeSensorLine = function() {};

        //create to function to bind to, but dont do anything with it yet
        vm.downloadAsCSV = function() {};

        $scope.$on('$destroy', function() {
            vm.ancResource.sensorList.forEach(function(sensor) {
                SensorsService.unsubscribe(sensor.python_identifier, vm.guid);
            });
            unbindUpdate();
            SensorsService.disconnectListener();
        });
    }
})();
