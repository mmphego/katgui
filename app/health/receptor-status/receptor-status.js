(function () {

    angular.module('katGui.health')
        .controller('ReceptorStatusCtrl', ReceptorStatusCtrl);

    function ReceptorStatusCtrl($rootScope, $scope, KatGuiUtil, ConfigService, SensorsService, $state, $interval, $log) {

        var vm = this;
        vm.receptorsData = [];
        vm.subarrays = {subarray_free: {id: 'free', state: 'inactive'}};
        vm.sortBySubarrays = false;
        vm.guid = KatGuiUtil.generateUUID();
        vm.disconnectIssued = false;
        vm.connectInterval = null;

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

        vm.connectListeners = function () {
            SensorsService.connectListener()
                .then(function () {
                    vm.initSensors();
                    if (vm.connectInterval) {
                        $interval.cancel(vm.connectInterval);
                        vm.connectInterval = null;
                        $rootScope.showSimpleToast('Reconnected :)');
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
                        $rootScope.showSimpleToast('Connection timeout! Attempting to reconnect...');
                        if (!vm.connectInterval) {
                            vm.connectInterval = $interval(vm.connectListeners, 10000);
                            vm.connectListeners();
                        }
                    }
                });
        };

        vm.initSensors = function () {
            vm.receptorsData.splice(0, vm.receptorsData.length);
            ConfigService.getReceptorList()
                .then(function (result) {
                    result.forEach(function (item) {
                        vm.receptorsData.push({name: item, subarray: 'free'});
                        SensorsService.connectResourceSensorNamesLiveFeedWithList(item, vm.receptorSensorsToConnect, vm.guid, 'event-rate', 1, 10);
                    });
                    for (var i = 1; i <= 4; i++) {
                        SensorsService.connectResourceSensorNamesLiveFeedWithList('subarray_' + i, vm.subarraySensorsToConnect, vm.guid, 'event-rate', 1, 10);
                    }
                    SensorsService.connectResourceSensorNameLiveFeed('katpool', 'resources_in_maintenance', vm.guid, 'event-rate', 1, 10);
                });
        };
        vm.connectListeners();

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

                if (resource.indexOf('subarray_') === 0) {
                    if (!vm.subarrays[resource]) {
                        vm.subarrays[resource] = {id: resource.split('_')[1]};
                    }
                    if (sensorName === 'allocations') {
                        if (message.value.value.length > 0) {
                            vm.subarrays[resource]['oldAllocations'] = vm.subarrays[resource]['allocations'];
                            var newAllocations = JSON.parse(message.value.value);
                            vm.subarrays[resource]['allocations'] = newAllocations;
                            var oldAllocsToFree = [];
                            _.each(vm.subarrays[resource]['oldAllocations'], function (oldAllocation) {
                                var foundOldAlloc = _.find(newAllocations, function (newAllocation) {
                                   return oldAllocation[0] === newAllocation[0];
                                });
                                if (!foundOldAlloc) {
                                    oldAllocsToFree.push(oldAllocation);
                                }
                            });
                            if (oldAllocsToFree.length > 0) {
                                oldAllocsToFree.forEach(function (oldAlloc) {
                                    var receptor = _.find(vm.receptorsData, function (receptor) {
                                        return receptor.name === oldAlloc[0];
                                    });
                                    if (receptor) {
                                        receptor.subarray = 'free';
                                    }
                                });

                            }
                        } else {
                            vm.subarrays[resource]['allocations'] = [];
                        }

                        var receptorsChangedSubarrays = [];

                        vm.receptorsData.forEach(function (receptor) {
                            _.find(vm.subarrays[resource].allocations, function (d) {
                                if (d[0] === receptor.name) {
                                    var subarrayId = resource.split('_')[1];
                                    if (subarrayId !== receptor.subarray) {
                                        receptor.oldSubarray = receptor.subarray
                                        receptorsChangedSubarrays.push(receptor);
                                    }
                                    receptor.subarray = subarrayId;
                                    if (d[1] === 'None') {
                                        receptor.allocatedSubarray = false;
                                        receptor.assignedSubarray = true;
                                    } else {
                                        receptor.allocatedSubarray = true;
                                        receptor.assignedSubarray = false;
                                    }
                                    return true;
                                }
                                return false;
                            });
                        });

                        //resource moved from one subarray to another
                        _.each(receptorsChangedSubarrays, function (receptor) {
                            var oldAlloc = _.find(vm.subarrays['subarray_' + receptor.oldSubarray].allocations, function (d) {
                                return d[0] === receptor.name;
                            });
                            if (oldAlloc) {
                                var oldAllocIndex = vm.subarrays['subarray_' + receptor.oldSubarray].allocations.indexOf(oldAlloc);
                                vm.subarrays['subarray_' + receptor.oldSubarray].allocations.splice(oldAllocIndex, 1);
                            }
                            delete receptor.oldSubarray;
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
