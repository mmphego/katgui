angular.module('katGui.alarms')
//
//    .factory('AlarmService', function ($rootScope, $timeout, alarms) {
//
//        var urlBase = 'http://localhost:8889';
//        var alarmService = {};
//        alarmService.connection = null;
//
//        alarmService.onSockJSOpen = function () {
//            if (alarmService.connection && alarmService.connection.readyState) {
//                alarmService.connection.send('katGui says hi.');
//            }
//        };
//
//        alarmService.onSockJSClose = function () {
//            console.log('Disconnecting Alarm Connection');
//            alarmService.connection = null;
//        };
//
//        alarmService.onSockJSMessage = function (e) {
//            var jsonObj = JSON.parse(e.data);
//
//            jsonObj = [].concat(jsonObj);
//
//            jsonObj.forEach(function (obj) {
//
//                if (obj.date) {
//                    obj.dateUnix = obj.date;
//                    obj.date = moment.utc(obj.date, 'X').format('hh:mm:ss DD-MM-YYYY');
//                }
//
//                alarms.addAlarmMessage(obj);
//            });
//
//            if (!$rootScope.$$phase) {
//                $rootScope.$digest();
//            }
//        };
//
//        //var testalarms = {};
//        //testalarms.data = '[{"date": 1414501809.065489, "priority": "new", "message": "llgpfokdrtxhpwpfszda", "severity": "maintenance", "name": "ugly_alien"}, {"date": 1414301809.065607, "priority": "acknowledged", "message": "muhxretqbaaoewdpijev", "severity": "warn", "name": "tiny_alien"}, {"date": 1414401809.065679, "priority": "new", "message": "sfadkzygdzrkckrqgxee", "severity": "critical", "name": "purple_sky"}, {"date": 1414401809.065747, "priority": "cleared", "message": "xnxmhjdshssiguxvapzo", "severity": "nominal", "name": "surfer"}, {"date": 1414401809.065884, "priority": "cleared", "message": "bccyhrecrrmchhqphnre", "severity": "nominal", "name": "ugly_alien"}, {"date": 1414401809.065951, "priority": "acknowledged", "message": "cxbyqcqwijjzxbmqpoqt", "severity": "nominal", "name": "humidity"}, {"date": 1414401809.066018, "priority": "known", "message": "nnokpxzmlpbonlypwjoo", "severity": "warn", "name": "purple_sky"}, {"date": 1414401809.066085, "priority": "new", "message": "tmbhuljmjujhftxwzkvp", "severity": "error", "name": "snow"}, {"date": 1414401809.066156, "priority": "acknowledged", "message": "znvbevrfzbipszsmicbr", "severity": "unknown", "name": "surfer"}, {"date": 1414401809.066018, "priority": "known", "message": "nnokqwemlpqwelypqwee", "severity": "error", "name": "purple_sky2"}, {"date": 1414901809.066018, "priority": "known", "message": "nnokasdmlasdelypqwas", "severity": "maintenance", "name": "purple_sky3"}, {"date": 1414201809.066018, "priority": "known", "message": "nnortydmlartelyrtyas", "severity": "nominal", "name": "purple_sky4"}]';
//        //$timeout(function() {
//        //    alarmService.onSockJSMessage(testalarms);
//        //}, 1000);
//
//
//        alarmService.connectListener = function () {
//            alarmService.connection = new SockJS(urlBase + '/alarm');
//            alarmService.connection.onopen = alarmService.onSockJSOpen;
//            alarmService.connection.onmessage = alarmService.onSockJSMessage;
//            alarmService.connection.onclose = alarmService.onSockJSClose;
//
//            return alarmService.connection !== null;
//        };
//
//        alarmService.disconnectListener = function () {
//            if (alarmService.connection) {
//                alarmService.connection.close();
//            }
//        };
//
//        return alarmService;
//    })
//
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
