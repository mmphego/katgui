(function () {

    angular.module('katGui')
        .controller('SensorGraphCtrl', SensorGraphCtrl);

    function SensorGraphCtrl($scope, $rootScope, $localStorage, $timeout, DataService, $q, KatGuiUtil,
                             MonitorService, $interval, $log, NotifyService, $stateParams, $state, MOMENT_DATETIME_FORMAT) {

        var vm = this;
        var SAMPLES_QUERY_LIMIT = 1000000;
        vm.showGridLines = false;
        vm.dateTimeError = false;
        vm.sensorNames = [];
        vm.sensorStartDatetime = new Date(new Date().getTime() - (60000 * 60)); //one hour earlier
        vm.sensorStartDateReadable = moment.utc(vm.sensorStartDatetime.getTime()).format(MOMENT_DATETIME_FORMAT);
        vm.sensorEndDatetime = new Date(new Date().getTime());
        vm.sensorEndDateReadable = moment.utc(vm.sensorEndDatetime.getTime()).format(MOMENT_DATETIME_FORMAT);
        vm.sensorSearchNames = [];
        vm.waitingForSearchResult = false;
        vm.showContextZoom = true;
        vm.showRelativeTime = false;
        vm.liveData = false;
        vm.useFixedYAxis = false;
        vm.useFixedXAxis = false;
        vm.yAxisMinValue = 0;
        vm.yAxisMaxValue = 100;

        vm.sensorServiceConnected = MonitorService.connected;
        if (!$localStorage['sensorGraphAutoCompleteList']) {
            $localStorage['sensorGraphAutoCompleteList'] = [];
        }

        vm.plotUsingValueTimestamp = $localStorage['plotUsingValueTimestamp']? true: false;
        vm.includeValueTimestamp = $localStorage['includeValueTimestamp']? true: false;
        vm.useUnixTimestamps = $localStorage['useUnixTimestamps']? true: false;
        vm.searchStaleSensors = $localStorage['searchStaleSensors']? true: false;

        vm.includeValueTimestampChanged = function () {
            $localStorage['includeValueTimestamp'] = vm.includeValueTimestamp;
        };

        vm.useUnixTimestampsChanged = function () {
            $localStorage['useUnixTimestamps'] = vm.useUnixTimestamps;
        };

        vm.searchStaleSensorsChanged = function () {
            $localStorage['searchStaleSensors'] = vm.searchStaleSensors;
        };

        vm.plotUsingValueTimestampChanged = function () {
            $localStorage['plotUsingValueTimestamp'] = vm.plotUsingValueTimestamp;
            vm.showOptionsChanged();
            vm.reloadAllData();
        };

        vm.initSensors = function () {
            if (vm.liveData) {
                vm.sensorNames.forEach(function (sensor) {
                    MonitorService.subscribeSensor(sensor);
                });
            }
        };

        var unbindLoginSuccess;
        if ($rootScope.loggedIn) {
            vm.initSensors();
        } else {
            unbindLoginSuccess = $rootScope.$on('loginSuccess', function () {
                vm.initSensors();
            });
        }

        vm.onTimeSet = function () {
            vm.sensorStartDatetime = moment.utc(vm.sensorStartDatetime.getTime() - vm.sensorStartDatetime.getTimezoneOffset() * 60000).toDate();
            vm.sensorStartDateReadable = moment.utc(vm.sensorStartDatetime.getTime()).format(MOMENT_DATETIME_FORMAT);
            vm.dateTimeError = false;
        };

        vm.onEndTimeSet = function () {
            vm.sensorEndDatetime = moment.utc(vm.sensorEndDatetime.getTime() - vm.sensorEndDatetime.getTimezoneOffset() * 60000).toDate();
            vm.sensorEndDateReadable = moment.utc(vm.sensorEndDatetime.getTime()).format(MOMENT_DATETIME_FORMAT);
            vm.endDateTimeError = false;
        };

        vm.startTimeChange = function () {
            var parsedDate = moment.utc(vm.sensorStartDateReadable, MOMENT_DATETIME_FORMAT).toDate();
            if (parsedDate) {
                vm.sensorStartDatetime = new Date(parsedDate);
                vm.dateTimeError = false;
            } else {
                vm.dateTimeError = true;
            }
        };

        vm.endTimeChange = function () {
            var parsedDate = moment.utc(vm.sensorEndDateReadable, MOMENT_DATETIME_FORMAT).toDate();
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
                plotUsingValueTimestamp: vm.plotUsingValueTimestamp,
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
                vm.sensorNames.forEach(function (sensor) {
                    MonitorService.unsubscribeSensor(sensor);
                });
            }
            vm.sensorNames.splice(0, vm.sensorNames.length);
            vm.clearChart();
            vm.updateGraphUrl();
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

        vm.reloadAllData = function() {
            for (var i = 0; i < vm.sensorNames.length; i++) {
                // stagger the katstore-webserver calls
                setTimeout(function (sensor) {
                    vm.findSensorData(sensor);
                }, i * 250, vm.sensorNames[i]);
            }
        };

        vm.findSensorNames = function (searchStr, searchStale, event) {
            var deferred = $q.defer();
            if (event) {
                event.stopPropagation();
            }
            if (searchStr && searchStr.length > 2 && !vm.waitingForSearchResult) {
                vm.sensorSearchNames = [];
                vm.waitingForSearchResult = true;
                // params: regex, search numeric, search stale sensors
                DataService.sensorsInfo(searchStr.trim().replace(' ', '.'), !vm.searchDiscrete, searchStale)
                    .then(function (result) {
                        vm.waitingForSearchResult = false;
                        if (!result.data.data) {
                            // NotifyService.showPreDialog('Error retrieving sensors', result.data.error);
                            NotifyService.showPreDialog('Error retrieving sensors', 'No sensor metadata returned.');
                        } else if (result.data.data) {
                            result.data.data.forEach(function (sensor) {
                                vm.sensorSearchNames.push({
                                    name: sensor.name,
                                    component: sensor.component,
                                    attributes: sensor.attributes,
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
            // katstore api takes seconds, we have it as ms here
            startDate = startDate / 1000;
            endDate = endDate / 1000;

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
            if (!vm.searchDiscrete) {
                interval = vm.relativeTimeToSeconds(vm.intervalNum, vm.intervalType);
            }

            var requestParams = {
                name: sensor.name,
                start: startDate,
                end: endDate,
                limit: SAMPLES_QUERY_LIMIT,
                allFields: vm.includeValueTimestamp
            };
            if (vm.intervalType !== 'n') {
                requestParams.interval = interval;
            }

            DataService.sensorData.call(this, requestParams)
                .then(function (result) {
                    if (result.data.data && result.data.data.length > 0) {
                        vm.redrawChart(result.data.data, interval > 0);
                    }
                    if (!angular.isDefined(_.findWhere(vm.sensorNames, {name: sensor.name}))) {
                        vm.sensorNames.push(sensor);
                    }
                    if (vm.liveData) {
                        MonitorService.subscribeSensor(sensor);
                    }
                    vm.updateGraphUrl();
                    vm.waitingForSearchResult = false;
                }, function (error) {
                    vm.waitingForSearchResult = false;
                    $log.error(error);
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
            vm.findSensorNames(vm.searchText, vm.searchStaleSensors);
            vm.loadOptions({
                plotUsingValueTimestamp: vm.plotUsingValueTimestamp,
                showGridLines: vm.showGridLines,
                hideContextZoom: !vm.showContextZoom,
                useFixedYAxis: vm.useFixedYAxis,
                useFixedXAxis: vm.useFixedXAxis,
                xAxisValues: [vm.sensorStartDatetime, vm.sensorEndDatetime],
                discreteSensors: vm.searchDiscrete
            });
        };

        vm.sensorDataReceived = function (event, message, subject) {
            if (subject.startsWith('sensor.')) {
                if (angular.isDefined(_.findWhere(vm.sensorNames, {name: message.name}))) {
                    vm.redrawChart([{
                        sensor: message.name,
                        value_ts: message.value_ts * 1000,
                        sample_ts: message.time * 1000,
                        value: message.value,
                        avg_value: message.value
                    }], vm.intervalType !== 'n' && !vm.searchDiscrete);
                }
            }
        };

        var unbindSensorUpdates = $rootScope.$on('sensorUpdateMessage', vm.sensorDataReceived);

        vm.liveDataChanged = function () {
            if (vm.liveData) {
                vm.initSensors();
            } else {
                vm.sensorNames.forEach(function (sensor) {
                    MonitorService.unsubscribeSensor(sensor);
                });
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
            // vm.disconnectLiveFeed(chip.name);
            MonitorService.unsubscribeSensor(chip);
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
            vm.downloadAsCSV(vm.useUnixTimestamps, vm.includeValueTimestamp);
        };

        $timeout(function () {
            vm.showOptionsChanged();
            if (moment.utc($stateParams.startTime, MOMENT_DATETIME_FORMAT, true).isValid() &&
                moment.utc($stateParams.endTime, MOMENT_DATETIME_FORMAT, true).isValid() &&
                $stateParams.sensors) {
                vm.sensorStartDatetime = moment.utc($stateParams.startTime, MOMENT_DATETIME_FORMAT, true).toDate();
                vm.sensorEndDatetime = moment.utc($stateParams.endTime, MOMENT_DATETIME_FORMAT, true).toDate();
                vm.sensorStartDateReadable = moment.utc(vm.sensorStartDatetime.getTime()).format(MOMENT_DATETIME_FORMAT);
                vm.sensorEndDateReadable = moment.utc(vm.sensorEndDatetime.getTime()).format(MOMENT_DATETIME_FORMAT);
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

                // katstore api takes seconds, we have it as ms here
                startDate = startDate / 1000;
                endDate = endDate / 1000;

                vm.findSensorNames(sensorNames.join('|'), true).then(function (sensors) {
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
                    vm.waitingForSearchResult = true;
                    var interval = null;
                    if (!vm.searchDiscrete) {
                        interval = vm.relativeTimeToSeconds(vm.intervalNum, vm.intervalType);
                    }
                    sensors.forEach(function (sensor) {
                        var requestParams = {
                            name: sensor.name,
                            start: startDate,
                            end: endDate,
                            limit: SAMPLES_QUERY_LIMIT,
                            allFields: vm.includeValueTimestamp
                        };
                        if (vm.intervalType !== 'n') {
                            requestParams.interval = interval;
                        }

                        DataService.sensorData.call(this, requestParams)
                            .then(function (result) {
                                if (result.data.data && result.data.data.length > 0) {
                                    vm.redrawChart(result.data.data, vm.intervalType !== 'n');
                                }
                                if (!angular.isDefined(_.findWhere(vm.sensorNames, {name: sensor.name}))) {
                                    vm.sensorNames.push(sensor);
                                }
                                if (vm.liveData) {
                                    MonitorService.subscribeSensor(sensor);
                                }
                                vm.updateGraphUrl();
                                vm.waitingForSearchResult = false;
                            }, function (error) {
                                vm.waitingForSearchResult = false;
                                $log.error(error);
                            });
                    });
                });

            } else if ($stateParams.startTime && $stateParams.endTime) {
                NotifyService.showSimpleDialog('Invalid Datetime URL Parameters',
                    'Invalid datetime strings: ' + $stateParams.startTime + ' or ' + $stateParams.endTime + '. Format should be ' + MOMENT_DATETIME_FORMAT);
            }
        }, 1000);

        var unbindReconnected = $rootScope.$on('websocketReconnected', vm.initSensors);

        $scope.$on('$destroy', function () {
            if (vm.liveData) {
                vm.sensorNames.forEach(function (sensor) {
                    MonitorService.unsubscribeSensor(sensor);
                });
            }
            if (unbindLoginSuccess) {
                unbindLoginSuccess();
            }
            unbindSensorUpdates();
            unbindReconnected();
        });
    }
})();
