(function () {
    angular.module('katGui.alarms')
        .provider('alarms', AlarmsProvider);

    function AlarmsProvider() {
        var _ttl = null;

        this.$get = [
            '$rootScope',
            function ($rootScope, ControlService) {

                var api = {};

                api.addAlarmMessage = function (alarmObj, config) {
                    var _config = config || {};
                    alarmObj.ttl = _config.ttl || _ttl;
                    $rootScope.$broadcast('alarmMessage', alarmObj);
                };

                api.addKnown = function (alarmName) {
                    ControlService.addKnownAlarm(alarmName);
                };

                return api;
            }
        ];
    }
})();
