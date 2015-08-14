(function () {

    //ssh to the box, do
    //motion -n -c /var/kat/vds_motion.conf
    angular.module('katGui.video', ['katGui.services'])
        .controller('VideoCtrl', VideoCtrl);

    function VideoCtrl($scope, $rootScope, $http, $log, $interval, $mdDialog, ControlService, SensorsService,
                       SERVER_URL, NotifyService, USER_ROLES) {

        var vm = this;

        var urlBase = SERVER_URL + '/katcontrol/vds';
        //todo set the image source from katconfig
        //not implemented in katconfig yet
        vm.imageSource = 'http://monctl.devo.camlab.kat.ac.za:8083';
        vm.sensorValues = {};

        vm.toggleFloodLights = function () {
            ControlService.floodlightsOn(vm.sensorValues.vds_flood_lights_on.value ? 'off' : 'on')
                .then(function (result) {
                    NotifyService.showSimpleToast(result.data.result.replace(/\\_/g, ' '));
                }, function (error) {
                    NotifyService.showSimpleDialog('Error sending request', error);
                });
        };

        vm.panLeft = function () {
            var newPanValue = vm.sensorValues.vds_pan_position.value - 5;
            if (newPanValue < 0) {
                newPanValue = 0;
            }
            vm.vdsCommand('pan/to', newPanValue);
        };

        vm.panFarLeft = function () {
            vm.vdsCommand('pan', 'left');
        };

        vm.panRight = function () {
            var newPanValue = vm.sensorValues.vds_pan_position.value + 5;
            if (newPanValue > 270) {
                newPanValue = 270;
            }
            vm.vdsCommand('pan/to', newPanValue);
        };

        vm.panFarRight = function () {
            vm.vdsCommand('pan', 'right');
        };

        vm.tiltUp = function () {
            var newTiltValue = vm.sensorValues.vds_tilt_position.value + 5;
            if (newTiltValue > 60) {
                newTiltValue = 60;
            }
            vm.vdsCommand('tilt/to', newTiltValue);
        };

        vm.tiltFarUp = function () {
            vm.vdsCommand('tilt', 'up');
        };

        vm.tiltDown = function () {
            var newTiltValue = vm.sensorValues.vds_tilt_position.value - 5;
            if (newTiltValue < -1) {
                newTiltValue = 0;
            }
            vm.vdsCommand('tilt/to', newTiltValue);
        };

        vm.tiltFarDown = function () {
            vm.vdsCommand('tilt', 'down');
        };

        vm.setPreset = function (event) {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog) {
                        $scope.title = 'Set VDS Preset';
                        $scope.presetIDs = [];
                        for (var i = 0; i < 64; i++) {
                            $http(createRequest('post', urlBase + '/presetset/'));
                            if (i < 10) {
                                $scope.presetIDs.push('m00' + i);
                            }
                            else {
                                $scope.presetIDs.push('m0' + i);
                            }
                        }
                        $scope.hide = function () {
                            $mdDialog.hide();
                        };
                        $scope.setPreset = function (preset) {
                            $http(createRequest('post', urlBase + '/presetset/' + preset))
                                .then(requestSuccess, requestError);
                        };
                    },
                    template: '<md-dialog style="padding: 0;" md-theme="{{$root.themePrimary}}">' +
                    '   <div style="padding: 0; margin: 0; overflow: auto" layout="column">' +
                    '       <md-toolbar class="md-primary" layout="row" layout-align="center center">' +
                    '           <span flex style="margin: 8px;">{{::title}}</span>' +
                    '       </md-toolbar>' +
                    '       <div flex layout="row" layout-align="center center">' +
                    '           <md-select ng-model="selectedPreset" style="margin:8px;"' +
                    '               class="md-primary" placeholder="Select A Preset ID">' +
                    '               <md-option ng-value="preset" ng-repeat="preset in presetIDs">{{preset}}</md-option>' +
                    '           </md-select>' +
                    '       </div>' +
                    '       <div layout="row" layout-align="end" style="margin-top: 8px; margin-right: 8px; margin-bottom: 8px; min-height: 40px;">' +
                    '           <md-button class="md-primary md-raised" md-theme="{{$root.themePrimaryButtons}}" ng-click="hide()">Cancel</md-button>' +
                    '           <md-button style="margin-left: 8px;" class="md-primary md-raised" md-theme="{{$root.themePrimaryButtons}}" ng-click="setPreset(selectedPreset); hide()">Set Selected Preset</md-button>' +
                    '       </div>' +
                    '   </div>' +
                    '</md-dialog>',
                    targetEvent: event
                });
        };

        vm.goToPreset = function (event) {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog) {
                        $scope.title = 'Go To VDS Preset';
                        $scope.presetIDs = [];
                        for (var i = 0; i < 64; i++) {
                            if (i < 10) {
                                $scope.presetIDs.push('m00' + i);
                            }
                            else {
                                $scope.presetIDs.push('m0' + i);
                            }
                        }
                        $scope.hide = function () {
                            $mdDialog.hide();
                        };
                        $scope.gotoPreset = function (preset) {
                            vm.lastPreset = preset;
                            $http(createRequest('post', urlBase + '/presetgoto/' + preset))
                                .then(requestSuccess, requestError);
                        };
                    },
                    template: '<md-dialog style="padding: 0;" md-theme="{{$root.themePrimary}}">' +
                    '   <div style="padding: 0; margin: 0; overflow: auto" layout="column">' +
                    '       <md-toolbar class="md-primary" layout="row" layout-align="center center">' +
                    '           <span flex style="margin: 8px;">{{::title}}</span>' +
                    '       </md-toolbar>' +
                    '       <div flex layout="row" layout-align="center center">' +
                    '           <md-select ng-model="selectedPreset" style="margin:8px;"' +
                    '               class="md-primary" placeholder="Select A Preset ID">' +
                    '               <md-option ng-value="preset" ng-repeat="preset in presetIDs">{{preset}}</md-option>' +
                    '           </md-select>' +
                    '       </div>' +
                    '       <div layout="row" layout-align="end" style="margin-top: 8px; margin-right: 8px; margin-bottom: 8px; min-height: 40px;">' +
                    '           <md-button class="md-primary md-raised" md-theme="{{$root.themePrimaryButtons}}" ng-click="hide()">Cancel</md-button>' +
                    '           <md-button style="margin-left: 8px;" class="md-primary md-raised" md-theme="{{$root.themePrimaryButtons}}" ng-click="gotoPreset(selectedPreset); hide()">Go To Selected Preset</md-button>' +
                    '       </div>' +
                    '   </div>' +
                    '</md-dialog>',
                    targetEvent: event
                });
        };

        vm.zoomChanged = function (zoomValue) {
            vm.zoom = zoomValue;
            if (vm.zoomInterval) {
                $interval.cancel(vm.zoomInterval);
            }
            vm.zoomInterval = $interval(vm.sendCurrentZoomCommand, 1000);
        };

        vm.sendCurrentZoomCommand = function () {
            vm.vdsCommand('zoom/to', vm.zoom);
            if (vm.zoomInterval) {
                $interval.cancel(vm.zoomInterval);
            }
        };

        vm.focusChanged = function (focusValue) {
            vm.focus = focusValue;
            if (vm.focusInterval) {
                $interval.cancel(vm.focusInterval);
            }
            vm.focusInterval = $interval(vm.sendCurrentFocusCommand, 1000);
        };

        vm.sendCurrentFocusCommand = function () {
            vm.vdsCommand('focus/to', vm.focus);
            if (vm.focusInterval) {
                $interval.cancel(vm.focusInterval);
            }
        };

        vm.stopVDS = function () {
            $http(createRequest('post', urlBase + '/stop'))
                .then(requestSuccess, requestError);
        };

        vm.vdsCommand = function (endpoint, args) {
            $http(createRequest('post', urlBase + '/' + endpoint + '/' + args))
                .then(requestSuccess, requestError);
        };

        function requestSuccess(result) {
            NotifyService.showSimpleToast(result.data);
        }

        function requestError(result) {
            NotifyService.showSimpleDialog('Error sending VDS command.', result.data);
        }

        vm.connectListeners = function () {
            SensorsService.connectListener()
                .then(function () {
                    vm.initSensors();
                    if (vm.connectInterval) {
                        $interval.cancel(vm.connectInterval);
                        vm.connectInterval = null;
                        if (!vm.disconnectIssued) {
                            NotifyService.showSimpleToast('Reconnected :)');
                        }
                    }
                }, function () {
                    $log.error('Could not establish sensor connection. Retrying every 10 seconds.');
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
                        NotifyService.showSimpleToast('Connection timeout! Attempting to reconnect...');
                        if (!vm.connectInterval) {
                            vm.connectInterval = $interval(vm.connectListeners, 10000);
                            vm.connectListeners();
                        }
                    }
                });
        };

        vm.initSensors = function () {
            SensorsService.setSensorStrategy('anc', 'vds_*', 'event', 0, 0);
        };


        vm.afterInit = function() {
            if ($rootScope.currentUser) {
                if ($rootScope.currentUser.req_role === USER_ROLES.lead_operator ||
                    $rootScope.currentUser.req_role === USER_ROLES.operator) {
                    vm.canOperateVDS = true;
                    vm.connectListeners();
                }
            } else {
                vm.undbindLoginSuccess = $rootScope.$on('loginSuccess', vm.afterInit);
            }
        };

        vm.afterInit();

        var unbindUpdate = $rootScope.$on('sensorsServerUpdateMessage', function (event, sensor) {
            var strList = sensor.name.split(':');
            var sensorName = strList[1].split('.')[1];
            vm.sensorValues[sensorName] = sensor.value;
            if (sensor.name.split('.')[1] === 'vds_focus_position') {
                vm.focus = sensor.value.value;
            } else if (sensor.name.split('.')[1] === 'vds_zoom_position') {
                vm.zoom = sensor.value.value;
            }
        });

        $scope.$on('$destroy', function () {
            unbindUpdate();
            vm.disconnectIssued = true;
            SensorsService.disconnectListener();
            if (vm.undbindLoginSuccess) {
                vm.undbindLoginSuccess();
            }
        });

        function createRequest(method, url) {
            return {
                method: method,
                url: url,
                headers: {
                    'Authorization': 'CustomJWT ' + $rootScope.jwt
                }
            };
        }
    }
})();


