(function () {

    angular.module('katGui.services')
        .service('MonitorService', MonitorService);

    function MonitorService(SERVER_URL, KatGuiUtil, $timeout, StatusService, AlarmsService, ObsSchedService, $interval,
                            $rootScope, $q, $log, ReceptorStateService, NotifyService) {

        var urlBase = SERVER_URL + '/katmonitor';
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
                api.subscribe('mon');
                api.subscribe('alarms');
                api.subscribe('health');
                api.subscribe('time');
                api.subscribe('auth');
            }
        };

        api.checkAlive = function () {
            if (!api.lastHeartBeat || new Date().getTime() - api.lastHeartBeat.getTime() > api.heartbeatTimeOutLimit) {
                $log.warn('Monitor Connection Heartbeat timeout!');
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
        };

        api.onSockJSMessage = function (e) {
            if (e && e.data) {
                var messages = JSON.parse(e.data);
                if (messages.error) {
                    $log.error('There was an error sending a jsonrpc request:');
                    $log.error(messages);
                } else if (messages.result.msg_channel === 'time:time') {
                    api.lastSyncedTime = messages.result.msg_data + 0.5;
                } else if (messages.id === 'redis-pubsub-init' || messages.id === 'redis-pubsub') {
                    if (messages.result) {
                        if (messages.id === 'redis-pubsub') {
                            var arrayResult = [];
                            arrayResult.push({
                                msg_data: messages.result.msg_data,
                                msg_channel: messages.result.msg_channel,
                                msg_pattern: messages.result.msg_pattern
                            });
                            messages.result = arrayResult;
                        }

                        messages.result.forEach(function (message) {
                            var messageObj = message;
                            if (_.isString(message)) {
                                messageObj = JSON.parse(message);
                            }
                            if (messageObj.msg_channel) {
                                var channelNameSplit;
                                var messageChannel = messageObj.msg_channel.split(":");
                                if (messageObj.msg_channel === 'auth:current_lo') {
                                    api.currentLeadOperator.name = messageObj.msg_data.lo;
                                    $rootScope.iAmLO = api.currentLeadOperator.name === $rootScope.currentUser.email && $rootScope.currentUser.req_role === 'lead_operator';
                                    if ($rootScope.currentUser &&
                                        $rootScope.currentUser.req_role === 'lead_operator' &&
                                        api.currentLeadOperator.name.length > 0 &&
                                        api.currentLeadOperator.name !== $rootScope.currentUser.email) {
                                        NotifyService.showDialog(
                                            'You are logged out.', 'You have been logged out because ' +
                                            api.currentLeadOperator.name + ' has assumed the Lead Operator role.');
                                        $rootScope.logout();
                                    }
                                } else if (messageChannel[0] === 'sched') {
                                    ObsSchedService.receivedScheduleMessage(messageChannel[1].split('.')[0], messageObj.msg_data);
                                } else if (messageChannel[0] === 'mon') {
                                    if (messageChannel[1] === 'sys_interlock_state') {
                                        api.interlockState.value = messageObj.msg_data.value;
                                    } else {
                                        StatusService.messageReceivedSensors(messageObj.msg_channel, messageObj.msg_data);
                                    }
                                } else if (messageChannel[0] === 'health') {
                                    if ((messageChannel[1].endsWith('mode') || messageChannel[1].endsWith('inhibited') ||
                                        messageChannel[1].endsWith('vds_flood_lights_on'))) {
                                        ReceptorStateService.receptorMessageReceived({
                                            name: messageObj.msg_channel,
                                            value: messageObj.msg_data
                                        });
                                    } else {
                                        StatusService.messageReceivedSensors(messageObj.msg_channel, messageObj.msg_data);
                                    }
                                } else if (messageChannel[0] === 'alarms') {
                                    AlarmsService.receivedAlarmMessage(messageObj.msg_channel, messageObj.msg_data);
                                }
                            } else {
                                $log.error('Dangling monitor message...');
                                $log.error(messageObj);
                            }
                        });
                    }
                } else if (messages.result) {
                    $log.info('Subscribed to: ' + JSON.stringify(messages.result));
                } else {
                    $log.error('Dangling monitor message...');
                    $log.error(e);
                }
            } else {
                $log.error('Dangling monitor message...');
                $log.error(e);
            }
        };

        api.connectListener = function () {
            api.deferredMap['connectDefer'] = $q.defer();
            $log.info('Monitor Connecting...');
            api.connection = new SockJS(urlBase + '/portal');
            api.connection.onopen = api.onSockJSOpen;
            api.connection.onmessage = api.onSockJSMessage;
            api.connection.onclose = api.onSockJSClose;
            api.connection.onheartbeat = api.onSockJSHeartbeat;
            api.lastHeartBeat = new Date();
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
