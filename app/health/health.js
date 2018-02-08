(function() {

    angular.module('katGui.health', ['katGui', 'katGui.d3'])
        .controller('HealthCtrl', HealthCtrl);

    function HealthCtrl($rootScope, $scope, ConfigService, StatusService, NotifyService,
        MonitorService, d3Util, $timeout) {

        var vm = this;
        ConfigService.loadAggregateSensorDetail();
        vm.topStatusTrees = StatusService.topStatusTrees;
        vm.sensorValues = {};
        vm.aggSensorValues = {};
        vm.subscribedSensors = [];
        vm.sensorsRegex = '';
        vm.getClassesOfSensor = StatusService.getClassesOfSensor;

        ConfigService.getStatusTreesForTop()
            .then(function(result) {
                StatusService.setTopStatusTrees(result.data);
                $timeout(vm.initSensors, 500);
            }, function() {
                NotifyService.showSimpleDialog(
                    "Error retrieving layout from katconf-webserver, is the server running?");
            });
        ConfigService.getSystemConfig();

        vm.initSensors = function() {
            if (StatusService.topStatusTrees) {
                var components = {};
                StatusService.topStatusTrees.forEach(function(tree) {
                    tree.subs.forEach(function(sub) {
                        if (!components[sub.component]) {
                            components[sub.component] = {
                                sensors: []
                            };
                        }
                        components[sub.component].sensors.push(sub.sensor);
                    });
                });
                for (var component in components) {
                    var componentSensorsRegex = components[component].sensors.join('|');
                    vm.sensorsRegex += componentSensorsRegex + '|';
                    MonitorService.listSensors(component, componentSensorsRegex);
                }
                vm.sensorsRegex += 'katpool_resources_in_maintenance';
                MonitorService.listSensors('katpool', 'katpool_resources_in_maintenance');
            }
        };

        vm.getClassesOfSensor = function(sub) {
            var sensorName = sub.component + '_' + sub.sensor;
            var statusClassResult = [sensorName, 'md-whiteframe-z1'];
            var sensorValue = vm.sensorValues[sensorName] || vm.aggSensorValues[sensorName];
            if (sensorValue) {
                var inMaintenance = vm.sensorValues.katpool_resources_in_maintenance;
                if (inMaintenance && (
                    inMaintenance.value.indexOf(sub.sensor.replace('agg_', '').split('_')[0]) > -1 ||
                    inMaintenance.value.indexOf(sub.component) > -1)) {
                    statusClassResult.push('in-maintenance-child');
                }
                statusClassResult.push(sensorValue.status + '-child');
            } else {
                statusClassResult.push('inactive-child');
            }
            return statusClassResult.join(' ');
        };

        vm.subMouseUp = function(sub, event) {
            if (sub.sensor.indexOf('agg_') > -1) {
                d3Util.showDialogForAggregateSensorInfo(sub);
            }
        };

        vm.getSensorTextFromSub = function(sub) {
            var sensorName = sub.component + '_' + sub.sensor;
            var sensor = vm.sensorValues[sensorName] || vm.aggSensorValues[sensorName];
            var sensorText = '';
            if (sensor) {
                sensorText = sensor.name + ' - ' + sensor.status + ' - ' + sensor.value;
            }
            return sensorText;
        };

        var unbindUpdate = $rootScope.$on('sensorUpdateMessage', function(event, sensor, subject) {
            if (sensor.name.search(vm.sensorsRegex) < 0) {
                return;
            }
            if (subject.startsWith('req.reply')) {
                MonitorService.subscribeSensor(sensor);
                vm.subscribedSensors.push(sensor);
            }
            vm.sensorValues[sensor.name] = sensor;
            var aggIndex = sensor.name.indexOf('agg_');
            if (aggIndex > -1) {
                vm.aggSensorValues['all_' + sensor.name.slice(aggIndex, sensor.name.length)] = sensor;
            }
        });

        var unbindReconnected = $rootScope.$on('websocketReconnected', vm.initSensors);

        $scope.$on('$destroy', function() {
            vm.subscribedSensors.forEach(function(sensor) {
                MonitorService.unsubscribeSensor(sensor);
            });
            unbindUpdate();
            unbindReconnected();
        });
    }
})
();
