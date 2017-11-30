(function () {

    angular.module('katGui.services')
        .factory('NotifyService', NotifyService);

    function NotifyService($rootScope, $mdDialog, $mdToast, $log, $q, $timeout, ConfigService, MOMENT_DATETIME_FORMAT) {

        var api = {};
        api.toastPosition = 'bottom right';
        api.toastHideDelay = 3500;
        api.currentToast = null;
        api.toastHideTimeout = null;

        api.showSimpleToast = function (message) {
            // $mdToast.hide();
            $log.info('Showing toast-message: ' + message);
            if (!message || message.length === 0) {
                $log.error('Attempting to show empty toast message - aborting.');
                return;
            }
            if (!api.currentToast) {
                api.currentToast = $mdToast.simple();
                api.currentToast
                    .content(message)
                    .hideDelay(false) // never hide automatically
                    .position(api.toastPosition);
                $mdToast.show(api.currentToast);
                api.toastHideTimeout = $timeout(function () {
                    $mdToast.hide();
                    api.currentToast = null;
                }, api.toastHideDelay);
            } else {
                if (api.toastHideTimeout) {
                    $timeout.cancel(api.toastHideTimeout);
                }
                api.toastHideTimeout = $timeout(function () {
                    $mdToast.hide();
                    api.currentToast = null;
                }, api.toastHideDelay);
                $mdToast.updateTextContent(message);
            }
        };

        api.showHttpErrorDialog = function (title, httpResponse) {
            if (httpResponse && httpResponse.data && httpResponse.data.err_code) {
                api.showSimpleDialog(title, httpResponse.data.err_code + ': ' + httpResponse.data.err_msg);
            } else {
                api.showSimpleDialog(title, httpResponse.config.url);
            }
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
                    "<div style='padding:0; margin:0' layout='column' layout-padding >" +
                    "<md-toolbar class='md-primary' layout='row' layout-align='center center'><span>{{title}}</span></md-toolbar>" +
                    "<div flex style='overflow: auto'>{{content}}</div>" +
                    "<div layout='row' layout-align='end' style='margin-top: 8px; margin-right: 8px; margin-bottom: 8px; min-height: 40px;'>" +
                    "<md-button style='margin-left: 8px;' class='md-primary md-raised' md-theme='{{$root.themePrimaryButtons}}' aria-label='OK' ng-click='hide()'>Close</md-button>" +
                    "</div>" +
                    "</div>" +
                    "</md-dialog>",
                    targetEvent: event
                });

            $log.info('Showing dialog, title: ' + title + ', message: ' + content);
        };

        api.showSetupSubarrayDialog = function (event, title, contentList, sub_nr) {
            $log.info('Showing dialog, title: ' + title + ', contentList: ' + contentList);
            $mdDialog.show({
                controller: function ($rootScope, $scope, $mdDialog) {
                    $scope.title = title;
                    $scope.contentList = contentList;
                    $scope.sub_nr = sub_nr;
                    $scope.hide = function () {
                        $mdDialog.hide();
                    };
                    $scope.openSubarray = function () {
                        $rootScope.stateGo('scheduler.resources', {subarray_id: sub_nr});
                        $mdDialog.hide();
                    };
                },
                template: "<md-dialog style='padding: 0; max-width: 95%; max-height: 95%' md-theme='{{$root.themePrimary}}' aria-label=''>" +
                "<div style='padding:0; margin:0' layout='column' layout-padding >" +
                "<md-toolbar class='md-primary' layout='row' layout-align='center center'><span style='margin:8px'>{{title}}</span></md-toolbar>" +
                "<div style='overflow: auto' flex><pre ng-repeat='content in contentList' style='white-space: pre-wrap'>{{content}}</pre></div>" +
                "</div>" +
                "<div layout='row' layout-align='end' style='margin-top: 8px; margin-right: 8px; margin-bottom: 8px; min-height: 40px;'>" +
                "<md-button style='margin-left: 8px;' class='md-primary md-raised' md-theme='{{$root.themePrimaryButtons}}' aria-label='OK' ng-click='hide()'>Close</md-button>" +
                "<md-button style='margin-left: 8px;' class='md-primary md-raised' md-theme='{{$root.themePrimaryButtons}}' aria-label='OK' ng-click='openSubarray()'>View Subarray {{sub_nr}}</md-button>" +
                "</div>" +
                "</md-dialog>",
                targetEvent: event
            });
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
                    "<div style='padding:0; margin:0;' layout='column' layout-padding >" +
                    "<md-toolbar class='md-primary' layout='row' layout-align='center center'><span style='margin:8px'>{{title}}</span></md-toolbar>" +
                    "<div flex style='overflow: auto'><p>{{content}}</p></div>" +
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
                    template: "<md-dialog style='padding: 0; max-width: 95%; max-height: 95%' md-theme='{{$root.themePrimary}}' aria-label=''>" +
                    "<div style='padding:0; margin:0' layout='column' layout-padding >" +
                    "<md-toolbar class='md-primary' layout='row' layout-align='center center'><span style='margin:8px'>{{title}}</span></md-toolbar>" +
                    "<div style='overflow: auto' flex><pre style='white-space: pre-wrap'>{{content}}</pre></div>" +
                    "</div>" +
                    "<div layout='row' layout-align='end' style='margin-top: 8px; margin-right: 8px; margin-bottom: 8px; min-height: 40px;'>" +
                    "<md-button style='margin-left: 8px;' class='md-primary md-raised' md-theme='{{$root.themePrimaryButtons}}' aria-label='OK' ng-click='hide()'>Close</md-button>" +
                    "</div>" +
                    "</md-dialog>",
                    targetEvent: event
                });

            $log.info('Showing dialog, title: ' + title + ', message: ' + content);
        };

        api.showSBDetails = function (sb, event, title) {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog) {
                        if (!title) {
                            $scope.title = 'Schedule Block: ';
                        } else {
                            $scope.title = title;
                        }
                        if (_.isString(sb)) {
                            sb = JSON.parse(sb);
                        }
                        $scope.sb = sb;
                        $scope.hide = function () {
                            $mdDialog.hide();
                        };
                    },
                    template: "<md-dialog style='padding: 0; max-height: 95%' md-theme='{{$root.themePrimary}}' aria-label='Schedule Block Details'>" +
                    "<md-content style='padding: 0; margin: 0; width: 500px; height:800px' layout='column' layout-padding >" +
                    "<md-toolbar class='md-primary long-input' layout='row' layout-align='center center'><span>{{title}}<b>{{sb.id_code}}</b></span></md-toolbar>" +
                    "<pre style='white-space: pre-wrap; overflow: auto' ng-bind-html='sb | prettifyJSON'></pre>" +
                    "<div layout='row' layout-align='end' style='margin-top: 8px; margin-right: 8px; margin-bottom: 8px; min-height: 40px;'>" +
                    "<md-button class='md-primary md-raised' style='margin-left: 8px;' md-theme='{{$root.themePrimaryButtons}}' aria-label='Done' ng-click='hide()'>Done</md-button>" +
                    "</div>" +
                    "</md-content></md-dialog>",
                    targetEvent: event
                });
        };

        api.showHTMLPreSensorDialog = function (title, sensor, event) {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog) {
                        $scope.title = title;
                        $scope.sensor = sensor;
                        $scope.hide = function () {
                            $mdDialog.hide();
                        };

                        $scope.sensorClass = function (status) {
                            return status + '-sensor-list-item';
                        };
                    },
                    template: [
                        '<md-dialog style="padding: 0; max-width: 95%; max-height: 95%" md-theme="{{$root.themePrimary}}" aria-label="">',
                            '<div style="padding:0; margin:0; overflow: auto" layout="column" layout-padding layout-align="start center">',
                                '<md-toolbar class="md-primary" layout="row" layout-align="center center"><span>{{title}}</span></md-toolbar>',
                                '<div flex layout="column" layout-align="start" class="resource-sensor-item" style="min-height: 165px">',
                                    '<div layout="row"><span class="sensor-dialog-details-name">Name:</span><span>{{sensor.name}}</span></div>',
                                    '<div layout="row" style="max-width: 700px"><span class="sensor-dialog-details-name">Description:</span><div>{{sensor.description}}</div></div>',
                                    '<div layout="row"><span class="sensor-dialog-details-name">Status:</span><span ng-class="sensorClass(sensor.status)">{{sensor.status}}</span></div>',
                                    '<div layout="row"><span class="sensor-dialog-details-name">Units:</span><span>{{sensor.units}}</span></div>',
                                    '<div layout="row"><span class="sensor-dialog-details-name">Type:</span><span>{{sensor.type}}</span></div>',
                                    '<div layout="row"><span class="sensor-dialog-details-name">Value Timestamp:</span><span>{{sensor.timestamp}}</span></div>',
                                    '<div layout="row"><span class="sensor-dialog-details-name">Received Timestamp:</span><span>{{sensor.received_timestamp}}</span></div>',
                                '</div>',
                                '<span style="font-weight: bold">Value:</span>',
                                '<pre flex style="white-space: pre-wrap; margin: 2px 8px" title="Sensor value" class="md-whiteframe-z1">{{sensor.value}}</pre>',
                            '</div>',
                                '<div layout="row" layout-align="end" style="margin-top: 8px; margin-right: 8px; margin-bottom: 8px; min-height: 40px;">',
                                    '<md-button style="margin-left: 8px;" class="md-primary md-raised" md-theme="{{$root.themePrimaryButtons}}" aria-label="OK" ng-click="hide()">Close</md-button>',
                                '</div>',
                            '</div>',
                        '</md-dialog>'].join(''),
                    targetEvent: event
                });

            $log.info('Showing dialog, title: ' + title + ', message: ' + sensor.value);
        };

        return api;
    }
})();
