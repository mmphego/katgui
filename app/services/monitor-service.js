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
        api.currentLeadOperator = {name: ''};
        api.interlockState = {value: ''};

        api.getTimeoutPromise = function () {
            if (!api.deferredMap['timeoutDefer']) {
                api.deferredMap['timeoutDefer'] = $q.defer();
            }
            return api.deferredMap['timeoutDefer'].promise;
        };

        api.subscribe = function (namespace, pattern) {
            var jsonRPC = {
                'jsonrpc': '2.0',
                'method': 'subscribe',
                'params': [namespace, pattern],
                'id': 'monitor-' + KatGuiUtil.generateUUID()
            };

            if (api.connection && api.connection.readyState) {
                return api.connection.send(JSON.stringify(jsonRPC));
            } else {
                $timeout(function () {
                    api.subscribe(namespace, pattern);
                }, 500);
            }
        };

        api.unsubscribe = function (namespace, pattern) {
            var jsonRPC = {
                'jsonrpc': '2.0',
                'method': 'unsubscribe',
                'params': [namespace, pattern],
                'id': 'monitor-' + KatGuiUtil.generateUUID()
            };

            if (api.connection === null) {
                $log.error('No Monitor Connection Present for subscribing, ignoring command for pattern ' + pattern);
            } else if (api.connection.readyState) {
                return api.connection.send(JSON.stringify(jsonRPC));
            } else {
                $timeout(function () {
                    api.unsubscribe(namespace, pattern);
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
            api.subscribe('katportal', ['time', 'mon', 'alarms', 'health', 'auth', 'resources']);
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
            // if (e && e.data) {
                //
            // }
            // return;
            if (e && e.data) {
                var messages = JSON.parse(e.data);
                if (messages.error) {
                    $log.error('There was an error sending a jsonrpc request:');
                    $log.error(messages);
                } else {
                    messages.forEach(function(msg) {
                        var data = JSON.parse(msg.data);
                        if (msg.subject === 'katportal.time') {
                            api.lastSyncedTime = data.time + 0.5;
                            api.lastSyncedLST = data.lst;
                        } else if (msg.subject === 'katportal.sched') {
                            $log.info(msg);
                            // ObsSchedService.receivedScheduleMessage(messages.result.msg_data);
                        } else if (msg.subject === 'katportal.alarms') {
                            $log.info(msg);
                        //     if (messageChannel[0] === 'alarms') {
                        //        AlarmsService.receivedAlarmMessage(messageObj.msg_channel, messageObj.msg_data);
                        //    }
                        } else if (msg.subject === 'katportal.userlogs') {
                            $log.info(msg);
                            // UserLogService.receivedUserlogMessage(messages.result.msg_channel, messages.result.msg_data);
                        } else if (msg.subject === 'katportal.auth') {
                            $log.info(msg);
                            // if (messageObj.msg_channel === 'auth:current_lo') {
                            //     api.currentLeadOperator.name = messageObj.msg_data.lo;
                            //     if ($rootScope.currentUser &&
                            //         $rootScope.currentUser.req_role === 'lead_operator' &&
                            //         api.currentLeadOperator.name.length > 0 &&
                            //         api.currentLeadOperator.name !== $rootScope.currentUser.email) {
                            //         NotifyService.showDialog(
                            //             'You have been logged in as the Monitor Role', 'You have lost the Lead Operator Role because ' +
                            //             api.currentLeadOperator.name + ' has assumed the Lead Operator role.');
                            //         //$rootScope.logout();
                            //         //Do not logout, just loging as a demoted monitor only use
                            //         SessionService.verifyAs('read_only');
                            //     }
                            // }
                        } else if (msg.subject === 'katportal.mon') {
                            $log.info(msg);
                        //     if (messageChannel[0] === 'mon') {
                        //        if (messageChannel[1] === 'sys_interlock_state') {
                        //            api.interlockState.value = messageObj.msg_data.value;
                        //        } else {
                        //            $log.error('Dangling Sensors message...');
                        //            $log.error(messageObj);
                        //        }
                        //    }
                        } else if (msg.subject === 'katportal.resources') {
                            $log.info(msg);
                        //     if (messageChannel[0] === 'resources') {
                        //        if (messageChannel[1].endsWith('katpool_resources_in_maintenance')) {
                        //            StatusService.receptorMaintenanceMessageReceived(messageObj);
                        //        }
                        //        ObsSchedService.receivedResourceMessage(message.msg_data);
                        //    }
                        } else if (msg.subject === 'katportal.health') {
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
                        } else if (msg.subject.startsWith('sensor.')) {
                            $rootScope.$emit('sensorsServerUpdateMessage', data);
                        } else {
                            $log.error('Dangling monitor message: ' + msg);
                        }
                    });
                }
            }
        };

        api.connectListener = function () {
            api.deferredMap['connectDefer'] = $q.defer();
            if (!api.connection) {
                $log.info('Monitor Connecting...');
                api.connection = new SockJS(urlBase() + '/portal');
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
            if (api.connection) {
                api.connection.close();
                $interval.cancel(api.checkAliveInterval);
                api.checkAliveInterval = null;
            } else {
                $log.error('Attempting to disconnect an already disconnected connection!');
            }
        };

        api.sendMonitorCommand = function (method, params) {

            if (api.connection) {
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
