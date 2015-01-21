(function(){

    angular.module('katGui.scheduler')
        .controller('SchedulerHomeCtrl', SchedulerHomeCtrl);

    function SchedulerHomeCtrl($state) {

        var vm = this;

        vm.stateGo = function (newState) {
            $state.go(newState);
        };

        vm.svgLoaded = function (targetElementToGetColorFromId) {
            angular.element('.svg-receptor').css('fill', angular.element(targetElementToGetColorFromId).css('color'));
            angular.element('.svg-receptor').css('stroke', angular.element(targetElementToGetColorFromId).css('color'));
        };

        vm.svgLoadedThatContainsOpacity = function (targetElementToGetColorFromId) {
            angular.element('.svg-receptor-with-opacity').css('fill', angular.element(targetElementToGetColorFromId).css('color'));
        };
    }
})();
