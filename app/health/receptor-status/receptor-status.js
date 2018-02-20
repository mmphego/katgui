(function() {

    angular.module('katGui.health')
        .controller('ReceptorStatusCtrl', ReceptorStatusCtrl);

    function ReceptorStatusCtrl($rootScope, $scope, KatGuiUtil, ConfigService, MonitorService, $state, $interval, $log,
        NotifyService, ObsSchedService, $timeout) {

        var vm = this;
        vm.receptors = {};
        vm.sensorValues = {};
        vm.subarrays = {
            subarray_free: {
                subNr: 'free'
            }
        };
        vm.sortBySubarrays = false;
        vm.showGraphics = false;
        vm.subscribedSensors = [];

        vm.receptorsSensorsToConnectRegex = [
            'device_status$',
            'mode$',
            'inhibited$',
            'lock$',
            'windstow_active$',
            'marked_in_maintenance$',
            'marked_faulty$'
        ].join('|');

        vm.subarraySensorsToConnectRegex = [
            'state$',
            'maintenance$'
        ].join('|');

        vm.initSensors = function() {
            ConfigService.getSystemConfig()
                .then(function(systemConfig) {
                    systemConfig.system.ants.split(',').forEach(function(receptorName) {
                        var receptor = {
                            name: receptorName
                        };
                        vm.receptors[receptorName] = receptor;
                    });
                    var subarrayNames = systemConfig.subarrayNrs.map(function(subNr) {
                        vm.subarrays['subarray_' + subNr] = {
                            subNr: subNr
                        };
                        return 'subarray_' + subNr;
                    });
                    MonitorService.listSensorsHttp(systemConfig.system.ants, vm.receptorsSensorsToConnectRegex, true).then(function(result) {
                        result.data.forEach(function(sensor) {
                            MonitorService.subscribeSensor(sensor);
                            vm.subscribedSensors.push(sensor);
                            vm.sensorValues[sensor.name] = sensor;
                        });
                    }, function(error) {
                        $log.error(error);
                    });
                    MonitorService.listSensorsHttp(subarrayNames.join(','), vm.subarraySensorsToConnectRegex, true).then(function(result) {
                        result.data.forEach(function(sensor) {
                            MonitorService.subscribeSensor(sensor);
                            vm.subscribedSensors.push(sensor);
                            vm.sensorValues[sensor.name] = sensor;
                        });
                    }, function(error) {
                        $log.error(error);
                    });
                    MonitorService.listSensorsHttp('katpool', 'katpool_pool_resources_', true).then(function(result) {
                        result.data.forEach(function(sensor) {
                            MonitorService.subscribeSensor(sensor);
                            vm.subscribedSensors.push(sensor);
                            vm.sensorValues[sensor.name] = sensor;

                            if (sensor.name === 'katpool_pool_resources_free') {
                                sensor.value.split(',').forEach(function(freeReceptor) {
                                    if (vm.receptors[freeReceptor]) {
                                        vm.receptors[freeReceptor].subNr = 'free';
                                    }
                                });
                            } else if (sensor.name.startsWith('katpool_pool_resources_')) {
                                var sensorNameSplit = sensor.name.split('_');
                                var subNr = sensorNameSplit[sensorNameSplit.length - 1];
                                sensor.value.split(',').forEach(function(receptorName) {
                                    if (vm.receptors[receptorName]) {
                                        vm.receptors[receptorName].subNr = subNr;
                                    }
                                });
                            }
                        });
                    }, function(error) {
                        $log.error(error);
                    });
                });
        };

        vm.sensorUpdateMessage = function(event, sensor, subject) {
            if (!sensor.name.startsWith('katpool_pool_resources_') &&
                sensor.name.search(vm.receptorsSensorsToConnectRegex) < 0 &&
                sensor.name.search(vm.subarraySensorsToConnectRegex) < 0) {
                return;
            }
            vm.sensorValues[sensor.name] = sensor;
            if (sensor.name === 'katpool_pool_resources_free') {
                sensor.value.split(',').forEach(function(freeReceptor) {
                    if (vm.receptors[freeReceptor]) {
                        vm.receptors[freeReceptor].subNr = 'free';
                    }
                });
            } else if (sensor.name.startsWith('katpool_pool_resources_')) {
                var sensorNameSplit = sensor.name.split('_');
                var subNr = sensorNameSplit[sensorNameSplit.length - 1];
                sensor.value.split(',').forEach(function(receptorName) {
                    if (vm.receptors[receptorName]) {
                        vm.receptors[receptorName].subNr = subNr;
                    }
                });
            }
        };

        vm.markResourceFaulty = function(receptor) {
            var faultySensor = vm.sensorValues[receptor.name + '_marked_faulty'];
            if (faultySensor) {
                ObsSchedService.markResourceFaulty(receptor.name, faultySensor.value ? 'clear' : 'set');
            }
        };

        vm.markResourceInMaintenance = function(receptor) {
            var inMaintenanceSensor = vm.sensorValues[receptor.name + '_marked_in_maintenance'];
            if (inMaintenanceSensor) {
                ObsSchedService.markResourceInMaintenance(receptor.name, inMaintenanceSensor.value ? 'clear' : 'set');
            }
        };

        vm.getReceptorBlockClass = function(receptorName) {
            var classes = '';
            var deviceStatus = vm.sensorValues[receptorName + '_device_status'];
            var mode = vm.sensorValues[receptorName + '_mode'];
            if (deviceStatus) {
                classes += ' receptor-graphic-sensors-' + deviceStatus.status;
            }
            if (mode) {
                classes += ' receptor-graphic-' + mode.value.toLowerCase();
            }
            return classes;
        };

        vm.getReceptorSvgClass = function(receptorName) {
            var classes = '';
            var inMaintenance = vm.sensorValues[receptorName + '_marked_in_maintenance'];
            var faulty = vm.sensorValues[receptorName + '_marked_faulty'];
            var deviceStatus = vm.sensorValues[receptorName + '_device_status'];
            var mode = vm.sensorValues[receptorName + '_mode'];
            if (inMaintenance && inMaintenance.value) {
                classes += ' maintenance-bg-hover';
            }
            if (faulty && faulty.value) {
                classes += ' receptor-svg-container-faulty';
            }
            if (deviceStatus) {
                classes += ' receptor-graphic-sensors-' + deviceStatus.status;
            }
            if (mode) {
                classes += ' receptor-graphic-' + mode.value.toLowerCase();
            }
            return classes;
        };

        vm.getReceptorModeTextClass = function(receptorName) {
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

        var unbindSensorUpdates = $rootScope.$on('sensorUpdateMessage', vm.sensorUpdateMessage);
        var unbindReconnected = $rootScope.$on('websocketReconnected', vm.initSensors);

        vm.initSensors();

        $scope.$on('$destroy', function() {
            vm.subscribedSensors.forEach(function(sensor) {
                MonitorService.unsubscribeSensor(sensor);
            });
            unbindReconnected();
            unbindSensorUpdates();
        });
    }
})();
