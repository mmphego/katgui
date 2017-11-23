(function () {

    angular.module('katGui.services')
        .service('MonitorService', MonitorService);

    function MonitorService(KatGuiUtil, $timeout, StatusService, AlarmsService, ObsSchedService, $interval,
                            $rootScope, $q, $log, ReceptorStateService, NotifyService, UserLogService, ConfigService,
                            SessionService, SensorsService, $http) {

        function urlBase() {
            return $rootScope.portalUrl? $rootScope.portalUrl + '/katmonitor' : '';
        }
        var api = {};
        api.deferredMap = {};
        api.connection = null;
        api.lastSyncedTime = null;

        //websocket default heartbeat is every 30 seconds
        //so allow for 35 seconds before alerting about timeout
        api.heartbeatTimeOutLimit = 35000;
        api.checkAliveConnectionInterval = 10000;

        api.getTimeoutPromise = function () {
            if (!api.deferredMap['timeoutDefer']) {
                api.deferredMap['timeoutDefer'] = $q.defer();
            }
            return api.deferredMap['timeoutDefer'].promise;
        };

        api.subscribeSensorName = function (component, sensorName) {
            api.subscribe('sensor.*.' + component + '.' + sensorName);
        };

        api.subscribeSensor = function (sensor) {
            var sensorWithoutComponent = sensor.name.replace(sensor.component + '_', '');
            // Sensor subjects are sensor.*.<component>.<sensorName>
            api.subscribe('sensor.*.' + sensor.component + '.' + sensorWithoutComponent);
        };

        api.subscribe = function (sub) {
            var jsonRPC = {
                'jsonrpc': '2.0',
                'method': 'subscribe',
                'params': [sub],
                'id': 'monitor-' + KatGuiUtil.generateUUID()
            };

            if (api.connection && api.connection.readyState) {
                return api.connection.send(JSON.stringify(jsonRPC));
            } else {
                $timeout(function () {
                    api.subscribe(sub);
                }, 500);
            }
        };

        api.unsubscribeSensorName = function (component, sensorName) {
            api.unsubscribe('sensor.*.' + component + '.' + sensorName);
        };

        api.unsubscribeSensor = function (sensor) {
            var sensorWithoutComponent = sensor.name.replace(sensor.component + '_', '');
            // Sensor subjects are sensor.*.<component>.<sensorName>
            api.unsubscribe('sensor.*.' + sensor.component + '.' + sensorWithoutComponent);
        };

        api.unsubscribe = function (subscriptions) {
            var jsonRPC = {
                'jsonrpc': '2.0',
                'method': 'unsubscribe',
                'params': [subscriptions],
                'id': 'monitor-' + KatGuiUtil.generateUUID()
            };

            if (api.connection === null) {
                $log.error('No Monitor Connection Present for subscribing, ignoring command for subs ' + subscriptions);
            } else if (api.connection.readyState) {
                return api.connection.send(JSON.stringify(jsonRPC));
            } else {
                $timeout(function () {
                    api.unsubscribe(subscriptions);
                }, 500);
            }
        };

        api.onSockJSOpen = function () {
            if (api.connection && api.connection.readyState) {
                $log.info('Monitor Connection Established.');
                api.deferredMap['connectDefer'].resolve();
                api.subscribeToDefaultChannels();
                ConfigService.checkOutOfDateVersion();
            }
            api.lastHeartBeat = new Date();
            $rootScope.connectedToMonitor = true;
        };

        api.subscribeToDefaultChannels = function () {
            api.subscribe(['portal.time', 'portal.alarms', 'portal.health', 'portal.auth.>', 'portal.resources']);
        };

        api.checkAlive = function () {
            if (!api.lastHeartBeat || new Date().getTime() - api.lastHeartBeat.getTime() > api.heartbeatTimeOutLimit) {
                $log.warn('Monitor Connection Heartbeat timeout!');
                api.connection = null;
                $rootScope.connectedToMonitor = false;
                api.deferredMap['timeoutDefer'].resolve();
                api.deferredMap['timeoutDefer'] = null;
            }
        };

        api.onSockJSHeartbeat = function () {
            api.lastHeartBeat = new Date();
        };

        api.onSockJSClose = function () {
            $log.info('Disconnecting Monitor Connection.');
            api.connection = null;
            api.lastHeartBeat = null;
            $rootScope.connectedToMonitor = false;
        };

        api.onSockJSMessage = function (e) {
            if (e && e.data) {
                if (e.data.data) {
                    var msg = e.data;
                    var data = JSON.parse(msg.data);
                    if (msg.subject === 'portal.time') {
                        api.lastSyncedTime = data.time + 0.5;
                        api.lastSyncedLST = data.lst;
                    } else if (msg.subject.startsWith('sensor.')) {
                        $rootScope.$emit('sensorUpdateMessage', data, msg.subject);
                        if (data.name === "katpool_lo_id") {
                            $rootScope.currentLeadOperator.name = data.value;
                        } else if (data.name === "sys_interlock_state") {
                            $rootScope.interlockState.value = data.value;
                        }
                    } else if (msg.subject === 'portal.sched') {
                        $log.info(msg);
                        // ObsSchedService.receivedScheduleMessage(messages.result.msg_data);
                    } else if (msg.subject === 'portal.alarms') {
                        $log.info(msg);
                    //     if (messageChannel[0] === 'alarms') {
                    //        AlarmsService.receivedAlarmMessage(messageObj.msg_channel, messageObj.msg_data);
                    //    }
                    } else if (msg.subject.startsWith('portal.userlogs')) {
                        UserLogService.receivedUserlogMessage(msg.subject, data);
                    } else if (msg.subject === 'portal.auth.current_lo') {
                        $rootScope.currentLeadOperator.name = data.lo;
                        if ($rootScope.currentUser &&
                            $rootScope.currentUser.req_role === 'lead_operator' &&
                            $rootScope.currentLeadOperator.name.length > 0 &&
                            $rootScope.currentLeadOperator.name !== $rootScope.currentUser.email) {
                            NotifyService.showDialog(
                                'You have been logged in as the Monitor Role', 'You have lost the Lead Operator Role because ' +
                                $rootScope.currentLeadOperator.name + ' has assumed the Lead Operator role.');
                            //$rootScope.logout();
                            //Do not logout, just loging as a demoted monitor only use
                            SessionService.verifyAs('read_only');
                        }
                    } else if (msg.subject === 'portal.resources') {
                         // if (data.name.endsWith('katpool_resources_in_maintenance')) {
                         //     StatusService.receptorMaintenanceMessageReceived(data);
                         // }
                         // ObsSchedService.receivedResourceMessage(data);
                    } else if (msg.subject === 'portal.health') {
                        $log.info(msg);
                    //     if (messageChannel[0] === 'health') {
                    //        if ((messageChannel[1].endsWith('mode') || messageChannel[1].endsWith('inhibited') ||
                    //            messageChannel[1].endsWith('vds_flood_lights_on'))) {
                    //            ReceptorStateService.receptorMessageReceived({
                    //                name: messageObj.msg_channel,
                    //                value: messageObj.msg_data
                    //            });
                    //        } else {
                    //            $log.error('Dangling Sensors message...');
                    //            $log.error(messageObj);
                    //        }
                    //    }
                    } else {
                        // this was a req reply (list_sensors remote request)
                        $rootScope.$emit('sensorUpdateMessage', data, msg.subject);
                        if (data.name === "katpool_lo_id") {
                            $rootScope.currentLeadOperator.name = data.value;
                        } else if (data.name === "sys_interlock_state") {
                            $rootScope.interlockState.value = data.value;
                        }
                    }
                } else {
                    var message = JSON.parse(e.data);
                    if (message.error) {
                        $log.error('There was an error sending a jsonrpc request:');
                        $log.error(message);
                    } else {
                        $log.warn('Dangling websocket message: ' + message);
                    }
                }
            }
        };

        api.connectListener = function () {
            api.deferredMap['connectDefer'] = $q.defer();
            if (!api.connection) {
                $log.info('Monitor Connecting...');
                api.connection = new SockJS(urlBase() + '/client');
                api.connection.onopen = api.onSockJSOpen;
                api.connection.onmessage = api.onSockJSMessage;
                api.connection.onclose = api.onSockJSClose;
                api.connection.onheartbeat = api.onSockJSHeartbeat;
                api.lastHeartBeat = new Date();
            } else {
                $timeout(function () {
                    if ($rootScope.connectedToMonitor) {
                        api.deferredMap['connectDefer'].resolve();
                    } else {
                        api.deferredMap['connectDefer'].reject();
                    }
                }, 1000);
            }
            if (!api.checkAliveInterval) {
                api.checkAliveInterval = $interval(api.checkAlive, api.checkAliveConnectionInterval);
            }
            return api.deferredMap['connectDefer'].promise;
        };

        api.disconnectListener = function () {
            if (api.connection && api.connection.readyState) {
                api.connection.close();
                $interval.cancel(api.checkAliveInterval);
                api.checkAliveInterval = null;
            } else {
                $log.error('Attempting to disconnect an already disconnected connection!');
            }
        };

        api.listSensors = function (component, regex) {
          api.sendMonitorCommand('list_sensors', [component, regex]);
        };

        api.sendMonitorCommand = function (method, params) {
            if (api.connection && api.connection.readyState) {
                var jsonRPC = {
                    'id': KatGuiUtil.generateUUID(),
                    'jsonrpc': '2.0',
                    'method': method,
                    'params': params
                };

                api.connection.send(JSON.stringify(jsonRPC));
            } else {
                $timeout(function () {
                    api.sendMonitorCommand(method, params);
                }, 500);
            }
        };

        return api;
    }
})();
