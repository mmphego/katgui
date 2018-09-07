(function () {

    angular.module('katGui')
        .controller('SensorGraphCtrl', SensorGraphCtrl);

    function SensorGraphCtrl($scope, $rootScope, $localStorage, $timeout, DataService, $q, KatGuiUtil,
                             MonitorService, UserLogService, $interval, $log, NotifyService, $stateParams, $state, MOMENT_DATETIME_FORMAT) {

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
        vm.sensorSearchStr = "";
        vm.selectedSensor = "";
        vm.waitingForSearchResult = false;
        vm.showTips = false;
        vm.showContextZoom = true;
        vm.showRelativeTime = false;
        vm.liveData = false;
        vm.useFixedYAxis = false;
        vm.useFixedXAxis = false;
        vm.yAxisMinValue = 0;
        vm.yAxisMaxValue = 100;
        vm.clientSubject = 'katgui.sensor_graph.' + KatGuiUtil.generateUUID();

        vm.sensorServiceConnected = MonitorService.connected;
        if (!$localStorage['sensorGraphAutoCompleteList']) {
            $localStorage['sensorGraphAutoCompleteList'] = [];
        }

        vm.plotUsingValueTimestamp = $localStorage['plotUsingValueTimestamp']? true: false;
        vm.includeValueTimestamp = $localStorage['includeValueTimestamp']? true: false;
        vm.useUnixTimestamps = $localStorage['useUnixTimestamps']? true: false;
        vm.searchWidth = $localStorage['sensorGraphSearchWidth']? $localStorage['sensorGraphSearchWidth'] : 366;

        vm.selectedSensor = '';
        vm.getSelectedSensor = function(sensor) {
            vm.selectedSensor = sensor;
        }

        vm.deriveCompoundTag = function(sensor) {
            try {
              compoundTag = sensor.attributes.katcp_name.replace(/\./g, '_:_')
            } catch (error) {
                compoundTag = '';
                $log.error('Could not extract compound tag string ' + error);
            }
            return compoundTag
        }

        vm.openUserLog = function() {
          UserLogService.listTags();
          var content = '';
          var endTime = '';
          var allocations = [];
          var assignedResources = [];
          var compoundTags = []
          var startTime = $rootScope.utcDateTime;
          if (vm.selectedSensor) {
              content = "Sensor(s): "
              vm.sensorNames.forEach(function (sensor) {
                  content += sensor.name + ";"
                  compoundTag = vm.deriveCompoundTag(sensor)
                  if (compoundTag) {
                      compoundTags.push(compoundTag)
                  }
                  var tag = _.findWhere(
                      UserLogService.tags,
                      {name: sensor.component})
                  if (tag) {
                      assignedResources.push(tag);
                  }
              });
              startTime = $stateParams.startTime;
              endTime = $stateParams.endTime;

          }
          var newUserLog = {
              start_time: start_time,
              end_time: end_time,
              tags: assignedResources,
              compound_tags: compoundTags,
              user_id: $rootScope.currentUser.id,
              content: content,
              attachments: []
          };
          $rootScope.editUserLog(newUserLog, event);
        };

        vm.menuItems = [
          {
            text:"Add user log",
            callback: vm.openUserLog
          }
        ];

        vm.includeValueTimestampChanged = function () {
            $localStorage['includeValueTimestamp'] = vm.includeValueTimestamp;
        };

        vm.useUnixTimestampsChanged = function () {
            $localStorage['useUnixTimestamps'] = vm.useUnixTimestamps;
        };

        vm.plotUsingValueTimestampChanged = function () {
            $localStorage['plotUsingValueTimestamp'] = vm.plotUsingValueTimestamp;
            vm.showOptionsChanged();
            vm.reloadAllData();
        };

        vm.initSensors = function () {
            MonitorService.subscribe(
                [vm.clientSubject + '.katstore.data', vm.clientSubject + '.katstore.error']);
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
            vm.sensorNames.forEach(function (sensor) {
                // stagger the katstore-webserver calls
                $timeout(function () {
                    vm.findSensorData(sensor);
                }, 500);
            });
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
            vm.selectedSensor = sensor
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
                // requestParams = [vm.clientSubject, sensor.name, startDate, endDate, SAMPLES_QUERY_LIMIT];
                requestParams = [null, sensor.name, startDate, endDate, SAMPLES_QUERY_LIMIT];
            } else {
                // requestParams = [vm.clientSubject, sensor.name, startDate, endDate, SAMPLES_QUERY_LIMIT, interval];
                requestParams = [null, sensor.name, startDate, endDate, SAMPLES_QUERY_LIMIT, interval];
            }

            DataService.sensorData.apply(this, requestParams)
                .then(function (result) {
                    if (result.data instanceof Array) {
                        vm.sensorDataReceived(null, result.data, 'katstore.data');
                    }
                    if (!angular.isDefined(_.findWhere(vm.sensorNames, {name: sensor.name}))) {
                        vm.sensorNames.push(sensor);
                    }
                    if (vm.liveData) {
                        MonitorService.subscribeSensor(sensor);
                    }
                    vm.updateGraphUrl();
                }, function (error) {
                    vm.waitingForSearchResult = false;
                    vm.sensorDataReceived(null, error, 'katstore.error');
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
            var hasMinMax = vm.intervalType !== 'n' && !vm.searchDiscrete;
            if (subject.endsWith('katstore.data')) {
                vm.waitingForSearchResult = false;
                if (message.inform_data) {
                    // inform message from katstore_ws about samples to be published
                    return;
                }
                if (!(message instanceof Array)) {
                    message = [message];
                }
                var newData = message.map(function(sample) {
                    return {
                        status: sample[5],
                        sensor: sample[4],
                        value: sample[3],
                        value_ts: sample[1],
                        sample_ts: sample[0],
                        minValue: sample[6],
                        maxValue: sample[7]
                    };
                });
                if (newData.length > 0) {
                    vm.redrawChart(newData, hasMinMax);
                }
            } else if (subject.startsWith('sensor.')) {
                if (angular.isDefined(_.findWhere(vm.sensorNames, {name: message.name}))) {
                    vm.redrawChart([{
                        sensor: message.name,
                        value_ts: message.value_ts * 1000,
                        sample_ts: message.time * 1000,
                        value: message.value
                    }], hasMinMax);
                }
            } else if (subject.endsWith('katstore.error')) {
                vm.waitingForSearchResult = false;
                NotifyService.showPreDialog(message.err_code + ': Error retrieving katstore data', message.err_msg);
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

        vm.increaseSearchWidth = function () {
            vm.searchWidth += 150;
            if (vm.searchWidth > 1200) {
                vm.searchWidth = 1200;
            }
            $localStorage['sensorGraphSearchWidth'] = vm.searchWidth;
        };

        vm.decreaseSearchWidth = function () {
            vm.searchWidth -= 150;
            if (vm.searchWidth < 366) {
                vm.searchWidth = 366;
            }
            $localStorage['sensorGraphSearchWidth'] = vm.searchWidth;
        };

        vm.resetSearchWidth = function (newSize) {
            vm.searchWidth = newSize;
            $localStorage['sensorGraphSearchWidth'] = vm.searchWidth;
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
                var sensorNames = $stateParams.sensors.split(',').map(function (sensorName) {
                    return '^(' + sensorName + ')$';
                });

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
                    vm.waitingForSearchResult = true;
                    sensors.forEach(function (sensor) {
                        var requestParams = [];
                        if (vm.searchDiscrete || vm.intervalType === 'n') {
                            // requestParams = [vm.clientSubject, sensor.name, startDate, endDate, SAMPLES_QUERY_LIMIT];
                            requestParams = [null, sensor.name, startDate, endDate, SAMPLES_QUERY_LIMIT];
                        } else {
                            // requestParams = [vm.clientSubject, sensor.name, startDate, endDate, SAMPLES_QUERY_LIMIT, vm.relativeTimeToSeconds(vm.intervalNum, vm.intervalType)];
                            requestParams = [null, sensor.name, startDate, endDate, SAMPLES_QUERY_LIMIT, vm.relativeTimeToSeconds(vm.intervalNum, vm.intervalType)];
                        }
                        vm.sensorNames.push(sensor);

                        DataService.sensorData.apply(this, requestParams)
                            .then(function (result) {
                                if (result.data instanceof Array) {
                                    vm.sensorDataReceived(null, result.data, 'katstore.data');
                                }
                                if (!angular.isDefined(_.findWhere(vm.sensorNames, {name: sensor.name}))) {
                                    vm.sensorNames.push(sensor);
                                }
                                if (vm.liveData) {
                                    MonitorService.subscribeSensor(sensor);
                                }
                                vm.updateGraphUrl();
                            }, function (error) {
                                vm.waitingForSearchResult = false;
                                vm.sensorDataReceived(null, error, 'katstore.error');
                                $log.info(error);
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
            MonitorService.unsubscribe(vm.clientSubject + '.kastore.data');
            MonitorService.unsubscribe(vm.clientSubject + '.kastore.error');
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
