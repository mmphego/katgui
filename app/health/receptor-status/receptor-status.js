(function () {

    angular.module('katGui.health')
        .controller('ReceptorStatusCtrl', ReceptorStatusCtrl);

    function ReceptorStatusCtrl($rootScope, $scope, KatGuiUtil, ConfigService, SensorsService, $state) {

        var vm = this;
        vm.receptorsData = [];
        vm.subarrays = {};
        vm.sortBySubarrays = false;
        vm.guid = KatGuiUtil.generateUUID();
        SensorsService.connectListener();

        vm.receptorSensorsToConnect = [
            'mode',
            'inhibited',
            'ap_device_status',
            'lock',
            'windstow_active'
        ];

        vm.subarraySensorsToConnect = [
            'state',
            'allocations',
            'maintenance'
        ];

        ConfigService.getReceptorList()
            .then(function (result) {
                result.forEach(function (item) {
                    vm.receptorsData.push({name: item});
                    SensorsService.connectResourceSensorNamesLiveFeedWithList(item, vm.receptorSensorsToConnect, vm.guid, 'event-rate', 1, 10);
                });

                for (var i = 1; i <= 4; i++) {
                    SensorsService.connectResourceSensorNamesLiveFeedWithList('subarray_' + i, vm.subarraySensorsToConnect, vm.guid, 'event-rate', 1, 10);
                }

                SensorsService.connectResourceSensorNameLiveFeed('katpool', 'resources_in_maintenance', vm.guid, 'event-rate', 1, 10);
            });

        vm.statusMessageReceived = function (event, message) {
            if (message.value) {
                var sensor = message.name.split(':')[1];
                var resource = sensor.split('.')[0];
                var sensorName = sensor.split('.')[1];

                vm.receptorsData.forEach(function (receptor) {
                    if (resource === 'katpool') {
                        if (sensorName === 'resources_in_maintenance') {
                            receptor.in_maintenance = false;
                            var resourcesList = message.value.value.split(',');
                            resourcesList.forEach(function (res) {
                                if (receptor.name === res) {
                                    receptor.in_maintenance = true;
                                }
                            });
                        }
                    } else if (receptor.name === resource) {
                        receptor[sensorName] = message.value;
                    }
                });

                //WIP TODO fix up the receptor status to use subarray sensors
                if (resource.indexOf('subarray_') === 0) {
                    if (!vm.subarrays[resource]) {
                        vm.subarrays[resource] = {};
                    }
                    if (sensorName === 'allocations') {
                        if (message.value.value.length > 0) {
                            vm.subarrays[resource]['allocations'] = JSON.parse(message.value.value);
                        } else {
                            vm.subarrays[resource]['allocations'] = [];
                        }

                        vm.receptorsData.forEach(function (receptor) {
                            if (_.contains(vm.subarrays[resource].allocations, receptor.name)) {
                                receptor.subarray = resource;
                            }
                        });
                    } else {
                        vm.subarrays[resource][sensorName] = message.value.value;
                    }
                }

                if (!$scope.$$phase) {
                    $scope.$digest();
                }
            }
        };

        vm.navigateToSchedulerDetails = function (subarray_id) {
            $state.go('scheduler.observations.detail', {subarray_id: subarray_id});
        };

        vm.cancelListeningToSensorMessages = $rootScope.$on('sensorsServerUpdateMessage', vm.statusMessageReceived);

        $scope.$on('$destroy', function () {
            vm.cancelListeningToSensorMessages();
            SensorsService.disconnectListener();
        });
    }
})();
