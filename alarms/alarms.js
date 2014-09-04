angular.module('katGui')

    .controller('AlarmsCtrl', function ($rootScope, $scope, AlarmService) {

        $scope.selectAll = false;
        $scope.alarmsData = [];
        $scope.orderByField = 'date';
        $scope.reverseSort = true;

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
            $scope.alarmsData.push(message);
        });

    });