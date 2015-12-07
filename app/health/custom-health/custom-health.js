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
        vm.treeIDIncrement = 0;

        vm.connectListeners = function () {
            SensorsService.connectListener()
                .then(function () {
                    vm.initSensors();
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

        vm.initSensors = function () {
            if (vm.regexStrings) {
                var regexString = '';
                var regexToConnect = [];
                vm.regexStrings.forEach(function (regex) {
                    regexToConnect.push(regex.name);
                });
                SensorsService.setSensorStrategies(regexToConnect.join('|'), 'event-rate', 1, 360);
            }
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
                                offset: vm.regexStrings[i].offset,
                                sensor: '',
                                elementId: 'custom-tree-' + vm.treeIDIncrement,
                                children: []
                            };
                            vm.treeIDIncrement++;
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

        vm.addView = function () {
            vm.buildView(vm.regex, {left: 0, top: 0}, {width: parseInt(vm.selectedWidth), height: parseInt(vm.selectedHeight)});
        };

        vm.buildView = function (regex, offset, size) {
            var sensorRegex = {
                name: regex,
                size: {w: size.width, h: size.height},
                offset: {left: offset.left, top: offset.top}
            };
            var existingItem = _.findWhere(vm.regexStrings, {name: sensorRegex.name});
            if (!existingItem) {
                vm.regexStrings.push(sensorRegex);
                if (SensorsService.connected) {
                    SensorsService.setSensorStrategies(regex, 'event-rate', 1, 360);
                }
            } else {
                NotifyService.showSimpleToast('Expression already exists, not adding ' + regex);
            }
        };

        //note: we dont unsubscribe from sensors here because if we have duplicates on the view,
        //the duplicate will be in black and unsubscribing from that sensor would mean the other
        //sensors with the same name will not get the updates any longer
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
            var items = document.getElementsByTagName('status-single-level-tree-map');
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                var regex = item.getElementsByClassName('status-top-label-text')[0].innerText;
                url += encodeURI(regex) + ':' + item.offsetLeft + ',' + item.offsetTop + ',' + item.clientWidth + ',' + item.clientHeight + ';';
            }
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
                    var regex = layout.split(':')[0];
                    //left,top,width,height
                    var layoutParams = layout.split(':')[1].split(',');
                    var offset = {left: parseInt(layoutParams[0]), top: parseInt(layoutParams[1])};
                    var size = {width: parseInt(layoutParams[2]), height: parseInt(layoutParams[3])};

                    //todo possible timing issue between when we build the status trees
                    //and when getting multiple setSensorStrategyMessage on rootScope
                    vm.buildView(regex, offset, size);
                }
            });
            if (!$scope.$$phase) {
                $scope.$digest();
            }
        }

        $timeout(vm.connectListeners, 500);
    }
})();
