(function() {

    function ProgramBlocksCtrl(ObsSchedService, $scope) {
        var vm = this;
        $scope.parent = $scope.$parent;

        vm.pbsOrderByFields = [
            {label: 'PB ID', value: 'pb_id', reverse: true},
            {label: 'Description', value: 'description'},
            {label: 'Observation Spec', value: 'obs_spec'},
            {label: 'State', value: 'state'},
            {label: 'Desired LST Start Time', value: 'desired_lst_start_time'},
            {label: 'Desired Start Time', value: 'desired_start_time'}
        ];

        vm.setPBsOrderBy = function(column) {
            var newOrderBy = _.findWhere(vm.pbsOrderByFields, {value: column});
            if ((vm.pbsOrderBy || {}).value === column) {
                if (newOrderBy.reverse === undefined) {
                    newOrderBy.reverse = true;
                } else if (newOrderBy.reverse) {
                    newOrderBy.reverse = undefined;
                    newOrderBy = null;
                }
            }
            vm.pbsOrderBy = newOrderBy;
        };

        vm.sbCount = function (pb) {
            return pb.schedule_blocks.length;
        };

        vm.setPBsOrderBy('pb_id');
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
