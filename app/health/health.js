/*jshint loopfunc: true */
(function () {

    angular.module('katGui.health', ['katGui'])
        .controller('HealthCtrl', HealthCtrl);

    function HealthCtrl(MonitorService, ConfigService, StatusService, $scope, $rootScope, $interval, d3Util) {

        var vm = this;
        vm.topStatusTrees = StatusService.topStatusTrees;
        $scope.itemsToUpdate = {};

        vm.unbindUpdate = $rootScope.$on('sensorUpdateReceived', function (event, sensor) {
            $scope.itemsToUpdate[sensor.name.replace(':', '_')] = sensor;
            if (!vm.stopUpdating) {
                vm.stopUpdating = $interval(vm.applyPendingUpdates, 200);
            }
        });

        vm.applyPendingUpdates = function () {
            var attributes = Object.keys($scope.itemsToUpdate);
            if (attributes.length > 0) {
                for (var i = 0; i < attributes.length; i++) {
                    var queryString = '#' + attributes[i];
                    var resultList = d3.selectAll(queryString);
                    //difficult to test d3 classes here, so ignore it for now
                    resultList.attr('class', function (d) {
                        return vm.setClassesOfSensor(d, attributes[i]);
                    });
                    //if (resultList[0].length === 0) {
                    ////this just means that the status view is still in the process of being built and drawn in the DOM,
                    ////the updates will be added in the next interval
                    //    console.error('Sensor tried to update, but the visual element does not exist - ' + attributes[i]);
                    //}
                }
            } else {
                if (angular.isDefined(vm.stopUpdating)) {
                    $interval.cancel(vm.stopUpdating);
                    vm.stopUpdating = undefined;
                }
            }
        };

        vm.setClassesOfSensor = function (d, sensorToUpdateName) {
            if (d.depth > 0) {
                if (!d.sensorValue) {
                    d.sensorValue = {};
                }
                var statusClassResult = "inactive-child";
                if ($scope.itemsToUpdate[sensorToUpdateName]) {
                    d.sensorValue = $scope.itemsToUpdate[sensorToUpdateName].sensorValue;
                    if (d.sensorValue) {
                        statusClassResult = d3Util.statusClassFromNumber(d.sensorValue.status) + '-child child';
                        delete $scope.itemsToUpdate[sensorToUpdateName];
                    }
                } else {
                    delete $scope.itemsToUpdate[sensorToUpdateName];
                    console.error('Trying to update sensor that does not exist or that does not have a sensorValue - this might be because the sensor was not subscribed to in kat-monitor-webserver');
                    console.error(d);
                }
                return statusClassResult;
            } else if (d.sensorValue) {
                delete $scope.itemsToUpdate[d.name + '_' + d.sensor];
                return d3Util.statusClassFromNumber(d.sensorValue.status) + '-child parent';
            } else {
                delete $scope.itemsToUpdate[sensorToUpdateName];
                console.error('deleting a sensor update because the sensorValue is null');
                console.error(d);
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
                    MonitorService.subscribe(sub);
                });
            }
            if (parent.sensor) {
                MonitorService.subscribe(parent.sensor);
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
        });
    }
})
();
