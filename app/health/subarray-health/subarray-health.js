(function () {

    angular.module('katGui.health')
        .controller('SubarrayHealthCtrl', SubarrayHealthCtrl);

    function SubarrayHealthCtrl(ConfigService, StatusService, $localStorage, $rootScope) {

        var vm = this;
        vm.receptorHealthTree = ConfigService.receptorHealthTree;
        vm.receptorList = StatusService.receptors;

        vm.populateTree = function (parent, receptor) {
            if (parent.children && parent.children.length > 0) {
                parent.children.forEach(function (child) {
                    vm.populateTree(child, receptor);
                });
            } else if (parent.subs && parent.subs.length > 0) {
                parent.subs.forEach(function (sub) {
                    if (!parent.children) {
                        parent.children = [];
                    }
                    parent.children.push({name: sub, sensor: sub, hidden: true});
                });
            }
        };

        vm.redrawCharts = function () {
            $rootScope.$emit('redrawChartMessage', [{id: 1, pool_resources: 'm044,m022'}, {id: 2, pool_resources: 'm011,m033'}, {id: 3, pool_resources: 'm055'}]);
        }

        ConfigService.getStatusTreeForReceptor()
            .then(function (result) {
                ConfigService.getReceptorList()
                    .then(function (receptors) {
                        StatusService.setReceptorsAndStatusTree(result.data, receptors);
                        for (var receptor in StatusService.statusData) {
                            //recursively populate children
                            vm.populateTree(StatusService.statusData[receptor], receptor);
                        }
                        vm.redrawCharts();
                    });
            });
    }
})();
