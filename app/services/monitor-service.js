(function () {

    angular.module('katGui')
        .service('MonitorService', MonitorService);

    function MonitorService($rootScope, alarms) {

        var pendingSubscribeObjects = [];
        var urlBase = 'http://192.168.10.127:8030';

        var connection = null;

        function subscribeToAlarms() {
            console.log('Monitor subscribed to kataware:alarm*...');
            var jsonRPC = {
                'jsonrpc': '2.0',
                'method': 'psubscribe',
                'params': ['kataware:alarm*'],
                'id': 'abe3d23201'
            };
            connection.send(JSON.stringify(jsonRPC));
        }

        this.subscribeToReceptorUpdates = function () {

            var connectionParams = ['m000:mode', 'm000:inhibited', 'm001:mode', 'm001:inhibited', 'm062:mode', 'm062:inhibited', 'm063:mode', 'm063:inhibited'];

            var jsonRPC = {
                'jsonrpc': '2.0',
                'method': 'subscribe',
                'params': [connectionParams],
                'subscribeName': 'subscribeToReceptorUpdates',
                'id': 'abe3d23201'
            };

            if (connection && connection.readyState) {
                connection.send(JSON.stringify(jsonRPC));
            } else {
                pendingSubscribeObjects.push(jsonRPC);
            }
        };

        this.onSockJSOpen = function () {
            if (connection && connection.readyState) {
                console.log('Monitor Connection Established.');
                subscribeToAlarms();

                pendingSubscribeObjects.forEach(function (obj) {
                    obj.subscribeName = null;
                    connection.send(JSON.stringify(obj));
                });

                pendingSubscribeObjects = [];
            }
        };

        this.onSockJSClose = function () {
            console.log('Disconnecting Monitor Connection');
            connection = null;
        };

        this.onSockJSMessage = function (e) {
            //console.log(e);

            var messages = JSON.parse(e.data);

            if (!messages['jsonrpc']) {

                messages = [].concat(messages);

                if (messages) {

                    messages.forEach(function (message) {

                        var messageObj = message;

                        if (_.isString(message)) {
                            messageObj = JSON.parse(message);
                        }

                        //console.log(messageObj);

                        if (messageObj.name.indexOf('kataware:') === 0 &&
                            messageObj.status !== 'nominal' &&
                            messageObj.status !== 'unknown') {

                            var alarmValues = messageObj.value.split(',');
                            var alarmPriority = 'unknown';
                            if (alarmValues.length > 2) {
                                alarmPriority = alarmValues[1];
                            }
                            messageObj.severity = messageObj.status;
                            messageObj.priority = alarmPriority;
                            messageObj.message = messageObj.value;

                            messageObj.name = messageObj.name.replace('kataware:alarm.', '');

                            messageObj.dateUnix = messageObj.time;
                            messageObj.date = moment.utc(messageObj.time, 'X').format('HH:mm:ss DD-MM-YYYY');
                            alarms.addAlarmMessage(messageObj);
                        } else {
                            $rootScope.$emit('receptorMessage', messageObj);
                        }
                    });
                }
            }
        };

        this.connectListener = function () {
            console.log('Monitor Connecting...');
            connection = new SockJS(urlBase + '/monitor');
            connection.onopen = this.onSockJSOpen;
            connection.onmessage = this.onSockJSMessage;
            connection.onclose = this.onSockJSClose;

            return connection !== null;
        };

        this.disconnectListener = function () {
            if (connection) {
                connection.close();
            }
        };

        return this;
    }
})();
