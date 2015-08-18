(function () {

    angular.module('katGui')
        .controller('SensorGraphCtrl', SensorGraphCtrl);

    function SensorGraphCtrl($scope, $rootScope, DataService, SensorsService, $interval, $log,
                             NotifyService) {

        var vm = this;
        var DATETIME_FORMAT = 'HH:mm:ss YYYY-MM-DD';
        vm.showGridLines = false;
        vm.dateTimeError = false;
        vm.sensorNames = [];
        vm.sensorStartDatetime = new Date();
        vm.sensorStartDatetime = new Date((vm.sensorStartDatetime.getTime() + (vm.sensorStartDatetime.getTimezoneOffset() * 60 * 1000)) - (60000 * 60)); //one hour earlier
        vm.sensorStartDateReadable = moment(vm.sensorStartDatetime.getTime()).format(DATETIME_FORMAT);
        vm.sensorEndDatetime = new Date();
        vm.sensorEndDateReadable = moment(vm.sensorEndDatetime.getTime() + (vm.sensorEndDatetime.getTimezoneOffset() * 60 * 1000)).format(DATETIME_FORMAT);
        vm.sensorSearchNames = [];
        vm.sensorSearchStr = "";
        vm.waitingForSearchResult = false;
        vm.showTips = false;
        vm.showContextZoom = true;
        vm.showRelativeTime = false;
        vm.liveData = false;
        vm.useFixedYAxis = false;
        vm.yAxisMinValue = 0;
        vm.yAxisMaxValue = 100;
        vm.disconnectIssued = false;
        vm.connectInterval = null;

        vm.connectListeners = function () {
            SensorsService.connectListener()
                .then(function () {
                    SensorsService.unsubscribe('*', SensorsService.guid);
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
                    if (!vm.disconnectIssued) {
                        NotifyService.showSimpleToast('Connection timeout! Attempting to reconnect...');
                        if (!vm.connectInterval) {
                            vm.connectInterval = $interval(vm.connectListeners, 10000);
                            vm.connectListeners();
                        }
                    }
                });
        };

        vm.connectListeners();

        vm.initSensors = function () {
            if (vm.liveData) {
                vm.sensorNames.forEach(function (sensor) {
                    var sensorName = sensor.katcp_name.substr(sensor.katcp_name.indexOf('.') + 1);
                    sensorName = sensorName.replace(/\./g, '_');
                    SensorsService.subscribe(sensor.component + '.' + sensorName, SensorsService.guid);
                    SensorsService.setSensorStrategy(
                        sensor.component,
                        sensorName,
                        $rootScope.sensorListStrategyType,
                        $rootScope.sensorListStrategyInterval,
                        $rootScope.sensorListStrategyInterval);
                });
            }
        };

        vm.onTimeSet = function () {
            vm.sensorStartDateReadable = moment(vm.sensorStartDatetime.getTime()).format(DATETIME_FORMAT);
            vm.dateTimeError = false;
        };

        vm.onEndTimeSet = function () {
            vm.sensorEndDateReadable = moment(vm.sensorEndDatetime.getTime()).format(DATETIME_FORMAT);
            vm.endDateTimeError = false;
        };

        vm.startTimeChange = function () {
            var parsedDate = Date.parse(vm.sensorStartDateReadable);
            if (parsedDate) {
                vm.sensorStartDatetime = new Date(parsedDate);
                vm.dateTimeError = false;
            } else {
                vm.dateTimeError = true;
            }
        };

        vm.endTimeChange = function () {
            var parsedDate = Date.parse(vm.sensorEndDateReadable);
            if (parsedDate) {
                vm.sensorEndDatetime = new Date(parsedDate);
                vm.endDateTimeError = false;
            } else {
                vm.endDateTimeError = true;
            }
        };

        vm.showOptionsChanged = function () {
            if (!$scope.$$phase) {
                $scope.$apply();
            }
            vm.redrawChart(null, vm.showGridLines, !vm.showContextZoom, vm.useFixedYAxis);
        };

        vm.showHelp = function ($event) {
            NotifyService.showDialog('Sensor Graph Help', 'This popup should probably show some helpful hints', $event);
        };

        vm.getMillisecondsDifference = function (plusMinus, time, count, type) {
            var multiplySign = plusMinus ? -1 : 1;
            switch (type) {
                case 's':
                    return time - (1000 * count * multiplySign);
                case 'm':
                    return time - (1000 * 60 * count * multiplySign);
                case 'h':
                    return time - (1000 * 60 * 60 * count * multiplySign);
                case 'd':
                    return time - (1000 * 60 * 60 * 24 * count * multiplySign);
                default:
                    return time - (count * multiplySign);
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

        vm.clearData = function () {
            vm.sensorNames.forEach(function (item) {
                var sensorName = item.sensor.katcp_name.substr(item.sensor.katcp_name.indexOf('.') + 1);
                sensorName = sensorName.replace(/\./g, '_');
                SensorsService.unsubscribe(item.sensor.component + '.' + sensorName, SensorsService.guid);
                item.liveData = false;
            });
            vm.sensorNames.splice(0, vm.sensorNames.length);
            vm.clearChart();
        };

        vm.validateSearchInputLength = function (searchStr) {
            if (searchStr.length > 2) {
                vm.sensorSearchFieldLengthError = false;
                vm.sensorSearchFieldShowTooltip = false;

            } else {
                vm.sensorSearchFieldLengthError = true;
                vm.sensorSearchFieldShowTooltip = true;
            }
        };

        vm.findSensorNames = function (searchStr, $event) {
            //13 == enter
            if ($event.keyCode !== 13) {
                return;
            }
            if (searchStr.length > 2) {
                vm.sensorSearchNames.splice(0, vm.sensorSearchNames.length);
                vm.waitingForSearchResult = true;
                DataService.findSensorName(searchStr, vm.sensorType)
                    .then(function (result) {
                        if (result.data.error) {
                            NotifyService.showPreDialog('Error Finding Sensor Info', result.data.error);
                            vm.waitingForSearchResult = false;
                        } else if (result.data.data) {
                            result.data.data.forEach(function (sensor) {
                                sensor.type = vm.sensorType;
                                vm.sensorSearchNames.push(sensor);
                            });
                            vm.waitingForSearchResult = false;
                        }
                    }, function (result) {
                        NotifyService.showSimpleDialog('Error Finding Sensors', 'There was an error finding sensors, is the server running?');
                        $log.error(result);
                        vm.waitingForSearchResult = false;
                    });
            }
        };

        vm.searchSensorClicked = function (sensor) {
            var startDate = vm.sensorStartDatetime.getTime() - (vm.sensorStartDatetime.getTimezoneOffset() * 60 * 1000);
            var endDate = vm.sensorEndDatetime.getTime() - (vm.sensorEndDatetime.getTimezoneOffset() * 60 * 1000);
            if (vm.showRelativeTime) {
                endDate = (vm.getMillisecondsDifference(
                    vm.plusMinus,
                    startDate,
                    vm.unitLength,
                    vm.unitType));
            }

            if (endDate < startDate) {
                startDate = endDate;
                endDate = vm.sensorStartDatetime.getTime() + (vm.sensorStartDatetime.getTimezoneOffset() * 60 * 1000);
            }

            if (sensor.type === 'discrete') {
                //get the sensor info for the y-axis values
                DataService.sensorInfo(sensor.name)
                    .then(function (result) {
                        //vm.redrawChart(null, vm.showGridLines, result.params);
                        vm.clearData();
                        vm.findSensorData(result, startDate, endDate, result.data.params);
                    }, function (error) {
                        $log.error(error);
                        NotifyService.showSimpleDialog('Error Finding Sensor Info', 'There was an error plotting the discrete sensor data, is the server running?');
                    });
            } else {
                DataService.sensorInfo(sensor.name)
                    .then(function (result) {
                        vm.findSensorData(result.data, startDate, endDate);
                        if (vm.liveData) {
                            vm.connectLiveFeed(result.data);
                        }
                    }, function (error) {
                        $log.error(error);
                        NotifyService.showSimpleDialog('Error Finding Sensor Info', 'There was an error plotting the discrete sensor data, is the server running?');
                    });
            }
        };

        vm.findSensorData = function (sensor, startDate, endDate, yAxisValues) {

            vm.waitingForSearchResult = true;
            vm.showTips = false;
            var humanizedDuration = moment.duration(endDate).subtract(startDate).humanize();
            NotifyService.showSimpleToast('Retrieving sensor data for ' + humanizedDuration + ', please wait.');
            if (vm.liveData && !angular.isDefined(_.findWhere(vm.sensorNames, {name: sensor.sensor}))) {
                vm.sensorNames.push({name: sensor.sensor, liveData: vm.liveData, sensor: sensor});
            }
            var interval = null;
            if (vm.sensorType === 'numeric') {
                interval = vm.relativeTimeToSeconds(vm.intervalNum, vm.intervalType);
            }

            DataService.findSensor(sensor.sensor, startDate, endDate, 5000, 'ms', 'json', interval)
                .then(function (result) {
                    vm.waitingForSearchResult = false;
                    var newData = [];
                    //pack the result in the way our chart needs it
                    //because the json we receive is not good enough for d3
                    for (var attr in result.data) {
                        for (var i = 0; i < result.data[attr].length; i++) {
                            newData.push({
                                Sensor: attr,
                                Timestamp: result.data[attr][i][0],
                                Value: result.data[attr][i][1],
                                Details: sensor
                            });
                        }
                    }

                    if (newData.length !== 0) {
                        NotifyService.showSimpleToast(newData.length + ' sensor data points found for ' + sensor.sensor + '.');
                        if (!angular.isDefined(_.findWhere(vm.sensorNames, {name: sensor.sensor}))) {
                            vm.sensorNames.push({name: sensor.sensor, liveData: vm.liveData, sensor: sensor});
                        }
                        vm.redrawChart(newData, vm.showGridLines, !vm.showContextZoom, vm.useFixedYAxis, yAxisValues);
                    } else {
                        NotifyService.showSimpleToast('No sensor data found for ' + sensor.sensor + '.');
                    }

                }, function (error) {
                    vm.waitingForSearchResult = false;
                    $log.error(error);
                    NotifyService.showSimpleDialog('Error Finding Sensor Data', 'There was an error finding sensor data, is the server running?');
                });
        };

        vm.chipRemovePressed = function (chip) {
            vm.removeSensorLine(chip.name);
            var sensorName = chip.sensor.katcp_name.substr(chip.sensor.katcp_name.indexOf('.') + 1);
            sensorName = sensorName.replace(/\./g, '_');
            SensorsService.unsubscribe(chip.sensor.component + '.' + sensorName, SensorsService.guid);
        };

        vm.setLineStrokeWidth = function (chipName) {
            var elements = document.getElementsByClassName(chipName);
            for (var i = 0; i < elements.length; i++) {
                if (elements[i].classList[0] === 'line') {
                    angular.element(elements[i]).css('stroke-width', '4px');
                } else if (elements[i].classList[0] === 'dot') {
                    for (var k = 0; k < elements[i].childNodes.length; k++) {
                        elements[i].childNodes[k].setAttribute('r', '6');
                    }
                }
            }
        };

        vm.removeLineStrokeWidth = function (chipName) {
            var elements = document.getElementsByClassName(chipName);
            for (var i = 0; i < elements.length; i++) {
                if (elements[i].classList[0] === 'line') {
                    angular.element(elements[i]).css('stroke-width', '1.5px');
                } else if (elements[i].classList[0] === 'dot') {
                    for (var k = 0; k < elements[i].childNodes.length; k++) {
                        elements[i].childNodes[k].setAttribute('r', '3');
                    }
                }
            }
        };

        vm.sensorTypeChanged = function () {
            if (!vm.sensorSearchFieldLengthError) {
                //todo fix this method call to not look so hacky
                vm.findSensorNames(vm.sensorSearchStr, {keyCode: 13}); //simulate keypress
            }
        };

        vm.connectLiveFeed = function (sensor) {
            var sensorName = sensor.katcp_name.substr(sensor.katcp_name.indexOf('.') + 1);
            sensorName = sensorName.replace(/\./g, '_');
            SensorsService.subscribe(sensor.component + '.' + sensorName, SensorsService.guid);
            SensorsService.setSensorStrategy(
                sensor.component,
                sensorName,
                $rootScope.sensorListStrategyType,
                $rootScope.sensorListStrategyInterval,
                $rootScope.sensorListStrategyInterval);
        };

        var unbindUpdate = $rootScope.$on('sensorsServerUpdateMessage', function (event, sensor) {
            if (sensor.value) {
                var realSensorName = sensor.name.split(':')[1].replace(/\./g, '_');
                if (angular.isDefined(_.findWhere(vm.sensorNames, {name: realSensorName}))) {
                    vm.redrawChart([{
                        Sensor: realSensorName,
                        ValueTimestamp: sensor.value.timestamp,
                        Timestamp: sensor.value.received_timestamp,
                        Value: sensor.value.value
                    }], vm.showGridLines, !vm.showContextZoom, vm.useFixedYAxis, null, 1000);
                } else {
                    $log.warn('Dangling sensor update after unsubscribe: ' + sensor.name);
                }
            }
        });

        vm.liveDataChanged = function () {
            vm.sensorNames.forEach(function (item) {
                if (!item.liveData) {
                    vm.connectLiveFeed(item.sensor);
                    item.liveData = true;
                } else {
                    var sensorName = item.sensor.katcp_name.substr(item.sensor.katcp_name.indexOf('.') + 1);
                    sensorName = sensorName.replace(/\./g, '_');
                    SensorsService.unsubscribe(item.sensor.component + '.' + sensorName, SensorsService.guid);
                    item.liveData = false;
                }
            });
        };

        $scope.$on('$destroy', function () {
            unbindUpdate();
            vm.liveData = false;
            vm.liveDataChanged();
            vm.disconnectIssued = true;
            SensorsService.disconnectListener();
        });
    }
})();
