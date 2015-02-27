(function () {

    angular.module('katGui')
        .service('ReceptorStateService', ReceptorStateService);

    function ReceptorStateService($rootScope, MonitorService, ConfigService) {

        var api = {receptorsData: []};

        ConfigService.getReceptorList()
            .then(function (receptors) {
                receptors.forEach(function (receptor) {
                    api.receptorsData.push({name: receptor, inhibited: false});
                    MonitorService.subscribeToReceptorUpdates();
                });

            }, function (result) {
                $rootScope.showSimpleDialog('Error', 'Error retrieving receptor list, please contact CAM support');
                console.error(result);
            });

        return api;
    }
})();
