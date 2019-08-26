(function() {

    angular.module('katGui.health')
        .controller('CbfHealthViewCtrl', CbfHealthViewCtrl);

    function CbfHealthViewCtrl($log, $interval, $rootScope, $scope, $localStorage, MonitorService,
                                  ConfigService, StatusService, NotifyService, $stateParams) {

        var SUBARRAY_CBF_COUNT_REGEX = 'subarray_._cbf_.*';
        var SUBARRAY_STATE_REGEX = 'subarray_._state';
        var vm = this;
        vm.desiredColumns = 4;
        vm.svgList = [];
        vm.subarrayNrs = [1, 2, 3, 4];
        vm.subarrays = [];

        vm.subscribedSensors = [];

        ConfigService.getSystemConfig()
            .then(function(systemConfig) {
                vm.subarrayNrs = systemConfig.system.dataproxy_nrs.split(',');
                vm.subarrays = vm.subarrayNrs.map(function(subNr) {
                    return {
                      name: 'subarray_' + subNr,
                      state: 'inactive',
                      fhost_errors: 0,
                      xhost_errors: 0,
                      fhost_warnings: 0,
                      xhost_warnings: 0,
                    }
                });
                vm.initSensors();
        });

        vm.updateCbfCount = function(sensor) {
          // get rid of subarray_n_cbf_,
          // eg: subarray_2_cbf_xhost_errors becomes xhost_errors
          var type = sensor.name.substring(15);
          // and subarray name is subarray_2
          var subarray_name = sensor.name.substring(0, 10);

          for (var j=0; j<vm.svgList.length; j++) {
            var svg = vm.svgList[j];
            var subarray = svg['subarray'];
            if (subarray.name==subarray_name && svg.type==type) {
              subarray[type] = sensor.value;
              vm.redraw(svg);
            }
          }
        }

        vm.updateSubarrayState = function(sensor) {
          for (var i=0; i<vm.subarrays.length; i++) {
            var subarray = vm.subarrays[i];
            if (sensor.name.includes(subarray.name)) {
              subarray.state = sensor.value;
              for (var j=0; j<vm.svgList.length; j++) {
                var svg = vm.svgList[j];
                if (svg['subarray'].name == subarray.name)
                  vm.redraw(svg);
              }
              return;
            }
          }
        }

        vm.initSensors = function() {
            var sensorsRegex = SUBARRAY_STATE_REGEX;
            MonitorService.listSensorsHttp('all', sensorsRegex).then(
              function (result) {
                  for (var i=0; i<result.data.length; i++) {
                      var sensor = result.data[i];
                      vm.updateSubarrayState(sensor);
                      MonitorService.subscribeSensor(sensor);
                      vm.subscribedSensors.push(sensor);
                  }
              },
              function(error) {
                  $log.error(error);
              }
            );

            sensorsRegex = SUBARRAY_CBF_COUNT_REGEX;
            MonitorService.listSensorsHttp('all', sensorsRegex).then(
              function (result) {
                for (var i=0; i<result.data.length; i++) {
                    var sensor = result.data[i];
                    vm.updateCbfCount(sensor);
                    MonitorService.subscribeSensor(sensor);
                    vm.subscribedSensors.push(sensor);
                }
              }, function(error) {
                  $log.error(error);
              });
        };

        var unbindUpdate = $rootScope.$on('sensorUpdateMessage', function(event, sensor, subject) {
          if (sensor.name.match(/subarray_._state/)) {
            vm.updateSubarrayState(sensor);
            return;
          }
          if (sensor.name.match(/subarray_._cbf_/)) {
            vm.updateCbfCount(sensor);
            return;
          }
        });

        var unbindReconnected = $rootScope.$on('websocketReconnected', vm.initSensors);

        $scope.$on('$destroy', function() {
            vm.subscribedSensors.forEach(function(sensor) {
                MonitorService.unsubscribeSensor(sensor);
            });
            unbindUpdate();
            unbindReconnected();
        });
    }
})();
