(function () {

    angular.module('katGui.health')
        .controller('ReceptorPointingCtrl', ReceptorPointingCtrl);

    function ReceptorPointingCtrl($rootScope, $scope, KatGuiUtil, ConfigService, SensorsService, $interval, $log,
                                  NotifyService, $timeout, ObsSchedService) {

        var vm = this;
        vm.receptorsData = [];
        vm.guid = KatGuiUtil.generateUUID();
        vm.disconnectIssued = false;
        vm.connectInterval = null;
        vm.connectionLost = false;
        vm.targets = [];
        vm.targetsToDisplay = [];
        vm.filters = [];
        vm.sensorValues = {};
        vm.subarrayColors = ["#EF6C00", "#2196F3", "#E91E63", "#43A047"];

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
            'pos_actual_pointm_azim',
            'pos_actual_pointm_elev',
            'pos_request_pointm_azim',
            'pos_request_pointm_elev',
            'pos_request_base_dec',
            'pos_request_base_ra',
            'pos_delta_azim',
            'pos_delta_elev',
            'pos_delta_sky',
            'mode',
            'inhibited',
            'lock',
            'target',
            'windstow_active'
        ];

        vm.initSensors = function () {
            vm.receptorsData.splice(0, vm.receptorsData.length);
            ConfigService.getReceptorList()
                .then(function (result) {
                    var sensorsRegexToConnect = [];
                    result.forEach(function (item, index) {
                        for (var i = 0; i < vm.sensorsToConnect.length; i++) {
                            sensorsRegexToConnect.push('^' + item + '_' + vm.sensorsToConnect[i]);
                        }
                        var receptor = {name: item, showHorizonMask: false, skyPlot: false, subarrayColor: "#d7d7d7"};
                        for (var k = 0; k < ObsSchedService.subarrays.length; k++) {
                            if (ObsSchedService.subarrays[k].pool_resources &&
                                ObsSchedService.subarrays[k].pool_resources.indexOf(receptor.name) > -1) {
                                receptor.sub_nr = parseInt(ObsSchedService.subarrays[k].id);
                                receptor.subarrayColor = vm.subarrayColors[receptor.sub_nr - 1];
                                vm.sensorValues[receptor.name + '_sub_nr'] = {value: receptor.sub_nr};
                                break;
                            }
                        }
                        vm.receptorsData.push(receptor);
                    });
                    SensorsService.setSensorStrategies(sensorsRegexToConnect.join('|'), 'event-rate', 1, 360);
                });

        };

        vm.getSources = function () {
            if (vm.targets.length === 0) {
                ConfigService.getSources()
                    .then(function (result) {
                        vm.targets = result.data;
                        vm.filterChanged();

                        for (var i in vm.targets) {
                            for (var j in vm.targets[i].tags) {
                                vm.filters[vm.targets[i].tags[j]] = {name: vm.targets[i].tags[j]};
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
                            pos_actual_pointm_azim: {value: az},
                            pos_actual_pointm_elev: {value: el}
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
            var sensor = message.name.split(':')[1];
            vm.sensorValues[sensor] = message.value;

            vm.receptorsData.forEach(function (receptor) {
                if (sensor.startsWith(receptor.name)) {
                    receptor[sensor.replace(receptor.name + '_', '')] = message.value;
                }
            });

            if (!vm.stopUpdating) {
                vm.stopUpdating = $interval(function () {
                    vm.redraw(false);
                    $interval.cancel(vm.stopUpdating);
                    vm.stopUpdating = null;
                }, 1000);
            }
        };

        vm.poolResourcesSensorUpdate = function (event, sensor) {
            vm.receptorsData.forEach(function (receptor) {
               if (sensor.value.indexOf(receptor.name) > -1) {
                   receptor.sub_nr = parseInt(sensor.name.split('_')[1]);
                   receptor.subarrayColor = vm.subarrayColors[receptor.sub_nr - 1];
                   vm.sensorValues[receptor.name + '_sub_nr'] = {value: receptor.sub_nr};
               } else if (receptor.sub_nr === parseInt(sensor.name.split('_')[1])) {
                   receptor.sub_nr = null;
                   receptor.subarrayColor = "#d7d7d7";
                   vm.sensorValues[receptor.name + '_sub_nr'] = null;
               }
           });
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

        vm.delaydRedrawAfterViewChange = function () {
            $timeout(function () {
                vm.redraw(false);
            }, 1000);
        };

        var bgColor = angular.element(document.querySelector("md-content")).css('background-color');
        angular.element(document.querySelector(".sky-plot-options-containter")).css({'background-color': bgColor});

        vm.cancelListeningToSensorMessages = $rootScope.$on('sensorsServerUpdateMessage', vm.statusMessageReceived);
        vm.cancelListeningToPoolResources = $rootScope.$on('subarrayPoolResourcesSensorUpdate', vm.poolResourcesSensorUpdate);

        $scope.$on('$destroy', function () {
            vm.cancelListeningToSensorMessages();
            vm.cancelListeningToPoolResources();
            $interval.cancel(vm.stopUpdating);
            vm.disconnectIssued = true;
            SensorsService.disconnectListener();
        });
    }
})();
