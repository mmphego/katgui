angular.module('katGui')

    .factory('MonitorService', function ($rootScope, alarms) {

        var urlBase = 'http://192.168.10.127:8030';
        var monitorService = {};
        monitorService.connection = null;

        monitorService.onSockJSOpen = function () {
            if (monitorService.connection && monitorService.connection.readyState) {

                var jsonRPC = {
                    'jsonrpc': '2.0',
                    'method': 'psubscribe',
                    'params': ['kataware:alarm*'],
                    'id': 'abe3d23201'
                };

                monitorService.connection.send(JSON.stringify(jsonRPC));

                jsonRPC = {
                    'jsonrpc': '2.0',
                    'method': 'subscribe',
                    'params': [['m000:mode', 'm000:inhibited', 'm001:mode', 'm001:inhibited', 'm062:mode', 'm062:inhibited', 'm063:mode', 'm063:inhibited']],
                    'id': 'abe3d23201'
                };
                monitorService.connection.send(JSON.stringify(jsonRPC));
                console.log('Monitor Connection Established.');
            }
        };

        monitorService.onSockJSClose = function () {
            console.log('Disconnecting Monitor Connection');
            monitorService.connection = null;
        };

        monitorService.onSockJSMessage = function (e) {
            //console.log(e);

            var message = JSON.parse(e.data);

            if (!message['jsonrpc']) {
                if (message.sensor.indexOf('kataware:') === 0) {

                    var alarmName = message.sensor.split(':')[1];
                    //var alarmStatus = message.status;
                    var alarmDate = message.time;
                    var alarmValue = message.value.split(',');
                    var severity = alarmValue[0];
                    var priority = alarmValue[1];
                    var description = alarmValue[2];

                    var alarmObj = {
                        priority: priority,
                        severity: severity,
                        name: alarmName,
                        dateUnix: alarmDate,
                        date: moment.utc(alarmDate, 'X').format('HH:mm:ss DD-MM-YYYY'),
                        message: description
                    };

                    alarms.addAlarmMessage(alarmObj);

                } else {
                    $rootScope.$broadcast('receptorMessage', message);
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
