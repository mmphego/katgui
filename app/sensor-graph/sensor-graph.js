(function () {

    angular.module('katGui')
        .controller('SensorGraphCtrl', SensorGraphCtrl);

    function SensorGraphCtrl($scope, $rootScope, $localStorage, $timeout, DataService,
                             SensorsService, $interval, $log, NotifyService) {

        var vm = this;
        var DATETIME_FORMAT = 'HH:mm:ss DD-MM-YYYY';
        var DATALIMIT = 5000;
        vm.showGridLines = false;
        vm.dateTimeError = false;
        vm.sensorNames = [];
        vm.sensorStartDatetime = new Date();
        vm.sensorStartDatetime = new Date((vm.sensorStartDatetime.getTime() + (vm.sensorStartDatetime.getTimezoneOffset() * 60 * 1000)) - (60000 * 60)); //one hour earlier
        vm.sensorStartDateReadable = moment(vm.sensorStartDatetime.getTime()).format(DATETIME_FORMAT);
        vm.sensorEndDatetime = new Date(new Date().getTime() + (vm.sensorStartDatetime.getTimezoneOffset() * 60 * 1000));
        vm.sensorEndDateReadable = moment(vm.sensorEndDatetime.getTime()).format(DATETIME_FORMAT);
        vm.sensorSearchNames = null;
        vm.sensorSearchStr = "";
        vm.waitingForSearchResult = false;
        vm.showTips = false;
        vm.showContextZoom = true;
        vm.showRelativeTime = false;
        vm.liveData = false;
        vm.useFixedYAxis = false;
        vm.yAxisMinValue = 0;
        vm.yAxisMaxValue = 100;
        vm.connectInterval = null;
        vm.sensorServiceConnected = SensorsService.connected;
        if (!$localStorage['sensorGraphAutoCompleteList']) {
            $localStorage['sensorGraphAutoCompleteList'] = [];
        }

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

        if ($rootScope.loggedIn) {
            vm.connectListeners();
        } else {
            vm.unbindLoginSuccess = $rootScope.$on('loginSuccess', function () {
                vm.connectListeners();
            });
        }

        vm.initSensors = function () {
            if (vm.liveData) {
                var sensorNames = [];
                vm.sensorNames.forEach(function (sensor) {
                    sensorNames.push(sensor.name);
                });
                vm.connectLiveFeed(sensorNames.join('|'));
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
            var parsedDate = moment(vm.sensorStartDateReadable, DATETIME_FORMAT).toDate();
            if (parsedDate) {
                vm.sensorStartDatetime = new Date(parsedDate);
                vm.dateTimeError = false;
            } else {
                vm.dateTimeError = true;
            }
        };

        vm.endTimeChange = function () {
            var parsedDate = moment(vm.sensorEndDateReadable, DATETIME_FORMAT).toDate();
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
            vm.redrawChart(null, vm.showGridLines, !vm.showContextZoom, vm.useFixedYAxis, null);
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
            if (vm.liveData) {
                vm.removeSensorStrategies();
            }
            vm.sensorNames.splice(0, vm.sensorNames.length);
            vm.clearChart();
        };

        vm.removeSensorStrategies = function () {
            var sensorNamesList = [];
            vm.sensorNames.forEach(function (item) {
                sensorNamesList.push(item.name);
            });
            vm.disconnectLiveFeed(sensorNamesList.join('|'));
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

        vm.findSensorNames = function (searchStr, event) {
            if (event) {
                event.stopPropagation();
            }
            if (searchStr && searchStr.length > 2 && !vm.waitingForSearchResult) {
                vm.sensorSearchNames = [];
                vm.waitingForSearchResult = true;
                DataService.sensorsInfo(searchStr.trim().replace(' ', '.'), vm.sensorType, 1000)
                    .then(function (result) {
                        vm.waitingForSearchResult = false;
                        if (result.data.error) {
                            NotifyService.showPreDialog('Error retrieving sensors', result.data.error);
                        } else if (result.data) {
                            result.data.forEach(function (sensor) {
                                vm.sensorSearchNames.push({
                                    name: sensor[0],
                                    component: sensor[1],
                                    attributes: sensor[2],
                                    type: vm.sensorType
                                });
                            });
                            if ($localStorage['sensorGraphAutoCompleteList'].indexOf(searchStr) === -1) {
                                $localStorage['sensorGraphAutoCompleteList'].push(searchStr);
                            }
                        }
                    }, function (error) {
                        vm.waitingForSearchResult = false;
                        $log.error(error);
                        NotifyService.showPreDialog('Error Finding Sensors', error);
                    });
            }
        };

        vm.findSensorData = function (sensor, suppressToast) {
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
                endDate = vm.sensorStartDatetime.getTime() - (vm.sensorStartDatetime.getTimezoneOffset() * 60 * 1000);
            }

            var indexOfSensor = vm.sensorNames.indexOf(sensor);
            if (indexOfSensor > -1) {
                vm.sensorNames.splice(indexOfSensor, 1);
            }
            vm.removeSensorLine(sensor.name);
            vm.waitingForSearchResult = true;
            vm.showTips = false;
            var interval = null;
            if (vm.sensorType === 'numeric') {
                interval = vm.relativeTimeToSeconds(vm.intervalNum, vm.intervalType);
            }

            var requestParams;
            if (sensor.type === 'discrete') {
                vm.clearData();
                requestParams = [SensorsService.guid, sensor.name, startDate, endDate, DATALIMIT];
            } else {
                requestParams = [SensorsService.guid, sensor.name, startDate, endDate, DATALIMIT, interval];
            }
            DataService.sensorData.apply(this, requestParams)
                .then(function (result) {
                    if (result.data instanceof Array) {
                        vm.sensorDataReceived(null, {value: result.data});
                    }
                    vm.sensorNames.push(sensor);
                    if (vm.liveData) {
                        vm.connectLiveFeed(sensor.name);
                    }
                }, function (error) {
                    vm.waitingForSearchResult = false;
                    $log.info(error);
                });
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
            vm.clearData();
            vm.findSensorNames(vm.searchText); //simulate keypress
        };

        vm.connectLiveFeed = function (sensorRegex) {
            if (sensorRegex.length > 0) {
                SensorsService.setSensorStrategies(
                    sensorRegex,
                    $rootScope.sensorListStrategyType,
                    $rootScope.sensorListStrategyInterval,
                    $rootScope.sensorListStrategyInterval);
            }
        };

        vm.disconnectLiveFeed = function (sensorRegex) {
            SensorsService.removeSensorStrategies(sensorRegex);
        };

        vm.sensorDataReceived = function (event, sensor) {

            if (sensor.value && sensor.value instanceof Array) {
                vm.waitingForSearchResult = false;
                var newData = [];
                var newSensorNames = {};
                for (var attr in sensor.value) {
                    var sensorName = sensor.value[attr][4];

                    newData.push({
                        status: sensor.value[attr][5],
                        sensor: sensorName,
                        value: sensor.value[attr][3],
                        value_ts: sensor.value[attr][2] / 1000,
                        sample_ts: sensor.value[attr][1] / 1000
                    });
                    newSensorNames[sensorName] = {};
                }

                if (newData) {
                    vm.redrawChart(newData, vm.showGridLines, !vm.showContextZoom, vm.useFixedYAxis, null);
                }
            }
            else if (sensor.value) {
                var realSensorName = sensor.name.split(':')[1].replace(/\./g, '_').replace(/-/g, '_');
                if (angular.isDefined(_.findWhere(vm.sensorNames, {name: realSensorName}))) {
                    vm.redrawChart([{
                        sensor: realSensorName,
                        value_ts: sensor.value.timestamp * 1000,
                        sample_ts: sensor.value.received_timestamp * 1000,
                        value: sensor.value.value
                    }], vm.showGridLines, !vm.showContextZoom, vm.useFixedYAxis, null, 1000);
                }
            }
        };

        var unbindUpdate = $rootScope.$on('sensorsServerUpdateMessage', vm.sensorDataReceived);

        vm.liveDataChanged = function () {
            if (vm.liveData) {
                vm.initSensors();
            } else {
                vm.removeSensorStrategies();
            }
        };

        vm.querySearch = function (query) {
            var results = query ? $localStorage['sensorGraphAutoCompleteList'].filter(vm.createFilterFor(query)) : [];
            return results;
        };

        vm.chipsQuerySearch = function (query) {
            var results = query ? vm.sensorSearchNames.filter(vm.createFilterFor(query)) : [];
            return results;
        };

        vm.createFilterFor = function (query) {
            return function filterFn(item) {
                return (item.name ? item.name.indexOf(query) > -1 : item.indexOf(query) > -1);
            };
        };

        vm.removeAutoCompleteItem = function (item, event) {
            var index = $localStorage['sensorGraphAutoCompleteList'].indexOf(item);
            if (index > -1) {
                $localStorage['sensorGraphAutoCompleteList'].splice(index, 1);
            }
            var oldSearchText = vm.searchText;
            vm.searchText = "";
            $timeout(function () {
                vm.searchText = oldSearchText;
            }, 0);
            event.stopPropagation();
        };

        vm.autoCompleteKeyPressed = function (event) {
            var selectedAutocompleteItem = document.getElementsByClassName('selected')[0];
            if (selectedAutocompleteItem && event.shiftKey &&
                (event.keyCode === 8 || event.keyCode === 46)) {
                vm.removeAutoCompleteItem(selectedAutocompleteItem.innerText.trim(), event);
            }
        };

        vm.chipRemoved = function (chip) {
            vm.disconnectLiveFeed(chip.name);
            vm.removeSensorLine(chip.name);
        };

        vm.chipAppended = function (chip) {
            if (chip.name) {
                vm.findSensorData(chip);
            }
            vm.sensorNames = vm.sensorNames.filter(function (item) {
                return item.name && item.name.length > 0;
            });
        };

        vm.downloadCSV = function () {
            //bound in multiLineChart
            vm.downloadAsCSV(vm.useUnixTimestamps);
        };

        $scope.$on('$destroy', function () {
            unbindUpdate();
            SensorsService.disconnectListener();
            if (vm.unbindLoginSuccess) {
                vm.unbindLoginSuccess();
            }
        });
    }
})();
