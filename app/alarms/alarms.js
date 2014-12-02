(function () {

    angular.module('katGui.alarms', ['katGui.util'])
        .controller('AlarmsCtrl', AlarmsCtrl);

    function AlarmsCtrl($rootScope, $scope, ControlService, KatGuiUtil) {

        var vm = this;

        vm.orderByFields = [
            {label: 'Date', value: 'dateUnix'},
            {label: 'Description', value: 'description'},
            {label: 'Name', value: 'name'},
            {label: 'Priority', value: 'priority'},
            {label: 'Severity', value: 'severity'},
        ];

        vm.alarmsOrderBy = vm.orderByFields[0];
        vm.alarmsKnownOrderBy = vm.orderByFields[0];

        vm.alarmsData = $rootScope.alarmsData;
        vm.knownAlarmsData = $rootScope.knownAlarmsData;

        vm.toggleSelectAllKnownAlarms = function (selected) {

            vm.knownAlarmsData.forEach(function (item) {
                item.selected = selected;
            });
        };

        vm.toggleSelectAllAlarms = function (selected) {

            vm.alarmsData.forEach(function (item) {
                item.selected = selected;
            });
        };

        vm.clearSelectedAlarms = function () {

            for (var j = 0; j < vm.alarmsData.length; j++) {
                if (vm.alarmsData[j].selected) {
                    ControlService.clearAlarm(vm.alarmsData[j].name);
                }
            }
        };

        vm.acknowledgeSelectedAlarms = function () {

            for (var j = 0; j < vm.alarmsData.length; j++) {
                if (vm.alarmsData[j].selected) {
                    ControlService.acknowledgeAlarm(vm.alarmsData[j].name);
                }
            }
        };

        vm.knowSelectedAlarms = function () {

            for (var j = 0; j < vm.alarmsData.length; j++) {
                if (vm.alarmsData[j].selected) {
                    ControlService.addKnownAlarm(vm.alarmsData[j].name);
                }
            }
        };

        vm.cancelKnowSelectedAlarms = function () {

            for (var j = 0; j < vm.knownAlarmsData.length; j++) {
                if (vm.knownAlarmsData[j].selected) {
                    ControlService.cancelKnowAlarm(vm.knownAlarmsData[j].name);
                }
            }
        };

        var unbindAlarmMessage = $rootScope.$on('alarmMessage', receivedAlarmMessage);
        $scope.$on('$destroy', unbindAlarmMessage);

        function receivedAlarmMessage(event, message) {

            if (message.severity === 'nominal') {
                return;
            }

            var found = false;

            if (message.priority === 'known') {

                for (var i = 0; i < vm.knownAlarmsData.length; i++) {
                    if (vm.knownAlarmsData[i].name === message.name) {
                        vm.knownAlarmsData[i].priority = message.priority;
                        vm.knownAlarmsData[i].severity = message.status;
                        vm.knownAlarmsData[i].dateUnix = message.dateUnix;
                        vm.knownAlarmsData[i].date = message.date;
                        vm.knownAlarmsData[i].description = message.value;
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    vm.knownAlarmsData.push(message);
                    KatGuiUtil.removeFirstFromArrayWhereProperty(vm.alarmsData, 'name', message.name);
                }

            } else {

                for (var j = 0; j < vm.alarmsData.length; j++) {
                    if (vm.alarmsData[j].name === message.name) {
                        vm.alarmsData[j].priority = message.priority;
                        vm.alarmsData[j].severity = message.status;
                        vm.alarmsData[j].dateUnix = message.dateUnix;
                        vm.alarmsData[j].date = message.date;
                        vm.alarmsData[j].description = message.value;
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    vm.alarmsData.push(message);
                    KatGuiUtil.removeFirstFromArrayWhereProperty(vm.knownAlarmsData, 'name', message.name);
                }
            }
        }

    }
})();
