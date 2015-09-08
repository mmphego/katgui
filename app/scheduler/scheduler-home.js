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
                               NotifyService) {

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
            SensorsService.setSensorStrategy('katpool', 'subarrays$', 'event', 0, 0);
        };

        vm.unbindUpdate = $rootScope.$on('sensorsServerUpdateMessage', function (event, sensor) {
            var strList = sensor.name.split(':');
            var sensorNameList = strList[1].split('.');

            if (sensorNameList[0] === 'katpool' && sensorNameList[1] === 'subarrays') {

                SensorsService.setSensorStrategy('katpool', 'pool_resources_free', 'event', 0, 0);
                SensorsService.setSensorStrategy('katpool', 'resources_faulty', 'event', 0, 0);
                SensorsService.setSensorStrategy('katpool', 'resources_in_maintenance', 'event', 0, 0);

                ObsSchedService.subarrays.splice(0, ObsSchedService.subarrays.length);
                var subarrays = sensor.value.value.split(',');
                for (var i = 0; i < subarrays.length; i++) {
                    SensorsService.setSensorStrategy('subarray_' + subarrays[i], 'allocations', 'event', 0, 0);
                    SensorsService.setSensorStrategy('subarray_' + subarrays[i], 'product', 'event', 0, 0);
                    SensorsService.setSensorStrategy('subarray_' + subarrays[i], 'state', 'event', 0, 0);
                    SensorsService.setSensorStrategy('subarray_' + subarrays[i], 'band', 'event', 0, 0);
                    SensorsService.setSensorStrategy('sched', 'mode_' + subarrays[i], 'event', 0, 0);
                    SensorsService.setSensorStrategy('subarray_' + subarrays[i], 'config_label', 'event', 0, 0);
                    SensorsService.setSensorStrategy('subarray_' + subarrays[i], 'maintenance', 'event', 0, 0);
                    SensorsService.setSensorStrategy('subarray_' + subarrays[i], 'delegated_ca', 'event', 0, 0);
                    ObsSchedService.subarrays.push({id: subarrays[i]});
                }
            } else if (sensorNameList[0].indexOf('subarray_') === 0) {
                var subarrayIndex = _.findIndex(ObsSchedService.subarrays, function (item) {
                    return item.id === sensorNameList[0].split('_')[1];
                });
                if (subarrayIndex > -1) {
                    if (sensorNameList[1] === 'allocations') {
                        var parsedAllocations = sensor.value.value !== "" ? JSON.parse(sensor.value.value) : [];
                        ObsSchedService.subarrays[subarrayIndex].allocations = [];

                        if (parsedAllocations.length > 0) {
                            for (var m in parsedAllocations) {
                                ObsSchedService.subarrays[subarrayIndex].allocations.push(
                                    {name: parsedAllocations[m][0], allocation: parsedAllocations[m][1]});
                            }
                        }
                    } else if (sensorNameList[1] === 'delegated_ca') {
                        ObsSchedService.subarrays[subarrayIndex][sensorNameList[1]] = sensor.value.value;
                        var iAmCA;
                        for (var i in ObsSchedService.subarrays) {
                            if (ObsSchedService.subarrays[i]['delegated_ca'] === $rootScope.currentUser.email) {
                                iAmCA = true;
                            }
                        }
                        $rootScope.iAmCA = iAmCA && $rootScope.currentUser.req_role === 'control_authority';
                    } else {
                        ObsSchedService.subarrays[subarrayIndex][sensorNameList[1]] = sensor.value.value;
                    }
                } else {
                    $log.error('Unknown subarray sensor value: ');
                    $log.error(sensor.value);
                }
            } else if (sensorNameList[1] === 'pool_resources_free') {
                ObsSchedService.poolResourcesFree.splice(0, ObsSchedService.poolResourcesFree.length);
                var resourcesList = sensor.value.value.split(',');
                if (resourcesList.length > 0 && resourcesList[0] !== '') {
                    for (var i in resourcesList) {
                        ObsSchedService.poolResourcesFree.push({name: resourcesList[i]});
                    }
                }
            } else if (sensorNameList[1].indexOf('mode_') === 0) {
                var subarrayId = sensorNameList[1].split('_')[1];
                var subarray = _.findWhere(ObsSchedService.subarrays, {id: subarrayId});
                if (subarray) {
                    subarray.mode = sensor.value.value;
                }
            } else {
                ObsSchedService[sensorNameList[1]] = sensor.value.value;
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
