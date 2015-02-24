(function () {

    angular.module('katGui')
        .service('ReceptorStateService', ReceptorStateService);

    function ReceptorStateService($rootScope, MonitorService) {

        MonitorService.subscribeToReceptorUpdates();

        this.receptorsData = [
            {
                name: "m011",
                inhibited: false
            },
            {
                name: "m022",
                inhibited: false
            },
            {
                name: "m033",
                inhibited: false
            },
            {
                name: "m044",
                inhibited: false
            },
            {
                name: "m055",
                inhibited: false
            }];

        return this;
    }
})();
