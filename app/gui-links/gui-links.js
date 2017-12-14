(function () {

    angular.module('katGui')
        .controller('GuiLinksCtrl', GuiLinksCtrl);

    function GuiLinksCtrl($rootScope, $scope, $interval, $log, MonitorService, MOMENT_DATETIME_FORMAT, NotifyService, $timeout) {

        var vm = this;
        vm.sensorValues = {};
        vm.subscribedSensors = [];
        vm.sensorsOrderByFields = [
            {label: 'Name', value: 'name'},
            {label: 'Value', value: 'value'}
        ];

        vm.refreshGuiLinks = function () {
            vm.sensorValues = {};
            vm.subscribedSensors.forEach(function (sensor) {
                MonitorService.unsubscribeSensor(sensor);
            });
            vm.initSensors();
        };

        vm.initSensors = function () {
            MonitorService.listSensors('all', 'gui_urls$');
        };

        var unbindSensorUpdates = $rootScope.$on('sensorUpdateMessage', function(event, sensor, subject) {
            if (sensor.name.indexOf('gui_urls') === -1) {
                return;
            }
            if (subject.startsWith('req.reply')) {
                MonitorService.subscribeSensor(sensor);
                vm.subscribedSensors.push(sensor);
                vm.sensorValues[sensor.name] = sensor;
            } else {
                for (var key in sensor) {
                    vm.sensorValues[sensor.name][key] = sensor[key];
                }
            }
            vm.sensorValues[sensor.name].date = moment.utc(sensor.time, 'X').format(MOMENT_DATETIME_FORMAT);
            try {
                vm.sensorValues[sensor.name].parsedValue = JSON.parse(sensor.value);
            } catch (error) {
                vm.sensorValues[sensor.name].parsedValue = sensor.value;
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
