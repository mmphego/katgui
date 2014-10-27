angular.module('katGui.alarms', [])

    .controller('AlarmsCtrl', function ($rootScope, $scope) {

        if (!$rootScope.showLargeAlarms) {
            $rootScope.showLargeAlarms = false;
            $scope.showLargeAlarms = false;
        }

        $scope.$watch('showLargeAlarms', function (newVal, oldVal) {
            if (newVal !== oldVal) {
                $rootScope.showLargeAlarms = newVal;
            }
        });

        $scope.alarmsData = [];
        $scope.knownAlarmsData = [];

        $scope.toggleSelectAllKnownAlarms = function (lastState) {

            $scope.knownAlarmsData.forEach(function(item) {
                item.selected = lastState;
            });
        };

        $scope.toggleSelectAllAlarms = function (lastState) {

            $scope.alarmsData.forEach(function(item) {
                item.selected = lastState;
            });
        };

        $rootScope.$on('alarmMessage', function (event, message) {

            if (message.priority === 'known') {
                $scope.knownAlarmsData.push(message);
            } else {
                $scope.alarmsData.push(message);
            }

        });

    });
