(function () {

    angular.module('katGui.scheduler', ['ui.bootstrap.datetimepicker',
        'katGui.services',
        'katGui.util',
        'ngAnimate'])
        .constant('SCHEDULE_BLOCK_TYPES', [
            'MAINTENANCE',
            'OBSERVATION',
            'MANUAL'])
        .controller('SchedulerHomeCtrl', SchedulerHomeCtrl);

    function SchedulerHomeCtrl($state, $rootScope, $scope, $interval, $log, SensorsService, ObsSchedService,
                               NotifyService, MonitorService, ConfigService) {

        var vm = this;
        vm.childStateShowing = $state.current.name !== 'scheduler';
        vm.subarrays = ObsSchedService.subarrays;
        vm.disconnectIssued = false;
        vm.connectInterval = null;
        vm.connectionLost = false;

        vm.connectListeners = function () {
            SensorsService.connectListener()
                .then(function () {
                    vm.initSensors();
                    if (vm.connectInterval) {
                        $interval.cancel(vm.connectInterval);
                        vm.connectInterval = null;
                        if (!vm.disconnectIssued) {
                            NotifyService.showSimpleToast('Reconnected :)');
                        }
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
                        NotifyService.showSimpleToast('Connection timeout! Attempting to reconnect...');
                        if (!vm.connectInterval) {
                            vm.connectInterval = $interval(vm.connectListeners, 10000);
                            vm.connectListeners();
                        }
                    }
                });
        };

        vm.connectListeners();

        vm.initSensors = function () {
            ObsSchedService.subarrays.splice(0, ObsSchedService.subarrays.length);
            MonitorService.subscribe('sched');
            var strategiesRegex = 'katpool_pool_resources_free|katpool_resources_faulty|katpool_resources_in_maintenance';

            ConfigService.getSystemConfig()
                .then(function (systemConfig) {
                    var subarray_nrs = systemConfig.system.subarray_nrs.split(',');
                    subarray_nrs.forEach(function (sub_nr) {
                        ObsSchedService.subarrays.push({id: sub_nr});
                    });
                    strategiesRegex += '|subarray_._allocations';
                    strategiesRegex += '|subarray_._product';
                    strategiesRegex += '|subarray_._state';
                    strategiesRegex += '|subarray_._band';
                    strategiesRegex += '|subarray_._config_label';
                    strategiesRegex += '|subarray_._maintenance';
                    strategiesRegex += '|subarray_._delegated_ca';
                    strategiesRegex += '|sched_mode_.';

                    SensorsService.setSensorStrategies(strategiesRegex, 'event-rate', 1, 360);
                });
        };

        vm.unbindUpdate = $rootScope.$on('sensorsServerUpdateMessage', function (event, sensor) {
            var sensorName = sensor.name.split(':')[1];

            if (sensorName.startsWith('subarray_')) {
                var subarrayIndex = _.findIndex(ObsSchedService.subarrays, function (item) {
                    return item.id === sensorName.split('_')[1];
                });
                if (subarrayIndex > -1) {
                    var trimmedSensorName = sensorName.replace('subarray_' + ObsSchedService.subarrays[subarrayIndex].id + '_', '');
                    if (sensorName.endsWith('allocations')) {
                        var parsedAllocations = sensor.value.value !== "" ? JSON.parse(sensor.value.value) : [];
                        if (!ObsSchedService.subarrays[subarrayIndex].allocations) {
                            ObsSchedService.subarrays[subarrayIndex].allocations = [];
                        } else {
                           ObsSchedService.subarrays[subarrayIndex].allocations.splice(0, ObsSchedService.subarrays[subarrayIndex].allocations.length);
                        }
                        if (parsedAllocations.length > 0) {
                            for (var m in parsedAllocations) {
                                ObsSchedService.subarrays[subarrayIndex].allocations.push(
                                    {name: parsedAllocations[m][0], allocation: parsedAllocations[m][1]});
                            }
                        }
                    } else if (sensorName.endsWith('delegated_ca')) {
                        ObsSchedService.subarrays[subarrayIndex][trimmedSensorName] = sensor.value.value;
                        var iAmCA;
                        for (var idx in ObsSchedService.subarrays) {
                            if (ObsSchedService.subarrays[idx]['delegated_ca'] === $rootScope.currentUser.email) {
                                iAmCA = true;
                            }
                        }
                        $rootScope.iAmCA = iAmCA && $rootScope.currentUser.req_role === 'control_authority';
                    } else {
                        ObsSchedService.subarrays[subarrayIndex][trimmedSensorName] = sensor.value.value;
                    }
                } else {
                    $log.error('Unknown subarray sensor value: ');
                    $log.error(sensor.value);
                }
            } else if (sensorName.endsWith('pool_resources_free')) {
                ObsSchedService.poolResourcesFree.splice(0, ObsSchedService.poolResourcesFree.length);
                var resourcesList = sensor.value.value.split(',');
                if (resourcesList.length > 0 && resourcesList[0] !== '') {
                    for (var index in resourcesList) {
                        ObsSchedService.poolResourcesFree.push({name: resourcesList[index]});
                    }
                }
            } else if (sensorName.indexOf('mode_') > -1) {
                var subarrayId = sensorName.split('_')[2];
                var subarray = _.findWhere(ObsSchedService.subarrays, {id: subarrayId});
                if (subarray) {
                    subarray.mode = sensor.value.value;
                }
            } else {
                var trimmed = sensorName.replace('katpool_', '');
                ObsSchedService[trimmed] = sensor.value.value;
            }
        });

        $rootScope.stateGoWithSubId = function (newState, subarray_id) {
            $state.go(newState, {subarray_id: subarray_id});
        };

        vm.unbindStateChangeStart = $rootScope.$on('$stateChangeStart', function (event, toState) {
            vm.childStateShowing = (toState.name === 'scheduler.drafts' ||
                toState.name === 'scheduler.resources' ||
                toState.name === 'scheduler.execute' ||
                toState.name === 'scheduler.subarrays' ||
                toState.name === 'scheduler.observations' ||
                toState.name === 'scheduler.observations.detail');
        });

        ObsSchedService.getScheduleBlocks();
        ObsSchedService.getScheduledScheduleBlocks();

        $scope.$on('$destroy', function () {
            MonitorService.unsubscribe('sched', '*');
            vm.unbindStateChangeStart();
            vm.unbindUpdate();

            if (vm.connectInterval) {
                $interval.cancel(vm.connectInterval);
            }
            SensorsService.disconnectListener();
            vm.disconnectIssued = true;
        });
    }
})();
