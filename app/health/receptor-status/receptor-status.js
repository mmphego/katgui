(function () {

    angular.module('katGui.health')
        .controller('ReceptorStatusCtrl', ReceptorStatusCtrl);

    function ReceptorStatusCtrl($rootScope, $scope, KatGuiUtil, ConfigService, SensorsService, $state, $interval, $log,
                                NotifyService) {

        var vm = this;
        vm.receptorsData = [];
        vm.subarrays = {subarray_free: {id: 'free', state: 'inactive'}};
        vm.sortBySubarrays = false;
        vm.showGraphics = true;
        vm.guid = KatGuiUtil.generateUUID();
        vm.disconnectIssued = false;
        vm.connectInterval = null;
        vm.connectionLost = false;

        vm.receptorSensorsToConnect = [
            'sensors_ok',
            'mode',
            'inhibited',
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
            vm.receptorsData.splice(0, vm.receptorsData.length);
            ConfigService.getReceptorList()
                .then(function (result) {
                    var receptorSensorsRegex = '';
                    result.forEach(function (item, index) {
                        if (index > 0) {
                            receptorSensorsRegex += '|';
                        }
                        vm.receptorsData.push({name: item, subarray: 'free'});
                        for (var i = 0; i < vm.receptorSensorsToConnect.length; i++) {
                            if (i > 0) {
                                receptorSensorsRegex += '|';
                            }
                            receptorSensorsRegex += item + '_' + vm.receptorSensorsToConnect[i];
                        }
                    });
                    receptorSensorsRegex += '|subarray_._state';
                    receptorSensorsRegex += '|subarray_._allocations';
                    receptorSensorsRegex += '|subarray_._maintenance';
                    for (var i = 1; i <= 4; i++) {
                        vm.subarrays['subarray_' + i] = {id: i.toString()};
                    }
                    receptorSensorsRegex += '|katpool_resources_in_maintenance';
                    SensorsService.setSensorStrategies(receptorSensorsRegex, 'event-rate', 1, 10);
                });
        };
        vm.connectListeners();

        vm.statusMessageReceived = function (event, message) {
            if (message.value) {
                var sensor = message.name.split(':')[1];

                vm.receptorsData.forEach(function (receptor) {
                    if (sensor.startsWith('katpool')) {
                        if (sensor.endsWith('resources_in_maintenance')) {
                            receptor.in_maintenance = false;
                            var resourcesList = message.value.value.split(',');
                            resourcesList.forEach(function (res) {
                                if (receptor.name === res) {
                                    receptor.in_maintenance = true;
                                }
                            });
                        }
                    } else if (sensor.startsWith(receptor.name)) {
                        receptor[sensor.replace(receptor.name + '_', '')] = message.value;
                    }
                });

                if (sensor.startsWith('subarray_')) {
                    var resource = sensor.split('_').slice(0, 2).join('_');
                    var sensorName = sensor.replace(resource + '_', '');
                    if (sensor.endsWith('allocations')) {
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
                                        receptor.oldSubarray = receptor.subarray;
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

        vm.getReceptorBlockClass = function (receptor) {
            return receptor.sensors_ok && receptor.sensors_ok.status? receptor.sensors_ok.status + '-item' : 'unknown-item';
        };

        vm.cancelListeningToSensorMessages = $rootScope.$on('sensorsServerUpdateMessage', vm.statusMessageReceived);

        $scope.$on('$destroy', function () {
            vm.cancelListeningToSensorMessages();
            SensorsService.disconnectListener();
        });
    }
})();
