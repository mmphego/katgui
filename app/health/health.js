(function () {

    angular.module('katGui.health', ['katGui', 'katGui.d3'])
        .controller('HealthCtrl', HealthCtrl);

    function HealthCtrl($timeout, $interval, $log, $rootScope, $scope, KatGuiUtil, ConfigService, StatusService, NotifyService, MonitorService) {

        var vm = this;
        ConfigService.loadAggregateSensorDetail();
        vm.topStatusTrees = StatusService.topStatusTrees;
        StatusService.sensorValues = {};
        vm.subscribedSensors = [];

        ConfigService.getStatusTreesForTop()
            .then(function (result) {
                StatusService.setTopStatusTrees(result.data);
                vm.initSensors();
            }, function () {
                NotifyService.showSimpleDialog("Error retrieving status tree structure from katconf-webserver, is the server running?");
            });
        ConfigService.getSystemConfig();

        vm.initSensors = function () {
            if (StatusService.topStatusTrees) {
                var components = {};
                StatusService.topStatusTrees.forEach(function(tree) {
                    tree.subs.forEach(function(sub) {
                        if (!components[sub.component]) {
                            components[sub.component] = {sensors: []};
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

        var unbindUpdate = $rootScope.$on('sensorUpdateMessage', function (event, sensor, subject) {
            if (subject.startsWith('req.reply')) {
                MonitorService.subscribeSensor(sensor);
                vm.subscribedSensors.push(sensor);
            }
            StatusService.sensorValues[sensor.name] = sensor;
            if (sensor.name === 'katpool_resources_in_maintenance') {
                d3.selectAll('rect').classed('in-maintenance-child', function (d) {
                    return StatusService.sensorValues.katpool_resources_in_maintenance.value.indexOf(d.component) > -1;
                });
            }
            d3.selectAll('rect.' + sensor.name).attr('class', function (d) {
                return [sensor.name, sensor.status + '-child'].join(' ');
            });
            d3.selectAll('text.' + sensor.name).attr('class', function (d) {
                return [sensor.name, sensor.status + '-child'].join(' ');
            });
        });

        var unbindReconnected = $rootScope.$on('websocketReconnected', vm.initSensors);

        $scope.$on('$destroy', function () {
            vm.subscribedSensors.forEach(function (sensor) {
                MonitorService.unsubscribeSensor(sensor);
            });
            unbindUpdate();
            unbindReconnected();
            StatusService.sensorValues = {};
        });
    }
})
();
