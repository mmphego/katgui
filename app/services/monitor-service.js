(function () {

    angular.module('katGui.services')
        .service('MonitorService', MonitorService);

    function MonitorService($rootScope, SERVER_URL, $localStorage, KatGuiUtil, $timeout, StatusService,
                            ConfigService, AlarmsService, ObservationScheduleService, $interval, $q, $log) {

        var urlBase = SERVER_URL + '/katmonitor/api/v1';
        var api = {};
        api.deferredMap = {};
        api.connection = null;

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

        api.subscribeToReceptorUpdates = function () {
            ConfigService.receptorList.forEach(function (receptor) {
                var connectionParams = ['mon:' + receptor + '.mode', 'mon:' + receptor + '.inhibited'];
                api.subscribe(connectionParams);
            });
            api.subscribe('anc.vds_flood_lights_on');
        };

        api.subscribeToAlarms = function () {
            api.subscribe('kataware.alarm_*');
        };

        api.subscribe = function (pattern) {
            if (typeof(pattern) !== 'object' && pattern.indexOf('mon:') === -1) {
                pattern = 'mon:' + pattern;
            }
            var jsonRPC = {
                'jsonrpc': '2.0',
                'method': 'subscribe',
                'params': [pattern, true],
                'id': 'monitor' + KatGuiUtil.generateUUID()
            };

            if (api.connection === null) {
                $log.error('No Monitor Connection Present for subscribing, ignoring command for pattern ' + pattern);
            } else if (api.connection.readyState && api.connection.authorized) {
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
            } else if (api.connection.readyState && api.connection.authorized) {
                return api.connection.send(JSON.stringify(jsonRPC));
            } else {
                $timeout(function () {
                    api.unsubscribe(pattern);
                }, 500);
            }
        };

        api.onSockJSOpen = function () {
            if (api.connection && api.connection.readyState) {
                $log.info('Monitor Connection Established. Authenticating...');
                api.authenticateSocketConnection();
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
                } else if (messages.id === 'redis-pubsub-init' || messages.id === 'redis-pubsub') {
                    if (messages.result) {
                        if (messages.id === 'redis-pubsub') {
                            var arrayResult = [];
                            arrayResult.push({
                                msg_data: messages.result.msg_data,
                                msg_channel: messages.result.msg_channel
                            });
                            messages.result = arrayResult;
                        }
                        messages.result.forEach(function (message) {
                            var messageObj = message;
                            if (_.isString(message)) {
                                messageObj = JSON.parse(message);
                            }
                            if (messageObj.msg_channel) {
                                var channelNameSplit = messageObj.msg_channel.split(":")[1].split('.');
                                if (channelNameSplit[0] === 'kataware') {
                                    AlarmsService.receivedAlarmMessage(messageObj.msg_channel, messageObj.msg_data);
                                } else if (channelNameSplit.length > 1 &&
                                    (channelNameSplit[1] === 'mode' || channelNameSplit[1] === 'inhibited' ||
                                     channelNameSplit[1] === 'vds_flood_lights_on')) {
                                    $rootScope.$emit('operatorControlStatusMessage', {
                                        name: messageObj.msg_channel,
                                        value: messageObj.msg_data
                                    });
                                } else if (channelNameSplit[0] === 'sched') {
                                    ObservationScheduleService.receivedSchedMessage(messageObj.msg_channel, messageObj.msg_data);
                                } else if (channelNameSplit.length > 1) {
                                    StatusService.messageReceivedSensors(messageObj.msg_channel, messageObj.msg_data);
                                }
                            } else {
                                $log.error('Dangling monitor message...');
                                $log.error(messageObj);
                            }
                        });
                    }
                } else if (messages.result) {
                    //auth response
                    if (messages.result.email && messages.result.session_id) {
                        $localStorage['currentUserToken'] = $rootScope.jwt;
                        api.connection.authorized = true;
                        $log.info('Monitor Connection Authenticated.');
                        api.deferredMap['connectDefer'].resolve();
                        api.subscribeToAlarms();
                    } else if (messages.result.length > 0) {
                        //subscribe response
                        //$log.info('Subscribed to: ');
                        //$log.info(messages.result);
                    } else {
                        //bad auth response
                        api.connection.authorized = false;
                        $log.info('Monitor Connection Authentication failed.');
                        $log.error(messages);
                        api.deferredMap['connectDefer'].reject();
                    }
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
            } else {
                $log.error('Attempting to disconnect an already disconnected connection!');
            }
        };

        api.authenticateSocketConnection = function () {

            if (api.connection) {
                var jsonRPC = {
                    'jsonrpc': '2.0',
                    'method': 'authorise',
                    'params': [$rootScope.session_id],
                    'id': 'authorise' + KatGuiUtil.generateUUID()
                };

                api.connection.send(JSON.stringify(jsonRPC));
            }
        };

        api.sendMonitorCommand = function (method, params) {

            if (api.connection && api.connection.authorized) {
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
