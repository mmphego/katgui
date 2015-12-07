/*jshint loopfunc: true */
(function () {
    angular.module('katGui.services', ['katGui.util', 'ngStorage'])
        .service('AlarmsService', AlarmsService);

    function AlarmsService($rootScope, ConfigService, SoundService, NotifyService) {

        var api = {};
        api.alarmsData = [];
        SoundService.init();
        $rootScope.$on('alarmMessage', api.receivedAlarmMessage);

        api.tailAlarmsHistory = function () {
            if (ConfigService.GetKATLogFileServerURL()) {
                window.open(ConfigService.GetKATLogFileServerURL() + "/logfile/alarms.log").focus();
            } else {
                NotifyService.showSimpleDialog('Error Viewing Progress', 'There is no KATLogFileServer IP defined in config, please contact CAM support.');
            }
        };

        api.receivedAlarmMessage = function (messageName, messageObj) {

            var alarmValues = messageObj.value.toString().split(',');
            messageObj.severity = alarmValues[0];
            messageObj.priority = alarmValues[1];
            messageObj.name = messageName.replace('alarms:kataware_alarm_', '');
            messageObj.date = moment.utc(messageObj.timestamp, 'X').format('DD-MM-YYYY HH:mm:ss');

            var severity_value =
                alarmValues[0] === 'critical'? 0 :
                alarmValues[0] === 'error'? 1 :
                alarmValues[0] === 'warn'? 2 :
                alarmValues[0] === 'unknown'? 3 :
                alarmValues[0] === 'nominal'? 4 : 5;
            messageObj.severity_value = severity_value;

            var foundAlarm = _.findWhere(api.alarmsData, {name: messageObj.name});
            if (foundAlarm) {
                foundAlarm.priority = messageObj.priority;
                foundAlarm.severity = messageObj.severity;
                foundAlarm.severity_value = severity_value;
                foundAlarm.timestamp = messageObj.timestamp;
                foundAlarm.date = messageObj.date;
                foundAlarm.value = messageObj.value;
                foundAlarm.selected = false;
            }
            if (!foundAlarm) {
                api.alarmsData.push(messageObj);
            }

            if (messageObj.priority === 'new' && messageObj.severity !== 'nominal') {
                if (messageObj.severity === 'critical') {
                    SoundService.playCriticalAlarm();
                } else if (messageObj.severity === 'error') {
                    SoundService.playAlarm();
                } else if (messageObj.severity !== 'nominal') {
                    SoundService.playBeep();
                }
            }
        };
        return api;
    }
})();
