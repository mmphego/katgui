(function () {

    angular.module('katGui')
        .controller('SensorListCtrl', SensorListCtrl);

    function SensorListCtrl($scope, $rootScope, SensorsService, $timeout, KatGuiUtil, $interval) {

        var vm = this;
        vm.resources = SensorsService.resources;
        vm.resourcesNames = [];
        vm.sensorsToDisplay = [];
        vm.resourceSensorsBeingDisplayed = '';
        vm.sensorsPlotNames = [];
        vm.guid = KatGuiUtil.generateUUID();
        vm.disconnectIssued = false;
        vm.connectInterval = null;

        vm.showTips = false;
        vm.showDots = false;
        vm.showContextZoom = false;
        vm.useFixedYAxis = false;
        vm.yAxisMinValue = 0;
        vm.yAxisMaxValue = 100;

        vm.limitTo = 50;
        $scope.loadMore = function () {
            vm.limitTo += 15;
        };

        vm.sensorsOrderByFields = [
            {label: 'Name', value: 'name'},
            {label: 'Timestamp', value: 'timestamp'},
            {label: 'Received Timestamp', value: 'received_timestamp'},
            {label: 'Status', value: 'status'},
            {label: 'Value', value: 'value'}
        ];

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
                    console.error('Could not establish sensor connection. Retrying every 10 seconds.');
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
            if (vm.resourceSensorsBeingDisplayed.length > 0) {
                SensorsService.connectResourceSensorListeners(vm.resourceSensorsBeingDisplayed, vm.guid);
            }
        };

        vm.setSensorsOrderBy = function (column) {
            var newOrderBy = _.findWhere(vm.sensorsOrderByFields, {value: column});
            if ((vm.sensorsOrderBy || {}).value === column) {
                if (newOrderBy.reverse === undefined) {
                    newOrderBy.reverse = true;
                } else if (newOrderBy.reverse) {
                    newOrderBy.reverse = undefined;
                    newOrderBy = null;
                }
            }
            vm.sensorsOrderBy = newOrderBy;
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        };

        vm.sensorLoaded = function ($index) {
            if ($index >= vm.limitTo - 1) {
                $timeout($scope.loadMore, 100);
            }
            return true;
        };

        vm.setSensorsOrderBy('name');

        SensorsService.listResources()
            .then(function () {
                for (var key in vm.resources) {
                    vm.resourcesNames.push({name: key});
                }
            });

        vm.listResourceSensors = function (resourceName) {
            if (vm.resourceSensorsBeingDisplayed === resourceName) {
                return;
            }
            if (vm.resourceSensorsBeingDisplayed.length > 0) {
                vm.limitTo = 50;
                SensorsService.removeResourceListeners(vm.resourceSensorsBeingDisplayed);
                SensorsService.unsubscribe(vm.resourceSensorsBeingDisplayed + '.*', vm.guid);
                vm.sensorsPlotNames.splice(0, vm.sensorsPlotNames.length);
                vm.clearChart();
            }
            if (!SensorsService.resources[resourceName].sensorsList) {
                SensorsService.listResourceSensors(resourceName)
                    .then(function (message) {
                        $rootScope.showSimpleToast(message);
                        vm.limitTo = 30;
                        vm.sensorsToDisplay = vm.resources[resourceName].sensorsList;
                        if (!$scope.$$phase) {
                            $scope.$digest();
                        }
                        SensorsService.connectResourceSensorListeners(resourceName, vm.guid);
                    });
            } else {
                vm.sensorsToDisplay = vm.resources[resourceName].sensorsList;
                SensorsService.subscribe(resourceName + '.*', vm.guid);
                if (!$scope.$$phase) {
                    $scope.$digest();
                }
            }
            vm.resourceSensorsBeingDisplayed = resourceName;
        };

        vm.sensorClass = function (status) {
            return status + '-sensor-list-item';
        };

        vm.plotLiveSensorFeed = function (sensor, remove) {
            if (sensor.sensorValue) {
                var sensorName = sensor.sensorValue.name.split(':')[1];
                if (remove) {
                    var sensorIndex = _.findIndex(vm.sensorsPlotNames, function (item) {
                        return item.name === sensorName;
                    });
                    if (sensorIndex > -1) {
                        vm.sensorsPlotNames.splice(sensorIndex, 1);
                        vm.removeSensorLine(sensorName);
                    }
                } else {
                    vm.sensorsPlotNames.push({name: sensorName, class: sensorName.replace(/\./g, '_')});
                }
            }
        };

        vm.chipRemovePressed = function ($chip) {
            var sensorIndex = _.findIndex(vm.sensorsPlotNames, function (item) {
                return item.name === $chip.name;
            });
            if (sensorIndex > -1) {
                for (var i = 0; i < vm.sensorsToDisplay.length; i++) {
                    if (vm.sensorsToDisplay[i].python_identifier === $chip.name.split('.')[1]) {
                        vm.sensorsToDisplay[i].selectedForChart = false;
                        break;
                    }
                }
                vm.removeSensorLine($chip.name);
            }
        };

        vm.clearChartData = function () {
            vm.sensorsToDisplay.forEach(function (sensor) {
                sensor.selectedForChart = false;
            });

            vm.sensorsPlotNames.splice(0, vm.sensorsPlotNames.length);
            vm.clearChart();
        };

        vm.maximiseSensorGraph = function () {
            var element = angular.element(document.querySelector('.sensor-list-chart-container'));
            element.css({top: '60px', left: '8px', width: 'calc(100% - 16px)', height: 'calc(100% - 68px)'});
        };

        vm.restoreSensorGraphSize = function () {
            var element = angular.element(document.querySelector('.sensor-list-chart-container'));
            element.css({top: 'auto', left: 'auto', right: '20px', bottom: '20px', width: '500px', height: '500px'});
        };

        var unbindUpdate = $rootScope.$on('sensorsServerUpdateMessage', function (event, sensor) {
            var strList = sensor.name.split(':');
            var sensorNameList = strList[1].split('.');
            vm.resources[sensorNameList[0]].sensorsList.forEach(function (oldSensor) {
                if (sensorNameList[0] + '.' + oldSensor.python_identifier === strList[1]) {
                    oldSensor.sensorValue = sensor.value;
                    oldSensor.status = sensor.value.status;
                    oldSensor.timestamp = moment.utc(sensor.value.timestamp, 'X').format('HH:mm:ss DD-MM-YYYY');
                    oldSensor.received_timestamp = moment.utc(sensor.value.received_timestamp, 'X').format('HH:mm:ss DD-MM-YYYY');
                    oldSensor.value = sensor.value.value;
                }
            });

            if (vm.sensorsPlotNames.length > 0 &&
                _.findIndex(vm.sensorsPlotNames,
                    function (item) {
                        return item.name === strList[1];
                    }) > -1) {
                vm.redrawChart([{
                    Sensor: strList[1].replace(/\./g, '_'),
                    ValueTimestamp: sensor.value.timestamp,
                    Timestamp: sensor.value.received_timestamp,
                    Value: sensor.value.value
                }], vm.showGridLines, vm.showDots, !vm.showContextZoom, vm.useFixedYAxis, null, 100);
            }
        });

        vm.showOptionsChanged = function () {
            if (!$scope.$$phase) {
                $scope.$apply();
            }
            vm.redrawChart(null, vm.showGridLines, vm.showDots, !vm.showContextZoom, vm.useFixedYAxis);
        };

        $scope.$on('$destroy', function () {
            if (vm.resourceSensorsBeingDisplayed.length > 0) {
                SensorsService.removeResourceListeners(vm.resourceSensorsBeingDisplayed);
            }

            SensorsService.unsubscribe(vm.resourceSensorsBeingDisplayed + ".*", vm.guid);
            unbindUpdate();
            vm.disconnectIssued = true;
            SensorsService.disconnectListener();
        });
    }
})();
