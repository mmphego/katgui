(function () {

    angular.module('katGui.services')
        .service('SensorsService', SensorsService);

    function SensorsService($rootScope, SERVER_URL, KatGuiUtil, $timeout, $localStorage, $q, $interval, $log, $http) {

        var urlBase = SERVER_URL + '/katmonitor/api/v1';
        var api = {};
        api.connection = null;
        api.deferredMap = {};
        api.resources = {};
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

        api.subscribe = function (pattern, guid) {
            var jsonRPC = {
                'jsonrpc': '2.0',
                'method': 'subscribe',
                'params': [guid + ':' + pattern],
                'id': 'sensors' + KatGuiUtil.generateUUID()
            };

            if (api.connection === null) {
                $log.error('No Sensors Connection Present for subscribing, ignoring command for pattern ' + pattern);
            } else if (api.connection.readyState && api.connection.authorized) {
                return api.connection.send(JSON.stringify(jsonRPC));
            } else {
                $timeout(function () {
                    api.subscribe(pattern, guid);
                }, 500);
            }
        };

        api.unsubscribe = function (pattern, guid) {
            var jsonRPC = {
                'jsonrpc': '2.0',
                'method': 'unsubscribe',
                'params': [guid + ':' + pattern],
                'id': 'sensors' + KatGuiUtil.generateUUID()
            };

            if (api.connection === null) {
                $log.error('No Sensors Connection Present for unsubscribing, ignoring command for pattern ' + pattern);
            } else if (api.connection.readyState && api.connection.authorized) {
                return api.connection.send(JSON.stringify(jsonRPC));
            } else {
                $timeout(function () {
                    api.unsubscribe(pattern, guid);
                }, 500);
            }
        };

        api.onSockJSOpen = function () {
            if (api.connection && api.connection.readyState) {
                $log.info('Sensors Connection Established. Authenticating...');
                api.authenticateSocketConnection();
            }
        };

        api.onSockJSClose = function () {
            $log.info('Disconnected Sensors Connection.');
            api.connection = null;
            api.lastHeartBeat = null;
        };

        api.checkAlive = function () {
            if (!api.lastHeartBeat || new Date().getTime() - api.lastHeartBeat.getTime() > api.heartbeatTimeOutLimit) {
                $log.warn('Sensors Connection Heartbeat timeout!');
                api.deferredMap['timeoutDefer'].resolve();
                api.deferredMap['timeoutDefer'] = null;
            }
        };

        api.onSockJSHeartbeat = function () {
            api.lastHeartBeat = new Date();
        };

        api.onSockJSMessage = function (e) {
            if (e && e.data) {
                var messages = JSON.parse(e.data);
                if (messages.error) {
                    $log.error('There was an error sending a jsonrpc request:');
                    $log.error(messages);
                } else if (messages.id === 'redis-pubsub-init' || messages.id === 'redis-pubsub') {
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
                            $rootScope.$emit('sensorsServerUpdateMessage', {
                                name: messageObj.msg_channel,
                                value: messageObj.msg_data
                            });
                        } else {
                            $log.error('Dangling Sensors message...');
                            $log.error(messageObj);
                        }
                    });
                } else if (messages.result.id === 'set_sensor_strategy') {
                    $rootScope.$emit('setSensorStrategyMessage', messages.result);
                } else if (messages.result) {

                    if (messages.result.email && messages.result.session_id) {
                        //auth response
                        $localStorage['currentUserToken'] = $rootScope.jwt;
                        api.connection.authorized = true;
                        $log.info('Sensors Connection Authenticated.');
                        api.deferredMap['connectDefer'].resolve();
                        api.subscribe('*', api.guid);
                    } else if (messages.result.length > 0) {
                        //subscribe response
                        //$log.info('Subscribed to: ');
                        //$log.info(messages.result);
                    } else {
                        //bad auth response
                        api.connection.authorized = false;
                        $log.error('Sensors Connection Authentication failed!');
                        $log.error(messages);
                        api.deferredMap['connectDefer'].reject();
                    }
                } else {
                    $log.error('Dangling sensors message...');
                    $log.error(e);
                }
            } else {
                $log.error('Dangling sensors message...');
                $log.error(e);
            }
        };

        api.connectListener = function (skipDeferObject) {
            if (api.connection) {
                $timeout(function () {
                    api.connectListener(true);
                }, 500);
            } else {
                api.guid = KatGuiUtil.generateUUID();
                $log.info('Sensors Connecting...');
                api.connection = new SockJS(urlBase + '/sensors');
                api.connection.onopen = api.onSockJSOpen;
                api.connection.onmessage = api.onSockJSMessage;
                api.connection.onclose = api.onSockJSClose;
                api.connection.onheartbeat = api.onSockJSHeartbeat;
                api.lastHeartBeat = new Date();
                if (!api.checkAliveInterval) {
                    api.checkAliveInterval = $interval(api.checkAlive, api.checkAliveConnectionInterval);
                } else {
                    $interval.cancel(api.checkAliveInterval);
                    api.checkAliveInterval = null;
                }
            }

            if (!skipDeferObject) {
                api.deferredMap['connectDefer'] = $q.defer();
                return api.deferredMap['connectDefer'].promise;
            }
        };

        api.disconnectListener = function () {
            if (api.connection) {
                api.unsubscribe('*', api.guid);
                $log.info('Disconnecting Sensors Connection.');
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

        api.setSensorStrategy = function (resource, sensorName, strategyType, strategyIntervalMin, strategyIntervalMax) {
            api.sendSensorsCommand('set_sensor_strategy',
                [
                    api.guid,
                    resource,
                    sensorName,
                    strategyType,
                    strategyIntervalMin,
                    strategyIntervalMax
                ]);
        };

        api.listResources = function () {
            var deferred = $q.defer();
            $http.get(urlBase + '/resource')
                .success(function (result) {
                    for (var i in result) {
                        api.resources[result[i]] = {};
                    }
                    deferred.resolve(api.resources);
                })
                .error(function (result) {
                    deferred.reject(result);
                });
            return deferred.promise;
        };

        api.listResourceSensors = function (resourceName) {
            var deferred = $q.defer();
            $http.get(urlBase + '/resource/' + resourceName + '/sensors')
                .success(function (result) {
                    api.resources[resourceName].sensorsList = [];
                    for (var i in result) {
                        api.resources[resourceName].sensorsList.push(
                            {name: result[i].name, python_identifier: result[i].python_identifier, description: result[i].description});
                    }
                    deferred.resolve(api.resources[resourceName].sensorsList);
                })
                .error(function (result) {
                    deferred.reject(result);
                });
            return deferred.promise;
        };

        api.removeResourceListeners = function (resourceName) {
            api.sendSensorsCommand('remove_sensor_listeners_from_resource', [resourceName]);
        };

        api.sendSensorsCommand = function (method, params, desired_jsonRPCId) {

            if (api.connection && api.connection.authorized) {
                var jsonRPC = {
                    'jsonrpc': '2.0',
                    'method': method,
                    'params': params
                };

                if (desired_jsonRPCId) {
                    jsonRPC.id = desired_jsonRPCId;
                }

                api.connection.send(JSON.stringify(jsonRPC));
            } else {
                $timeout(function () {
                    api.sendSensorsCommand(method, params, desired_jsonRPCId);
                }, 500);
            }
        };

        return api;
    }
})();
