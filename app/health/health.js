(function() {

    angular.module('katGui.health', ['katGui', 'katGui.d3'])
        .controller('HealthCtrl', HealthCtrl);

    function HealthCtrl($timeout, $interval, $log, $rootScope, $scope, KatGuiUtil, ConfigService,
        StatusService, NotifyService, MonitorService, d3Util) {

        var vm = this;
        ConfigService.loadAggregateSensorDetail();
        vm.topStatusTrees = StatusService.topStatusTrees;
        vm.sensorValues = {};
        vm.subscribedSensors = [];
        vm.getClassesOfSensor = StatusService.getClassesOfSensor;

        ConfigService.getStatusTreesForTop()
            .then(function(result) {
                StatusService.setTopStatusTrees(result.data);
                vm.initSensors();
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
                    MonitorService.listSensors(component, components[component].sensors.join('|'));
                }
                MonitorService.listSensors('katpool', 'resources_in_maintenance');
            }
        };

        vm.getClassesOfSensor = function(sub) {
            var sensorName = sub.component + '_' + sub.sensor;
            var statusClassResult = [sensorName, 'md-whiteframe-z1'];
            var sensorValue = vm.sensorValues[sensorName];
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

        var unbindUpdate = $rootScope.$on('sensorUpdateMessage', function(event, sensor, subject) {
            if (subject.startsWith('req.reply')) {
                MonitorService.subscribeSensor(sensor);
                vm.subscribedSensors.push(sensor);
            }
            vm.sensorValues[sensor.name] = sensor;
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
