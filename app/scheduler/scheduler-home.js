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

        MonitorService.subscribe('sched');
        ObsSchedService.getScheduleBlocks();
        ObsSchedService.getScheduledScheduleBlocks();

        $scope.$on('$destroy', function () {
            MonitorService.unsubscribe('sched', '*');
            vm.unbindStateChangeStart();

            if (vm.connectInterval) {
                $interval.cancel(vm.connectInterval);
            }
            SensorsService.disconnectListener();
            vm.disconnectIssued = true;
        });
    }
})();
