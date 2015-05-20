(function () {

    angular.module('katGui')
        .controller('SensorListCtrl', SensorListCtrl);

    function SensorListCtrl($scope, $rootScope, SensorsService, $timeout) {

        var vm = this;
        vm.resources = SensorsService.resources;
        vm.resourcesNames = [];
        vm.sensorsToDisplay = [];
        vm.resourceSensorsBeingDisplayed = '';
        vm.sensorsPlotNames = [];

        vm.limitTo = 50;
        $scope.loadMore = function () {
            vm.limitTo += 15;
        };

        vm.sensorsOrderByFields = [
            {label: 'Name', value: 'name'},
            {label: 'Timestamp', value: 'timestamp'},
            {label: 'Status', value: 'status'},
            {label: 'Value', value: 'value'}
        ];

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
        };

        vm.sensorLoaded = function ($index) {
            if ($index >= vm.limitTo - 1) {
                $timeout($scope.loadMore, 100);
            }
            return true;
        };

        vm.setSensorsOrderBy('name');

        SensorsService.connectListener();

        SensorsService.listResources()
            .then(function (message) {
                //$rootScope.showSimpleToast(message);
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
                SensorsService.unsubscribe(vm.resourceSensorsBeingDisplayed + ':*');
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
                        SensorsService.connectResourceSensorListeners(resourceName);
                    });
            } else {
                vm.sensorsToDisplay = vm.resources[resourceName].sensorsList;
                SensorsService.subscribe(resourceName + ':*');
                if (!$scope.$$phase) {
                    $scope.$digest();
                }
            }
            vm.resourceSensorsBeingDisplayed = resourceName;
        };

        vm.sensorClass = function (status) {
            return status + '-sensor-list-item';
        };

        vm.plotLiveSensorFeed = function (sensor) {
            if (sensor.sensorValue) {
                vm.sensorsPlotNames.push(sensor.sensorValue.name);
            }
        };

        vm.clearChartData = function () {
            vm.sensorsToDisplay.forEach(function (sensor) {
                sensor.selectedForChart = false;
            });

            vm.sensorsPlotNames.splice(0, vm.sensorsPlotNames.length);
            vm.clearChart();
        };

        var unbindUpdate = $rootScope.$on('sensorsServerUpdateMessage', function (event, sensor) {
            var resource = sensor.name.split(':');
            vm.resources[resource[0]].sensorsList.forEach(function (oldSensor) {
                if (resource[0] + ':' + oldSensor.python_identifier === sensor.name) {
                    oldSensor.sensorValue = sensor.value;
                    oldSensor.status = sensor.value.status;
                    oldSensor.timestamp = sensor.value.timestamp;
                    oldSensor.value = sensor.value.value;
                }
            });

            if (vm.sensorsPlotNames.indexOf(sensor.name) > -1) {
                vm.redrawChart([{
                    Sensor: sensor.name.replace(/:/g, '_'),
                    Timestamp: sensor.value.timestamp,
                    Value: sensor.value.value
                }], false, null, true, 100);
            }
        });

        $scope.$on('$destroy', function () {
            if (vm.resourceSensorsBeingDisplayed.length > 0) {
                SensorsService.removeResourceListeners(vm.resourceSensorsBeingDisplayed);
            }

            SensorsService.unsubscribe(vm.resourceSensorsBeingDisplayed + ":*");
            unbindUpdate();
        });
    }
})();
