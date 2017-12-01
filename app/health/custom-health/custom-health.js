// *******************************************************************
// TODO: WARNING THIS DISPLAY WAS EXPERIMENTAL AND IS NOT USED ANYMORE
// *******************************************************************
(function () {

    angular.module('katGui.health')
        .controller('CustomHealthCtrl', CustomHealthCtrl);

    function CustomHealthCtrl($scope, $rootScope, $interval, MonitorService, KatGuiUtil, $location, $stateParams,
                              $timeout, $log, $mdDialog, $state, NotifyService, ConfigService) {

        var vm = this;
        vm.resources = ConfigService.resources;
        vm.resourcesNames = [];
        vm.customStatusTrees = [];
        vm.regexStrings = [];
        vm.subscribedSensors = [];
        vm.guid = KatGuiUtil.generateUUID();
        vm.treeIDIncrement = 0;

        vm.initSensors = function () {
            if (vm.regexStrings && vm.regexStrings.length > 0) {
                var regexToConnect = vm.regexStrings.map(function (regex) {
                    return regex.name;
                });
                MonitorService.listSensors('all', regexToConnect);
            }
        };

        vm.unbindSetSensorStrategy = $rootScope.$on('setSensorStrategyMessage', function (event, message) {
            for (var i = 0; i < vm.regexStrings.length; i++) {
                var regex = new RegExp(vm.regexStrings[i].name);
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

        vm.buildView = function (regex, offset, size) {
            if (!regex || regex.length === 0) {
                return;
            }
            var sensorRegex = {
                name: regex,
                size: {width: size.width, height: size.height},
                offset: {left: offset.left, top: offset.top}
            };
            var existingItem = _.findWhere(vm.regexStrings, {name: sensorRegex.name});
            if (!existingItem) {
                vm.regexStrings.push(sensorRegex);
                // if (SensorsService.connected) {
                    // SensorsService.setSensorStrategies(regex, 'event-rate', 1, 360);
                // }
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
                vm.debounceUpdateUrl();
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

        vm.mouseUp = function () {
            vm.debounceUpdateUrl();
        };

        vm.updateUrl = function () {
            if (vm.regexStrings.length > 0) {
                var url = '';
                var items = document.getElementsByTagName('status-single-level-tree-map');
                for (var i = 0; i < items.length; i++) {
                    var regex = items[i].getElementsByClassName('status-top-label-text')[0].innerText;
                    var newOffset = {top: items[i].offsetTop, left: items[i].offsetLeft};
                    var newSize = {width: items[i].clientWidth, height: items[i].clientHeight};
                    var existingItemIndex = _.findIndex(vm.regexStrings, {name: regex});
                    if (existingItemIndex > -1) {
                        vm.regexStrings[existingItemIndex].offset = newOffset;
                        vm.regexStrings[existingItemIndex].size = newSize;
                    }
                    url += encodeURI(regex + ':' + newOffset.left + ',' + newOffset.top + ',' + newSize.width + ',' + newSize.height + ';');
                }
                if (vm.regexStrings.length > 0 && url.length > 0) {
                    $state.go('customHealth', { layout: url }, { notify: false, reload: false });
                } //else: this is the init step and dom elements are not created yet
            }
        };

        vm.debounceUpdateUrl = _.debounce(vm.updateUrl, 500);

        vm.showEnterSensorRegexDialog = function (event) {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog) {
                        $scope.title = "Enter custom regex";
                        $scope.regex = '';
                        $scope.dimensions = [{
                            height: 400, width: 200
                        }, {
                            height: 600, width: 200
                        }, {
                            height: 800, width: 200
                        }, {
                            height: 1000, width: 200
                        }, {
                            height: 1200, width: 200
                        }, {
                            height: 600, width: 400
                        }, {
                            height: 800, width: 400
                        }, {
                            height: 1000, width: 400
                        }, {
                            height: 1200, width: 400
                        }];
                        $scope.dimension = $scope.dimensions[1];
                        $scope.hide = function () {
                            $mdDialog.hide();
                        };
                        $scope.createView = function () {
                            var offset = {top: 0, left: 0};
                            if (vm.regexStrings.length > 0) {
                                var lastViewItem = vm.regexStrings[vm.regexStrings.length - 1];
                                offset = {top: lastViewItem.offset.top, left: lastViewItem.offset.left + lastViewItem.size.width + 8};
                            }
                            vm.buildView($scope.regex, offset, $scope.dimension);
                            vm.debounceUpdateUrl();
                            $mdDialog.hide();
                        };
                    },
                    template: [
                        '<md-dialog style="padding: 0; max-width: 95%; max-height: 95%" md-theme="{{$root.themePrimary}}" layout="column">',
                            '<md-toolbar class="md-primary" layout="row" layout-align="center center"><span>{{title}}</span></md-toolbar>',
                            '<div style="padding:0; margin: 8px; overflow: auto; width: 400px" layout="column" layout-padding layout-align="start center" md-theme="{{$root.themePrimaryButtons}}">',
                                '<md-input-container class="md-primary" title="Start typing to find sensors" style="padding: 2px; margin-bottom: 0; height: 40px; width: 380px">',
                                    '<input placeholder="Enter a regex..." ng-model="regex" md-autofocus maxlength="80">',
                                '</md-input-container>',
                                '<div layout="row" layout-align="space-between center" style="min-width: 100%">',
                                    '<span flex>View Dimensions <i>(width x height)</i>:</span>',
                                    '<md-select ng-model="dimension" placeholder="Select dimensions..." style="margin: 0">',
                                        '<md-option ng-repeat="dimension in dimensions" ng-value="dimension">',
                                          '{{dimension.width + "x" + dimension.height}}',
                                    '</md-option>',
                                '</div>',
                            '</div>',
                            '<div layout="row" layout-align="end" style="margin-top: 8px; margin-right: 8px; margin-bottom: 8px; min-height: 40px;" md-theme="{{$root.themePrimaryButtons}}">',
                                '<md-button style="margin-left: 8px;" class="md-primary" ng-click="hide()">Cancel</md-button>',
                                '<md-button style="margin-left: 8px;" class="md-primary md-raised" ng-click="createView()">Create View</md-button>',
                            '</div>',
                        '</md-dialog>'].join(''),
                    targetEvent: event
                });
        };

        $scope.itemsToUpdate = {};
        var unbindUpdate = $rootScope.$on('sensorUpdateMessage', function (event, sensor, subject) {
            if (subject.startsWith('req.reply')) {
                MonitorService.subscribeSensor(sensor);
                vm.subscribedSensors.push(sensor);
            }
            $scope.itemsToUpdate[sensor.name] = sensor;
            vm.applyPendingUpdates();
        });

        var unbindReconnected = $rootScope.$on('websocketReconnected', vm.initSensors);

        $scope.$on('$destroy', function () {
            vm.subscribedSensors.forEach(function (sensor) {
                MonitorService.unsubscribeSensor(sensor);
            });
            $interval.cancel(vm.pendingUpdatesInterval);
            unbindUpdate();
            unbindReconnected();
            vm.sensorValues = {};
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
            vm.debounceUpdateUrl();
        }
        $timeout(vm.connectListeners, 500);
    }
})();
