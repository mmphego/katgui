(function () {

    angular.module('katGui.health')
        .controller('ReceptorStatusCtrl', ReceptorStatusCtrl);

    function ReceptorStatusCtrl($rootScope, ConfigService, MonitorService, StatusService) {

        var vm = this;
        vm.receptorStatusTree = ConfigService.receptorStatusTree;
        vm.receptorList = ConfigService.receptorList;
        vm.statusData = StatusService.statusData;

        vm.items = [
            {value: 'tree', name: 'Treemap'},
            {value: 'pack', name: 'Pack'},
            {value: 'partition', name: 'Partition'},
            {value: 'icicle', name: 'Icicle'},
            {value: 'sunburst', name: 'Sunburst'}
        ];

        vm.treeChartSize = {
            width: 800,
            height: 500
        };

        vm.mapType = 'partition';

        //ConfigService.getStatusTreeForReceptor()
        //    .then(function (statusTreeResult) {
        //
        //    });

        ConfigService.getReceptorList()
            .then(function(receptors) {
                StatusService.setReceptors(receptors);
                receptors.forEach(function(item) {
                    MonitorService.subscribe('mon_*:agg_' + item + '*');
                });
            });
    }
})();
