angular.module('katGui')

    .controller('OperatorControlCtrl', function ($rootScope, $scope, $interval, ReceptorStateService, ControlService) {

        $scope.receptorsData = ReceptorStateService.receptorsData;

        $scope.stowAll = function () {
            ControlService.stowAll();
        };

        $scope.inhibitAll = function () {
            ControlService.inhibitAll();
        };

        $scope.stopAll = function () {
            ControlService.stopAll();
        };

        $scope.resumeOperations = function () {
            ControlService.resumeOperations();
        };

        $scope.shutdownComputing = function () {
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
    });
