(function () {

    angular.module('katGui.services')
        .factory('NotifyService', NotifyService);

    function NotifyService($mdDialog, $mdToast, $log, SensorsService) {

        var api = {};
        api.toastPosition = 'bottom right';
        api.toastHideDelay = 3500;

        api.showSimpleToast = function (message) {
            $mdToast.show(
                $mdToast.simple()
                    .content(message)
                    .position(api.toastPosition)
                    .hideDelay(api.toastHideDelay)
            );

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
                    "<textarea style='resize: none; overflow: auto; border: 0; background: transparent' auto-grow readonly>{{sb | json:4}}</textarea>" +
                    "<div layout='row' layout-align='end' style='margin-top: 8px; margin-right: 8px; margin-bottom: 8px; min-height: 40px;'>" +
                    "<md-button class='md-primary' style='margin-left: 8px;' md-theme='{{$root.themePrimaryButtons}}' aria-label='Done' ng-click='hide()'>Done</md-button>" +
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

                                $scope.sensorNameList.forEach(function (sensor) {
                                    var resource = '';
                                    var sensorName = '';

                                    $scope.sensors[sensor] = {name: sensor};
                                    var firstPart = sensor.split('_', 1)[0];
                                    if (firstPart === 'mon' || firstPart === 'nm') {
                                        var secondPart = sensor.substring(sensor.indexOf('_') + 1);
                                        resource = firstPart + '_' + secondPart;
                                        sensorName = secondPart;
                                    } else {
                                        resource = firstPart;
                                        sensorName = sensor.substring(sensor.indexOf('_') + 1);
                                    }
                                    SensorsService.setSensorStrategy(resource, sensorName, 'event-rate', 1, 360);
                                });
                            }, function () {
                                $log.error('Could not establish sensor connection.');
                            });

                        var unbindUpdate = $rootScope.$on('sensorsServerUpdateMessage', function (event, sensor) {
                            var strList = sensor.name.split(':');
                            var sensorName = strList[1].replace(/\./g, '_');
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
                    "                   <div layout='row' class='resource-sensor-item'>" +
                    "                       <span style='width: 310px'>{{sensor.name}}</span>" +
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
