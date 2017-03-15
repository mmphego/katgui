(function () {

    angular.module('katGui.health')
        .controller('SubarrayHealthCtrl', SubarrayHealthCtrl);

    function SubarrayHealthCtrl(SensorsService, ConfigService, StatusService, NotifyService, $log,
                                $interval, $localStorage, $rootScope, $scope, $timeout) {

        var vm = this;
        vm.receptorHealthTree = ConfigService.receptorHealthTree;
        vm.receptorList = StatusService.receptors;
        vm.subarrays = {};
        //TODO replace SensorsService with MonitorService usage because we have default subscriptions to subarray sensors
        SensorsService.subarraySensorValues = {};

        vm.connectListeners = function () {
            SensorsService.connectListener()
                .then(function () {
                    vm.initSensors();
                    if (vm.connectInterval) {
                        $interval.cancel(vm.connectInterval);
                        vm.connectInterval = null;
                        vm.connectionLost = false;
                        NotifyService.showSimpleToast('Reconnected :)');
                    }
                }, function () {
                    $log.error('Could not establish sensor connection. Retrying every 10 seconds.');
                    if (!vm.connectInterval) {
                        vm.connectionLost = true;
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
                            vm.connectionLost = true;
                            vm.connectInterval = $interval(vm.connectListeners, 10000);
                            vm.connectListeners();
                        }
                    }
                });
        };

        vm.initSensors = function () {
            var subarrays = ConfigService.systemConfig.system.subarray_nrs.split(',');
            var receptorSensorsRegex = 'subarray_._state|subarray_._pool_resources|subarray_._maintenance|cbf_.*.sensors.ok|sdp.*.sensors.ok|anc.*.sensors.ok';
            for (var i = 0; i < subarrays.length; i++) {
                vm.subarrays['subarray_' + subarrays[i]] = {id: i.toString()};
            }
            SensorsService.setSensorStrategies(receptorSensorsRegex, 'event-rate', 1, 360);
            if (StatusService.receptorTreesSensors) {
                SensorsService.setSensorStrategies(Object.keys(StatusService.receptorTreesSensors).join('|'), 'event-rate', 1, 360);
            }
        };

        vm.statusMessageReceived = function (event, message) {
            var sensorName = message.name.split(':')[1];
            if (sensorName.startsWith('subarray_')) {
                var splitSensorName = sensorName.split('_');
                var sub_nr = splitSensorName[1];
                if (!SensorsService.subarraySensorValues['subarray_' + sub_nr]) {
                    SensorsService.subarraySensorValues['subarray_' + sub_nr] = {};
                }
                SensorsService.subarraySensorValues['subarray_' + sub_nr][sensorName.replace('subarray_' + sub_nr + '_', '')] = message.value;
                SensorsService.subarraySensorValues['subarray_' + sub_nr].id = sub_nr;
            } else {
                message.status = message.value.status;
                message.received_timestamp = message.value.received_timestamp;
                message.timestamp = message.value.timestamp;
                message.value = message.value.value;
                StatusService.sensorValues[sensorName] = message;
                StatusService.addToUpdateQueue(sensorName);
            }
            vm.debounceScheduleRedraw();
        };

        vm.cancelListeningToSensorMessages = $rootScope.$on('sensorsServerUpdateMessage', vm.statusMessageReceived);

        vm.populateTree = function (parent, receptor) {
            StatusService.receptorTreesSensors['(ant|m).*' + parent.sensor] = 1;
            if (parent.children && parent.children.length > 0) {
                parent.children.forEach(function (child) {
                    vm.populateTree(child, receptor);
                });
            } else if (parent.subs && parent.subs.length > 0) {
                parent.subs.forEach(function (sub) {
                    if (!parent.children) {
                        parent.children = [];
                    }
                    parent.children.push({name: sub, sensor: sub, hidden: true});
                    StatusService.receptorTreesSensors['(ant|m).*' + sub] = 1;
                });
            }
        };

        vm.scheduleRedraw = function (force) {
            $rootScope.$emit('redrawChartMessage', force);
        };

        $timeout(function () {
            ConfigService.getStatusTreeForReceptor()
                .then(function (result) {
                    ConfigService.getReceptorList()
                        .then(function (receptors) {
                            StatusService.receptorTreesSensors = {};
                            StatusService.setReceptorsAndStatusTree(result.data, receptors);
                            StatusService.receptors.forEach(function (receptor) {
                                vm.populateTree(StatusService.statusData[receptor], receptor);
                            });
                            vm.connectListeners();
                            vm.debounceScheduleRedraw();
                        });
                });
        }, 3000);

        vm.debounceScheduleRedraw = _.throttle(vm.scheduleRedraw, 3000);

        $scope.$on('$destroy', function () {
            vm.cancelListeningToSensorMessages();
            SensorsService.disconnectListener();
        });
    }
})();
