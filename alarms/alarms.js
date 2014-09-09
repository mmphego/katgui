angular.module('katGui')

    .controller('AlarmsCtrl', function ($rootScope, $scope, AlarmService) {

        $scope.selectAll = false;
        $scope.alarmsData = [];
        $scope.orderByField = 'date';
        $scope.reverseSort = true;

        $scope.gridOptionsAlarms = {
            data: 'alarmsData',
            columnDefs: [
                {field: 'date', displayName: 'Date', width: 150},
                {field: 'severity', displayName: 'Severity', width: 120 },
                {field: 'priority', displayName: 'Priority', width: 120},
                {field: 'name', displayName: 'Alarm Name', width: 120},
                {field: 'message', displayName: 'Message', width: 120}],
            enableRowSelection: false
        };

        if (!AlarmService.isConnected()) {
            AlarmService.connectListener();
        }

        $scope.$watch('selectAll', function (newVal) {

            if ($scope.alarmsData) {
                $scope.alarmsData.forEach(function (alarm) {
                    if (alarm.selected !== newVal) {
                        alarm.selected = newVal;
                    }
                });
            }
        });

        $rootScope.$on('alarmMessage', function (event, message) {

            if (message.priority === 'new' &&
                (message.severity === 'warn' ||
                    message.severity === 'error' ||
                    message.severity === 'critical')) {
                $rootScope.newAlarmCount++;
            }

            $scope.alarmsData.push(message);
        });

    });