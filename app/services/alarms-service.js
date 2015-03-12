/*jshint loopfunc: true */
(function () {
    angular.module('katGui.services')
        .service('AlarmsService', AlarmsService);

    function AlarmsService($rootScope) {

        var api = {};
        api.alarmsData = [];
        $rootScope.$on('alarmMessage', api.receivedAlarmMessage);

        api.receivedAlarmMessage = function (messageName, messageObj) {

            var alarmValues = messageObj.value.toString().split(',');
            messageObj.severity = alarmValues[0];
            messageObj.priority = alarmValues[1];
            messageObj.name = messageName.replace('kataware:alarm_', '');
            messageObj.dateUnix = messageObj.timestamp;
            messageObj.date = moment.utc(messageObj.timestamp, 'X').format('HH:mm:ss DD-MM-\'YY');

            if (messageObj.severity === 'nominal') {
                var index = _.indexOf(api.alarmsData, _.findWhere(api.alarmsData, {name: messageObj.name}));
                if (index > -1) {
                    api.alarmsData.splice(index, 1);
                }
            } else {
                var foundAlarm = _.findWhere(api.alarmsData, {name: messageObj.name});
                if (foundAlarm) {
                    foundAlarm.priority = messageObj.priority;
                    foundAlarm.severity = messageObj.severity;
                    foundAlarm.dateUnix = messageObj.dateUnix;
                    foundAlarm.date = messageObj.date;
                    foundAlarm.value = messageObj.value;
                    foundAlarm.selected = false;
                }
                if (!foundAlarm) {
                    api.alarmsData.push(messageObj);
                }
            }
        };
        return api;
    }
})();
