(function () {

    angular.module('katGui.alarms', ['katGui.util'])
        .controller('AlarmsCtrl', AlarmsCtrl);

    function AlarmsCtrl($rootScope, $scope, ControlService, KatGuiUtil, $timeout) {

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

            $rootScope.alarmsData.forEach(function (item) {
                if (item.priority === 'known') {
                    item.selected = selected;
                }
            });
        };

        vm.toggleSelectAllAlarms = function (selected) {

            $rootScope.alarmsData.forEach(function (item) {
                if (item.priority !== 'known') {
                    item.selected = selected;
                }
            });
        };

        vm.clearSelectedAlarms = function () {

            var timeout = 0;
            $rootScope.alarmsData.forEach(function (item) {
                if (item.selected) {
                    $timeout(function() {
                        ControlService.clearAlarm(item.name);
                    }, timeout);
                    timeout += 100;
                }
            });
        };

        vm.acknowledgeSelectedAlarms = function () {

            var timeout = 0;
            $rootScope.alarmsData.forEach(function (item) {
                if (item.selected) {
                    $timeout(function() {
                        ControlService.acknowledgeAlarm(item.name);
                    }, timeout);
                    timeout += 100;
                }
            });
        };

        vm.knowSelectedAlarms = function () {

            var timeout = 0;
            $rootScope.alarmsData.forEach(function (item) {
                if (item.selected) {
                    $timeout(function() {
                        ControlService.addKnownAlarm(item.name);
                    }, timeout);
                    timeout += 100;
                }
            });
        };

        vm.cancelKnowSelectedAlarms = function () {

            var timeout = 0;
            $rootScope.alarmsData.forEach(function (item) {
                if (item.selected) {
                    $timeout(function() {
                        ControlService.cancelKnowAlarm(item.name);
                    }, timeout);
                    timeout += 100;
                }
            });
        };
    }
})();
