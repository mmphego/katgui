(function () {

    angular.module('katGui.scheduler')
        .controller('SchedulerHomeCtrl', SchedulerHomeCtrl);

    function SchedulerHomeCtrl($state, $rootScope, $scope, ObservationScheduleService) {

        ObservationScheduleService.connectListener();
        var vm = this;
        vm.childStateShowing = $state.current.name !== 'scheduler';

        vm.stateGo = function (newState) {
            $state.go(newState);
        };

        var unbindStateChangeStart = $rootScope.$on('$stateChangeStart', function (event, toState) {

            if (toState.name === 'scheduler.drafts' ||
                toState.name === 'scheduler.resources' ||
                toState.name === 'scheduler.execute' ||
                toState.name === 'scheduler.subarrays') {
                vm.childStateShowing = true;
            } else {
                vm.childStateShowing = false;
            }
        });

        vm.svgLoaded = function (targetElementToGetColorFromId) {
            angular.element('.svg-receptor').css('fill', angular.element(targetElementToGetColorFromId).css('color'));
            angular.element('.svg-receptor').css('stroke', angular.element(targetElementToGetColorFromId).css('color'));
        };

        vm.svgLoadedThatContainsOpacity = function (targetElementToGetColorFromId) {
            angular.element('.svg-receptor-with-opacity').css('fill', angular.element(targetElementToGetColorFromId).css('color'));
        };

        $scope.$on('$destroy', function () {
            unbindStateChangeStart();
            ObservationScheduleService.disconnectListener();
        });
    }
})();
