(function() {

    angular.module('katGui.health')
        .controller('SKARABHealthCtrl', SKARABHealthCtrl);

    function SKARABHealthCtrl($rootScope, $scope, ConfigService, StatusService, NotifyService,
        MonitorService, d3Util, $timeout, $log, $state) {

        var vm = this;
        vm.NUM_OF_RACKS = 9;
        vm.NUM_OF_SLOTS = 42;

        vm.subscribedSensors = [];

        vm.testdata1 =
        [{
          name: 'm000',
          skarab1: 'ok',
          skarab2: 'ok',
        },
        {
          name: 'm002',
          skarab1: 'ok',
          skarab2: 'ok',
        },
        {
          name: 'm003',
          skarab1: 'ok',
          skarab2: 'ok',
        },        {
          name: 'm005',
          skarab1: 'ok',
          skarab2: 'ok',
        }];

        vm.testdata2 =
        [{
          name: 'm010',
          skarab1: 'ok',
          skarab2: 'ok',
        },
        {
          name: 'm020',
          skarab1: 'ok',
          skarab2: 'ok',
        },
        {
          name: 'm015',
          skarab1: 'ok',
          skarab2: 'ok',
        },        {
          name: 'm017',
          skarab1: 'ok',
          skarab2: 'ok',
        },
        {
          name: 'm020',
          skarab1: 'ok',
          skarab2: 'ok',
        },
        {
          name: 'm025',
          skarab1: 'ok',
          skarab2: 'ok',
        },
        {
          name: 'm027',
          skarab1: 'ok',
          skarab2: 'ok',
        },        {
          name: 'm036',
          skarab1: 'ok',
          skarab2: 'ok',
        }];

        vm.testdata3 =
        [{name: 'm000',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm001',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm002',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm003',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm004',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm005',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm006',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm007',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm008',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm009',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm010',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm011',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm012',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm013',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm014',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm015',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm016',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm017',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm018',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm019',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm020',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm021',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm022',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm023',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm024',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm025',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm026',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm027',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm028',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm039',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm030',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm031',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm032',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm033',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm034',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm035',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm036',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm037',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm038',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm039',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm040',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm041',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm042',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm043',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm044',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm045',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm046',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm047',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm048',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm049',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm050',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm051',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm052',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm053',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm054',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm055',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm056',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm057',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm058',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm059',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm060',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm061',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm062',skarab1: 'ok',skarab2: 'ok',},
        {name: 'm063',skarab1: 'ok',skarab2: 'ok',},
        ];

        // initialise data with racks and slots
        vm.data = [];
        var id = 0;
        for (var i=1; i<(vm.NUM_OF_RACKS+1); i++) {
          for (var j=1; j<(vm.NUM_OF_SLOTS+1); j++) {
            id++;
            var obj = {};
            obj.rack = i;
            obj.slot = j;
            obj.position = 'B' + ("00"+i).slice(-2) + ":" + ("00"+j).slice(-2);
            obj.sensorName = '';
            obj.sensorValue = {};
            obj.status = 'empty';
            obj.id = id;
            vm.data.push(obj);
          }
        }

        ConfigService.getSystemConfig();

        vm.initPositionSensors = function() {

          var sensorsRegex = 'skarab.*_location';
          MonitorService.listSensorsHttp('all', sensorsRegex).then(function (result) {
              for (var i=0; i<result.data.length; i++) {
                var sensor = result.data[i];
                var position = sensor.value;
                var deviceStatusName = sensor.name.replace('location', 'device_status');
                vm.updatePositionSensor(position, deviceStatusName);
              }
              vm.initStatusSensors();

          }, function(error) {
              $log.error(error);
          });
        };

        vm.initStatusSensors = function() {
          var sensorsRegex = 'skarab.*_device_status';
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

        vm.navigateToSensorList = function(component, filter) {
          $state.go('sensor-list',{
            component: component,
            filter: filter
          });
        };

        vm.updatePositionSensor = function(position, sensorName) {
          if (!position) {
            return;
          }

          var p = position.split(/[:+]/);
          var rack = Number(p[0].substring(1));
          var slot = Number(p[1]);

//// TODO: There could be two sensors linked to the same position
// (one each from cbfhealth and cbfhealth2 proxies). Current code does not
// allow for that. If tie-breaker is required then need to reimplement this
          for (var i=0; i<vm.data.length; i++) {
            var obj = vm.data[i];
            if (obj.rack==rack && obj.slot==slot) {
              obj.position = position;
              obj.sensorName = sensorName;
              obj.status = 'unknown';
              return;
            }
          }
        };

        vm.updateStatusSensor = function(sensor) {
          for (var i=0; i<vm.data.length; i++) {
            var obj = vm.data[i];
            if (obj.sensorName==sensor.name) {
              if (!obj.sensor) {
                obj.name = sensor.original_name;
                obj.description = sensor.description;
              }
              obj.sensor = sensor;
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
