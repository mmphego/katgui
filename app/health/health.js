/*jshint loopfunc: true */
(function () {

    angular.module('katGui.health', ['katGui', 'katGui.d3'])
        .controller('HealthCtrl', HealthCtrl);

    function HealthCtrl(MonitorService, ConfigService, StatusService, $scope, $rootScope, $interval) {

        var vm = this;
        ConfigService.loadAggregateSensorDetail();
        vm.topStatusTrees = StatusService.topStatusTrees;
        $scope.itemsToUpdate = {};
        vm.subscriptions = {};

        vm.unbindUpdate = $rootScope.$on('sensorUpdateReceived', function (event, sensor) {
            $scope.itemsToUpdate[sensor.name.replace('.', '_')] = sensor;
            if (!vm.stopUpdating) {
                vm.stopUpdating = $interval(vm.applyPendingUpdates, 200);
            }
        });

        vm.applyPendingUpdates = function () {
            var attributes = Object.keys($scope.itemsToUpdate);
            if (attributes.length > 0) {
                for (var i = 0; i < attributes.length; i++) {
                    var sensorName = $scope.itemsToUpdate[attributes[i]].name;
                    sensorName = sensorName.replace(/\./g, '-');
                    var queryString = '.' + sensorName;
                    var resultList = d3.selectAll(queryString);
                    resultList[0].forEach(function (element) {
                        d3.select(element).attr('class', function (d) {
                            return vm.setClassesOfSensor(d, attributes[i], sensorName);
                        });
                    });
                    //if (resultList[0].length === 0) {
                    ////this just means that the status view is still in the process of being built and drawn in the DOM,
                    ////the updates will be added in the next interval
                    //    $log.error('Sensor tried to update, but the visual element does not exist - ' + attributes[i]);
                    //}
                }
            } else {
                if (angular.isDefined(vm.stopUpdating)) {
                    $interval.cancel(vm.stopUpdating);
                    vm.stopUpdating = undefined;
                }
            }
        };

        vm.setClassesOfSensor = function (d, sensorToUpdateName, fixedClassName) {
            if (d.depth > 0) {
                if (!d.sensorValue) {
                    d.sensorValue = {};
                }
                var statusClassResult = fixedClassName;
                if ($scope.itemsToUpdate[sensorToUpdateName]) {
                    d.sensorValue = $scope.itemsToUpdate[sensorToUpdateName].sensorValue;
                    if (d.sensorValue) {
                        statusClassResult += ' ' + d.sensorValue.status + '-child';
                    }
                } else {
                    //delete $scope.itemsToUpdate[sensorToUpdateName];
                    //$log.error('Trying to update sensor that does not exist or that does not have a sensorValue - this might be because the sensor was not subscribed to in kat-monitor-webserver');
                    //$log.error(d);
                }
                statusClassResult += d.dx > 300 ? " child-big-text" : " child";
                return statusClassResult;
            } else if (d.sensorValue) {
                return fixedClassName + ' ' + d.sensorValue.status + '-child parent';
            }
        };

        vm.subscribeToChildSensors = function (parent) {
            if (parent.children && parent.children.length > 0) {
                parent.children.forEach(function (child) {
                    vm.subscribeToChildSensors(child);
                });
            } else if (parent.subs && parent.subs.length > 0) {
                parent.subs.forEach(function (sub) {
                    if (!parent.children) {
                        parent.children = [];
                    }
                    parent.children.push({name: sub, sensor: sub});
                    vm.subscriptions[sub] = true;
                    MonitorService.subscribe(sub);
                });
            }
            if (parent.sensor) {
                MonitorService.subscribe(parent.sensor);
                vm.subscriptions[parent.sensor] = true;
            }
        };

        ConfigService.getStatusTreesForTop()
            .success(function (statusTreeResult) {
                StatusService.setTopStatusTrees(statusTreeResult);
                for (var i in StatusService.topStatusTrees) {
                    vm.subscribeToChildSensors(StatusService.topStatusTrees[i]);
                }
            })
            .error(function () {
                $rootScope.showSimpleDialog("Error retrieving status tree structure from katconf-webserver, is the server running?");
            });

        $scope.$on('$destroy', function() {
            vm.unbindUpdate();
            if (vm.stopUpdating) {
                $interval.cancel(vm.stopUpdating);
            }

            for (var sub in vm.subscriptions) {
                MonitorService.unsubscribe(sub);
            }
        });
    }
})
();
