(function () {

    angular.module('katGui')
        .controller('DeviceStatusCtrl', DeviceStatusCtrl);

    function DeviceStatusCtrl($rootScope, $scope, $interval, $log, KatGuiUtil, MonitorService, MOMENT_DATETIME_FORMAT,
                              NotifyService) {

        var vm = this;
        vm.sensorValues = {};
        vm.sensorsRegex = 'device_status|serial|lru';
        vm.subscribedSensors = [];
        vm.sensorsOrderByFields = [
            {label: 'Name', value: 'name'},
            {label: 'Timestamp', value: 'date'},
            {label: 'Status', value: 'status'},
            {label: 'Value', value: 'value'}
        ];

        vm.initSensors = function () {
            MonitorService.listSensorsHttp('all', vm.sensorsRegex).then(function(result) {
                result.data.forEach(function (sensor) {
                    MonitorService.subscribeSensor(sensor);
                    vm.subscribedSensors.push(sensor);
                    sensor.date = moment.utc(sensor.time, 'X').format(MOMENT_DATETIME_FORMAT);
                    vm.sensorValues[sensor.name] = sensor;
                    if (!sensor.original_name) {
                        sensor.original_name = sensor.name;
                    }
                });
            }, function(error) {
                $log.error(error);
            });
        };

        var unbindSensorUpdates = $rootScope.$on('sensorUpdateMessage', function(event, sensor, subject) {
            if (sensor.name.search(vm.sensorsRegex) < 0) {
                return;
            }
            for (var key in sensor) {
                vm.sensorValues[sensor.name][key] = sensor[key];
            }
            vm.sensorValues[sensor.name].date = moment.utc(sensor.time, 'X').format(MOMENT_DATETIME_FORMAT);
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
