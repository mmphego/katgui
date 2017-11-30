(function () {

    angular.module('katGui')
        .controller('SensorGroupsCtrl', SensorGroupsCtrl);

    function SensorGroupsCtrl($scope, $rootScope, MonitorService, $timeout, $interval, NotifyService,
                              ConfigService, $log, MOMENT_DATETIME_FORMAT, KatGuiUtil) {

        var vm = this;
        vm.sensorGroups = {};
        vm.sensorGroupList = [];
        vm.subscribedSensors = [];
        vm.sensorsGroupBeingDisplayed = '';
        vm.sensorValues = {};
        vm.hideNominalSensors = false;

        ConfigService.loadSensorGroups().then(function (result) {
            vm.sensorGroupList = Object.keys(result);
            vm.sensorGroups = result;
        });

        vm.sensorsOrderByFields = [
            {label: 'Name', value: 'name'},
            {label: 'Timestamp', value: 'timestamp'},
            {label: 'Received Timestamp', value: 'received_timestamp'},
            {label: 'Status', value: 'status'},
            {label: 'Value', value: 'value'}
        ];

        vm.initSensors = function () {
            if (vm.sensorsGroupBeingDisplayed) {
                vm.showProgress = true;
                var sensorsRegex = vm.sensorGroups[vm.sensorsGroupBeingDisplayed].sensors.split('|');
                sensorsRegex.forEach(function(sensorRegex) {
                    var sensorSplitList = sensorRegex.split(':');
                    var component = sensorSplitList[0];
                    var regex = sensorSplitList[1];
                    MonitorService.listSensors(component, regex);
                });
            }
        };

        vm.setSensorGroupStrategy = function (sensorGroupName) {
            vm.subscribedSensors.forEach(function (sensor) {
                MonitorService.unsubscribeSensor(sensor);
            });
            vm.subscribedSensors = [];
            vm.sensorValues = {};
            vm.sensorsGroupBeingDisplayed = sensorGroupName;
            vm.initSensors();
        };

        vm.displaySensorValue = function ($event, sensor) {
            NotifyService.showHTMLPreSensorDialog(sensor.python_identifier + ' value at ' + sensor.received_timestamp, sensor, $event);
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

        vm.sensorClass = function (status) {
            return status + '-sensor-list-item';
        };

        vm.filterByNotNominal = function (sensor) {
            return !vm.hideNominalSensors || vm.hideNominalSensors && sensor.status !== 'nominal';
        };

        var unbindSensorUpdates = $rootScope.$on('sensorUpdateMessage', function(event, sensor, subject) {
            if (subject.startsWith('req.reply')) {
                vm.showProgress = false;
                if (!vm.sensorValues[sensor.name]) {
                    MonitorService.subscribeSensor(sensor);
                    vm.subscribedSensors.push(sensor);
                }
                vm.sensorValues[sensor.name] = sensor;
                vm.sensorValues[sensor.name].date = moment.utc(sensor.time, 'X').format(MOMENT_DATETIME_FORMAT);
            } else {
                if (vm.sensorValues[sensor.name]) {
                    for (var key in sensor) {
                        vm.sensorValues[sensor.name][key] = sensor[key];
                    }
                }
                vm.sensorValues[sensor.name].date = moment.utc(sensor.time, 'X').format(MOMENT_DATETIME_FORMAT);
            }
        });

        var unbindReconnected = $rootScope.$on('websocketReconnected', vm.initSensors);

        vm.initSensors();

        $scope.$on('$destroy', function () {
            vm.subscribedSensors.forEach(function (sensor) {
                MonitorService.unsubscribeSensor(sensor);
            });
            unbindSensorUpdates();
            unbindReconnected();
        });
    }
})();
