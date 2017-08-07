(function () {

    angular.module('katGui')
        .controller('DeviceStatusCtrl', DeviceStatusCtrl);

    function DeviceStatusCtrl($rootScope, $scope, $interval, $log, KatGuiUtil, SensorsService, MOMENT_DATETIME_FORMAT,
                              NotifyService) {

        var vm = this;

        vm.sortedSensorNames = [];
        vm.sensorValues = {};
        vm.resourcesNames = {};
        vm.guid = KatGuiUtil.generateUUID();
        vm.disconnectIssued = false;
        vm.connectInterval = null;

        var sensorNameList = [];

        vm.sensorsOrderByFields = [
            {label: 'Name', value: 'name'},
            {label: 'Timestamp', value: 'date'},
            {label: 'Status', value: 'status'},
            {label: 'Value', value: 'value'}
        ];

        //note: manual sorting because we are using json as our datasource
        vm.setSensorsOrderBy = function (column, skipReverseToggle) {
            var newOrderBy = _.findWhere(vm.sensorsOrderByFields, {value: column});
            if ((vm.sensorsOrderBy || {}).value === column) {
                if (!skipReverseToggle && newOrderBy.reverse === undefined) {
                    newOrderBy.reverse = true;
                } else if (!skipReverseToggle && newOrderBy.reverse) {
                    newOrderBy.reverse = undefined;
                    newOrderBy = null;
                }
            }
            vm.sensorsOrderBy = newOrderBy;

            //todo move to a util class
            var array = [];
            for (var key in vm.sensorValues) {
                vm.sensorValues[key]._key = key;
                array.push(vm.sensorValues[key]);
            }

            array = _.sortBy(array, function(item) {
                return item[column].toString();
            });
            if (newOrderBy && newOrderBy.reverse) {
                array.reverse();
            }

            vm.sortedSensorNames.splice(0, vm.sortedSensorNames.length);

            for (var i = 0; i < array.length; i++) {
                vm.sortedSensorNames.push(array[i]._key);
            }
        };

        vm.setSensorsOrderBy('name');

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

        vm.initSensors = function () {
            SensorsService.setSensorStrategies('^(?!agg_).*_device_status|serial|lru', 'event-rate', 1, 120);
        };

        vm.sensorClass = function (status) {
            return status + '-sensor-list-item';
        };

        vm.connectListeners();

        var unbindUpdate = $rootScope.$on('sensorsServerUpdateMessage', function (event, sensor) {
            sensor.value.name = sensor.name.split(':')[1];
            sensor.value.date = moment.utc(sensor.value.timestamp, 'X').format(MOMENT_DATETIME_FORMAT);
            vm.sensorValues[sensor.value.name] = sensor.value;
            //note: manual sorting because we are using json as our datasource
            vm.setSensorsOrderBy(vm.sensorsOrderBy.value, true);
        });

        $scope.$on('$destroy', function () {
            for (var key in SensorsService.resources) {
                SensorsService.removeResourceListeners(key);
            }
            SensorsService.unsubscribe('*', vm.guid);
            unbindUpdate();
            vm.disconnectIssued = true;
            SensorsService.disconnectListener();
        });
    }
})();
