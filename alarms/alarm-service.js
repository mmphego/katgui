angular.module('katGui')

    .factory('AlarmService', function ($rootScope, alarms) {

        var urlBase = 'http://localhost:8889';
        var alarmService = {};

        var conn = new SockJS(urlBase + '/alarm');

        conn.onopen = function() {
            conn.send('Hi there');
        };

        conn.onmessage = function(e) {
            var jsonObj = JSON.parse(e.data);

            jsonObj = [].concat(jsonObj);

            $rootScope.safeApply(function() {
                jsonObj.forEach(function (obj) {
                    alarms.addErrorMessage(obj.name + ' ' + obj.message);
                });
            });

        };

        conn.onclose = function() {
            console.log('Disconnecting Alarm Connection');
        };

        return alarmService;
    });