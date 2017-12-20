// *******************************************************************
// TODO: WARNING THIS DISPLAY WAS EXPERIMENTAL AND IS NOT USED ANYMORE
// *******************************************************************
(function () {

    angular.module('katGui.health')
        .controller('SubarrayHealthCtrl', SubarrayHealthCtrl);

    function SubarrayHealthCtrl(MonitorService, ConfigService, StatusService, NotifyService, $log,
                                $interval, $localStorage, $rootScope, $scope, $timeout) {
        var vm = this;
        vm.receptorHealthTree = ConfigService.receptorHealthTree;
        vm.receptorList = StatusService.receptors;
        vm.subarrays = {};
        vm.sensorValues = {};
        vm.subscribedSensors = [];

        vm.initSensors = function () {
            var subarrays = ConfigService.systemConfig.system.subarray_nrs.split(',');
            // var receptorSensorsRegex = 'subarray_._state|subarray_._pool_resources|subarray_._maintenance|cbf_.*.sensors.ok|sdp.*.sensors.ok|anc.*.sensors.ok';
            // for (var i = 0; i < subarrays.length; i++) {
                // vm.subarrays['subarray_' + subarrays[i]] = {id: i.toString()};
            // }
            // MonitorService.setSensorStrategies(receptorSensorsRegex, 'event-rate', 1, 360);
            // if (StatusService.receptorTreesSensors) {
                // MonitorService.setSensorStrategies(Object.keys(StatusService.receptorTreesSensors).join('|'), 'event-rate', 1, 360);
            // }
        };

        vm.statusMessageReceived = function (event, message) {
            // var sensorName = message.name.split(':')[1];
            // if (sensorName.startsWith('subarray_')) {
            //     var splitSensorName = sensorName.split('_');
            //     var sub_nr = splitSensorName[1];
            //     if (!MonitorService.subarraySensorValues['subarray_' + sub_nr]) {
            //         MonitorService.subarraySensorValues['subarray_' + sub_nr] = {};
            //     }
            //     MonitorService.subarraySensorValues['subarray_' + sub_nr][sensorName.replace('subarray_' + sub_nr + '_', '')] = message.value;
            //     MonitorService.subarraySensorValues['subarray_' + sub_nr].id = sub_nr;
            // } else {
            //     message.status = message.value.status;
            //     message.received_timestamp = message.value.received_timestamp;
            //     message.timestamp = message.value.timestamp;
            //     message.value = message.value.value;
            //     StatusService.sensorValues[sensorName] = message;
            //     StatusService.addToUpdateQueue(sensorName);
            // }
            // vm.debounceScheduleRedraw();
        };

        // vm.cancelListeningToSensorMessages = $rootScope.$on('sensorsServerUpdateMessage', vm.statusMessageReceived);

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
        vm.pendingUpdatesInterval = $interval(StatusService.applyPendingUpdates, 150);

        var unbindUpdate = $rootScope.$on('sensorUpdateMessage', function (event, sensor, subject) {
            if (subject.startsWith('req.reply')) {
                MonitorService.subscribeSensor(sensor);
                vm.subscribedSensors.push(sensor);
            }
            StatusService.addToUpdateQueue(sensor.name);
            // remove the mon_proxyN from the sensor name
            if (sensor.name.startsWith('mon_')) {
              sensor.name = sensor.name.replace(/^mon_.*agg_/, 'agg_');
            }
            StatusService.sensorValues[sensor.name] = sensor;
        });

        var unbindReconnected = $rootScope.$on('websocketReconnected', vm.initSensors);

        $scope.$on('$destroy', function () {
            vm.subscribedSensors.forEach(function (sensor) {
                MonitorService.unsubscribeSensor(sensor);
            });
            $interval.cancel(vm.pendingUpdatesInterval);
            unbindUpdate();
            unbindReconnected();
            StatusService.sensorValues = {};
        });
    }
})();
