(function () {

    angular.module('katGui')
        .controller('SensorGraphCtrl', SensorGraphCtrl);

    function SensorGraphCtrl($scope, $rootScope, KatGuiUtil, DataService, $filter, SensorsService, $interval, $log) {

        var vm = this;
        vm.showGridLines = false;
        vm.dateTimeError = false;
        vm.sensorNames = [];
        vm.sensorStartDatetime = new Date();
        vm.sensorStartDatetime = new Date(vm.sensorStartDatetime.getTime() - 60000 * 60); //one hour earlier
        vm.sensorStartDateReadable = $filter('date')(vm.sensorStartDatetime, 'yyyy-MM-dd HH:mm:ss');
        vm.sensorEndDatetime = new Date();
        vm.sensorEndDateReadable = $filter('date')(vm.sensorEndDatetime, 'yyyy-MM-dd HH:mm:ss');
        vm.sensorSearchNames = [];
        vm.sensorSearchStr = "";
        vm.waitingForSearchResult = false;
        vm.showTips = false;
        vm.showDots = false;
        vm.showContextZoom = true;
        vm.showRelativeTime = false;
        vm.liveData = false;
        vm.useFixedYAxis = false;
        vm.yAxisMinValue = 0;
        vm.yAxisMaxValue = 100;
        vm.guid = KatGuiUtil.generateUUID();
        vm.disconnectIssued = false;
        vm.connectInterval = null;

        vm.connectListeners = function () {
            SensorsService.connectListener()
                .then(function () {
                    vm.initSensors();
                    if (vm.connectInterval) {
                        $interval.cancel(vm.connectInterval);
                        vm.connectInterval = null;
                        $rootScope.showSimpleToast('Reconnected :)');
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
            if (vm.liveData) {
                vm.sensorNames.forEach(function (sensor) {
                    vm.connectLiveFeed(sensor.name);
                });
            }
        };

        vm.onTimeSet = function () {
            vm.sensorStartDateReadable = $filter('date')(vm.sensorStartDatetime, 'yyyy-MM-dd HH:mm:ss');
            vm.dateTimeError = false;
        };

        vm.onEndTimeSet = function () {
            vm.sensorEndDateReadable = $filter('date')(vm.sensorEndDatetime, 'yyyy-MM-dd HH:mm:ss');
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
            vm.redrawChart(null, vm.showGridLines, vm.showDots, !vm.showContextZoom, vm.useFixedYAxis);
        };

        vm.showHelp = function ($event) {
            $rootScope.showDialog('Sensor Graph Help', 'This popup should probably show some helpful hints', $event);
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

        vm.clearData = function () {
            vm.sensorNames.forEach(function (item) {
                var sensorName = item.sensor.katcp_sensor_name.substr(item.sensor.katcp_sensor_name.indexOf('.') + 1);
                sensorName = sensorName.replace(/\./g, '_');
                SensorsService.unsubscribe(item.sensor.component + '.' + sensorName, vm.guid);
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
            if ($event.keyCode !== 13) {
                return;
            }
            if (searchStr.length > 2) {
                vm.sensorSearchNames.splice(0, vm.sensorSearchNames.length);
                vm.waitingForSearchResult = true;
                DataService.findSensorName(searchStr, vm.sensorType)
                    .success(function (result) {
                        result.data.forEach(function (sensor) {
                            sensor.type = vm.sensorType;
                            vm.sensorSearchNames.push(sensor);
                        });
                        vm.waitingForSearchResult = false;
                    })
                    .error(function (result) {
                        $rootScope.showSimpleDialog('Error Finding Sensors', 'There was an error finding sensors, is the server running?');
                        $log.error(result);
                        vm.waitingForSearchResult = false;
                    });
            }
        };

        vm.searchSensorClicked = function (sensor) {
            var startDate = vm.sensorStartDatetime.getTime();
            var endDate = vm.sensorEndDatetime.getTime();
            if (vm.showRelativeTime) {
                endDate = (vm.getMillisecondsDifference(
                    vm.plusMinus,
                    vm.sensorStartDatetime.getTime(),
                    vm.unitLength,
                    vm.unitType));
            }

            if (endDate < startDate) {
                startDate = endDate;
                endDate = vm.sensorStartDatetime.getTime();
            }

            if (sensor.type === 'discrete') {
                //get the sensor info for the y-axis values
                DataService.sensorInfo(sensor.name)
                    .success(function (result) {
                        //vm.redrawChart(null, vm.showGridLines, result.params);
                        vm.clearData();
                        vm.findSensorData(result, startDate, endDate, result.params);
                    })
                    .error(function (error) {
                        $log.error(error);
                        $rootScope.showSimpleDialog('Error Finding Sensor Info', 'There was an error plotting the discrete sensor data, is the server running?');
                    });
            } else {
                DataService.sensorInfo(sensor.name)
                    .success(function (result) {
                        vm.findSensorData(result, startDate, endDate);
                        if (vm.liveData) {
                            vm.connectLiveFeed(result);
                        }
                    })
                    .error(function (error) {
                        $log.error(error);
                        $rootScope.showSimpleDialog('Error Finding Sensor Info', 'There was an error plotting the discrete sensor data, is the server running?');
                    });
            }
        };

        vm.findSensorData = function (sensor, startDate, endDate, yAxisValues) {

            vm.waitingForSearchResult = true;
            vm.showTips = false;
            var humanizedDuration = moment.duration(endDate).subtract(startDate).humanize();
            $rootScope.showSimpleToast('Retrieving sensor data for ' + humanizedDuration + ', please wait.');
            if (vm.liveData && !angular.isDefined(_.findWhere(vm.sensorNames, {name: sensor.sensor}))) {
                vm.sensorNames.push({name: sensor.sensor, liveData: vm.liveData, sensor: sensor});
            }
            DataService.findSensor(sensor.sensor, startDate, endDate, 1000, 'ms', 'json', vm.sensorType)
                .success(function (result) {
                    vm.waitingForSearchResult = false;
                    var newData = [];
                    //pack the result in the way our chart needs it
                    //because the json we receive is not good enough for d3
                    for (var attr in result) {
                        for (var i = 0; i < result[attr].length; i++) {
                            newData.push({
                                Sensor: attr,
                                Timestamp: result[attr][i][0],
                                Value: result[attr][i][1],
                                Details: sensor
                            });
                        }
                    }

                    if (newData.length !== 0) {
                        $rootScope.showSimpleToast(newData.length + ' sensor data points found for ' + sensor.sensor + '.');
                        if (!angular.isDefined(_.findWhere(vm.sensorNames, {name: sensor.sensor}))) {
                            vm.sensorNames.push({name: sensor.sensor, liveData: vm.liveData, sensor: sensor});
                        }
                        vm.redrawChart(newData, vm.showGridLines, vm.showDots, !vm.showContextZoom, vm.useFixedYAxis, yAxisValues);
                    } else {
                        $rootScope.showSimpleToast('No sensor data found for ' + sensor.sensor + '.');
                    }

                })
                .error(function (error) {
                    vm.waitingForSearchResult = false;
                    $log.error(error);
                    $rootScope.showSimpleDialog('Error Finding Sensor Data', 'There was an error finding sensor data, is the server running?');
                });
        };

        vm.findSensorDataFromRegex = function (sensorName, $event) {
            if ($event.keyCode !== 13) {
                return;
            }
            var startDate = vm.sensorStartDatetime.getTime();
            var endDate = vm.sensorEndDatetime.getTime();
            if (vm.showRelativeTime) {
                endDate = (vm.getMillisecondsDifference(
                    vm.plusMinus,
                    vm.sensorStartDatetime.getTime(),
                    vm.unitLength,
                    vm.unitType));
            }

            if (endDate < startDate) {
                startDate = endDate;
                endDate = vm.sensorStartDatetime.getTime();
            }
            vm.showTips = false;
            $rootScope.showSimpleToast('Retrieving sensor data, please wait.');
            DataService.findSensorDataFromRegex(sensorName, startDate, endDate, 10000, 'ms', 'json', vm.sensorType)
                .success(function (result) {
                    var newData = [];
                    //pack the result in the way our chart needs it
                    //because the json we receive is not good enough
                    for (var attr in result) {
                        for (var i = 0; i < result[attr].length; i++) {
                            newData.push({
                                Sensor: attr,
                                Timestamp: result[attr][i].sample_ts,
                                Value: result[attr][i].value
                            });
                        }
                        if (!angular.isDefined(_.findWhere(vm.sensorNames, {name: sensorName})) || vm.liveData) {
                            vm.sensorNames.push({name: attr, liveData: vm.liveData, sensor: sensor});
                        }
                    }

                    if (newData.length !== 0) {
                        $rootScope.showSimpleToast(newData.length + ' sensor data points found for ' + sensorName + '.');
                        vm.redrawChart(newData, vm.showGridLines, vm.showDots, !vm.showContextZoom, vm.useFixedYAxis);
                    } else {
                        $rootScope.showSimpleToast('No sensor data found for ' + sensorName + '.');
                    }
                })
                .error(function (error) {
                    $log.error(error);
                    $rootScope.showSimpleDialog('Error Finding Sensor Data', 'There was an error finding sensor data, is the server running?');
                });
        };

        vm.chipRemovePressed = function (chip) {
            vm.removeSensorLine(chip.name);
            var sensorName = chip.sensor.katcp_sensor_name.substr(chip.sensor.katcp_sensor_name.indexOf('.') + 1);
            sensorName = sensorName.replace(/\./g, '_');
            SensorsService.unsubscribe(chip.sensor.component + '.' + sensorName, vm.guid);
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
            SensorsService.connectLiveFeed(sensor, vm.guid);
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
                    }], vm.showGridLines, vm.showDots, !vm.showContextZoom, vm.useFixedYAxis, null, 1000);
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
                    var sensorName = item.sensor.katcp_sensor_name.substr(item.sensor.katcp_sensor_name.indexOf('.') + 1);
                    sensorName = sensorName.replace(/\./g, '_');
                    SensorsService.unsubscribe(item.sensor.component + '.' + sensorName, vm.guid);
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
