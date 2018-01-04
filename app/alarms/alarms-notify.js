(function() {

    angular.module('katGui.alarms')
        .controller('AlarmsNotifyCtrl', AlarmsNotifyCtrl)
        .directive('alarmsNotifier', AlarmDirective);

    function AlarmDirective() {
        return {
            restrict: 'E',
            templateUrl: 'app/alarms/alarms-notify.html',
            replace: true,
            scope: true,
            controller: 'AlarmsNotifyCtrl as vm'
        };
    }

    function AlarmsNotifyCtrl(ControlService) {

        var vm = this;

        vm.acknowledgeMessage = function(message) {
            ControlService.acknowledgeAlarm(message.name);
        };

        vm.knowMessage = function(message) {
            ControlService.addKnownAlarm(message.name);
        };

        vm.hideAlarmNotification = function(message) {
            message.hidden = true;
        };

        vm.alarmsFilter = function(alarm) {
            return alarm.priority === 'new' && alarm.severity !== 'nominal';
        };
    }
})();
