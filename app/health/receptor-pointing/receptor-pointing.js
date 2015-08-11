(function () {

    angular.module('katGui.health')
        .controller('ReceptorPointingCtrl', ReceptorPointingCtrl);

    function ReceptorPointingCtrl($rootScope, $scope, KatGuiUtil, ConfigService, SensorsService, $interval, $log,
                                  NotifyService) {

        var vm = this;
        vm.receptorsData = [];
        vm.guid = KatGuiUtil.generateUUID();
        vm.disconnectIssued = false;
        vm.connectInterval = null;
        vm.connectionLost = false;
        vm.targets = [];
        vm.targetsToDisplay = [];
        vm.filters = [];

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

        vm.sensorsToConnect = [
            'ap_actual_azim',
            'ap_actual_elev',
            'ap_requested_azim',
            'ap_requested_elev',
            'pos_request_base_dec',
            'pos_request_base_ra',
            'pos_delta_azim',
            'pos_delta_elev',
            'pos_delta_sky',
            'mode',
            'inhibited',
            'ap_device_status',
            'lock',
            'target',
            'windstow_active'
        ];

        vm.initSensors = function () {
            vm.receptorsData.splice(0, vm.receptorsData.length);
            ConfigService.getReceptorList()
                .then(function (result) {
                    result.forEach(function (item) {
                        vm.receptorsData.push({name: item, showHorizonMask: false, skyPlot: false});
                        SensorsService.setSensorStrategy(item, vm.sensorsToConnect, 'event-rate', 1, 360);
                    });
                });
        };

        vm.getSources = function () {
            if (vm.targets.length === 0) {
                ConfigService.getSources()
                    .then(function (result) {
                        vm.targets = result.data;
                        vm.filterChanged();

                        for (var i in result) {
                            for (var j in result[i].tags) {
                                vm.filters[result[i].tags[j]] = {name: result[i].tags[j]};
                            }
                        }
                    }, function (error) {
                        $log.error(error);
                    });
            }
        };

        vm.filterChanged = function (filter) {
            vm.selectedTarget = null;
            vm.targetsToDisplay.splice(0, vm.targetsToDisplay.length);
            var namesAdded = [];
            for (var i in vm.targets) {
                if (namesAdded.indexOf(vm.targets[i].name) === -1 && (filter === '' || vm.targets[i].tags.indexOf(filter) > -1)) {
                    namesAdded.push(vm.targets[i].name);
                    vm.targetsToDisplay.push(vm.targets[i].name);
                }
            }
        };

        vm.drawSkyPlot = function (drawAll) {
            vm.clearSkyPlot();
            if (vm.selectedTarget || drawAll) {
                for (var i in vm.targets) {
                    if ((vm.selectedFilter === '' || vm.targets[i].tags.indexOf(vm.selectedFilter) > -1) &&
                        drawAll || vm.selectedTarget === vm.targets[i].name) {
                        var azel = vm.targets[i].azel;
                        var radec = vm.targets[i].radec;
                        var az = azel[0] * (180/Math.PI);
                        if (az > 180) {
                            az = az - 360;
                        }
                        var el = azel[1] * (180/Math.PI);
                        vm.receptorsData.push({
                            name: vm.targets[i].name,
                            skyPlot: true,
                            ap_actual_azim: {value: az},
                            ap_actual_elev: {value: el}
                            //pos_request_base_dec: {value: radec[1]},
                            //pos_request_base_ra: {value: radec[0]}
                        });
                    }
                }
                vm.redraw(true);
            }
        };

        vm.clearSkyPlot = function () {
            var indexesToRemove = [];
            for (var i = 0; i < vm.receptorsData.length; i++) {
                if (vm.receptorsData[i].skyPlot) {
                    indexesToRemove.push(i);
                }
            }
            for (var idx = indexesToRemove.length - 1; idx >= 0; idx--) {
                vm.receptorsData.splice(indexesToRemove[idx], 1);
            }
            vm.redraw(true);
        };

        vm.statusMessageReceived = function (event, message) {

            if (message.value) {
                var sensor = message.name.split(':')[1];
                var resource = sensor.split('.')[0];
                var sensorName = sensor.split('.')[1];

                //todo make receptorsData a dictionary
                vm.receptorsData.forEach(function (receptor) {
                    if (receptor.name === resource) {
                        receptor[sensorName] = message.value;
                    }
                });
            }
            if (!vm.stopUpdating) {
                vm.stopUpdating = $interval(function () {
                    vm.redraw(false);
                    $interval.cancel(vm.stopUpdating);
                    vm.stopUpdating = null;
                }, 1000);
            }
        };

        vm.redraw = function (horizonMaskToggled) {
            vm.redrawChart(vm.receptorsData, vm.showNames, vm.showTrails, vm.showGridLines, vm.trailDots, horizonMaskToggled);
        };

        vm.toggleHorizonMask = function (receptor) {
            if (!receptor.horizonMask) {
                ConfigService.getHorizonMask(receptor.name)
                    .then(function (result) {
                        if (!result.data.error) {
                            receptor.showHorizonMask = true;
                            receptor.horizonMask = "az el\r" + JSON.parse(result.data);
                            vm.redraw(true);
                        } else {
                            NotifyService.showSimpleDialog('Error Retrieving Horizon Mask', result.data.error);
                        }

                    }, function () {
                        NotifyService.showSimpleDialog('Error Retrieving Horizon Mask', 'Could not retrieve a horizon mask for ' + receptor.name);
                    });
            } else {
                receptor.showHorizonMask = !receptor.showHorizonMask;
                vm.redraw(true);
            }
        };

        var bgColor = angular.element(document.querySelector("md-content")).css('background-color');
        angular.element(document.querySelector(".sky-plot-options-containter")).css({'background-color': bgColor});

        vm.cancelListeningToSensorMessages = $rootScope.$on('sensorsServerUpdateMessage', vm.statusMessageReceived);

        $scope.$on('$destroy', function () {
            vm.cancelListeningToSensorMessages();
            $interval.cancel(vm.stopUpdating);
            vm.disconnectIssued = true;
            SensorsService.disconnectListener();
        });
    }
})();
