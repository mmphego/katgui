(function () {

    angular.module('katGui.scheduler', ['ui.bootstrap.datetimepicker',
        'katGui.services',
        'katGui.util',
        'ngAnimate'])
        .controller('SchedulerHomeCtrl', SchedulerHomeCtrl);

    function SchedulerHomeCtrl($state, $rootScope, $scope, ObservationScheduleService, ConfigService, MonitorService) {

        ConfigService.loadKATObsPortalURL();
        ObservationScheduleService.connectListener();
        MonitorService.subscribe('sched:pending_requests_*');
        var vm = this;
        vm.childStateShowing = $state.current.name !== 'scheduler';

        vm.stateGo = function (newState) {
            $state.go(newState);
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
            ObservationScheduleService.disconnectListener();
        });
    }
})();
