(function () {

    angular.module('katGui')
        .controller('SensorListCtrl', SensorListCtrl);

    function SensorListCtrl($scope, $rootScope, SensorsService, $timeout, KatGuiUtil, $interval,
                            $log, $mdDialog, DATETIME_FORMAT, NotifyService, ConfigService) {

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
        vm.showContextZoom = false;
        vm.useFixedYAxis = false;
        vm.yAxisMinValue = 0;
        vm.yAxisMaxValue = 100;
        vm.hideNominalSensors = false;

        if (!ConfigService.sensorGroups) {
            ConfigService.loadSensorGroups();
        }

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
                            NotifyService.showSimpleToast('Reconnected :)');
                        }
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
            if (vm.resourcesNames.length === 0) {
                vm.nodes = ConfigService.resourceGroups;
                SensorsService.listResourcesFromConfig()
                    .then(function (result) {
                        for (var key in result) {
                            vm.resourcesNames.push({name: key, node: result[key].node});
                        }
                    });
            }

            if (vm.resourceSensorsBeingDisplayed.length > 0) {
                SensorsService.setSensorStrategy(
                    vm.resourceSensorsBeingDisplayed,
                    '',
                    $rootScope.sensorListStrategyType,
                    $rootScope.sensorListStrategyInterval,
                    10);
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

        vm.setSensorsOrderBy('name');

        vm.listResourceSensors = function (resourceName) {
            if (vm.resourceSensorsBeingDisplayed === resourceName) {
                return;
            }
            if (vm.resourceSensorsBeingDisplayed.length > 0) {
                SensorsService.removeResourceListeners(vm.resourceSensorsBeingDisplayed);
                SensorsService.unsubscribe(vm.resourceSensorsBeingDisplayed + '.*', vm.guid);
                vm.sensorsPlotNames.splice(0, vm.sensorsPlotNames.length);
                vm.clearChart();
            }
            if (ConfigService.sensorGroups && ConfigService.sensorGroups[resourceName]) {
                vm.resourceSensorsBeingDisplayed = resourceName;
                if (!vm.resources[resourceName]) {
                    vm.resources[resourceName] = {};
                }
                vm.resources[resourceName].sensorsList = [];
                vm.sensorsToDisplay = vm.resources[resourceName].sensorsList;
                var sensorNameList = ConfigService.sensorGroups[resourceName].sensors.split('|');
                sensorNameList.forEach(function (sensor) {
                    var resource = '';
                    var sensorName = '';
                    var firstPart = sensor.split('_', 1)[0];
                    if (firstPart === 'mon' || firstPart === 'nm') {
                        var secondPart = sensor.substring(sensor.indexOf('_') + 1);
                        resource = firstPart + '_' + secondPart;
                        sensorName = secondPart;
                    } else {
                        resource = firstPart;
                        sensorName = sensor.substring(sensor.indexOf('_') + 1);
                    }
                    sensorName = sensorName.replace(/\\_/g, '_');
                    SensorsService.setSensorStrategy(
                        resource,
                        sensorName,
                        $rootScope.sensorListStrategyType,
                        $rootScope.sensorListStrategyInterval,
                        10);
                });

            } else {
                SensorsService.listResourceSensors(resourceName)
                    .then(function (result) {
                        vm.resources[resourceName].sensorsList = result;
                        vm.sensorsToDisplay = vm.resources[resourceName].sensorsList;
                        if (!$scope.$$phase) {
                            $scope.$digest();
                        }
                        SensorsService.setSensorStrategy(
                            resourceName,
                            '',
                            $rootScope.sensorListStrategyType,
                            $rootScope.sensorListStrategyInterval,
                            10);
                    });
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
            var sensorFound = false;
            if (!vm.resources[sensorNameList[0]].sensorsList) {
                vm.resources[sensorNameList[0]].sensorsList = [];
            }
            vm.resources[sensorNameList[0]].sensorsList.forEach(function (oldSensor) {
                if (sensorNameList[0] + '.' + oldSensor.python_identifier === strList[1]) {
                    oldSensor.sensorValue = sensor.value;
                    oldSensor.status = sensor.value.status;
                    oldSensor.timestamp = moment.utc(sensor.value.timestamp, 'X').format(DATETIME_FORMAT);
                    oldSensor.received_timestamp = moment.utc(sensor.value.received_timestamp, 'X').format(DATETIME_FORMAT);
                    oldSensor.value = sensor.value.value;
                    sensorFound = true;
                }
            });
            if (!sensorFound) {
                vm.resources[sensorNameList[0]].sensorsList.push({
                    name: sensorNameList[1],
                    sensorValue: sensor.value,
                    status: sensor.value.status,
                    timestamp: moment.utc(sensor.value.timestamp, 'X').format(DATETIME_FORMAT),
                    received_timestamp: moment.utc(sensor.value.received_timestamp, 'X').format(DATETIME_FORMAT),
                    value: sensor.value.value,
                    python_identifier: sensorNameList[1]
                });
                vm.sensorsToDisplay = vm.resources[sensorNameList[0]].sensorsList;
            }

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
                }], vm.showGridLines, !vm.showContextZoom, vm.useFixedYAxis, null, 100);
            }
        });

        vm.showOptionsChanged = function () {
            if (!$scope.$$phase) {
                $scope.$apply();
            }
            vm.redrawChart(null, vm.showGridLines, !vm.showContextZoom, vm.useFixedYAxis);
        };

        vm.showSensorGroups = function () {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog, ConfigService) {
                        $scope.title = 'Select a Sensor Group';
                        $scope.sensorGroups = ConfigService.sensorGroups;

                        $scope.hide = function () {
                            $mdDialog.hide();
                        };

                        $scope.setSensorGroup = function (key) {
                            vm.listResourceSensors(key);
                        };
                    },
                    template: '<md-dialog style="padding: 0;" md-theme="{{$root.themePrimary}}">' +
                    '   <div style="padding: 0; margin: 0; overflow: auto" layout="column">' +
                    '       <md-toolbar class="md-primary" layout="row" layout-align="center center">' +
                    '           <span flex style="margin: 8px;">{{::title}}</span>' +
                    '       </md-toolbar>' +
                    '       <div flex layout="column">' +
                    '           <div layout="row" layout-align="center center" ng-repeat="key in $root.objectKeys(sensorGroups) | orderBy:key track by $index" ng-click="setSensorGroup(key); hide()" class="config-label-list-item">' +
                    '               <b>{{key}}</b>' +
                    '           </div>' +
                    '       </div>' +
                    '       <div layout="row" layout-align="end" style="margin-top: 8px; margin-right: 8px; margin-bottom: 8px; min-height: 40px;">' +
                    '           <md-button style="margin-left: 8px;" class="md-primary md-raised" md-theme="{{$root.themePrimaryButtons}}" aria-label="OK" ng-click="hide()">Cancel</md-button>' +
                    '       </div>' +
                    '   </div>' +
                    '</md-dialog>',
                    targetEvent: event
                });
        };

        $scope.filterByNotNominal = function(sensor) {
            return !vm.hideNominalSensors || vm.hideNominalSensors && sensor.status !== 'nominal';
        };

        $scope.$on('$destroy', function () {
            unbindUpdate();
            vm.disconnectIssued = true;
            SensorsService.disconnectListener();
        });
    }
})();
