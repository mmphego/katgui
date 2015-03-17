(function () {

    angular.module('katGui.alarms', ['katGui.util'])
        .controller('AlarmsCtrl', AlarmsCtrl);

    function AlarmsCtrl($rootScope, $scope, ControlService, AlarmsService, $timeout) {

        var vm = this;
        vm.alarmsOrderByFields = [
            {label: 'Severity', value: 'severity'},
            {label: 'Timestamp', value: 'date'},
            {label: 'Priority', value: 'priority'},
            {label: 'Name', value: 'name'},
            {label: 'Message', value: 'value'}
        ];
        vm.knownAlarmsOrderByFields = [
            {label: 'Severity', value: 'severity'},
            {label: 'Timestamp', value: 'date'},
            {label: 'Priority', value: 'priority'},
            {label: 'Name', value: 'name'},
            {label: 'Message', value: 'value'}
        ];

        vm.setAlarmsOrderBy = function (column, reverse) {
            var newOrderBy = _.findWhere(vm.alarmsOrderByFields, {value: column});
            if (newOrderBy.reverse === undefined) {
                newOrderBy.reverse = reverse || false;
            } else {
                newOrderBy.reverse = !newOrderBy.reverse;
            }
            vm.alarmsOrderBy = newOrderBy;
        };

        vm.setAlarmsOrderBy('date', true);

        vm.setKnownAlarmsOrderBy = function (column, reverse) {
            var newOrderBy = _.findWhere(vm.knownAlarmsOrderByFields, {value: column});
            if (newOrderBy.reverse === undefined) {
                newOrderBy.reverse = reverse || false;
            } else {
                newOrderBy.reverse = !newOrderBy.reverse;
            }
            vm.knownAlarmsOrderBy = newOrderBy;
        };

        vm.setKnownAlarmsOrderBy('date', true);

        vm.toggleSelectAllKnownAlarms = function (selected) {
            AlarmsService.alarmsData.forEach(function (item) {
                if (item.priority === 'known') {
                    item.selected = selected;
                }
            });
        };

        vm.toggleSelectAllAlarms = function (selected) {
            AlarmsService.alarmsData.forEach(function (item) {
                if (item.priority !== 'known') {
                    item.selected = selected;
                }
            });
        };

        vm.clearSelectedAlarms = function () {
            var timeout = 0;
            AlarmsService.alarmsData.forEach(function (item) {
                if (item.selected) {
                    $timeout(function() {
                        ControlService.clearAlarm(item.name);
                    }, timeout);
                    timeout += 100;
                }
            });
        };

        vm.clearAlarm = function (alarm) {
            ControlService.clearAlarm(alarm.name);
        };

        vm.acknowledgeSelectedAlarms = function () {
            var timeout = 0;
            AlarmsService.alarmsData.forEach(function (item) {
                if (item.selected) {
                    $timeout(function() {
                        ControlService.acknowledgeAlarm(item.name);
                    }, timeout);
                    timeout += 100;
                }
            });
        };

        vm.acknowledgeAlarm = function (alarm) {
            ControlService.acknowledgeAlarm(alarm.name);
        };

        vm.knowSelectedAlarms = function () {
            var timeout = 0;
            AlarmsService.alarmsData.forEach(function (item) {
                if (item.selected) {
                    $timeout(function() {
                        ControlService.addKnownAlarm(item.name);
                    }, timeout);
                    timeout += 100;
                }
            });
        };

        vm.knowAlarm = function (alarm) {
            ControlService.addKnownAlarm(alarm.name);
        };

        vm.cancelKnowSelectedAlarms = function () {
            var timeout = 0;
            AlarmsService.alarmsData.forEach(function (item) {
                if (item.selected) {
                    $timeout(function() {
                        ControlService.cancelKnowAlarm(item.name);
                    }, timeout);
                    timeout += 100;
                }
            });
        };

        vm.cancelKnowAlarm = function (alarm) {
            ControlService.cancelKnowAlarm(alarm.name);
        };

        vm.keydown = function (e, key) {
            if (key === 27) {
                //escape
                AlarmsService.alarmsData.forEach(function (item) {
                    item.selected = false;
                });
            }
            $scope.$apply();
        };

        vm.unbindShortcuts = $rootScope.$on("keydown", vm.keydown);
        $scope.$on('$destroy', function () {
            vm.unbindShortcuts('keydown');
        });
    }
})();
