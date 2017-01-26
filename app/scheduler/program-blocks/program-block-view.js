(function() {

    function ProgramBlocksCtrl(ObsSchedService, $scope) {
        var vm = this;
        $scope.parent = $scope.$parent;
    }

    angular.module('katGui.scheduler')
        .component('programBlocks', {
            controllerAs: 'vm',
            controller: ProgramBlocksCtrl,
            templateUrl: 'app/scheduler/program-blocks/program-block-view.html',
            bindings: {
                programBlocks: '='
            }
        });
})();
