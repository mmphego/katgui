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

        ConfigService.getReceptorList()
            .then(function (result) {
                result.forEach(function (item) {
                    vm.receptorsData.push({name: item});
                    SensorsService.connectResourceSensorNameLiveFeed(item, 'mode', vm.guid, 'event-rate', 1, 10);
                    SensorsService.connectResourceSensorNameLiveFeed(item, 'inhibited', vm.guid, 'event-rate', 1, 10);
                    //todo need an aggregated sensor for the receptor
                    SensorsService.connectResourceSensorNameLiveFeed(item, 'ap_device_status', vm.guid, 'event-rate', 1, 10);
                    SensorsService.connectResourceSensorNameLiveFeed(item, 'lock', vm.guid, 'event-rate', 1, 10);
                    SensorsService.connectResourceSensorNameLiveFeed(item, 'windstow_active', vm.guid, 'event-rate', 1, 10);
                });

                SensorsService.connectResourceSensorNameLiveFeed('katpool', 'resources_in_maintenance', vm.guid, 'event-rate', 1, 10);
                SensorsService.connectResourceSensorNameLiveFeed('katpool', 'allocations_1', vm.guid, 'event-rate', 1, 5);
                SensorsService.connectResourceSensorNameLiveFeed('katpool', 'allocations_2', vm.guid, 'event-rate', 1, 5);
                SensorsService.connectResourceSensorNameLiveFeed('katpool', 'allocations_3', vm.guid, 'event-rate', 1, 5);
                SensorsService.connectResourceSensorNameLiveFeed('katpool', 'allocations_4', vm.guid, 'event-rate', 1, 5);
                SensorsService.connectResourceSensorNameLiveFeed('katpool', 'subarrays_maintenance', vm.guid, 'event-rate', 1, 5);

                SensorsService.connectResourceSensorNameLiveFeed('subarray_1', 'state', vm.guid, 'event-rate', 1, 10);
                //SensorsService.connectResourceSensorNameLiveFeed('subarray_1', 'pool_resources', vm.guid, 'event-rate', 1, 10);
                SensorsService.connectResourceSensorNameLiveFeed('subarray_2', 'state', vm.guid, 'event-rate', 1, 10);
                //SensorsService.connectResourceSensorNameLiveFeed('subarray_2', 'pool_resources', vm.guid, 'event-rate', 1, 10);
                SensorsService.connectResourceSensorNameLiveFeed('subarray_3', 'state', vm.guid, 'event-rate', 1, 10);
                //SensorsService.connectResourceSensorNameLiveFeed('subarray_3', 'pool_resources', vm.guid, 'event-rate', 1, 10);
                SensorsService.connectResourceSensorNameLiveFeed('subarray_4', 'state', vm.guid, 'event-rate', 1, 10);
                //SensorsService.connectResourceSensorNameLiveFeed('subarray_4', 'pool_resources', vm.guid, 'event-rate', 1, 10);
            });

        vm.statusMessageReceived = function (event, message) {

            if (message.value) {
                var sensor = message.name.split(':')[1];
                var resource = sensor.split('.')[0];
                var sensorName = sensor.split('.')[1];

                //todo make receptorsData a dictionary
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
                        } else if (sensorName.indexOf('allocations_') === 0) {
                            var subarray = sensorName.split('_')[1];
                            if (!vm.subarrays['subarray_' + subarray]) {
                                vm.subarrays['subarray_' + subarray] = {id: subarray};
                            }
                            vm.subarrays['subarray_' + subarray].allocations = JSON.parse(message.value.value);
                        } else if (sensorName = 'subarrays_maintenance') {
                            for (var i = 1; i < 5; i++) {
                                if (!vm.subarrays['subarray_' + i]) {
                                    vm.subarrays['subarray_' + i] = {id: i};
                                }
                                vm.subarrays['subarray_' + i].in_maintenance = false;
                            }
                            var subarrayIdList = message.value.value.split(',');
                            subarrayIdList.forEach(function (id) {
                                if (!vm.subarrays['subarray_' + id]) {
                                    vm.subarrays['subarray_' + id] = {id: id};
                                }
                                vm.subarrays['subarray_' + id].in_maintenance = true;
                            });

                        }
                    } else if (resource.indexOf('subarray_') === 0) {
                        var subarray = resource.split('_')[1];
                        if (!vm.subarrays['subarray_' + subarray]) {
                            vm.subarrays['subarray_' + subarray] = {id: subarray};
                        }
                        //if (sensorName === 'pool_resources') {
                        //    vm.subarrays['subarray_' + subarray]['assigned'] = message.value.value.split(',');
                        //} else {
                            vm.subarrays['subarray_' + subarray][sensorName] = message.value.value;
                        //}
                    } else if (receptor.name === resource) {
                        receptor[sensorName] = message.value;
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


        //todo do this better!
        vm.getReceptorSubarray = function (receptor) {
            var updated = false;
            for (var attr in vm.subarrays) {
                if (vm.subarrays[attr].allocations) {
                    vm.subarrays[attr].allocations.forEach(function (allocation) {
                        if (allocation[0] === receptor.name) {
                            receptor.subarray = vm.subarrays[attr].id;
                            receptor.allocation = allocation;
                            receptor.assignedSubarray = allocation[1] === 'None';
                            receptor.allocatedSubarray = allocation[1] !== 'None';
                            updated = true;
                        }
                    });
                }
            }
            if (!updated) {
                receptor.allocation = '';
                receptor.subarray = '';
                receptor.assignedSubarray = false;
                receptor.allocatedSubarray = false;
            }
        };

        //todo do this better!
        vm.getReceptorSubarrayPerSubarray = function (receptor) {
            vm.getReceptorSubarray(receptor);
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
