(function () {

    //ssh to the box, do
    //motion -n -c /var/kat/vds_motion.conf
    angular.module('katGui.video', ['katGui.services'])
        .controller('VideoCtrl', VideoCtrl);

    function VideoCtrl($scope, $rootScope, $http, $log, $interval, $mdDialog, ControlService, SensorsService,
                       NotifyService, USER_ROLES, ConfigService, KatGuiUtil, $state) {

        function urlBase() {
           return $rootScope.portalUrl? $rootScope.portalUrl + '/katcontrol/vds' : '';
        }

        var vm = this;
        vm.imageSources = [];
        vm.imageSource = null;

        ConfigService.getSystemConfig()
            .then(function (systemConfig) {

                if (!systemConfig.vds) {
                    $state.go('home');
                    return;
                }

                vm.imageSources = [];
                var imageKeys = Object.keys(systemConfig.vds);
                for (var i = 0; i < imageKeys.length; i++) {
                    vm.imageSources.push({name: imageKeys[i], url: systemConfig.vds[imageKeys[i]]});
                }

                vm.imageSource = vm.imageSources[0];

                if (!$scope.$$phase) {
                    $scope.$digest();
                }
            });

        vm.sensorValues = {};
        vm.stepTimeValue = 1;

        vm.toggleFloodLights = function () {
            ControlService.floodlightsOn(vm.sensorValues.vds_flood_lights_on.value ? 'off' : 'on')
                .then(function (result) {
                    var splitMessage = result.data.result.split(' ');
                    var message = KatGuiUtil.sanitizeKATCPMessage(result.data.result);
                    if (splitMessage.length > 2 && splitMessage[1] !== 'ok') {
                        NotifyService.showPreDialog('Error sending request', message);
                    } else {
                        NotifyService.showSimpleToast(message);
                    }
                }, function (error) {
                    NotifyService.showSimpleDialog('Error sending request', error);
                });
        };

        vm.panLeft = function () {
            vm.vdsCommand('pan/left', vm.stepTimeValue);
        };

        vm.panFarLeft = function () {
            vm.vdsCommand('pan', 'left');
        };

        vm.panRight = function () {
            vm.vdsCommand('pan/right', vm.stepTimeValue);
        };

        vm.panFarRight = function () {
            vm.vdsCommand('pan', 'right');
        };

        vm.tiltUp = function () {
            vm.vdsCommand('tilt/up', vm.stepTimeValue);
        };

        vm.tiltFarUp = function () {
            vm.vdsCommand('tilt', 'up');
        };

        vm.tiltDown = function () {
            vm.vdsCommand('tilt/down', vm.stepTimeValue);
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
                            $http(createRequest('post', urlBase() + '/presetset/'));
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
                            $http(createRequest('post', urlBase() + '/presetset/' + preset))
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
                            $http(createRequest('post', urlBase() + '/presetgoto/' + preset))
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
            $http(createRequest('post', urlBase() + '/stop'))
                .then(requestSuccess, requestError);
        };

        vm.vdsCommand = function (endpoint, args) {
            $http(createRequest('post', urlBase() + '/' + endpoint + '/' + args))
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
            SensorsService.setSensorStrategies('anc_vds_*', 'event-rate', 1, 360);
        };


        vm.afterInit = function() {
            if ($rootScope.currentUser) {
                if ($rootScope.expertOrLO ||
                    $rootScope.currentUser.req_role === USER_ROLES.operator) {
                    vm.canOperateVDS = true;
                    vm.connectListeners();
                }
            }
        };

        vm.unbindLoginSuccess = $rootScope.$on('loginSuccess', vm.afterInit);
        vm.afterInit();

        var unbindUpdate = $rootScope.$on('sensorsServerUpdateMessage', function (event, sensor) {
            var sensorName = sensor.name.split(':')[1].replace('anc_', '');
            vm.sensorValues[sensorName] = sensor.value;
            if (sensorName === 'vds_focus_position') {
                vm.focus = sensor.value.value;
            } else if (sensorName === 'vds_zoom_position') {
                vm.zoom = sensor.value.value;
            }
        });

        $scope.$on('$destroy', function () {
            unbindUpdate();
            vm.disconnectIssued = true;
            SensorsService.disconnectListener();
            if (vm.unbindLoginSuccess) {
                vm.unbindLoginSuccess();
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
