(function () {

    angular.module('katGui')
        .controller('OperatorControlCtrl', OperatorControlCtrl);

    function OperatorControlCtrl($rootScope, $scope, $interval, ReceptorStateService, ControlService, KatGuiUtil, $log) {

        var vm = this;
        vm.receptorsData = ReceptorStateService.receptorsData;
        vm.guid = KatGuiUtil.generateUUID();
        vm.disconnectIssued = false;
        vm.connectInterval = null;
        vm.connectionLost = false;
        vm.floodLightSensor = false;

        vm.connectListeners = function () {
            ControlService.connectListener()
                .then(function () {
                    vm.initReceptors();
                    if (vm.connectInterval) {
                        $interval.cancel(vm.connectInterval);
                        vm.connectionLost = false;
                        vm.connectInterval = null;
                        if (!vm.disconnectIssued) {
                            $rootScope.showSimpleToast('Reconnected :)');
                        }
                    }
                }, function () {
                    $log.error('Could not establish control connection. Retrying every 10 seconds.');
                    if (!vm.connectInterval) {
                        vm.connectionLost = true;
                        vm.connectInterval = $interval(vm.connectListeners, 10000);
                    }
                });
            vm.handleSocketTimeout();
        };

        vm.handleSocketTimeout = function () {
            ControlService.getTimeoutPromise()
                .then(function () {
                    if (!vm.disconnectIssued) {
                        $rootScope.showSimpleToast('Connection timeout! Attempting to reconnect...');
                        if (!vm.connectInterval) {
                            vm.connectionLost = true;
                            vm.connectInterval = $interval(vm.connectListeners, 10000);
                            vm.connectListeners();
                        }
                    }
                });
        };

        vm.connectListeners();

        vm.initReceptors = function () {
            ReceptorStateService.getReceptorList();
        };

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

        vm.toggleFloodLights = function () {
            if (vm.floodLightSensor.value){
                ControlService.floodlightsOn("off");
            } else{
                ControlService.floodlightsOn("on");
            }
        };

        //vm.shutdownComputing = function () {
        //    ControlService.shutdownComputing();
        //};

        var stopInterval = $interval(function () {
            vm.receptorsData.forEach(function (item) {
                if (item.lastUpdate) {
                    item.since = moment(item.lastUpdate, 'HH:mm:ss DD-MM-YYYY').format('HH:mm:ss DD-MM-YYYY');
                    item.fromNow = moment(item.lastUpdate, 'HH:mm:ss DD-MM-YYYY').fromNow();
                } else {
                    item.since = "error";
                    item.fromNow = "Connection Error!";
                }
            });
        }, 1000);

        vm.receptorMessageReceived = function (event, message) {
            var sensorNameList = message.name.split(':')[1].split('.');
            var receptor = sensorNameList[0];
            var sensorName = sensorNameList[1];
            if (sensorName === 'vds_flood_lights_on') {
                vm.floodLightSensor = message.value;
            } else {
                ReceptorStateService.receptorsData.forEach(function (item) {
                    if (item.name === receptor && message.value) {
                        if (sensorName === 'mode' && item.status !== message.value.value) {
                            item.state = message.value.value;
                        } else if (sensorName === 'inhibited' && item.inhibited !== message.value.value) {
                            item.inhibited = message.value.value;
                        }
                        item.lastUpdate = moment(message.value.timestamp, 'X').format('HH:mm:ss DD-MM-YYYY');
                    }
                });
            }
        };

        vm.cancelListeningToReceptorMessages = $rootScope.$on('operatorControlStatusMessage', vm.receptorMessageReceived);

        $scope.$on('$destroy', function () {
            if (!vm.connectInterval) {
                $interval.cancel(vm.connectInterval);
            }
            $interval.cancel(stopInterval);
            vm.cancelListeningToReceptorMessages();
            ControlService.disconnectListener();
            vm.disconnectIssued = true;
        });
    }
})();
