(function() {

    function ProgramBlocksCtrl(ObsSchedService) {
        var vm = this;
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
