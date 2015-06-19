(function () {

    angular.module('katGui.health')
        .controller('ReceptorPointingCtrl', ReceptorPointingCtrl);

    function ReceptorPointingCtrl($rootScope, $scope, KatGuiUtil, ConfigService, SensorsService, $interval, $log) {

        var vm = this;
        vm.receptorsData = [];
        vm.guid = KatGuiUtil.generateUUID();
        vm.disconnectIssued = false;
        vm.connectInterval = null;
        vm.connectionLost = false;

        vm.connectListeners = function () {
            SensorsService.connectListener()
                .then(function () {
                    vm.initSensors();
                    if (vm.connectInterval) {
                        $interval.cancel(vm.connectInterval);
                        vm.connectionLost = false;
                        vm.connectInterval = null;
                        $rootScope.showSimpleToast('Reconnected :)');
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
                        $rootScope.showSimpleToast('Connection timeout! Attempting to reconnect...');
                        if (!vm.connectInterval) {
                            vm.connectionLost = true;
                            vm.connectInterval = $interval(vm.connectListeners, 10000);
                            vm.connectListeners();
                        }
                    }
                });
        };

        vm.connectListeners();

        vm.sensorsToConnect = [
            'ap_actual_azim',
            'ap_actual_elev',
            'ap_requested_azim',
            'ap_requested_elev',
            'pos_request_base_dec',
            'pos_request_base_ra',
            'pos_delta_sky',
            'mode',
            'inhibited',
            'ap_device_status',
            'lock',
            'windstow_active'
        ];

        vm.initSensors = function () {
            vm.receptorsData.splice(0, vm.receptorsData.length);
            ConfigService.getReceptorList()
                .then(function (result) {
                    result.forEach(function (item) {
                        vm.receptorsData.push({name: item, showHorizonMask: false});
                        SensorsService.connectResourceSensorNamesLiveFeedWithList(item, vm.sensorsToConnect, vm.guid, 'event-rate', 1, 10);
                    });
                });
        };

        vm.statusMessageReceived = function (event, message) {

            if (message.value) {
                var sensor = message.name.split(':')[1];
                var resource = sensor.split('.')[0];
                var sensorName = sensor.split('.')[1];

                //todo make receptorsData a dictionary
                vm.receptorsData.forEach(function (receptor) {
                    if (receptor.name === resource) {
                        receptor[sensorName] = message.value;
                    }
                    if (!angular.isDefined(vm.stopUpdating)) {
                        vm.stopUpdating = $interval(function () {
                            vm.redraw(false);
                        }, 1000);
                    }
                });
                if (!$scope.$$phase) {
                    $scope.$digest();
                }
            }
        };

        vm.redraw = function (horizonMaskToggled) {
            vm.redrawChart(vm.receptorsData, vm.showNames, vm.showTrails, vm.showGridLines, vm.trailDots, horizonMaskToggled);
        };

        vm.toggleHorizonMask = function (receptor) {
            if (!receptor.horizonMask) {
                ConfigService.getHorizonMask(receptor.name)
                    .success(function (result) {
                        receptor.showHorizonMask = true;
                        receptor.horizonMask = "az el\r" + result;
                        vm.redraw(true);
                    })
                    .error(function (result) {
                        $log.error(result);
                    });
            } else {
                receptor.showHorizonMask = !receptor.showHorizonMask;
                vm.redraw(true);
            }
        };

        vm.cancelListeningToSensorMessages = $rootScope.$on('sensorsServerUpdateMessage', vm.statusMessageReceived);

        $scope.$on('$destroy', function () {
            vm.cancelListeningToSensorMessages();
            $interval.cancel(vm.stopUpdating);
            vm.disconnectIssued = true;
            SensorsService.disconnectListener();
        });
    }
})();
