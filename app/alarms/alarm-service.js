angular.module('katGui.alarms')

    .factory('AlarmService', function ($rootScope, $timeout, alarms) {

        var urlBase = 'http://localhost:8889';
        var alarmService = {};
        alarmService.connection = null;

        alarmService.onSockJSOpen = function () {
            if (alarmService.connection && alarmService.connection.readyState) {
                alarmService.connection.send('katGui says hi.');
            }
        };

        alarmService.onSockJSClose = function () {
            console.log('Disconnecting Alarm Connection');
            alarmService.connection = null;
        };

        alarmService.onSockJSMessage = function (e) {
            var jsonObj = JSON.parse(e.data);

            jsonObj = [].concat(jsonObj);

            jsonObj.forEach(function (obj) {

                if (obj.date) {
                    obj.date = moment.utc(obj.date, 'X').format('hh:mm:ss DD-MM-YYYY');
                }

                alarms.addAlarmMessage(obj);
            });

            if (!$rootScope.$$phase) {
                $rootScope.$digest();
            }
        };

        alarmService.connectListener = function () {
            alarmService.connection = new SockJS(urlBase + '/alarm');
            alarmService.connection.onopen = alarmService.onSockJSOpen;
            alarmService.connection.onmessage = alarmService.onSockJSMessage;
            alarmService.connection.onclose = alarmService.onSockJSClose;

            return alarmService.connection !== null;
        };

        alarmService.disconnectListener = function () {
            if (alarmService.connection) {
                alarmService.connection.close();
            }
        };

        return alarmService;
    })

    .provider('alarms', function () {
        var _ttl = null;

        this.$get = [
            '$rootScope',
            function ($rootScope) {

                var api = {};

                api.addAlarmMessage = function (alarmObj, config) {
                    var _config = config || {};
                    alarmObj.ttl = _config.ttl || _ttl;
                    $rootScope.$broadcast('alarmMessage', alarmObj);
                };

                return api;
            }
        ];
    });