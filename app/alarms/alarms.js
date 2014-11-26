(function () {

    angular.module('katGui.alarms', [])
        .controller('AlarmsCtrl', AlarmsCtrl);

    function AlarmsCtrl($rootScope, $scope, ControlService) {

        var vm = this;

        vm.orderByFields = [
            { label: 'Date', value: 'dateUnix' },
            { label: 'Description', value: 'description' },
            { label: 'Name', value: 'name' },
            { label: 'Priority', value: 'priority' },
            { label: 'Severity', value: 'severity' },
        ];

        vm.alarmsOrderBy = vm.orderByFields[0];
        vm.alarmsKnownOrderBy = vm.orderByFields[0];

        if (!$rootScope.showLargeAlarms) {
            $rootScope.showLargeAlarms = false;
            vm.showLargeAlarms = false;
        }

        $scope.$watch('showLargeAlarms', function (newVal, oldVal) {
            if (newVal !== oldVal) {
                $rootScope.showLargeAlarms = newVal;
            }
        });

        vm.alarmsData = $rootScope.alarmsData;
        vm.knownAlarmsData = $rootScope.knownAlarmsData;

        vm.toggleSelectAllKnownAlarms = function (lastState) {

            vm.knownAlarmsData.forEach(function (item) {
                item.selected = lastState;
            });
        };

        vm.toggleSelectAllAlarms = function (lastState) {

            vm.alarmsData.forEach(function (item) {
                item.selected = lastState;
            });
        };

        var unbindAlarmMessage = $rootScope.$on('alarmMessage', function (event, message) {

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
                }

                //for (var k = 0; k < vm.alarmsData.length; k++) {
                //    if (vm.alarmsData[k].name === message.name) {
                //
                //    }
                //}

                //todo: remove from alarmsData
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
                }

                //todo: remove from knownalarmsData
            }

        });

        $scope.$on('$destroy', unbindAlarmMessage);

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

    }
})();
