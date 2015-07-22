(function () {

    //ssh to the box, do
    //motion -n -c /var/kat/vds_motion.conf
    angular.module('katGui.video', ['katGui.services'])
        .controller('VideoCtrl', VideoCtrl);

    function VideoCtrl($scope, $rootScope, $http, $log, $interval, $timeout, SensorsService, SERVER_URL) {

        var vm = this;
        var urlBase = SERVER_URL + '/katvds/api/v1';
        vm.imageSource = 'http://monctl.devo.camlab.kat.ac.za:8083';
        vm.sensorValues = {};

        vm.panLeft = function () {
            var newPanValue = vm.sensorValues.vds_pan_position.value - 5;
            if (newPanValue < 0) {
                newPanValue = 0;
            }
            vm.vdsCommand('pan/to', newPanValue);
        };

        vm.panFarLeft = function () {
            vm.vdsCommand('pan', 'left');
        };

        vm.panRight = function () {
            var newPanValue = vm.sensorValues.vds_pan_position.value + 5;
            if (newPanValue > 270) {
                newPanValue = 270;
            }
            vm.vdsCommand('pan/to', newPanValue);
        };

        vm.panFarRight = function () {
            vm.vdsCommand('pan', 'right');
        };

        vm.tiltUp = function () {
            var newTiltValue = vm.sensorValues.vds_tilt_position.value - 5;
            if (newTiltValue < -1) {
                newTiltValue = 0;
            }
            vm.vdsCommand('tilt/to', newTiltValue);
        };

        vm.tiltFarUp = function () {
            vm.vdsCommand('tilt', 'up');
        };

        vm.tiltDown = function () {
            var newTiltValue = vm.sensorValues.vds_tilt_position.value + 5;
            if (newTiltValue > 60) {
                newTiltValue = 0;
            }
            vm.vdsCommand('tilt/to', newTiltValue);
        };

        vm.tiltFarDown = function () {
            vm.vdsCommand('tilt', 'down');
        };

        vm.rememberPos = function () {
            vm.vdsCommand('presetset', 120);
        };

        vm.zoomChanged = function (zoomValue) {
            vm.vdsCommand('zoom/to', zoomValue);
        };

        vm.focusChanged = function (focusValue) {
            vm.vdsCommand('focus/to', focusValue);
        };

        vm.cyclePos = function () {
        };

        vm.vdsCommand = function (endpoint, args) {
            $http.get(urlBase + '/' + endpoint + '/' + args)
                .success(requestSuccess)
                .error(requestError);
        };

        function requestSuccess (result) {
            $rootScope.showSimpleToast(result);
        }

        function requestError (result) {
            $rootScope.showSimpleDialog('Error sending VDS command.', result);
        }


        vm.connectListeners = function () {
            SensorsService.connectListener()
                .then(function () {
                    vm.initSensors();
                    if (vm.connectInterval) {
                        $interval.cancel(vm.connectInterval);
                        vm.connectInterval = null;
                        if (!vm.disconnectIssued) {
                            $rootScope.showSimpleToast('Reconnected :)');
                        }
                    }
                }, function () {
                    $log.error('Could not establish sensor connection. Retrying every 10 seconds.');
                    if (!vm.connectInterval) {
                        vm.connectInterval = $interval(vm.connectListeners, 10000);
                    }
                });
            vm.handleSocketTimeout();
        };

        vm.handleSocketTimeout = function () {
            SensorsService.getTimeoutPromise()
                .then(function () {
                    if (!vm.disconnectIssued) {
                        $rootScope.showSimpleToast('Connection timeout! Attempting to reconnect...');
                        if (!vm.connectInterval) {
                            vm.connectInterval = $interval(vm.connectListeners, 10000);
                            vm.connectListeners();
                        }
                    }
                });
        };

        vm.initSensors = function () {
            SensorsService.setSensorStrategy('anc', 'vds_*', 'event', 0, 0);
        };

        vm.connectListeners();

        var unbindUpdate = $rootScope.$on('sensorsServerUpdateMessage', function (event, sensor) {
            var strList = sensor.name.split(':');
            var sensorName = strList[1].split('.')[1];
            vm.sensorValues[sensorName] = sensor.value;
            $log.info(sensor.value);
        });

        $scope.$on('$destroy', function () {
            unbindUpdate();
            vm.disconnectIssued = true;
            SensorsService.disconnectListener();
        });
    }
})();


