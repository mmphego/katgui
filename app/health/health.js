(function () {

    angular.module('katGui')
        .controller('HealthCtrl', HealthCtrl);

    function HealthCtrl(MonitorService, ConfigService, StatusService, $scope, $rootScope, $timeout, $interval, d3Util) {

        var vm = this;
        vm.topStatusTree = StatusService.topStatusTree;
        $scope.itemsToUpdate = {};

        var unbindUpdate = $rootScope.$on('sensorUpdateReceived', function (event, sensor) {
            $scope.itemsToUpdate[sensor.name.replace(':', '_')] = sensor;

            var stopUpdating = $interval(applyPendingUpdates, 200);

            function applyPendingUpdates() {
                var attributes = Object.keys($scope.itemsToUpdate);

                if (attributes.length > 0) {
                    for (var i = 0; i < attributes.length;i++) {
                        var queryString = '#' + attributes[i];
                        var resultList = d3.selectAll(queryString.replace("mon_proxy_", ""));
                        resultList.attr('class', function(d) {
                            return setClassesOfSensor(d, attributes[i]);
                        });
                        //if (resultList[0].length === 0) {
                        //    delete $scope.itemsToUpdate[attributes[i]];
                            //    console.error('Sensor tried to update, but the visual element does not exist - ' + attributes[i]);
                        //}
                    }
                } else {
                    if (angular.isDefined(stopUpdating)) {
                        $interval.cancel(stopUpdating);
                        stopUpdating = undefined;
                    }
                }
            }

            function setClassesOfSensor(d, sensorToUpdateName) {
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
            }
        });

        ConfigService.getStatusTreesForTop()
            .success(function (statusTreeResult) {

                //for (var attr in statusTreeResult) {
                //    StatusService.topStatusTree[attr] = statusTreeResult[attr];
                //}

                StatusService.topStatusTree = statusTreeResult;
                StatusService.topStatusTree.children = [];
                StatusService.topStatusTree.subs.forEach(function (sub) {
                    StatusService.topStatusTree.children.push({sensor: sub});
                });

                subscribeToChildSensors(statusTreeResult);

                function subscribeToChildSensors(parent) {
                    if (parent.status_children && parent.status_children.length > 0) {
                        parent.status_children.forEach(function (child) {
                            subscribeToChildSensors(child);

                        });
                    } else if (parent.children && parent.children.length > 0) {
                        parent.children.forEach(function (child) {
                            subscribeToChildSensors(child);
                        });
                    } else if (parent.subs && parent.subs.length > 0) {
                        parent.subs.forEach(function (sub) {
                            if (!parent.children) {
                                parent.children = [];
                            }
                            parent.children.push({name: sub, sensor: sub});
                            MonitorService.subscribe("mon_proxy:" + sub);
                        });
                    }

                    if (parent.sensor) {
                        MonitorService.subscribe("mon_proxy:" + parent.sensor);
                    }
                }
            });

        $scope.$on('$destroy', function () {
            unbindUpdate();
        });

    }
})();
