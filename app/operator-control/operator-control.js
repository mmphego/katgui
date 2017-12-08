(function () {

    angular.module('katGui')
        .controller('OperatorControlCtrl', OperatorControlCtrl);

    function OperatorControlCtrl($rootScope, $scope, $state, $interval, $log, USER_ROLES, MOMENT_DATETIME_FORMAT,
                                 KatGuiUtil, ControlService, NotifyService, ConfigService, MonitorService) {

        var vm = this;
        vm.subscribedSensors = [];
        vm.receptorsData = [];
        vm.sensorValues = {};
        vm.waitingForRequestResult = false;
        vm.sensorsRegex = 'mode|inhibit|device.status';

        vm.initSensors = function () {
            ConfigService.getReceptorList()
                .then(function (receptors) {
                    receptors.forEach(function (receptor) {
                        vm.receptorsData.push({
                            name: receptor
                        });
                        MonitorService.listSensors(receptor, vm.sensorsRegex);
                    });
                }, function (result) {
                    NotifyService.showSimpleDialog('Error', 'Error retrieving receptor list, please contact CAM support.');
                    $log.error(result);
                });
        };

        vm.statusMessageReceived = function (event, sensor, subject) {
            if (subject.startsWith('req.reply')) {
                MonitorService.subscribeSensor(sensor);
                vm.subscribedSensors.push(sensor);
            }
            vm.sensorValues[sensor.name] = sensor;
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

        vm.getReceptorModeTextClass = function (receptorName) {
            var classes = '';
            var mode = vm.sensorValues[receptorName + '_mode'];
            var windstowActive = vm.sensorValues[receptorName + '_windstow_active'];
            if (mode) {
                if (mode.value === 'POINT') {
                    classes += ' nominal-item';
                } else {
                    classes += ' receptor-' + mode.value.toLowerCase() + '-state';
                }
            }
            if (windstowActive && windstowActive.value) {
                classes += ' error-item';
            }
            return classes;
        };

        vm.canIntervene = function () {
            return $rootScope.expertOrLO || $rootScope.currentUser.req_role === USER_ROLES.operator;
        };

        var unbindSensorUpdates = $rootScope.$on('sensorUpdateMessage', vm.statusMessageReceived);
        var unbindReconnected = $rootScope.$on('websocketReconnected', vm.initSensors);

        vm.initSensors();

        $scope.$on('$destroy', function () {
            vm.subscribedSensors.forEach(function (sensor) {
                MonitorService.unsubscribeSensor(sensor);
            });
            unbindSensorUpdates();
            unbindReconnected();
        });
    }
})();
