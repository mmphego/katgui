(function () {

    angular.module('katGui')
        .controller('OperatorControlCtrl', OperatorControlCtrl);

    function OperatorControlCtrl($rootScope, $scope, $state, $interval, $log, USER_ROLES, DATETIME_FORMAT, ReceptorStateService,
                                 KatGuiUtil, ControlService, NotifyService, ConfigService, SensorsService) {

        var vm = this;

        vm.receptorsData = [];
        vm.sensorValues = {};
        vm.waitingForRequestResult = false;
        vm.canIntervene = false;
        vm.connectInterval = null;
        vm.sensorsToConnectRegex = '^(m...|ant.).(mode|inhibit|sensors.ok)';

        vm.connectListeners = function () {
            SensorsService.connectListener()
                .then(function () {
                    vm.initSensors();
                    if (vm.connectInterval) {
                        $interval.cancel(vm.connectInterval);
                        vm.connectionLost = false;
                        vm.connectInterval = null;
                        NotifyService.showSimpleToast('Reconnected :)');
                    }
                }, function () {
                    $log.error('Could not establish sensor connection. Retrying every 10 seconds.');
                    if (!vm.connectInterval) {
                        vm.connectionLost = true;
                        vm.connectInterval = $interval(vm.connectListeners, 10000);
                    }
                });
            vm.handleSocketTimeout();
        };

        vm.handleSocketTimeout = function () {
            SensorsService.getTimeoutPromise()
                .then(function () {
                    if (!vm.disconnectIssued) {
                        NotifyService.showSimpleToast('Connection timeout! Attempting to reconnect...');
                        if (!vm.connectInterval) {
                            vm.connectionLost = true;
                            vm.connectInterval = $interval(vm.connectListeners, 10000);
                            vm.connectListeners();
                        }
                    }
                });
        };

        vm.connectListeners();

        vm.initSensors = function () {
            ConfigService.getReceptorList()
                .then(function (receptors) {
                    receptors.forEach(function (receptor) {
                        var modeValue = '';
                        var lastUpdate = null;
                        if (vm.sensorValues[receptor + '_' + 'mode']) {
                            modeValue = vm.sensorValues[receptor + '_' + 'mode'].value;
                            lastUpdate = vm.sensorValues[receptor + '_' + 'mode'].timestamp;
                        }
                        var inhibitValue = false;
                        if (vm.sensorValues[receptor + '_' + 'inhibited']) {
                            inhibitValue = vm.sensorValues[receptor + '_' + 'inhibited'].value;
                            lastUpdate = vm.sensorValues[receptor + '_' + 'mode'].timestamp;
                        }
                        var lastUpdateValue;
                        if (lastUpdate) {
                            lastUpdateValue = moment(lastUpdate, 'X').format(DATETIME_FORMAT);
                        }
                        SensorsService.setSensorStrategies(vm.sensorsToConnectRegex, 'event-rate', 1, 360);
                        vm.receptorsData.push({
                            name: receptor,
                            inhibited: inhibitValue,
                            state: modeValue,
                            lastUpdate: lastUpdateValue
                        });
                    });
                }, function (result) {
                    NotifyService.showSimpleDialog('Error', 'Error retrieving receptor list, please contact CAM support.');
                    $log.error(result);
                });

        };

        vm.statusMessageReceived = function (event, message) {
            var sensor = message.name.split(':')[1];
            vm.sensorValues[sensor] = message.value;
        };

        vm.stowAll = function () {
            vm.waitingForRequestResult = true;
            vm.handleRequestResponse(ControlService.stowAll());
        };

        vm.inhibitAll = function () {
            vm.waitingForRequestResult = true;
            vm.handleRequestResponse(ControlService.inhibitAll());
        };

        vm.stopAll = function () {
            vm.waitingForRequestResult = true;
            vm.handleRequestResponse(ControlService.stopAll());
        };

        vm.resumeOperations = function () {
            vm.waitingForRequestResult = true;
            vm.handleRequestResponse(ControlService.resumeOperations());
        };

        vm.shutdownComputing = function (event) {
            NotifyService.showImportantConfirmDialog(event, 'Confirm Shutdown',
                'Are you sure you want to shutdown all computing?',
                'Yes', 'Cancel')
                    .then(function () {
                        vm.waitingForRequestResult = true;
                        vm.handleRequestResponse(ControlService.shutdownComputing());
                    }, function () {
                        NotifyService.showSimpleToast('Cancelled Shutdown');
                    });
        };

        vm.shutdownSPCorr = function (event) {
            NotifyService.showImportantConfirmDialog(event, 'Confirm Shutdown',
                'Are you sure you want to powerdown SP and the Correlators?',
                'Yes', 'Cancel')
                    .then(function () {
                        vm.waitingForRequestResult = true;
                        vm.handleRequestResponse(ControlService.shutdownSPCorr());
                    }, function () {
                        NotifyService.showSimpleToast('Cancelled Shutdown');
                    });
        };

        vm.handleRequestResponse = function (request) {
            request
                .then(function (result) {
                    vm.waitingForRequestResult = false;
                    var splitMessage = result.data.result.split(' ');
                    var message = KatGuiUtil.sanitizeKATCPMessage(result.data.result);
                    if (splitMessage.length > 2 && splitMessage[1] !== 'ok') {
                        NotifyService.showPreDialog('Error sending request', message);
                    } else {
                        NotifyService.showSimpleToast(message);
                    }
                }, function (error) {
                    vm.waitingForRequestResult = false;
                    NotifyService.showHttpErrorDialog('Error sending request', error);
                });
        };

        vm.afterInit = function() {
            vm.canIntervene = $rootScope.expertOrLO || $rootScope.currentUser.req_role === USER_ROLES.operator;
        };

        vm.cancelListeningToSensorMessages = $rootScope.$on('sensorsServerUpdateMessage', vm.statusMessageReceived);
        vm.unbindLoginSuccess = $rootScope.$on('loginSuccess', vm.afterInit);
        vm.afterInit();

        $scope.$on('$destroy', function () {
            if (vm.unbindLoginSuccess) {
                vm.unbindLoginSuccess();
            }
            vm.cancelListeningToSensorMessages();
            vm.disconnectIssued = true;
            SensorsService.disconnectListener();
        });
    }
})();
