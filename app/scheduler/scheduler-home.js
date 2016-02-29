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
                               NotifyService, MonitorService, ConfigService, $stateParams, $q) {

        var vm = this;
        vm.childStateShowing = $state.current.name !== 'scheduler';
        vm.subarrays = ObsSchedService.subarrays;
        vm.disconnectIssued = false;
        vm.connectInterval = null;
        vm.connectionLost = false;
        vm.waitForSubarrayToExistDeferred = $q.defer();
        vm.subarray = null;

        $rootScope.stateGoWithSubId = function (newState, subarray_id) {
            $state.go(newState, {subarray_id: subarray_id});
            vm.subarray = _.findWhere(ObsSchedService.subarrays, {id: subarray_id});
        };

        vm.unbindStateChangeStart = $rootScope.$on('$stateChangeStart', function (event, toState) {
            vm.childStateShowing = (toState.name === 'scheduler.drafts' ||
                toState.name === 'scheduler.resources' ||
                toState.name === 'scheduler.execute' ||
                toState.name === 'scheduler.subarrays' ||
                toState.name === 'scheduler.observations' ||
                toState.name === 'scheduler.observations.detail');
        });

        MonitorService.subscribe('sched');
        ObsSchedService.getScheduleBlocks();
        ObsSchedService.getScheduledScheduleBlocks();

        vm.checkCASubarrays = function () {
            for (var i = 0; i < ObsSchedService.subarrays.length; i++) {
                if ($stateParams.subarray_id === ObsSchedService.subarrays[i].id) {
                    vm.subarray = ObsSchedService.subarrays[i];
                    vm.waitForSubarrayToExistDeferred.resolve();
                    vm.iAmCA = vm.subarray.delegated_ca === $rootScope.currentUser.email;
                }
            }
        };

        vm.checkCASubarrays();
        if (!vm.subarray) {
            vm.unbindWatchSubarrays = $scope.$watchCollection('vm.subarrays', function () {
                vm.checkCASubarrays();
            });
        }

        vm.unbindDelegateWatch = $scope.$watch('vm.subarray.delegated_ca', function (newVal) {
            vm.checkCASubarrays();
        });

        vm.waitForSubarrayToExist = function () {
            return vm.waitForSubarrayToExistDeferred.promise;
        };

        $scope.$on('$destroy', function () {
            MonitorService.unsubscribe('sched', '*');
            vm.unbindStateChangeStart();

            if (vm.connectInterval) {
                $interval.cancel(vm.connectInterval);
            }
            if (vm.unbindWatchSubarrays) {
                vm.unbindWatchSubarrays();
            }
            SensorsService.disconnectListener();
            vm.disconnectIssued = true;
        });
    }
})();
