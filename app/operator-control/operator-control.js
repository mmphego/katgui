(function () {

    angular.module('katGui')
        .controller('OperatorControlCtrl', OperatorControlCtrl);

    function OperatorControlCtrl($interval, ReceptorStateService, ControlService) {

        var vm = this;

        vm.receptorsData = ReceptorStateService.receptorsData;

        vm.stowAll = function () {
            ControlService.stowAll();
        };

        vm.inhibitAll = function () {
            ControlService.inhibitAll();
        };

        vm.stopAll = function () {
            ControlService.stopAll();
        };

        vm.resumeOperations = function () {
            ControlService.resumeOperations();
        };

        vm.shutdownComputing = function () {
            ControlService.shutdownComputing();
        };

        $interval(updateReceptorLastChangeDate, 1000);

        function updateReceptorLastChangeDate() {
            ReceptorStateService.receptorsData.forEach(function (item) {
                var ms = moment(new Date()).diff(moment(item.lastUpdate, 'HH:mm:ss DD-MM-YYYY'));
                var d = moment.duration(ms);
                item.since = Math.floor(d.asHours()) + moment(ms).format(":mm:ss");
            });
        }
    }
})();
