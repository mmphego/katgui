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

        vm.toggleSelectAllKnownAlarms = function (selected) {

            $rootScope.knownAlarmsData.forEach(function (item) {
                item.selected = selected;
            });
        };

        vm.toggleSelectAllAlarms = function (selected) {

            $rootScope.alarmsData.forEach(function (item) {
                item.selected = selected;
            });
        };

        vm.clearSelectedAlarms = function () {

            for (var j = 0; j < $rootScope.alarmsData.length; j++) {
                if ($rootScope.alarmsData[j].selected) {
                    ControlService.clearAlarm($rootScope.alarmsData[j].name);
                }
            }
        };

        vm.acknowledgeSelectedAlarms = function () {

            for (var j = 0; j < $rootScope.alarmsData.length; j++) {
                if ($rootScope.alarmsData[j].selected) {
                    ControlService.acknowledgeAlarm($rootScope.alarmsData[j].name);
                }
            }
        };

        vm.knowSelectedAlarms = function () {

            for (var j = 0; j < $rootScope.alarmsData.length; j++) {
                if ($rootScope.alarmsData[j].selected) {
                    ControlService.addKnownAlarm($rootScope.alarmsData[j].name);
                }
            }
        };

        vm.cancelKnowSelectedAlarms = function () {

            for (var j = 0; j < $rootScope.knownAlarmsData.length; j++) {
                if ($rootScope.knownAlarmsData[j].selected) {
                    ControlService.cancelKnowAlarm($rootScope.knownAlarmsData[j].name);
                }
            }
        };
    }
})();
