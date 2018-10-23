(function() {

    angular.module('katGui')
        .controller('WeatherCtrl', WeatherCtrl);

    function WeatherCtrl($rootScope, $scope, DataService, MonitorService, KatGuiUtil, $interval, $log, $q,
        MOMENT_DATETIME_FORMAT, ConfigService, NotifyService, $timeout, $localStorage) {

        var vm = this;
        vm.ancSensors = [
            'air_pressure',
            'air_temperature',
            'air_relative_humidity',
            'weather_rainfall',
            'gust_wind_speed',
            'wind_direction',
            'mean_wind_speed'
        ];
        vm.sensorsRegex = vm.ancSensors.join('|');
        vm.ancHistoricSensors = [
            'anc_air_pressure',
            'anc_air_temperature',
            'anc_air_relative_humidity',
            'anc_gust_wind_speed',
            'anc_mean_wind_speed'
        ];
        vm.sensorColors = {
            anc_air_pressure: '#1f77b4',
            anc_air_temperature: '#ff7f0e',
            anc_air_relative_humidity: '#2ca02c',
            anc_gust_wind_speed: '#ff7f0e',
            anc_mean_wind_speed: '#1f77b4'
        };

        vm.sensorValues = {};
        vm.resourcesHistoriesCount = 4;
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

        vm.initSensors = function() {
            var startDateMS = vm.getTimestampFromHistoricalRange();
            vm.dataTimeWindow = new Date().getTime() - startDateMS;
            MonitorService.listSensorsHttp('anc', vm.sensorsRegex, true).then(function (result) {
                result.data.forEach(function (sensor) {
                    vm.sensorUpdateMessage(null, sensor);
                });
            }, function(error) {
                $log.error(error);
            });
            vm.ancSensors.forEach(function(sensorName) {
                MonitorService.subscribeSensorName('anc', sensorName);
            });

            vm.ancHistoricSensors.forEach(function(dataSensorName) {
                var interval = vm.relativeTimeToSeconds(vm.sensorGroupingInterval, vm.historicalRange);
                var dataLimit = parseInt(vm.dataTimeWindow / (interval * 1000));
                vm.loadWindOptions({
                    dataLimit: dataLimit

                });
                var requestParams = {
                    name: dataSensorName,
                    start: startDateMS/1000,
                    end: 'now',
                    limit: dataLimit,
                    allFields: vm.includeValueTimestamp,
                    interval: interval
                };

                DataService.sensorData.call(this, requestParams)
                    .then(function(result) {
                        vm.sensorDataReceived(result.data.data);
                    }, function(error) {
                        $log.info(error);
                        NotifyService.showPreDialog('Error retrieving historical weather data', error);
                    });
            });
        };

        vm.sensorDataReceived = function(sensorData) {
            var newData = [];
            var newWindData = [];
            var newSensorNames = {};
            sensorData.forEach(function (sensor) {
                var sensorName = sensor.sensor;
                var latestSensor = {
                    status: sensor.status,
                    sensor: sensorName,
                    value: sensor.avg_value,
                    sample_ts: sensor.min_sample_time * 1000,
                };
                if (sensorName.startsWith('anc_air_')) {
                    if (sensorName === 'anc_air_pressure') {
                        latestSensor.rightAxis = true;
                    }
                    newData.push(latestSensor);
                } else {
                    latestSensor = {
                        status: sensor.status,
                        sensor: sensorName,
                        value: sensor.avg_value,
                        sample_ts: sensor.min_sample_time * 1000,
                    };
                    newWindData.push(latestSensor);
                }
                if (!vm.maxSensorValue[sensorName]) {
                    vm.maxSensorValue[sensorName] = {
                        timestamp: moment.utc(sensor.min_sample_time, 'X').format('HH:mm:ss'),
                        value: sensor.avg_value
                    };
                } else if (sensor.value > vm.maxSensorValue[sensorName].value) {
                    vm.maxSensorValue[sensorName] = {
                        timestamp: moment.utc(sensor.min_sample_time, 'X').format('HH:mm:ss'),
                        value: sensor.avg_value
                    };
                }
            });
            if (newData.length > 0) {
                vm.redrawChart(newData, vm.showGridLines, vm.dataTimeWindow);
            }
            if (newWindData.length > 0) {
                vm.redrawWindChart(newWindData);
            }
        };

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

        vm.relativeTimeToSeconds = function(count, type) {
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

        //create it to be bound to, but we dont use it on this display
        vm.removeSensorLine = function() {};
        //create to function to bind to, but dont do anything with it
        vm.downloadAsCSV = function() {};

        vm.sensorUpdateMessage = function(event, sensor, subject) {
            if (sensor.name.search(vm.sensorsRegex) < 0) {
                return;
            }
            vm.sensorValues[sensor.name] = sensor;

            if (!vm.maxSensorValue[sensor.name]) {
                vm.maxSensorValue[sensor.name] = {
                    timestamp: moment.utc(sensor.time, 'X').format('HH:mm:ss'),
                    value: sensor.value
                };
            } else if (sensor.value > vm.maxSensorValue[sensor.name].value) {
                vm.maxSensorValue[sensor.name] = {
                    timestamp: moment.utc(sensor.time, 'X').format('HH:mm:ss'),
                    value: sensor.value
                };
            }

            if (sensor.name === 'anc_wind_direction') {
                vm.redrawCompass(sensor.value);
            } else if (sensor.name.endsWith('_wind_speed')) {
                var newWindSensor = {
                    sensor: sensor.name,
                    sample_ts: sensor.time * 1000,
                    received_timestamp: sensor.value_ts * 1000,
                    value: sensor.value,
                    color: vm.sensorColors[sensor.name]
                };
                vm.redrawWindChart([newWindSensor]);
            } else if (sensor.name.startsWith('anc_air_')) {
                var newAirSensor = {
                    sensor: sensor.name,
                    sample_ts: sensor.time * 1000,
                    received_timestamp: sensor.value_ts * 1000,
                    value: sensor.value,
                    color: vm.sensorColors[sensor.name]
                };

                if (sensor.name === 'anc_air_pressure') {
                    newAirSensor.rightAxis = true;
                }
                vm.redrawChart([newAirSensor], vm.showGridLines, vm.dataTimeWindow);
            }
        };

        var unbindSensorUpdates = $rootScope.$on('sensorUpdateMessage', vm.sensorUpdateMessage);
        var unbindReconnected = $rootScope.$on('websocketReconnected', vm.initSensors);

        $timeout(function() {
            vm.initSensors(true);
        });

        $scope.$on('$destroy', function() {
            vm.ancSensors.forEach(function(sensorName) {
                MonitorService.unsubscribeSensorName('anc', sensorName);
            });
            unbindSensorUpdates();
            unbindReconnected();
        });
    }
})();
