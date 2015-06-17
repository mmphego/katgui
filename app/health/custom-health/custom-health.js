(function () {

    angular.module('katGui.health')
        .controller('CustomHealthCtrl', CustomHealthCtrl);

    function CustomHealthCtrl(MonitorService, $scope, $rootScope, $interval, SensorsService, KatGuiUtil) {

        var vm = this;
        vm.resources = SensorsService.resources;
        vm.resourcesNames = [];
        vm.customStatusTrees = [];
        vm.regexStrings = [];
        vm.guid = KatGuiUtil.generateUUID();

        vm.connectListeners = function () {
            SensorsService.connectListener()
                .then(function () {
                    vm.initSensors();
                    if (vm.connectInterval) {
                        $interval.cancel(vm.connectInterval);
                        vm.connectInterval = null;
                        if (!vm.disconnectIssued) {
                            $rootScope.showSimpleToast('Reconnected :)');
                        }
                    }
                }, function () {
                    console.error('Could not establish sensor connection. Retrying every 10 seconds.');
                    if (!vm.connectInterval) {
                        vm.connectInterval = $interval(vm.connectListeners, 10000);
                    }
                });
            vm.handleSocketTimeout();
        };

        vm.handleSocketTimeout = function () {
            SensorsService.getTimeoutPromise()
                .then(function () {
                    if (!vm.disconnectIssued) {
                        $rootScope.showSimpleToast('Connection timeout! Attempting to reconnect...');
                        if (!vm.connectInterval) {
                            vm.connectInterval = $interval(vm.connectListeners, 10000);
                            vm.connectListeners();
                        }
                    }
                });
        };

        vm.connectListeners();

        vm.initSensors = function () {
            if (vm.regexStrings.length > 0) {
                //SensorsService.connectResourceSensorListeners(vm.resourceSensorsBeingDisplayed, vm.guid);
            }
        };

        SensorsService.listResources()
            .then(function () {
                for (var key in vm.resources) {
                    vm.resourcesNames.push({name: key});
                }
            });

        vm.unbindSetSensorStrategy = $rootScope.$on('setSensorStrategyMessage', function (event, message) {

            for (var i = 0; i < vm.regexStrings.length; i++) {

                if (!vm.customStatusTrees[i]) {
                    vm.customStatusTrees[i] = {
                        name: vm.regexStrings[i],
                        sensor: '',
                        children: []
                    };
                }

                for (var k in message.sensors) {
                    if (!_.findWhere(vm.customStatusTrees[i].children, {name: message.sensors[k][2]})) {
                        vm.customStatusTrees[i].children.push({
                            name: message.sensors[k][2],
                            sensor: message.sensors[k][2],
                            sensorValue: {
                                timestamp: message.sensors[k][0].reading[0],
                                received_timestamp: message.sensors[k][0].reading[1],
                                status: message.sensors[k][0].reading[2],
                                value: message.sensors[k][0].reading[3]
                            },
                            objectValue: message.sensors[k][0]
                        });
                    }
                    SensorsService.subscribe(message.resource + '.' + message.sensors[k][2], vm.guid);
                }
            }
        });

        vm.unbindSensorsUpdate = $rootScope.$on('sensorsServerUpdateMessage', function (event, sensor) {
            var strList = sensor.name.split(':');
            var sensorNameList = strList[1].split('.');

            $scope.itemsToUpdate[sensorNameList[1]] = sensor;
            if (!vm.stopUpdating) {
                vm.stopUpdating = $interval(vm.applyPendingUpdates, 200);
            }
        });


        $scope.itemsToUpdate = {};

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
                    d.sensorValue = $scope.itemsToUpdate[sensorToUpdateName].value;
                    if (d.sensorValue) {
                        statusClassResult = d.sensorValue.status + '-child';
                        delete $scope.itemsToUpdate[sensorToUpdateName];
                    }
                } else {
                    //delete $scope.itemsToUpdate[sensorToUpdateName];
                    //console.error('Trying to update sensor that does not exist or that does not have a sensorValue - this might be because the sensor was not subscribed to in kat-monitor-webserver');
                    //console.error(d);
                }
                statusClassResult += d.dx > 300 ? " child-big-text" : " child";
                return statusClassResult;
            } else if (d.sensorValue) {
                delete $scope.itemsToUpdate[d.name + '_' + d.sensor];
                return d.sensorValue.status + '-child parent';
            } else {
                delete $scope.itemsToUpdate[sensorToUpdateName];
                console.error('deleting a sensor update because the sensorValue is null');
                console.error(d);
            }
        };

        vm.buildView = function (resource, regex, layoutPosition) {
            var sensorRegex = resource + '.' + regex;
            if (vm.regexStrings.indexOf(sensorRegex) === -1) {
                vm.regexStrings.push(sensorRegex);
                SensorsService.connectResourceSensorNameLiveFeed(
                    resource,
                    regex,
                    vm.guid,
                    $rootScope.sensorListStrategyType,
                    $rootScope.sensorListStrategyInterval,
                    $rootScope.sensorListStrategyInterval,
                    true);
            }
        };

        vm.removeStatusTree = function (tree) {
            //MonitorService.unsubscribe(tree.name);
            vm.regexStrings.splice(vm.regexStrings.indexOf(tree.name), 1);
            vm.customStatusTrees.splice(vm.customStatusTrees.indexOf(tree));
        };

        $scope.$on('$destroy', function () {
            if (vm.resourceSensorsBeingDisplayed.length > 0) {
                SensorsService.removeResourceListeners(vm.resourceSensorsBeingDisplayed);
            }

            SensorsService.unsubscribe(vm.resourceSensorsBeingDisplayed + ".*", vm.guid);
            vm.unbindSetSensorStrategy();
            vm.unbindSensorsUpdate();
            if (vm.stopUpdating) {
                $interval.cancel(vm.stopUpdating);
            }
            vm.disconnectIssued = true;
            SensorsService.disconnectListener();
        });
    }
})();
