(function () {

    angular.module('katGui.services')
        .service('MonitorService', MonitorService);

    function MonitorService($rootScope) {

        var pendingSubscribeObjects = [];
        var urlBase = 'http://10.8.67.130:8030';

        var connection = null;
        //use this alias because we are using some api functions within functions
        //because 'this' means something different within each child function
        var api = this;

        function subscribeToAlarms() {
            console.log('Monitor subscribed to kataware:alarm*...');
            var jsonRPC = {
                'jsonrpc': '2.0',
                'method': 'subscribe',
                'params': 'kataware:alarm[.]*',
                'id': 'abe3d23201'
            };
            return connection.send(JSON.stringify(jsonRPC));
        }

        api.subscribeToReceptorUpdates = function () {

            var connectionParams = ['m000:mode', 'm000:inhibited', 'm001:mode', 'm001:inhibited', 'm062:mode', 'm062:inhibited', 'm063:mode', 'm063:inhibited'];

            var jsonRPC = {
                'jsonrpc': '2.0',
                'method': 'subscribe',
                'params': [connectionParams],
                'subscribeName': 'subscribeToReceptorUpdates',
                'id': 'abe3d23201'
            };

            if (connection && connection.readyState) {
                return connection.send(JSON.stringify(jsonRPC));
            } else {
                pendingSubscribeObjects.push(jsonRPC);
            }
        };

        api.onSockJSOpen = function () {
            if (connection && connection.readyState) {
                console.log('Monitor Connection Established.');
                subscribeToAlarms();

                pendingSubscribeObjects.forEach(function (obj) {
                    delete obj.subscribeName;
                    return connection.send(JSON.stringify(obj));
                });

                pendingSubscribeObjects = [];
            }
        };

        api.onSockJSClose = function () {
            console.log('Disconnecting Monitor Connection');
            connection = null;
        };

        api.onSockJSMessage = function (e) {

            var messages = JSON.parse(e.data);
            if (!messages['jsonrpc']) {

                messages = [].concat(messages);
                if (messages) {

                    messages.forEach(function (message) {

                        var messageObj = message;
                        if (_.isString(message)) {
                            messageObj = JSON.parse(message);
                        }

                        if (messageObj.name.lastIndexOf('kataware:', 0) === 0) {
                            api.alarmMessageReceived(messageObj);
                        } else if (messageObj.name.indexOf('kataware:') !== 0) {
                            api.receptorMessageReceived(messageObj);
                        } else {
                            console.log('dangling monitor message...');
                            console.log(messageObj);
                        }
                    });
                }
            }
        };

        api.connectListener = function () {
            console.log('Monitor Connecting...');
            connection = new SockJS(urlBase + '/monitor');
            connection.onopen = api.onSockJSOpen;
            connection.onmessage = api.onSockJSMessage;
            connection.onclose = api.onSockJSClose;

            return connection !== null;
        };

        api.disconnectListener = function () {
            if (connection) {
                connection.close();
            }
        };

        api.receptorMessageReceived = function (messageObj) {
            $rootScope.$broadcast('receptorMessage', messageObj);
        };

        api.alarmMessageReceived = function (messageObj) {

            var alarmValues = messageObj.value.toString().split(',');
            var alarmPriority = 'unknown';
            if (alarmValues.length > 2) {
                alarmPriority = alarmValues[1];
            }
            messageObj.severity = messageObj.status;
            messageObj.priority = alarmPriority;
            messageObj.message = messageObj.value;

            messageObj.name = messageObj.name.replace('kataware:alarm.', '');

            messageObj.dateUnix = messageObj.time;
            messageObj.date = moment.utc(messageObj.time, 'X').format('HH:mm:ss DD-MM-\'YY');
            $rootScope.$emit('alarmMessage', messageObj);
        };

        return api;
    }
})();
