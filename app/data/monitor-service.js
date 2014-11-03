

angular.module('katGui')

    .factory('MonitorService', function ($rootScope, alarms) {

        var pendingSubscribeObjects = [];
        var urlBase = 'http://192.168.10.127:8030';
        var monitorService = {};
        monitorService.connection = null;

        monitorService.onSockJSOpen = function () {
            if (monitorService.connection && monitorService.connection.readyState) {
                console.log('Monitor Connection Established.');
                monitorService.subscribeToAlarms();

                pendingSubscribeObjects.forEach(function (obj) {
                    obj.subscribeName = null;
                    monitorService.connection.send(JSON.stringify(obj));
                });

                pendingSubscribeObjects = [];
            }
        };

        monitorService.subscribeToAlarms = function () {
            console.log('Monitor subscribed to kataware:alarm*...');
            var jsonRPC = {
                'jsonrpc': '2.0',
                'method': 'psubscribe',
                'params': ['kataware:alarm*'],
                'id': 'abe3d23201'
            };
            monitorService.connection.send(JSON.stringify(jsonRPC));
        };

        monitorService.subscribeToReceptorUpdates = function () {
            var connectionParams = ['m000:mode', 'm000:inhibited', 'm001:mode', 'm001:inhibited', 'm062:mode', 'm062:inhibited', 'm063:mode', 'm063:inhibited'];
            console.log('Monitor subscribed to ' + connectionParams);

            var jsonRPC = {
                'jsonrpc': '2.0',
                'method': 'subscribe',
                'params': [connectionParams],
                'subscribeName': 'subscribeToReceptorUpdates',
                'id': 'abe3d23201'
            };
            if (monitorService.connection && monitorService.connection.readyState) {
                monitorService.connection.send(JSON.stringify(jsonRPC));
            } else {
                pendingSubscribeObjects.push(jsonRPC);
            }
        };

        monitorService.onSockJSClose = function () {
            console.log('Disconnecting Monitor Connection');
            monitorService.connection = null;
        };

        monitorService.onSockJSMessage = function (e) {
            console.log(e);

            var messages = JSON.parse(e.data);

            if (!messages['jsonrpc']) {

                messages = [].concat(messages);

                if (messages) {

                    messages.forEach(function (message) {

                        var messageObj = message;

                        if (_.isString(message)) {
                            messageObj = JSON.parse(message);
                        }

                        console.log(messageObj);

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
                            $rootScope.$broadcast('receptorMessage', messageObj);
                        }
                    });
                }
            }
        };

        monitorService.connectListener = function () {
            console.log('Monitor Connecting...');
            monitorService.connection = new SockJS(urlBase + '/monitor');
            monitorService.connection.onopen = monitorService.onSockJSOpen;
            monitorService.connection.onmessage = monitorService.onSockJSMessage;
            monitorService.connection.onclose = monitorService.onSockJSClose;

            return monitorService.connection !== null;
        };

        monitorService.disconnectListener = function () {
            if (monitorService.connection) {
                monitorService.connection.close();
            }
        };

        return monitorService;
    });
