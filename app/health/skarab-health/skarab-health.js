(function() {

    angular.module('katGui.health')
        .controller('SKARABHealthCtrl', SKARABHealthCtrl);

    function SKARABHealthCtrl($rootScope, $scope, ConfigService, StatusService, NotifyService,
        MonitorService, d3Util, $timeout, $log) {

        var vm = this;
        vm.NUM_OF_RACKS = 9;
        vm.NUM_OF_SLOTS = 42;

        vm.subscribedSensors = [];
        vm.sensorsRegex = '';

        // initialise data with racks and slots
        vm.data = [];
        var id = 0;
        for (var i=1; i<(vm.NUM_OF_RACKS+1); i++) {
          for (var j=1; j<(vm.NUM_OF_SLOTS+1); j++) {
            var obj = {};
            obj.rack = i;
            obj.slot = j;
            obj.position = '';
            obj.sensor_name = '';
            obj.sensor_value = {};
            obj.status = 'unknown';
            obj.id = id;
            vm.data.push(obj);
            id++;
          }
        }

        ConfigService.getSystemConfig();

        vm.initPositionSensors = function() {

//          let sensorsRegex = 'skarab.position';
          var sensorsRegex = 'device_status';
          MonitorService.listSensorsHttp('all', sensorsRegex).then(function (result) {
              for (var i=0; i<result.data.length; i++) {
                var sensor = result.data[i];
                var position = sensor.value;
                position = 'B09-30+1';
                var device_status_name = sensor.name.replace('position', 'device_status');
                vm.updatePositionSensor(position, device_status_name);
              }
              vm.initStatusSensors();

          }, function(error) {
              $log.error(error);
          });
        };

        vm.initStatusSensors = function() {
          var sensorsRegex = 'device_status';
          MonitorService.listSensorsHttp('all', sensorsRegex).then(function (result) {
              result.data.forEach(function (sensor) {
                vm.updateStatusSensor(sensor);
                MonitorService.subscribeSensor(sensor);
                vm.subscribedSensors.push(sensor);
              });
            }, function(error) {
                $log.error(error);
            });
        };

        vm.updatePositionSensor = function(position, sensorName) {
          if (!position) {
            return;
          }

          var p = position.split(/[-,+]/);
          var rack = Number(p[0].substring(1));
          var slot = Number(p[1]);

          for (var i=0; i<vm.data.length; i++) {
            var obj = vm.data[i];
            if (obj.rack==rack && obj.slot==slot) {
              obj.position = position;
              obj.sensor_name = sensorName;
              return;
            }
          }
        };

        vm.updateStatusSensor = function(sensor) {
          for (var i=0; i<vm.data.length; i++) {
            var obj = vm.data[i];
            if (obj.sensor_name==sensor.name) {
              obj.sensor_value = sensor;
              obj.status = sensor.status;
              if (vm.updateStatus)
                vm.updateStatus(obj);
              return;
            }
          }
        };

        var unbindUpdate = $rootScope.$on('sensorUpdateMessage', function(event, sensor, subject) {
          if (sensor.name.includes("device_status")) {
            vm.updateStatusSensor(sensor);
          }
        });

        var unbindReconnected = $rootScope.$on('websocketReconnected', vm.initPositionSensors);
        vm.initPositionSensors();

        $scope.$on('$destroy', function() {
            vm.subscribedSensors.forEach(function(sensor) {
                MonitorService.unsubscribeSensor(sensor);
            });
            unbindUpdate();
            unbindReconnected();
        });
    }
})
();
