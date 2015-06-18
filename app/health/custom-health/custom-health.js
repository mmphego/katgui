(function () {

    angular.module('katGui.health')
        .controller('CustomHealthCtrl', CustomHealthCtrl);

    function CustomHealthCtrl($scope, $rootScope, $interval, SensorsService, KatGuiUtil, $location, $stateParams, $timeout) {

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
                //todo init sensors on reconnect
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

                if (!_.findWhere(vm.customStatusTrees, {name: vm.regexStrings[i].name})) {
                    vm.customStatusTrees[i] = {
                        name: vm.regexStrings[i].name,
                        resource: vm.regexStrings[i].name.split('.')[0],
                        size: vm.regexStrings[i].size,
                        sensor: '',
                        children: []
                    };
                }

                for (var k in message.sensors) {
                    if (message.sensors[k][0].parent_name === vm.customStatusTrees[i].resource
                        && (message.sensors[k][2]).indexOf(vm.customStatusTrees[i].name.split('.')[1]) !== -1
                        && !_.findWhere(vm.customStatusTrees[i].children, {name: message.sensors[k][2]})) {
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
                vm.stopUpdating = $interval(vm.applyPendingUpdates, $rootScope.sensorListStrategyInterval);
            }
        });


        $scope.itemsToUpdate = {};

        vm.applyPendingUpdates = function () {
            var attributes = Object.keys($scope.itemsToUpdate);
            if (attributes.length > 0) {
                for (var i = 0; i < attributes.length; i++) {
                    var sensorName = $scope.itemsToUpdate[attributes[i]].name.split(':')[1].replace(/\./g, '-');
                    var queryString = '.' + sensorName;
                    var resultList = d3.selectAll(queryString);
                    resultList[0].forEach(function (element) {
                        d3.select(element).attr('class', function (d) {
                            return vm.setClassesOfSensor(d, attributes[i], sensorName);
                        });
                    });
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
                    d.sensorValue = $scope.itemsToUpdate[sensorToUpdateName].value;
                    if (d.sensorValue) {
                        statusClassResult += ' ' + d.sensorValue.status + '-child';
                    }
                }
                statusClassResult += d.dx > 300 ? " child-big-text" : " child";
                return statusClassResult;
            } else if (d.sensorValue) {
                return fixedClassName + ' ' + d.sensorValue.status + '-child parent';
            }
        };

        vm.buildView = function (resource, regex) {
            var sensorRegex = {
                name: resource + '.' + regex,
                size: {w: vm.selectedWidth, h: vm.selectedHeight},
                sizeString: vm.selectedWidth + 'x' + vm.selectedHeight
            };
            var existingItem = _.findWhere(vm.regexStrings, {name: sensorRegex.name});
            if (!existingItem) {
                vm.regexStrings.push(sensorRegex);
                SensorsService.connectResourceSensorNameLiveFeed(
                    resource,
                    regex,
                    vm.guid,
                    $rootScope.sensorListStrategyType,
                    $rootScope.sensorListStrategyInterval,
                    $rootScope.sensorListStrategyInterval,
                    true
                );
            }
        };

        //note: we dont unsubscribe from sensors here because if we have duplicates on the view,
        //the duplicate will be in black and unsubscribing from that sensor would mean the other sensors with the same name
        //will not get the updates any longer
        vm.removeStatusTree = function (tree) {
            var existingItem = _.findWhere(vm.regexStrings, {name: tree.name});
            if (existingItem) {
                vm.regexStrings.splice(vm.regexStrings.indexOf(existingItem), 1);
                vm.customStatusTrees.splice(vm.customStatusTrees.indexOf(tree), 1);
            }
        };

        vm.exportToUrl = function () {
            var url = $location.absUrl();
            if (url.indexOf('?') !== -1) {
                url = url.split('?')[0];
            }
            url += '?layout=';
            vm.regexStrings.forEach(function (item) {
                url += item.name + ',' + item.sizeString + ';';
            });
            $rootScope.showSimpleDialog('Exported URL', url);
        };

        $scope.$on('$destroy', function () {
            vm.unbindSetSensorStrategy();
            vm.unbindSensorsUpdate();
            if (vm.stopUpdating) {
                $interval.cancel(vm.stopUpdating);
            }
            vm.disconnectIssued = true;
            SensorsService.disconnectListener();
        });

        if ($stateParams.layout) {
            var lastTimeout = 200;
            var layouts = $stateParams.layout.split(';');
            layouts.forEach(function (layout) {
                if (layout) {
                    var regex = layout.split(',')[0];
                    var size = layout.split(',')[1].split('x');
                    var resource = regex.split('.')[0];
                    var sensor = regex.split('.')[1];

                    //todo possible timing issue between when we build the status trees
                    //and when getting multiple setSensorStrategyMessage on rootScope
                    $timeout(function () {
                        vm.selectedWidth = parseInt(size[0]);
                        vm.selectedHeight = parseInt(size[1]);
                        vm.buildView(resource, sensor);
                    }, lastTimeout);
                    lastTimeout += 500;
                }
            });
            if (!$scope.$$phase) {
                $scope.$digest();
            }
        }
    }
})();
