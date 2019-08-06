(function() {

    angular.module('katGui.health')
        .controller('CbfHealthViewCtrl', CbfHealthViewCtrl);

    function CbfHealthViewCtrl($log, $interval, $rootScope, $scope, $localStorage, MonitorService,
                                  ConfigService, StatusService, NotifyService, $stateParams) {

        var vm = this;
        vm.svgList = [];

        vm.populateSensorNames = function(viewName, parent) {
            if (!StatusService.configHealthSensors[viewName]) {
                StatusService.configHealthSensors[viewName] = {
                    sensors: []
                };
            }
            // Only populate if parent.sensor defined
            if (parent.sensor) {
                if (parent.component && parent.component !== 'all' ) {
                    StatusService.configHealthSensors[viewName].sensors.push(parent.component+'_'+parent.sensor);
                }
                else {
                    StatusService.configHealthSensors[viewName].sensors.push(parent.sensor);
                }
            }
            if (parent.children && parent.children.length > 0) {
                parent.children.forEach(function(child) {
                    vm.populateSensorNames(viewName, child);
                });
            }
        };

        ConfigService.getConfigHealthViews().then(
            function(result) {
                vm.configHealthViews = result.data;
                Object.keys(vm.configHealthViews).forEach(function (viewKey) {
                    vm.configHealthViews[viewKey].forEach(function (view) {
                        vm.populateSensorNames(viewKey, view);
                    });
                });
                $rootScope.configHealthViews = Object.keys(vm.configHealthViews);
                vm.redrawCharts();
                vm.initSensors();
            },
            function(error) {
                $log.error(error);
                NotifyService.showSimpleDialog("Error retrieving config health views from katconf-webserver, is the service running?");
            });

        vm.initSensors = function() {
            if (vm.selectedConfigView) {
                vm.subscribedSensors.forEach(function (sensor) {
                    MonitorService.unsubscribeSensor(sensor);
                });
                vm.subscribedSensors = [];
                vm.view = StatusService.configHealthSensors[vm.selectedConfigView];
                if (vm.view) {
                    MonitorService.listSensorsHttp('all', vm.view.sensors.join('|')).then(function (result) {
                        result.data.forEach(function (sensor) {
                            MonitorService.subscribeSensor(sensor);
                            vm.subscribedSensors.push(sensor);
                            StatusService.sensorValues[sensor.name] = sensor;
                            $log.info("Register "+sensor.name);
                            d3.selectAll('.' + sensor.name).attr('class', sensor.status + '-child ' + sensor.name);
                        });
                    }, function(error) {
                        $log.error(error);
                    });
                }
            }
        };

        vm.redrawCharts = function () {
            $rootScope.$emit('redrawChartMessage', {size: vm.treeChartSize});
        };

        var unbindUpdate = $rootScope.$on('sensorUpdateMessage', function (event, sensor, subject) {
            var view = StatusService.configHealthSensors[vm.selectedConfigView];
            if (!view || sensor.name.search(view.sensors.join('|')) < 0) {
                return;
            }
            /* Remove the mon_N from the sensor name,
               this is because for now static portal config does not know about
               monitor(e.g mon_proxy01, mon_monctl) prefix
            */
            if (sensor.name.startsWith('mon_')) {
                sensor.name = sensor.name.replace(/^mon_.*agg_/, 'agg_');
            }
            StatusService.sensorValues[sensor.name] = sensor;
            d3.selectAll('.' + sensor.name).attr('class', sensor.status + '-child ' + sensor.name);
        });

        var unbindReconnected = $rootScope.$on('websocketReconnected', vm.initSensors);

        $scope.$on('$destroy', function () {
            vm.subscribedSensors.forEach(function (sensor) {
                MonitorService.unsubscribeSensor(sensor);
            });
            unbindUpdate();
            handleInterfaceChanged();
            unbindReconnected();
            StatusService.sensorValues = {};
        });
    }
})();
