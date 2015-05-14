(function () {

    angular.module('katGui.services')
        .service('SensorsService', SensorsService);

    function SensorsService($rootScope, SERVER_URL, KatGuiUtil, $timeout, $localStorage) {

        var urlBase = SERVER_URL + '/katmonitor/api/v1';
        var api = {};
        api.connection = null;

        api.subscribe = function (pattern) {
            var jsonRPC = {
                'jsonrpc': '2.0',
                'method': 'subscribe',
                'params': [pattern],
                'id': 'sensors' + KatGuiUtil.generateUUID()
            };

            if (api.connection === null) {
                console.error('No Sensors Connection Present for subscribing, ignoring command for pattern ' + pattern);
            } else if (api.connection.readyState && api.connection.authorized) {
                return api.connection.send(JSON.stringify(jsonRPC));
            } else {
                $timeout(function () {
                    api.subscribe(pattern);
                }, 500);
            }
        };

        api.unsubscribe = function (pattern) {
            var jsonRPC = {
                'jsonrpc': '2.0',
                'method': 'unsubscribe',
                'params': [pattern],
                'id': 'sensors' + KatGuiUtil.generateUUID()
            };

            if (api.connection === null) {
                console.error('No Sensors Connection Present for subscribing, ignoring command for pattern ' + pattern);
            } else if (api.connection.readyState && api.connection.authorized) {
                return api.connection.send(JSON.stringify(jsonRPC));
            } else {
                $timeout(function () {
                    api.subscribe(pattern);
                }, 500);
            }
        };

        api.onSockJSOpen = function () {
            if (api.connection && api.connection.readyState) {
                console.log('Sensors Connection Established. Authenticating...');
                api.authenticateSocketConnection();
            }
        };

        api.onSockJSClose = function () {
            console.log('Disconnecting Sensors Connection');
            api.connection = null;
        };

        api.onSockJSMessage = function (e) {
            if (e && e.data) {
                var messages = JSON.parse(e.data);
                if (messages.error) {
                    console.error('There was an error sending a jsonrpc request:');
                    console.error(messages);
                } else if (messages.id === 'redis-pubsub-init' || messages.id === 'redis-pubsub') {
                    if (messages.id === 'redis-pubsub') {
                        var arrayResult = [];
                        arrayResult.push({msg_data: messages.result.msg_data, msg_channel: messages.result.msg_channel});
                        messages.result = arrayResult;
                    }
                    messages.result.forEach(function (message) {
                        var messageObj = message;
                        if (_.isString(message)) {
                            messageObj = JSON.parse(message);
                        }
                        if (messageObj.msg_channel) {
                            $rootScope.$emit('sensorsServerUpdateMessage', {name: messageObj.msg_channel, value: messageObj.msg_data});
                        } else {
                            console.error('Dangling Sensors message...');
                            console.error(messageObj);
                        }
                    });
                }  else if (messages.result) {
                    //auth response
                    if (messages.result.email && messages.result.session_id) {
                        $localStorage['currentUserToken'] = $rootScope.jwt;
                        api.connection.authorized = true;
                        console.log('Sensors Connection Established. Authenticated.');
                    } else if (messages.result.length > 0) {
                        //subscribe response
                        //console.log('Subscribed to: ');
                        //console.log(messages.result);
                    } else {
                        //bad auth response
                        api.connection.authorized = false;
                        console.log('Sensors Connection Established. Authentication failed.');
                        console.error(messages);
                    }
                } else {
                    console.error('Dangling sensors message...');
                    console.error(e);
                }
            } else {
                console.error('Dangling sensors message...');
                console.error(e);
            }
        };

        api.connectListener = function () {
            console.log('Sensors Connecting...');
            api.connection = new SockJS(urlBase + '/sensors');
            api.connection.onopen = api.onSockJSOpen;
            api.connection.onmessage = api.onSockJSMessage;
            api.connection.onclose = api.onSockJSClose;
            return api.connection !== null;
        };

        api.disconnectListener = function () {
            if (api.connection) {
                api.connection.close();
            } else {
                console.error('Attempting to disconnect an already disconnected connection!');
            }
        };

        api.authenticateSocketConnection = function() {

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

        api.connectLiveFeed = function (sensor, interval) {

            var sensorName = sensor.katcp_sensor_name.substr(sensor.katcp_sensor_name.indexOf('.') + 1);
            sensorName = sensorName.replace(/\./g, '_');
            api.sendSensorsCommand('set_sensor_strategy', [sensor.component, sensorName, 'period', interval]);
            api.subscribe(sensor.component + ':' + sensorName);
        };

        api.sendSensorsCommand = function (method, params) {

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
                    api.sendSensorsCommand(method, params);
                }, 500);
            }
        };

        return api;
    }
})();
