(function () {

    angular.module('katGui.health')
        .controller('ReceptorPointingCtrl', ReceptorPointingCtrl);

    function ReceptorPointingCtrl($rootScope, $scope, KatGuiUtil, ConfigService, SensorsService, $interval, $timeout) {

        var vm = this;
        vm.receptorsData = [];
        vm.guid = KatGuiUtil.generateUUID();
        SensorsService.connectListener();

        $timeout(function () {
            ConfigService.getReceptorList()
                .then(function (result) {
                    result.forEach(function (item) {
                        vm.receptorsData.push({name: item, showHorizonMask: false});
                        $timeout(function () {
                            SensorsService.connectResourceSensorNameLiveFeed(item, 'ap_actual_azim', vm.guid, 'event-rate', 1, 10);
                        }, 10);
                        $timeout(function () {
                            SensorsService.connectResourceSensorNameLiveFeed(item, 'ap_actual_elev', vm.guid, 'event-rate', 1, 10);
                        }, 10);
                        $timeout(function () {
                            SensorsService.connectResourceSensorNameLiveFeed(item, 'ap_requested_azim', vm.guid, 'event-rate', 1, 10);
                        }, 10);
                        $timeout(function () {
                            SensorsService.connectResourceSensorNameLiveFeed(item, 'ap_requested_elev', vm.guid, 'event-rate', 1, 10);
                        }, 10);
                        $timeout(function () {
                            SensorsService.connectResourceSensorNameLiveFeed(item, 'pos_request_base_dec', vm.guid, 'event-rate', 1, 10);
                        }, 10);
                        $timeout(function () {
                            SensorsService.connectResourceSensorNameLiveFeed(item, 'pos_request_base_ra', vm.guid, 'event-rate', 1, 10);
                        }, 10);
                        $timeout(function () {
                            SensorsService.connectResourceSensorNameLiveFeed(item, 'pos_delta_sky', vm.guid, 'event-rate', 1, 10);
                        }, 10);

                        $timeout(function () {
                            SensorsService.connectResourceSensorNameLiveFeed(item, 'mode', vm.guid, 'event-rate', 1, 10);
                            SensorsService.connectResourceSensorNameLiveFeed(item, 'inhibited', vm.guid, 'event-rate', 1, 10);
                            SensorsService.connectResourceSensorNameLiveFeed(item, 'ap_device_status', vm.guid, 'event-rate', 1, 10);
                            SensorsService.connectResourceSensorNameLiveFeed(item, 'lock', vm.guid, 'event-rate', 1, 10);
                            SensorsService.connectResourceSensorNameLiveFeed(item, 'windstow_active', vm.guid, 'event-rate', 1, 10);
                        }, 10);
                    });
                });
        }, 1000);

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
                        console.log(result);
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
            SensorsService.disconnectListener();
        });
    }
})();
