(function () {

    angular.module('katGui.health')
        .controller('SubarrayHealthCtrl', SubarrayHealthCtrl);

    function SubarrayHealthCtrl(SensorsService, ConfigService, StatusService, NotifyService, $log,
                                $interval, $localStorage, $rootScope, $scope, $timeout) {

        var vm = this;
        vm.receptorHealthTree = ConfigService.receptorHealthTree;
        vm.receptorList = StatusService.receptors;
        vm.subarrays = {};
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
            var receptorSensorsRegex = '';
            receptorSensorsRegex += 'subarray_._state';
            receptorSensorsRegex += '|subarray_._pool_resources';
            receptorSensorsRegex += '|subarray_._maintenance';
            for (var i = 0; i < subarrays.length; i++) {
                vm.subarrays['subarray_' + subarrays[i]] = {id: i.toString()};
            }
            SensorsService.setSensorStrategies(receptorSensorsRegex, 'event', 0, 0);
        };

        vm.statusMessageReceived = function (event, message) {
            var sensorName = message.name.split(':')[1];
            var splitSensorName = sensorName.split('_');
            var sub_nr = splitSensorName[1];
            if (!SensorsService.subarraySensorValues['subarray_' + sub_nr]) {
                SensorsService.subarraySensorValues['subarray_' + sub_nr] = {};
            }
            SensorsService.subarraySensorValues['subarray_' + sub_nr][sensorName.replace('subarray_' + sub_nr + '_', '')] = message.value;
            SensorsService.subarraySensorValues['subarray_' + sub_nr].id = sub_nr;
            vm.scheduleRedraw(true);
        };

        vm.cancelListeningToSensorMessages = $rootScope.$on('sensorsServerUpdateMessage', vm.statusMessageReceived);

        vm.populateTree = function (parent, receptor) {
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
                });
            }
        };

        vm.scheduleRedraw = function (force) {
            if (!vm.redrawInterval) {
                vm.redrawInterval = $interval(function () {
                    $rootScope.$emit('redrawChartMessage', force);
                    $interval.cancel(vm.redrawInterval);
                    vm.redrawInterval = null;
                }, 1000);
            }
        };

        $timeout(function () {
            ConfigService.getStatusTreeForReceptor()
                .then(function (result) {
                    ConfigService.getReceptorList()
                        .then(function (receptors) {
                            StatusService.setReceptorsAndStatusTree(result.data, receptors);
                            for (var i = 0; i < ConfigService.receptorList.length; i++) {
                                //recursively populate children
                                vm.populateTree(StatusService.statusData[ConfigService.receptorList[i]], ConfigService.receptorList[i]);
                            }
                            vm.scheduleRedraw();
                            vm.connectListeners();
                        });
                });
        }, 100);


        $scope.$on('$destroy', function () {
            if (vm.redrawInterval) {
                $interval.cancel(vm.redrawInterval);
            }
            vm.cancelListeningToSensorMessages();
            SensorsService.disconnectListener();
        });
    }
})();
