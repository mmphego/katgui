angular.module('katGui')

    .factory('AlarmService', function ($rootScope, alarms, UI_VERSION) {

        var urlBase = 'http://localhost:8889';
        var alarmService = {};
        var conn = null;

            alarmService.connectListener = function () {
            conn = new SockJS(urlBase + '/alarm');

            conn.onopen = function () {
                conn.send('katGui version: ' + UI_VERSION + ' says hi.');
            };

            conn.onmessage = function (e) {
                var jsonObj = JSON.parse(e.data);

                jsonObj = [].concat(jsonObj);

                $rootScope.safeApply(function () {
                    jsonObj.forEach(function (obj) {

                        if (obj.date) {
                            obj.date = moment.utc(obj.date, 'X').format('hh:mm:ss DD-MM-YYYY');
                        }

                        alarms.addAlarmMessage(obj);
                    });
                });

            };

            conn.onclose = function () {
                console.log('Disconnecting Alarm Connection');
            };
        };

        alarmService.disconnectListener = function () {
            if (conn) {
                conn.close();
                conn = null;
            }
        };

        alarmService.isConnected = function () {
          return conn !== null;
        };

        return alarmService;
    })

    .provider('alarms', function () {
        var _ttl = null;

        this.$get = [
            '$rootScope',
            function ($rootScope) {

                function broadcastMessage(message) {
                    $rootScope.$broadcast('alarmMessage', message);
                }

                function sendAlarmMessage(alarmObj, config) {
                    var _config = config || {};
                    alarmObj.ttl = _config.ttl || _ttl;
                    broadcastMessage(alarmObj);
                }

                function addAlarmMessage(alarmObj, config) {
                    sendAlarmMessage(alarmObj, config);
                }

                return {
                    addAlarmMessage: addAlarmMessage
                };
            }
        ];
    });