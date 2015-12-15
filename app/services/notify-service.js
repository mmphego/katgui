(function () {

    angular.module('katGui.services')
        .factory('NotifyService', NotifyService);

    function NotifyService($rootScope, $mdDialog, $mdToast, $log, $q, SensorsService, ConfigService, DATETIME_FORMAT) {

        var api = {};
        api.toastPosition = 'bottom right';
        api.toastHideDelay = 3500;

        api.showSimpleToast = function (message) {
            $mdToast.hide();
            var simpleToast = $mdToast.simple()
                .content(message)
                .highlightAction(true)
                .position(api.toastPosition)
                .hideDelay(api.toastHideDelay);
            $mdToast.show(simpleToast);
            $log.info('Showing toast-message: ' + message);
        };

        api.showSimpleDialog = function (title, message) {
            api.showDialog(title, message);
        };

        api.showDialog = function (title, content, event) {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog) {
                        $scope.title = title;
                        $scope.content = content;
                        $scope.hide = function () {
                            $mdDialog.hide();
                        };
                    },
                    template: "<md-dialog style='padding: 0;' md-theme='{{$root.themePrimary}}' aria-label=''>" +
                    "<div style='padding:0; margin:0; overflow: auto' layout='column' layout-padding >" +
                    "<md-toolbar class='md-primary' layout='row' layout-align='center center'><span>{{title}}</span></md-toolbar>" +
                    "<div flex>{{content}}</div>" +
                    "<div layout='row' layout-align='end' style='margin-top: 8px; margin-right: 8px; margin-bottom: 8px; min-height: 40px;'>" +
                    "<md-button style='margin-left: 8px;' class='md-primary md-raised' md-theme='{{$root.themePrimaryButtons}}' aria-label='OK' ng-click='hide()'>Close</md-button>" +
                    "</div>" +
                    "</div>" +
                    "</md-dialog>",
                    targetEvent: event
                });

            $log.info('Showing dialog, title: ' + title + ', message: ' + content);
        };

        api.showConfirmDialog = function(event, title, content, confirmText, cancelText) {
            var deferred = $q.defer();
            var confirmButton = confirmText ? confirmText : 'Confirm';
            var cancelButton = cancelText ? cancelText : 'Cancel';
            var confirm = $mdDialog.confirm()
                .title(title)
                .content(content)
                .ariaLabel('')
                .ok(confirmButton)
                .cancel(cancelButton)
                .targetEvent(event);
            $mdDialog.show(confirm).then(function() {
                deferred.resolve();
            }, function() {
                deferred.reject();
            });
            return deferred.promise;
        };

        api.showImportantConfirmDialog = function(event, title, content, confirmText, cancelText) {
            var deferred = $q.defer();
            var confirmButton = confirmText ? confirmText : 'Confirm';
            var cancelButton = cancelText ? cancelText : 'Cancel';
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog) {
                        $scope.title = title;
                        $scope.content = content;
                        $scope.resolve = function () {
                            deferred.resolve();
                            $mdDialog.hide();
                        };
                        $scope.reject = function () {
                            deferred.reject();
                            $mdDialog.hide();
                        };
                    },
                    template: "<md-dialog style='padding: 0;' md-theme='red' aria-label=''>" +
                    "<div style='padding:0; margin:0; overflow: auto' layout='column' layout-padding >" +
                    "<md-toolbar class='md-primary' layout='row' layout-align='center center'><span style='margin:8px'>{{title}}</span></md-toolbar>" +
                    "<div flex><p>{{content}}</p></div>" +
                    "</div>" +
                    "<div layout='row' layout-align='end' style='margin-top: 8px; margin-right: 8px; margin-bottom: 8px; min-height: 40px;'>" +
                    "<md-button style='margin-left: 8px;' class='md-primary md-raised' md-theme='{{$root.themePrimaryButtons}}' aria-label='' ng-click='reject()'>" + cancelButton + "</md-button>" +
                    "<md-button style='margin-left: 8px;' class='md-primary md-raised' md-theme='red' aria-label='' ng-click='resolve()'>" + confirmButton + "</md-button>" +
                    "</div>" +
                    "</md-dialog>",
                    targetEvent: event
                });

            $log.info('Showing dialog, title: ' + title + ', message: ' + content);
            return deferred.promise;
        };

        api.showPreDialog = function (title, content, event) {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog) {
                        $scope.title = title;
                        $scope.content = content;
                        $scope.hide = function () {
                            $mdDialog.hide();
                        };
                    },
                    template: "<md-dialog style='padding: 0;' md-theme='{{$root.themePrimary}}' aria-label=''>" +
                    "<div style='padding:0; margin:0; overflow: auto' layout='column' layout-padding >" +
                    "<md-toolbar class='md-primary' layout='row' layout-align='center center'><span style='margin:8px'>{{title}}</span></md-toolbar>" +
                    "<div flex><pre>{{content}}</pre></div>" +
                    "</div>" +
                    "<div layout='row' layout-align='end' style='margin-top: 8px; margin-right: 8px; margin-bottom: 8px; min-height: 40px;'>" +
                    "<md-button style='margin-left: 8px;' class='md-primary md-raised' md-theme='{{$root.themePrimaryButtons}}' aria-label='OK' ng-click='hide()'>Close</md-button>" +
                    "</div>" +
                    "</md-dialog>",
                    targetEvent: event
                });

            $log.info('Showing dialog, title: ' + title + ', message: ' + content);
        };

        api.showSBDetails = function (sb, event) {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog) {
                        $scope.sb = sb;
                        $scope.hide = function () {
                            $mdDialog.hide();
                            $rootScope.mdDialogSb = undefined;
                        };
                    },
                    template: "<md-dialog style='padding: 0;' md-theme='{{$root.themePrimary}}' aria-label='Schedule Block Details'>" +
                    "<md-content style='padding: 0; margin: 0; width: 500px;height:800px' layout='column' layout-padding >" +
                    "<md-toolbar class='md-primary long-input' layout='row' layout-align='center center'><span>Schedule Block: <b>{{sb.id_code}}</b></span></md-toolbar>" +
                    "<pre ng-bind-html='sb | prettifyJSON'></pre>" +
                    "<div layout='row' layout-align='end' style='margin-top: 8px; margin-right: 8px; margin-bottom: 8px; min-height: 40px;'>" +
                    "<md-button class='md-primary md-raised' style='margin-left: 8px;' md-theme='{{$root.themePrimaryButtons}}' aria-label='Done' ng-click='hide()'>Done</md-button>" +
                    "</div>" +
                    "</md-content></md-dialog>",
                    targetEvent: event
                });
        };

        api.showAggregateSensorsDialog = function (title, content, event) {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog) {
                        $scope.title = title;
                        $scope.content = content;
                        $scope.hide = function () {
                            $mdDialog.hide();
                        };
                        $scope.jsonContent = JSON.parse(content);
                        $scope.parentSensorNameList = $scope.jsonContent.sensors.split(',');
                        $scope.sensorNameList = [];
                        $scope.sensors = {};

                        $scope.sensorClass = function (status) {
                            return status + '-sensor-list-item';
                        };

                        SensorsService.connectListener()
                            .then(function () {
                                $scope.parentSensorNameList.forEach(function (sensorName) {
                                    getChildSensorsFromAgg(sensorName);
                                    function getChildSensorsFromAgg (sensor) {
                                        if (sensor.indexOf('agg_') === -1) {
                                            $scope.sensorNameList.push(sensor);
                                        } else {
                                            var childSensors = ConfigService.aggregateSensorDetail[sensor].sensors.split(',');
                                            childSensors.forEach(function (childSensor) {
                                                if (sensor.indexOf('agg_') === -1) {
                                                    $scope.sensorNameList.push(childSensor);
                                                } else {
                                                    getChildSensorsFromAgg(childSensor);
                                                }

                                            });
                                        }
                                    }
                                });

                                var sensorsRegex = '';
                                $scope.sensorNameList.forEach(function (sensor, index) {
                                    $scope.sensors[sensor] = {name: sensor};
                                    if (index !== 0) {
                                        sensorsRegex += '|';
                                    }
                                    sensorsRegex += '^' + sensor;
                                });
                                if (sensorsRegex.length > 0) {
                                    SensorsService.setSensorStrategies(sensorsRegex, 'event-rate', 1, 360);
                                }

                            }, function () {
                                $log.error('Could not establish sensor connection.');
                            });

                        var unbindUpdate = $rootScope.$on('sensorsServerUpdateMessage', function (event, sensor) {
                            var strList = sensor.name.split(':');
                            var sensorName = strList[1].replace(/\./g, '_').trim();
                            $scope.sensors[sensorName].value = sensor.value.value;
                            $scope.sensors[sensorName].status = sensor.value.status;
                            $scope.sensors[sensorName].timestamp = moment.utc(sensor.value.timestamp, 'X').format(DATETIME_FORMAT);
                            $scope.sensors[sensorName].received_timestamp = moment.utc(sensor.value.received_timestamp, 'X').format(DATETIME_FORMAT);
                        });

                        $scope.$on('$destroy', function () {
                            unbindUpdate();
                            SensorsService.disconnectListener();
                        });
                    },
                    template: "<md-dialog style='padding: 0;' md-theme='{{$root.themePrimary}}' aria-label=''>" +
                    "   <div style='padding:0; margin:0; overflow: auto' layout='column' layout-padding >" +
                    "       <md-toolbar class='md-primary' layout='row' layout-align='center center'><span>{{title}}</span></md-toolbar>" +
                    "           <div flex><pre>{{content}}</pre></div>" +
                    "           <div layout='column' class='resource-sensors-list' style='margin: 0 16px'>" +
                    "               <div style='height: 24px' ng-repeat='sensor in sensors'>" +
                    "                   <div layout='row' class='resource-sensor-item' title='{{sensor.name}}'>" +
                    "                       <span style='width: 310px; overflow: hidden; text-overflow: ellipsis'>{{sensor.name}}</span>" +
                    "                       <span class='resource-sensor-status-item' ng-class='sensorClass(sensor.status)'>{{sensor.status}}</span>" +
                    "                       <span class='resource-sensor-time-item' title='Timestamp (Received: {{sensor.received_timestamp}})'>{{sensor.timestamp}}</span>" +
                    "                       <span flex class='resource-sensor-value-item'>{{sensor.value}}</span>" +
                    "                   </div>" +
                    "               </div>" +
                    "           </div>" +
                    "   </div>" +
                    "   <div layout='row' layout-align='end' style='margin-top: 8px; margin-right: 8px; margin-bottom: 8px; min-height: 40px;'>" +
                    "       <md-button style='margin-left: 8px;' class='md-primary md-raised' md-theme='{{$root.themePrimaryButtons}}' aria-label='OK' ng-click='hide()'>Close</md-button>" +
                    "   </div>" +
                    "</md-dialog>",
                    targetEvent: event
                });

            $log.info('Showing dialog, title: ' + title + ', message: ' + content);
        };

        return api;
    }
})();
