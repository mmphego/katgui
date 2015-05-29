(function () {

    angular.module('katGui.health')
        .controller('ReceptorPointingCtrl', ReceptorPointingCtrl);

    function ReceptorPointingCtrl($rootScope, $scope, KatGuiUtil, ConfigService, SensorsService, $interval, $timeout) {

        var vm = this;
        vm.receptorsData = [];
        vm.guid = KatGuiUtil.generateUUID();
        SensorsService.connectListener();

        ConfigService.getReceptorList()
            .then(function (result) {
                $timeout(function() {
                    result.forEach(function (item) {
                        vm.receptorsData.push({name: item});
                        $timeout(function() {
                            SensorsService.connectResourceSensorNameLiveFeed(item, 'ap_actual_azim', vm.guid, 'event-rate', 1, 10);
                        }, 30);
                        $timeout(function() {
                            SensorsService.connectResourceSensorNameLiveFeed(item, 'ap_actual_elev', vm.guid, 'event-rate', 1, 10);
                        }, 30);
                        $timeout(function() {
                            SensorsService.connectResourceSensorNameLiveFeed(item, 'ap_requested_azim', vm.guid, 'event-rate', 1, 10);
                        }, 30);
                        $timeout(function() {
                            SensorsService.connectResourceSensorNameLiveFeed(item, 'ap_requested_elev', vm.guid, 'event-rate', 1, 10);
                        }, 30);
                    });
                }, 1000);
            });

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
                        vm.stopUpdating = $interval(vm.redraw, 1000);
                    }
                });
                if (!$scope.$$phase) {
                    $scope.$digest();
                }
            } else {
                //TODO some messages' value is null
                //console.warn(message);
            }
        };

        vm.redraw = function () {
            vm.redrawChart(vm.receptorsData);
        };

        vm.cancelListeningToSensorMessages = $rootScope.$on('sensorsServerUpdateMessage', vm.statusMessageReceived);

        $scope.$on('$destroy', function () {
            vm.cancelListeningToSensorMessages();
            $interval.cancel(vm.stopUpdating);
            SensorsService.disconnectListener();
        });
    }
})();
