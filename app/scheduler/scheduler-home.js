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

    function SchedulerHomeCtrl($state, $rootScope, $scope, ObservationScheduleService, ConfigService, $interval) {

        ConfigService.loadKATObsPortalURL();
        var vm = this;
        vm.childStateShowing = $state.current.name !== 'scheduler';
        vm.disconnectIssued = false;
        vm.connectInterval = null;
        vm.connectionLost = false;

        vm.connectListeners = function () {
            ObservationScheduleService.connectListener()
                .then(function () {
                    if (vm.connectInterval) {
                        $interval.cancel(vm.connectInterval);
                        vm.connectionLost = false;
                        vm.connectInterval = null;
                        if (!vm.disconnectIssued) {
                            $rootScope.showSimpleToast('Reconnected :)');
                        }
                    }
                }, function () {
                    $log.error('Could not establish scheduler connection. Retrying every 10 seconds.');
                    if (!vm.connectInterval) {
                        vm.connectionLost = true;
                        vm.connectInterval = $interval(vm.connectListeners, 10000);
                    }
                });
            vm.handleSocketTimeout();
        };

        vm.handleSocketTimeout = function () {
            ObservationScheduleService.getTimeoutPromise()
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

        vm.stateGo = function (newState) {
            $state.go(newState);
        };

        vm.stateGoObservationSchedules = function (subarray_id) {
            $state.go('scheduler.observations.detail', {subarray_id: subarray_id});
        };

        vm.unbindStateChangeStart = $rootScope.$on('$stateChangeStart', function (event, toState) {
            if (toState.name === 'scheduler.drafts' ||
                toState.name === 'scheduler.resources' ||
                toState.name === 'scheduler.execute' ||
                toState.name === 'scheduler.subarrays' ||
                toState.name === 'scheduler.observations' ||
                toState.name === 'scheduler.observations.detail') {
                vm.childStateShowing = true;
            } else {
                vm.childStateShowing = false;
            }
        });

        $scope.$on('$destroy', function () {
            vm.unbindStateChangeStart();

            if (!vm.connectInterval) {
                $interval.cancel(vm.connectInterval);
            }
            ObservationScheduleService.disconnectListener();
            vm.disconnectIssued = true;
        });
    }
})();
