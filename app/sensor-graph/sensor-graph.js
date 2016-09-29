(function () {

    angular.module('katGui')
        .controller('SensorGraphCtrl', SensorGraphCtrl);

    function SensorGraphCtrl($scope, $rootScope, $localStorage, $timeout, DataService, $q,
                             SensorsService, $interval, $log, NotifyService, $stateParams, $state) {

        var vm = this;
        var SAMPLES_QUERY_LIMIT = 1000000;
        var DATETIME_FORMAT = 'HH:mm:ss DD-MM-YYYY';
        vm.showGridLines = false;
        vm.dateTimeError = false;
        vm.sensorNames = [];
        vm.sensorStartDatetime = new Date(new Date().getTime() - (60000 * 60)); //one hour earlier
        vm.sensorStartDateReadable = moment.utc(vm.sensorStartDatetime.getTime()).format(DATETIME_FORMAT);
        vm.sensorEndDatetime = new Date(new Date().getTime());
        vm.sensorEndDateReadable = moment.utc(vm.sensorEndDatetime.getTime()).format(DATETIME_FORMAT);
        vm.sensorSearchNames = null;
        vm.sensorSearchStr = "";
        vm.waitingForSearchResult = false;
        vm.showTips = false;
        vm.showContextZoom = true;
        vm.showRelativeTime = false;
        vm.liveData = false;
        vm.useFixedYAxis = false;
        vm.useFixedXAxis = false;
        vm.yAxisMinValue = 0;
        vm.yAxisMaxValue = 100;
        vm.connectInterval = null;
        vm.sensorServiceConnected = SensorsService.connected;
        if (!$localStorage['sensorGraphAutoCompleteList']) {
            $localStorage['sensorGraphAutoCompleteList'] = [];
        }

        //TODO add an option to append to current data instead of deleting existing

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
                //remove leading and trailing | characters
                vm.connectLiveFeed(sensorNames.join('|').replace(/(^\|)|(\|$)/g, ''));
            }
        };

        vm.onTimeSet = function () {
            vm.sensorStartDatetime = moment.utc(vm.sensorStartDatetime.getTime() - vm.sensorStartDatetime.getTimezoneOffset() * 60000).toDate();
            vm.sensorStartDateReadable = moment.utc(vm.sensorStartDatetime.getTime()).format(DATETIME_FORMAT);
            vm.dateTimeError = false;
        };

        vm.onEndTimeSet = function () {
            vm.sensorEndDatetime = moment.utc(vm.sensorEndDatetime.getTime() - vm.sensorEndDatetime.getTimezoneOffset() * 60000).toDate();
            vm.sensorEndDateReadable = moment.utc(vm.sensorEndDatetime.getTime()).format(DATETIME_FORMAT);
            vm.endDateTimeError = false;
        };

        vm.startTimeChange = function () {
            var parsedDate = moment.utc(vm.sensorStartDateReadable, DATETIME_FORMAT).toDate();
            if (parsedDate) {
                vm.sensorStartDatetime = new Date(parsedDate);
                vm.dateTimeError = false;
            } else {
                vm.dateTimeError = true;
            }
        };

        vm.endTimeChange = function () {
            var parsedDate = moment.utc(vm.sensorEndDateReadable, DATETIME_FORMAT).toDate();
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
            vm.loadOptions({
                showGridLines: vm.showGridLines,
                hideContextZoom: !vm.showContextZoom,
                useFixedYAxis: vm.useFixedYAxis,
                useFixedXAxis: vm.useFixedXAxis,
                xAxisValues: [vm.sensorStartDatetime, vm.sensorEndDatetime],
                discreteSensors: vm.searchDiscrete
            });
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
            vm.updateGraphUrl();
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
            var deferred = $q.defer();
            if (event) {
                event.stopPropagation();
            }
            if (searchStr && searchStr.length > 2 && !vm.waitingForSearchResult) {
                vm.sensorSearchNames = [];
                vm.waitingForSearchResult = true;
                DataService.sensorsInfo(searchStr.trim().replace(' ', '.'), vm.searchDiscrete? 'discrete' : 'numeric', 1000)
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
                                    type: vm.searchDiscrete? 'discrete' : 'numeric'
                                });
                            });
                            if ($localStorage['sensorGraphAutoCompleteList'].indexOf(searchStr) === -1) {
                                $localStorage['sensorGraphAutoCompleteList'].push(searchStr);
                            }
                        }
                        deferred.resolve(vm.sensorSearchNames);
                    }, function (error) {
                        vm.waitingForSearchResult = false;
                        $log.error(error);
                        NotifyService.showPreDialog('Error Finding Sensors', error);
                        deferred.reject([]);
                    });
            }
            return deferred.promise;
        };

        vm.findSensorData = function (sensor, suppressToast) {
            var startDate = vm.sensorStartDatetime.getTime();
            var endDate = vm.sensorEndDatetime.getTime();
            if (vm.showRelativeTime) {
                endDate = (vm.getMillisecondsDifference(
                    vm.plusMinus,
                    startDate,
                    vm.intervalNum,
                    vm.intervalType));
            }

            if (endDate < startDate) {
                startDate = endDate;
                endDate = vm.sensorStartDatetime.getTime();
            }

            if (vm.useFixedXAxis) {
                vm.showOptionsChanged();
            }

            var indexOfSensor = vm.sensorNames.indexOf(sensor);
            if (indexOfSensor > -1) {
                vm.sensorNames.splice(indexOfSensor, 1);
            }
            vm.removeSensorLine(sensor.name);
            vm.waitingForSearchResult = true;
            vm.showTips = false;
            var interval = null;
            if (vm.searchDiscrete !== 'numeric') {
                interval = vm.relativeTimeToSeconds(vm.intervalNum, vm.intervalType);
            }

            var requestParams;
            if (sensor.type === 'discrete' || vm.intervalType === 'n') { // discrete sensors and user selected no interval
                requestParams = [SensorsService.guid, sensor.name, startDate, endDate, SAMPLES_QUERY_LIMIT];
            } else {
                requestParams = [SensorsService.guid, sensor.name, startDate, endDate, SAMPLES_QUERY_LIMIT, interval];
            }

            DataService.sensorData.apply(this, requestParams)
                .then(function (result) {
                    if (result.data instanceof Array) {
                        vm.sensorDataReceived(null, {value: result.data});
                    }
                    if (!angular.isDefined(_.findWhere(vm.sensorNames, {name: sensor.name}))) {
                        vm.sensorNames.push(sensor);
                    }
                    if (vm.liveData) {
                        vm.connectLiveFeed(sensor.name);
                    }
                    vm.updateGraphUrl();
                }, function (error) {
                    vm.waitingForSearchResult = false;
                    $log.info(error);
                });
        };

        vm.updateGraphUrl = function () {
            var sensorNames = vm.sensorNames.map(function (sensor) {
                return sensor.name;
            }).join(',');
            if (sensorNames) {
                $state.go('sensor-graph', {
                        startTime: vm.sensorStartDateReadable,
                        endTime: vm.sensorEndDateReadable,
                        sensors: sensorNames,
                        interval: vm.intervalNum + ',' + vm.intervalType,
                        discrete: vm.searchDiscrete? 'discrete' : null},
                        { notify: false, reload: false });
            } else {
                $state.go('sensor-graph', {
                        startTime: null,
                        endTime: null,
                        sensors: null,
                        interval: null,
                        discrete: null},
                        { notify: false, reload: false });
            }
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
                    angular.element(elements[i]).css('stroke-width', '1.0px');
                } else if (elements[i].classList[0] === 'dot') {
                    for (var k = 0; k < elements[i].childNodes.length; k++) {
                        elements[i].childNodes[k].setAttribute('r', '3');
                    }
                }
            }
        };

        vm.sensorTypeChanged = function () {
            vm.clearData();
            vm.sensorSearchNames = [];
            vm.findSensorNames(vm.searchText); //simulate keypress
            vm.loadOptions({
                showGridLines: vm.showGridLines,
                hideContextZoom: !vm.showContextZoom,
                useFixedYAxis: vm.useFixedYAxis,
                useFixedXAxis: vm.useFixedXAxis,
                xAxisValues: [vm.sensorStartDatetime, vm.sensorEndDatetime],
                discreteSensors: vm.searchDiscrete
            });
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

            var hasMinMax = vm.intervalType !== 'n' && !vm.searchDiscrete;

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
                        value_ts: sensor.value[attr][1],
                        sample_ts: sensor.value[attr][0],
                        minValue: sensor.value[attr][6],
                        maxValue: sensor.value[attr][7]
                    });
                    newSensorNames[sensorName] = {};
                }

                if (newData.length > 0) {
                    vm.redrawChart(newData, hasMinMax);
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
                    }], hasMinMax);
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
                return (item.name ? item.name.toLowerCase().indexOf(query.toLowerCase()) > -1 : item.indexOf(query) > -1);
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
            vm.updateGraphUrl();
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

        $timeout(function () {
            if (moment.utc($stateParams.startTime, 'HH:mm:ss DD-MM-YYYY', true).isValid() &&
                moment.utc($stateParams.endTime, 'HH:mm:ss DD-MM-YYYY', true).isValid() &&
                $stateParams.sensors) {
                vm.sensorStartDatetime = moment.utc($stateParams.startTime, 'HH:mm:ss DD-MM-YYYY', true).toDate();
                vm.sensorEndDatetime = moment.utc($stateParams.endTime, 'HH:mm:ss DD-MM-YYYY', true).toDate();
                vm.sensorStartDateReadable = moment.utc(vm.sensorStartDatetime.getTime()).format(DATETIME_FORMAT);
                vm.sensorEndDateReadable = moment.utc(vm.sensorEndDatetime.getTime()).format(DATETIME_FORMAT);
                var startDate = vm.sensorStartDatetime.getTime();
                var endDate = vm.sensorEndDatetime.getTime();
                var intervalParams = $stateParams.interval.split(',');
                var discreteParam = $stateParams.discrete;
                if (discreteParam === 'discrete') {
                    vm.searchDiscrete = true;
                    vm.showOptionsChanged();
                }
                if (!intervalParams) {
                    intervalParams = [1, 'm'];
                }
                var intervalTime = parseInt(intervalParams[0]);
                if (intervalParams.length > 1 &&
                    intervalTime > 0 && intervalTime < 10000 &&
                    ['s', 'm', 'h', 'd', 'n'].indexOf(intervalParams[1]) > -1) {
                    vm.intervalNum = intervalTime.toString();
                    vm.intervalType = intervalParams[1];
                } else {
                    vm.intervalNum = '10';
                    vm.intervalType = 'm';
                }
                var sensorNames = $stateParams.sensors.split(',');
                vm.findSensorNames(sensorNames.join('|')).then(function (sensors) {
                    var sensorTypes = [];
                    sensors.forEach(function (sensor) {
                        if (sensorTypes.indexOf(sensor.type) === -1) {
                            sensorTypes.push(sensor.type);
                        }
                    });
                    if (sensorTypes.length > 1) {
                        NotifyService.showSimpleDialog('Cannot mix sensor types',
                            'Cannot mix sensor types: ' + sensorTypes);
                        return;
                    }
                    sensors.forEach(function (sensor) {
                        var requestParams = [];
                        if (vm.searchDiscrete || vm.intervalType === 'n') {
                            requestParams = [SensorsService.guid, sensor.name, startDate, endDate, SAMPLES_QUERY_LIMIT];
                        } else {
                            requestParams = [SensorsService.guid, sensor.name, startDate, endDate, SAMPLES_QUERY_LIMIT, vm.relativeTimeToSeconds(vm.intervalNum, vm.intervalType)];
                        }

                        DataService.sensorData.apply(this, requestParams)
                            .then(function (result) {
                                vm.sensorNames.push(sensor);
                            }, function (error) {
                                vm.waitingForSearchResult = false;
                                $log.info(error);
                            });
                    });
                });

            } else if ($stateParams.startTime && $stateParams.endTime) {
                NotifyService.showSimpleDialog('Invalid Datetime URL Parameters',
                    'Invalid datetime strings: ' + $stateParams.startTime + ' or ' + $stateParams.endTime + '. Format should be HH:mm:ss DD-MM-YYYY.');
            }
        }, 1000);

        vm.unbindKatstoreErrorMessage = $rootScope.$on('sensorServiceMessageError', function (event, message) {
            vm.waitingForSearchResult = false;
            NotifyService.showPreDialog(message.msg_data.err_code + ': Error retrieving katstore data', message.msg_data.err_msg);
        });

        $scope.$on('$destroy', function () {
            unbindUpdate();
            SensorsService.disconnectListener();
            if (vm.unbindLoginSuccess) {
                vm.unbindLoginSuccess();
            }
            vm.unbindKatstoreErrorMessage();
        });
    }
})();
