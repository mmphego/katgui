(function () {

    angular.module('katGui.health')
        .controller('CustomHealthCtrl', CustomHealthCtrl);

    function CustomHealthCtrl($scope, $rootScope, $interval, SensorsService, KatGuiUtil, $location, $stateParams,
                              $timeout, $log, NotifyService) {

        var vm = this;
        vm.resources = SensorsService.resources;
        vm.resourcesNames = [];
        vm.customStatusTrees = [];
        vm.regexStrings = [];
        vm.guid = KatGuiUtil.generateUUID();
        vm.connectionLost = false;

        vm.connectListeners = function () {
            SensorsService.connectListener()
                .then(function () {
                    if (vm.connectInterval) {
                        $interval.cancel(vm.connectInterval);
                        vm.connectionLost = false;
                        vm.connectInterval = null;
                        if (!vm.disconnectIssued) {
                            NotifyService.showSimpleToast('Reconnected :)');
                        }
                    }
                }, function () {
                    $log.error('Could not establish sensor connection. Retrying every 10 seconds.');
                    if (!vm.connectInterval) {
                        vm.connectionLost = true;
                        vm.connectInterval = $interval(vm.connectListeners, 10000);
                    }
                });
            vm.handleSocketTimeout();
        };

        vm.handleSocketTimeout = function () {
            SensorsService.getTimeoutPromise()
                .then(function () {
                    if (!vm.disconnectIssued) {
                        NotifyService.showSimpleToast('Connection timeout! Attempting to reconnect...');
                        if (!vm.connectInterval) {
                            vm.connectionLost = true;
                            vm.connectInterval = $interval(vm.connectListeners, 10000);
                            vm.connectListeners();
                        }
                    }
                });
        };

        vm.unbindSetSensorStrategy = $rootScope.$on('setSensorStrategyMessage', function (event, message) {
            for (var i = 0; i < vm.regexStrings.length; i++) {
                var regex = new RegExp(vm.regexStrings[i]);
                for (var key in message) {
                    if (regex.test(key)) {
                        if (!vm.customStatusTrees[i]) {
                            vm.customStatusTrees[i] = {
                                name: vm.regexStrings[i].name,
                                resource: vm.regexStrings[i].name,
                                size: vm.regexStrings[i].size,
                                sensor: '',
                                children: []
                            };
                        }
                        if (!_.findWhere(vm.customStatusTrees[i].children, {name: vm.regexStrings[i].name})) {
                            vm.customStatusTrees[i].children.push({
                                name: key,
                                sensor: key,
                                sensorValue: {}
                            });
                        }
                    }
                }
            }
        });

        vm.unbindSensorsUpdate = $rootScope.$on('sensorsServerUpdateMessage', function (event, sensor) {
            var sensorName = sensor.name.split(':')[1];
            sensor.name = sensorName;

            $scope.itemsToUpdate[sensorName] = sensor;
            if (!vm.stopUpdating) {
                vm.stopUpdating = $interval(vm.applyPendingUpdates, $rootScope.sensorListStrategyInterval);
            }
        });

        $scope.itemsToUpdate = {};

        vm.applyPendingUpdates = function () {
            var attributes = Object.keys($scope.itemsToUpdate);
            if (attributes.length > 0) {
                for (var i = 0; i < attributes.length; i++) {
                    var sensorName = $scope.itemsToUpdate[attributes[i]].name;
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

        vm.buildView = function (regex) {
            var sensorRegex = {
                name: regex,
                size: {w: vm.selectedWidth, h: vm.selectedHeight},
                sizeString: vm.selectedWidth + 'x' + vm.selectedHeight
            };
            var existingItem = _.findWhere(vm.regexStrings, {name: sensorRegex.name});
            if (!existingItem) {
                vm.regexStrings.push(sensorRegex);
                SensorsService.setSensorStrategies(
                    regex,
                    $rootScope.sensorListStrategyType,
                    $rootScope.sensorListStrategyInterval,
                    $rootScope.sensorListStrategyInterval
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
            NotifyService.showSimpleDialog('Exported URL', url);
        };

        $scope.$on('$destroy', function () {
            vm.unbindSetSensorStrategy();
            vm.unbindSensorsUpdate();
            if (vm.stopUpdating) {
                $interval.cancel(vm.stopUpdating);
            }
            if (vm.connectInterval) {
                $interval.cancel(vm.connectInterval);
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

                    //todo possible timing issue between when we build the status trees
                    //and when getting multiple setSensorStrategyMessage on rootScope
                    $timeout(function () {
                        vm.selectedWidth = parseInt(size[0]);
                        vm.selectedHeight = parseInt(size[1]);
                        vm.buildView(regex);
                    }, lastTimeout);
                    lastTimeout += 500;
                }
            });
            if (!$scope.$$phase) {
                $scope.$digest();
            }
        }

        $timeout(vm.connectListeners, 500);
    }
})();
