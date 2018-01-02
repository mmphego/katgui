(function() {

    angular.module('katGui.services')
        .service('MonitorService', MonitorService);

    function MonitorService(KatGuiUtil, $timeout, StatusService, AlarmsService, ObsSchedService, $interval,
        $rootScope, $q, $log, ReceptorStateService, NotifyService, UserLogService, ConfigService,
        SessionService, $http, $state, $mdDialog, MOMENT_DATETIME_FORMAT) {

        function urlBase() {
            return $rootScope.portalUrl ? $rootScope.portalUrl + '/katmonitor' : '';
        }
        var api = {};
        api.deferredMap = {};
        api.connection = null;
        api.lastSyncedTime = null;
        api.globalSubscriptionFilters = [{
            component: 'sys',
            filter: 'sys_interlock_state'
        }, {
            component: 'katpool',
            filter: 'katpool_lo_id'
        }, {
            component: 'kataware',
            filter: 'kataware_alarm_'
        }];
        api.globalSubscriptions = {};

        //websocket default heartbeat is every 30 seconds
        //so allow for 35 seconds before alerting about timeout
        api.heartbeatTimeOutLimit = 35000;
        api.checkAliveConnectionInterval = 10000;

        api.getTimeoutPromise = function() {
            api.deferredMap.timeoutDefer = $q.defer();
            return api.deferredMap.timeoutDefer.promise;
        };

        api.initGlobalSensors = function() {
            api.globalSubscriptionFilters.forEach(function(globalSub) {
                api.listSensors(globalSub.component, globalSub.filter);
            });
        };

        api.subscribeSensorName = function(component, sensorName) {
            api.subscribe('sensor.normal.' + component + '.' + sensorName);
        };

        api.subscribeSensor = function(sensor) {
            var sensorWithoutComponent = sensor.name.replace(sensor.component + '_', '');
            // Sensor subjects are sensor.*.<component>.<sensorName>
            api.subscribe('sensor.normal.' + sensor.component + '.' + sensorWithoutComponent);
        };

        api.subscribeResource = function(component) {
            // Sensor subjects are sensor.*.<component>.*
            api.subscribe('sensor.normal.' + component + '.*');
        };

        api.subscribe = function(sub) {
            var jsonRPC = {
                'jsonrpc': '2.0',
                'method': 'subscribe',
                'params': [sub],
                'id': 'monitor-' + KatGuiUtil.generateUUID()
            };

            if (api.connection && api.connection.readyState) {
                return api.connection.send(JSON.stringify(jsonRPC));
            } else {
                $timeout(function() {
                    api.subscribe(sub);
                }, 500);
            }
        };

        api.unsubscribeSensorName = function(component, sensorName) {
            api.unsubscribe('sensor.normal.' + component + '.' + sensorName);
        };

        api.unsubscribeSensor = function(sensor) {
            var sensorWithoutComponent = sensor.name.replace(sensor.component + '_', '');
            // Sensor subjects are sensor.*.<component>.<sensorName>
            api.unsubscribe('sensor.normal.' + sensor.component + '.' + sensorWithoutComponent);
        };

        api.unsubscribe = function(subscriptions) {
            var jsonRPC = {
                'jsonrpc': '2.0',
                'method': 'unsubscribe',
                'params': [subscriptions],
                'id': 'monitor-' + KatGuiUtil.generateUUID()
            };

            if (api.connection === null) {
                $log.error('No Monitor Connection Present for unsubscribing, ignoring command for unsubs ' + subscriptions);
            } else if (api.connection.readyState) {
                return api.connection.send(JSON.stringify(jsonRPC));
            } else {
                $timeout(function() {
                    api.unsubscribe(subscriptions);
                }, 500);
            }
        };

        api.onSockJSOpen = function() {
            if (api.connection && api.connection.readyState) {
                $log.info('Monitor Connection Established.');
                api.deferredMap.connectDefer.resolve();
                api.subscribeToDefaultChannels();
                ConfigService.checkOutOfDateVersion();
            }
            api.lastHeartBeat = new Date();
            $rootScope.connectedToMonitor = true;
        };

        api.subscribeToDefaultChannels = function() {
            api.subscribe(['portal.time', 'portal.auth.>']);
        };

        api.checkAlive = function() {
            if (!api.lastHeartBeat || new Date().getTime() - api.lastHeartBeat.getTime() > api.heartbeatTimeOutLimit) {
                $log.warn('Monitor Connection Heartbeat timeout!');
                api.connection = null;
                $rootScope.connectedToMonitor = false;
                api.deferredMap.timeoutDefer.resolve();
            }
        };

        api.onSockJSHeartbeat = function() {
            api.lastHeartBeat = new Date();
        };

        api.onSockJSClose = function() {
            $log.info('Disconnecting Monitor Connection.');
            api.connection = null;
            api.lastHeartBeat = null;
            $rootScope.connectedToMonitor = false;
            api.globalSubscriptions = {};
        };

        api.onSockJSMessage = function(e) {
            if (e && e.data) {
                var msg;
                if (e.data.data) {
                    msg = e.data;
                    var data;
                    try {
                        data = JSON.parse(msg.data);
                    } catch (error) {
                        data = msg.data;
                    }

                    if (msg.subject === 'portal.time') {
                        api.lastSyncedTime = data.time;
                        api.lastSyncedLST = data.lst;
                    } else if (msg.subject.startsWith('sensor.')) {
                        $rootScope.$emit('sensorUpdateMessage', data, msg.subject);
                    } else if (msg.subject === 'portal.sched') {
                        ObsSchedService.receivedScheduleMessage(data);
                    } else if (msg.subject.startsWith('portal.userlogs')) {
                        UserLogService.receivedUserlogMessage(msg.subject, data);
                    } else {
                        // req.reply messages
                        $rootScope.$emit('sensorUpdateMessage', data, msg.subject);
                        if (data && data.component) {
                            var foundGlobalMatch = api.globalSubscriptionFilters.filter(function(globalSub) {
                                return globalSub.component === data.component &&
                                    data.name.match(globalSub.filter);
                            });
                            if (foundGlobalMatch && !api.globalSubscriptions[data.name]) {
                                api.globalSubscriptions[data.name] = data;
                                api.subscribeSensor(data);
                            }
                        }
                    }

                    if (data.name === "katpool_lo_id") {
                        $rootScope.katpool_lo_id = data;
                        if ($rootScope.currentUser &&
                            $rootScope.currentUser.req_role === 'lead_operator' &&
                            $rootScope.katpool_lo_id.value.length > 0 &&
                            $rootScope.katpool_lo_id.value !== $rootScope.currentUser.email) {
                            NotifyService.showDialog(
                                'You have been logged in as the Monitor Role',
                                'You have lost the Lead Operator Role because ' +
                                $rootScope.katpool_lo_id.value + ' has assumed the Lead Operator role.');
                            //$rootScope.logout();
                            //Do not logout, just loging as a demoted monitor only use
                            SessionService.verifyAs('read_only');
                        }
                    } else if (data.name === "sys_interlock_state") {
                        $rootScope.sys_interlock_state = data;
                    } else if (data.name && data.name.startsWith('kataware_alarm')) {
                        AlarmsService.receivedAlarmMessage(data);
                    }
                } else {
                    msg = e.data;
                    if (msg.error) {
                        $log.error('There was an error sending a jsonrpc request:');
                        $log.error(msg);
                    } else if (msg.server_hint) {
                        $log.warn('Server hint received: ' + msg.server_hint);
                        $log.warn(msg);
                        if (msg.server_hint === 'retry_later' && msg.hint_method === 'list_sensors') {
                            $timeout(function() {
                                api.listSensors(msg.hint_args.component, msg.hint_args.name_filter);
                            }, msg.hint_args.timedelta);
                        }
                    } else {
                        $log.warn('Dangling websocket message: ' + msg);
                    }
                }
            }
        };

        api.connectListener = function() {
            api.deferredMap.connectDefer = $q.defer();
            if (!api.connection) {
                $log.info('Monitor Connecting...');
                api.connection = new SockJS(urlBase() + '/client');
                api.connection.onopen = api.onSockJSOpen;
                api.connection.onmessage = api.onSockJSMessage;
                api.connection.onclose = api.onSockJSClose;
                api.connection.onheartbeat = api.onSockJSHeartbeat;
                api.lastHeartBeat = new Date();
            } else {
                $timeout(function() {
                    if ($rootScope.connectedToMonitor) {
                        api.deferredMap.connectDefer.resolve();
                    } else {
                        api.deferredMap.connectDefer.reject();
                    }
                }, 1000);
            }
            if (!api.checkAliveInterval) {
                api.checkAliveInterval = $interval(api.checkAlive, api.checkAliveConnectionInterval);
            }
            return api.deferredMap.connectDefer.promise;
        };

        api.disconnectListener = function() {
            if (api.connection && api.connection.readyState) {
                api.connection.close();
                $interval.cancel(api.checkAliveInterval);
                api.checkAliveInterval = null;
            } else {
                $log.error('Attempting to disconnect an already disconnected connection!');
            }
        };

        api.listSensors = function(component, regex) {
            api.sendMonitorCommand('list_sensors', [component, regex]);
        };

        api.showAggregateSensorsDialog = function(title, content, event) {
            $mdDialog
                .show({
                    controller: function($rootScope, $scope, $mdDialog) {
                        $scope.title = title;
                        $scope.content = content;
                        $scope.hide = function() {
                            $mdDialog.hide();
                        };
                        $scope.jsonContent = JSON.parse(content);
                        $scope.parentSensorNameList = $scope.jsonContent.sensors.split(',');
                        $scope.subscribedSensors = [];
                        $scope.sensorNameList = [];
                        $scope.sensorValues = {};

                        $scope.sensorClass = function(status) {
                            return status + '-sensor-list-item';
                        };

                        $scope.initSensors = function() {
                            setAggSensorStrategies();
                        };

                        function setAggSensorStrategies() {
                            $scope.parentSensorNameList.forEach(function(sensorName) {
                                getChildSensorsFromAgg(sensorName);

                                function getChildSensorsFromAgg(sensor) {
                                    if (sensor.indexOf('agg_') === -1) {
                                        $scope.sensorNameList.push(sensor);
                                    } else {
                                        var childSensors = ConfigService.aggregateSensorDetail[sensor].sensors.split(',');
                                        childSensors.forEach(function(childSensor) {
                                            if (sensor.indexOf('agg_') === -1) {
                                                $scope.sensorNameList.push(childSensor);
                                            } else {
                                                getChildSensorsFromAgg(childSensor);
                                            }
                                        });
                                    }
                                }
                            });
                            var componentSensors = {};
                            if ($scope.sensorNameList) {
                                $scope.sensorNameList.forEach(function(sensorName) {
                                    var component, componentNameMatches;
                                    if (sensorName.startsWith('nm_') || sensorName.startsWith('mon_')) {
                                        componentNameMatches = sensorName.match(/^(mon_|nm_)[a-z0-9]+_/);
                                    } else {
                                        componentNameMatches = sensorName.match(/^[a-z0-9]+_\d|^[a-z0-9]+_/);
                                    }
                                    if (componentNameMatches) {
                                        component = componentNameMatches[0].slice(0, componentNameMatches[0].length - 1);
                                    }

                                    if (component) {
                                        if (!componentSensors[component]) {
                                            componentSensors[component] = {
                                                sensors: []
                                            };
                                        }
                                        componentSensors[component].sensors.push(sensorName.replace(component + '_', ''));
                                    }
                                });
                            }
                            for (var component in componentSensors) {
                                api.listSensors(component, componentSensors[component].sensors.join('|'));
                            }
                        }

                        var unbindUpdate = $rootScope.$on('sensorUpdateMessage', function(event, sensor, subject) {
                            if (subject.startsWith('req.reply')) {
                                api.subscribeSensor(sensor);
                                if (!$scope.sensorValues[sensor.name]) {
                                    $scope.subscribedSensors.push(sensor);
                                }
                            }
                            sensor.date = moment.utc(sensor.time, 'X').format(MOMENT_DATETIME_FORMAT);
                            $scope.sensorValues[sensor.name] = sensor;
                        });

                        var unbindReconnected = $rootScope.$on('websocketReconnected', $scope.initSensors);
                        $scope.initSensors();

                        $scope.$on('$destroy', function() {
                            $scope.subscribedSensors.forEach(function(sensor) {
                                api.unsubscribeSensor(sensor);
                            });
                            unbindUpdate();
                            unbindReconnected();
                        });
                    },
                    template: [
                        '<md-dialog style="padding: 0;" md-theme="{{$root.themePrimary}}" aria-label="">',
                        '<div style="padding:0; margin:0; overflow: auto" layout="column" layout-padding >',
                        '<md-toolbar class="md-primary" layout="row" layout-align="center center"><span>{{title}}</span></md-toolbar>',
                        '<div flex><pre style="white-space: pre-wrap">{{content}}</pre></div>',
                        '<div layout="column" class="resource-sensors-list" style="margin: 0 16px">',
                        '<div style="height: 24px" ng-repeat="sensor in subscribedSensors | orderBy:\'name\'">',
                        '<div layout="row" class="resource-sensor-item" title="{{sensor.original_name}}">',
                        '<span style="width: 450px; overflow: hidden; text-overflow: ellipsis">{{sensor.original_name}}</span>',
                        '<span class="resource-sensor-status-item" ng-class="sensorClass(sensorValues[sensor.name].status)">{{sensorValues[sensor.name].status}}</span>',
                        '<span class="resource-sensor-time-item" title="Timestamp">{{sensorValues[sensor.name].date}}</span>',
                        '<span flex class="resource-sensor-value-item">{{sensorValues[sensor.name].value}}</span>',
                        '</div>',
                        '</div>',
                        '</div>',
                        '</div>',
                        '<div layout="row" layout-align="end" style="margin-top: 8px; margin-right: 8px; margin-bottom: 8px; min-height: 40px;">',
                        '<md-button style="margin-left: 8px;" class="md-primary md-raised" md-theme="{{$root.themePrimaryButtons}}" aria-label="OK" ng-click="hide()">Close</md-button>',
                        '</div>',
                        '</md-dialog>'
                    ].join(''),
                    targetEvent: event
                });

            $log.info('Showing dialog, title: ' + title + ', message: ' + content);
        };

        api.sendMonitorCommand = function(method, params) {
            if (api.connection && api.connection.readyState) {
                var jsonRPC = {
                    'id': KatGuiUtil.generateUUID(),
                    'jsonrpc': '2.0',
                    'method': method,
                    'params': params
                };

                api.connection.send(JSON.stringify(jsonRPC));
            } else {
                $timeout(function() {
                    api.sendMonitorCommand(method, params);
                }, 500);
            }
        };

        return api;
    }
})();
