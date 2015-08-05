(function () {

    angular.module('katGui.services')
        .service('MonitorService', MonitorService);

    function MonitorService(SERVER_URL, KatGuiUtil, $timeout, StatusService, AlarmsService, ObsSchedService, $interval,
                            $rootScope, $q, $log, ReceptorStateService) {

        var urlBase = SERVER_URL + '/katmonitor/api/v1';
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

        api.subscribe = function (pattern) {
            var jsonRPC = {
                'jsonrpc': '2.0',
                'method': 'subscribe',
                'params': [pattern, true],
                'id': 'monitor' + KatGuiUtil.generateUUID()
            };

            if (api.connection === null) {
                $log.error('No Monitor Connection Present for subscribing, ignoring command for pattern ' + pattern);
            } else if (api.connection.readyState) {
                return api.connection.send(JSON.stringify(jsonRPC));
            } else {
                $timeout(function () {
                    api.subscribe(pattern);
                }, 500);
            }
        };

        api.unsubscribe = function (pattern) {
            if (typeof(pattern) !== 'object' && pattern.indexOf('mon:') === -1) {
                pattern = 'mon:' + pattern;
            }
            var jsonRPC = {
                'jsonrpc': '2.0',
                'method': 'unsubscribe',
                'params': [pattern],
                'id': 'monitor' + KatGuiUtil.generateUUID()
            };

            if (api.connection === null) {
                $log.error('No Monitor Connection Present for subscribing, ignoring command for pattern ' + pattern);
            } else if (api.connection.readyState) {
                return api.connection.send(JSON.stringify(jsonRPC));
            } else {
                $timeout(function () {
                    api.unsubscribe(pattern);
                }, 500);
            }
        };

        api.onSockJSOpen = function () {
            if (api.connection && api.connection.readyState) {
                $log.info('Monitor Connection Established.');
                api.deferredMap['connectDefer'].resolve();
                api.subscribe('mon:*');
                api.subscribe('sched:*');
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
                } else if (messages.result.msg_channel === 'mon:time') {
                    //add one seconds because our display update interval
                    //is only every second
                    api.lastSyncedTime = messages.result.msg_data + 1;
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
                                var messageChannel = messageObj.msg_channel.split(":");
                                if (messageChannel[0] === 'sched') {
                                    ObsSchedService.receivedScheduleMessage(messageChannel[1].split('.')[0], messageObj.msg_data);
                                } else if (messageChannel[0] === 'mon') {
                                    var channelNameSplit = messageChannel[1].split('.');
                                    if (channelNameSplit[1] === 'lo_id') {
                                        api.currentLeadOperator.name = messageObj.msg_data.value !== '' ? messageObj.msg_data.value : 'None';
                                        if (api.currentUser &&
                                            api.currentUser.req_role === 'lead_operator' &&
                                            api.currentLeadOperator.name !== $rootScope.currentUser.email) {
                                            $rootScope.logout();
                                        }
                                    } else if (channelNameSplit[1] === 'interlock_state') {
                                        api.interlockState.value = messageObj.msg_data.value;
                                    } else if (channelNameSplit[0] === 'kataware') {
                                        AlarmsService.receivedAlarmMessage(messageObj.msg_channel, messageObj.msg_data);
                                    } else if (channelNameSplit.length > 1 &&
                                        (channelNameSplit[1] === 'mode' || channelNameSplit[1] === 'inhibited' ||
                                        channelNameSplit[1] === 'vds_flood_lights_on')) {
                                        ReceptorStateService.receptorMessageReceived({
                                            name: messageObj.msg_channel,
                                            value: messageObj.msg_data
                                        });
                                    } else if (channelNameSplit.length > 1) {
                                        StatusService.messageReceivedSensors(messageObj.msg_channel, messageObj.msg_data);
                                    }
                                }
                            } else {
                                $log.error('Dangling monitor message...');
                                $log.error(messageObj);
                            }
                        });
                    }
                } else if (messages.result) {
                    //subscribe response
                    $log.info(messages.result);
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
            api.connection = new SockJS(urlBase + '/monitor');
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
                api.unsubscribe('*');
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
