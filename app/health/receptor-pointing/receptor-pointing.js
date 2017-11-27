(function () {

    angular.module('katGui.health')
        .controller('ReceptorPointingCtrl', ReceptorPointingCtrl);

    function ReceptorPointingCtrl($rootScope, $scope, KatGuiUtil, ConfigService, MonitorService, $interval, $log,
                                  NotifyService, $timeout) {

        var vm = this;
        vm.receptors = {};
        vm.skyPlotData = [];
        vm.subscribedSensors = [];
        vm.targets = [];
        vm.targetsToDisplay = [];
        vm.filters = [];
        vm.sensorValues = {};
        vm.trailDots = 30;
        // map subarray number to a colour
        vm.subarrayColors = {1: "#EF6C00", 2: "#2196F3", 3: "#E91E63", 4: "#43A047"};

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
            ConfigService.getSystemConfig()
                .then(function (systemConfig) {
                    systemConfig.system.ants.split(',').forEach(function (receptorName) {
                        var receptor = {
                            name: receptorName,
                            showHorizonMask: false,
                            subarrayColor: "#d7d7d7"
                        };
                        vm.receptors[receptorName] = receptor;
                        MonitorService.listSensors(receptorName, '^(' + vm.sensorsToConnect.join('|') + ')$');
                    });
                    systemConfig.subarrayNrs.forEach(function(subNr) {
                      MonitorService.listSensors('subarray_' + subNr, 'pool_resources$');
                    });
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
            vm.skyPlotData = [];
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
                        vm.skyPlotData.push({
                            name: vm.targets[i].name,
                            pos_actual_pointm_azim: {value: az},
                            pos_actual_pointm_elev: {value: el}
                        });
                    }
                }
                vm.redraw(true);
            }
        };

        vm.clearSkyPlot = function () {
            vm.redraw(true);
        };

        vm.sensorUpdateMessage = function (event, sensor, subject) {
            if (subject.startsWith('req.reply')) {
                if (sensor.component === 'sys' || sensor.component === 'katpool') {
                    // These are sensors from other listings like katpool_lo_id and sys_interlock_state
                    return;
                }
                MonitorService.subscribeSensor(sensor);
                vm.subscribedSensors.push(sensor);
            }
            vm.sensorValues[sensor.name] = sensor;

            if (sensor.name.endsWith('pool_resources')) {
                // e.g. subarray_1_pool_resources
                var sensorNameSplit = sensor.name.split('_');
                // e.g. subarray_1
                var subNr = parseInt(sensorNameSplit[sensorNameSplit.length - 3]);
                for (var receptorName in vm.receptors) {
                  if (sensor.value.indexOf(receptorName) > -1) {
                      vm.receptors[receptorName].subarrayColor = vm.subarrayColors[subNr];
                      vm.sensorValues[receptorName + '_sub_nr'] = subNr;
                  } else if (vm.receptors[receptorName] === subNr) {
                      // receptor was unassigned
                      vm.receptors[receptorName].subarrayColor = "#d7d7d7";
                      vm.sensorValues[receptorName + '_sub_nr'] = null;
                  }
                }
            } else {
              // e.g. m011_<sensor>
              var receptor = sensor.name.split('_')[0];
              sensor.name = sensor.name.replace(receptor + '_', '');
              vm.receptors[receptor][sensor.name] = sensor;
            }
        };

        vm.redraw = function (horizonMaskToggled) {
            vm.redrawChart(
              vm.receptors, vm.skyPlotData, vm.showNames, vm.showTrails,
              vm.showGridLines, vm.trailDots, horizonMaskToggled);
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

        vm.delayedRedrawAfterViewChange = function () {
            $timeout(function () {
                vm.redraw(false);
            }, 1000);
        };

        var bgColor = angular.element(document.querySelector("md-content")).css('background-color');
        angular.element(document.querySelector(".sky-plot-options-containter")).css({'background-color': bgColor});

        vm.unbindSensorUpdates = $rootScope.$on('sensorUpdateMessage', vm.sensorUpdateMessage);
        vm.unbindReconnected = $rootScope.$on('websocketReconnected', vm.initSensors);

        vm.initSensors();
        vm.updatePlotInterval = $interval(function () {
             vm.redraw(false);
        }, 1000);

        $scope.$on('$destroy', function () {
            vm.subscribedSensors.forEach(function (sensor) {
                MonitorService.unsubscribeSensor(sensor);
            });
            vm.unbindSensorUpdates();
            vm.unbindReconnected();
            $interval.cancel(vm.updatePlotInterval);
        });
    }
})();
