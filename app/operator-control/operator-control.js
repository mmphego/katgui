(function () {

    angular.module('katGui')
        .controller('OperatorControlCtrl', OperatorControlCtrl);

    function OperatorControlCtrl($rootScope, $scope, $interval, ReceptorStateService, ControlService) {

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

        //vm.shutdownComputing = function () {
        //    ControlService.shutdownComputing();
        //};

        var stopInterval = $interval(function () {
            vm.receptorsData.forEach(function (item) {
                if (item.lastUpdate) {
                    var ms = moment(new Date()).diff(moment(item.lastUpdate, 'HH:mm:ss DD-MM-YYYY'));
                    var d = moment.duration(ms);
                    item.since = Math.floor(d.asHours()) + moment(ms).format(":mm:ss");
                    item.fromNow = moment(item.lastUpdate, 'HH:mm:ss DD-MM-YYYY').fromNow();
                } else {
                    item.since = "error";
                    item.fromNow = "Connection Error!";
                }
            });
        }, 1000);

        vm.receptorMessageReceived = function (event, message) {
            var sensorNameList = message.name.split(':');
            var sensor = sensorNameList[0];
            var sensorName = sensorNameList[1];
            vm.receptorsData.forEach(function (item) {

                if (item.name === sensor) {
                    if (sensorName === 'mode' && item.state !== message.value) {
                        item.state = message.value;
                    } else if (sensorName === 'inhibited' && item.inhibited !== message.value) {
                        item.inhibited = message.value;
                    }

                    item.lastUpdate = moment(message.time, 'X').format('HH:mm:ss DD-MM-YYYY');
                }

            });
        };

        var cancelListeningToReceptorMessages = $rootScope.$on('receptorMessage', vm.receptorMessageReceived);

        $scope.$on('$destroy', function () {
            $interval.cancel(stopInterval);
            cancelListeningToReceptorMessages();
        });
    }
})();
