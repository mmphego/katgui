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

            $scope.knownAlarmsData.forEach(function (item) {
                item.selected = lastState;
            });
        };

        $scope.toggleSelectAllAlarms = function (lastState) {

            $scope.alarmsData.forEach(function (item) {
                item.selected = lastState;
            });
        };

        $rootScope.$on('alarmMessage', function (event, message) {

            var found = false;

            if (message.priority === 'known') {

                for (var i = 0; i < $scope.knownAlarmsData.length; i++) {
                    if ($scope.knownAlarmsData[i].name === message.name) {
                        $scope.knownAlarmsData[i].priority = message.priority;
                        $scope.knownAlarmsData[i].severity = message.severity;
                        $scope.knownAlarmsData[i].dateUnix = message.dateUnix;
                        $scope.knownAlarmsData[i].date = message.date;
                        $scope.knownAlarmsData[i].description = message.description;
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    $scope.knownAlarmsData.push(message);
                }
            } else {

                for (var j = 0; j < $scope.alarmsData.length; j++) {
                    if ($scope.alarmsData[j].name === message.name) {
                        $scope.alarmsData[j].priority = message.priority;
                        $scope.alarmsData[j].severity = message.severity;
                        $scope.alarmsData[j].dateUnix = message.dateUnix;
                        $scope.alarmsData[j].date = message.date;
                        $scope.alarmsData[j].description = message.description;
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    $scope.alarmsData.push(message);
                }
            }
        });

    });
