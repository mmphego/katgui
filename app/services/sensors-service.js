(function () {

    angular.module('katGui.services')
        .service('SensorsService', SensorsService);

    function SensorsService($rootScope, SERVER_URL, KatGuiUtil, $timeout, $q, $interval, $log, $http, ConfigService) {

        var urlBase = SERVER_URL + '/katmonitor';
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
            } else if (api.connection.readyState) {
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

            if (api.connection && api.connection.readyState) {
                return api.connection.send(JSON.stringify(jsonRPC));
            } else {
                $timeout(function () {
                    api.unsubscribe(pattern, guid);
                }, 500);
            }
        };

        api.onSockJSOpen = function () {
            if (api.connection && api.connection.readyState) {
                $log.info('Sensors Connection Established.');
                api.deferredMap['connectDefer'].resolve();
                api.subscribe('*', api.guid);
                api.connected = true;
            }
        };

        api.onSockJSClose = function () {
            $log.info('Disconnected Sensors Connection.');
            api.connection = null;
            api.lastHeartBeat = null;
            api.connected = false;
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
                    $log.info('Subscribed to: ' + JSON.stringify(messages.result));
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
                .then(function (result) {
                    for (var i in result.data) {
                        for (var node in ConfigService.systemConfig['katconn:resources']) {
                            var processList = ConfigService.systemConfig['katconn:resources'][node];
                            if (processList.indexOf(result.data[i].name) > -1) {
                                var group = 'Components';
                                if (node === 'single_ctl') {
                                    group = 'Proxies';
                                }
                                result.data[i].node = group;
                                break;
                            }
                        }
                        api.resources[result.data[i].name] = result.data[i];
                    }
                    deferred.resolve(api.resources);
                }, function (result) {
                    deferred.reject(result);
                });
            return deferred.promise;
        };

        api.listResourcesFromConfig = function () {
            var deferred = $q.defer();
            for (var node in ConfigService.systemConfig['katconn:resources']) {
                var processList = ConfigService.systemConfig['katconn:resources'][node].split(',');
                for (var i in processList) {
                    var group = 'Components';
                    if (node === 'single_ctl') {
                        group = 'Proxies';
                    }
                    var processClientConfig = ConfigService.systemConfig['katconn:clients'][processList[i]].split(':');
                    api.resources[processList[i]] = {
                        name: processList[i],
                        host: processClientConfig[0],
                        port: processClientConfig[1],
                        node: group
                    };
                }
            }

            $timeout(function () {
                deferred.resolve(api.resources);
            }, 0);
            return deferred.promise;
        };

        api.listResourceSensors = function (resourceName) {
            var deferred = $q.defer();
            $http.get(urlBase + '/resource/' + resourceName + '/sensors')
                .then(function (result) {
                    api.resources[resourceName].sensorsList = [];
                    for (var i in result.data) {
                        api.resources[resourceName].sensorsList.push({
                            name: result.data[i].name,
                            python_identifier: result.data[i].python_identifier,
                            description: result.data[i].description,
                            value: result.data[i].value,
                            timestamp: result.data[i].timestamp,
                            received_timestamp: result.data[i].received_timestamp,
                            status: result.data[i].status
                        });
                    }
                    deferred.resolve(api.resources[resourceName].sensorsList);
                }, function (result) {
                    deferred.reject(result);
                });
            return deferred.promise;
        };

        api.removeResourceListeners = function (resourceName) {
            api.sendSensorsCommand('remove_sensor_listeners_from_resource', [resourceName]);
        };

        api.sendSensorsCommand = function (method, params, desired_jsonRPCId) {

            if (api.connection) {
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
