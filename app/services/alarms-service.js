/*jshint loopfunc: true */
(function () {
    angular.module('katGui.services', ['katGui.util', 'ngStorage'])
        .service('AlarmsService', AlarmsService);

    function AlarmsService($rootScope, ConfigService, SoundService, NotifyService, MOMENT_DATETIME_FORMAT) {

        var api = {};
        api.alarmsData = [];
        SoundService.init();
        $rootScope.$on('alarmMessage', api.receivedAlarmMessage);

        api.tailAlarmsHistory = function () {
            $rootScope.openLogWithProgramNameFilter("alarms");
        };

        api.receivedAlarmMessage = function (messageObj) {

            var alarmValues = messageObj.value.toString().split(',');
            var alarm = {
                severity: alarmValues[0],
                priority: alarmValues[1],
                name: messageObj.name.replace('kataware_alarm_', ''),
                date: moment.utc(messageObj.time, 'X').format(MOMENT_DATETIME_FORMAT)
            };

            var severity_value =
                alarmValues[0] === 'critical'? 0 :
                alarmValues[0] === 'error'? 1 :
                alarmValues[0] === 'warn'? 2 :
                alarmValues[0] === 'unknown'? 3 :
                alarmValues[0] === 'nominal'? 4 : 5;
            alarm.severity_value = severity_value;

            var foundAlarm = _.findWhere(api.alarmsData, {name: alarm.name});
            if (foundAlarm) {
                if (alarm.priority !== foundAlarm.priority) {
                    foundAlarm.selected = false;
                }
                foundAlarm.priority = alarm.priority;
                foundAlarm.severity = alarm.severity;
                foundAlarm.severity_value = severity_value;
                foundAlarm.timestamp = alarm.timestamp;
                foundAlarm.date = alarm.date;
                foundAlarm.value = alarm.value;
            }
            if (!foundAlarm) {
                api.alarmsData.push(alarm);
            }

            if (alarm.priority === 'new' && alarm.severity !== 'nominal') {
                if (alarm.severity === 'critical') {
                    SoundService.playCriticalAlarm();
                } else if (alarm.severity === 'error') {
                    SoundService.playAlarm();
                } else if (alarm.severity !== 'nominal') {
                    SoundService.playBeep();
                }
            }
        };
        return api;
    }
})();
