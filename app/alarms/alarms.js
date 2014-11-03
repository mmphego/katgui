angular.module('katGui.alarms', [])

    .controller('AlarmsCtrl', function ($rootScope, $scope, ControlService) {

        if (!$rootScope.showLargeAlarms) {
            $rootScope.showLargeAlarms = false;
            $scope.showLargeAlarms = false;
        }

        $scope.$watch('showLargeAlarms', function (newVal, oldVal) {
            if (newVal !== oldVal) {
                $rootScope.showLargeAlarms = newVal;
            }
        });

        $scope.alarmsData = $rootScope.alarmsData;
        $scope.knownAlarmsData = $rootScope.knownAlarmsData;

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
                        $scope.knownAlarmsData[i].severity = message.status;
                        $scope.knownAlarmsData[i].dateUnix = message.dateUnix;
                        $scope.knownAlarmsData[i].date = message.date;
                        $scope.knownAlarmsData[i].description = message.value;
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    $scope.knownAlarmsData.push(message);
                }

                //for (var k = 0; k < $scope.alarmsData.length; k++) {
                //    if ($scope.alarmsData[k].name === message.name) {
                //
                //    }
                //}

                //todo: remove from alarmsData
            } else {

                for (var j = 0; j < $scope.alarmsData.length; j++) {
                    if ($scope.alarmsData[j].name === message.name) {
                        $scope.alarmsData[j].priority = message.priority;
                        $scope.alarmsData[j].severity = message.status;
                        $scope.alarmsData[j].dateUnix = message.dateUnix;
                        $scope.alarmsData[j].date = message.date;
                        $scope.alarmsData[j].description = message.value;
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    $scope.alarmsData.push(message);
                }

                //todo: remove from knownalarmsData
            }

        });

        $scope.clearSelectedAlarms = function () {

            for (var j = 0; j < $scope.alarmsData.length; j++) {
                if ($scope.alarmsData[j].selected) {
                    ControlService.clearAlarm($scope.alarmsData[j].name);
                }
            }
        };

        $scope.acknowledgeSelectedAlarms = function () {

            for (var j = 0; j < $scope.alarmsData.length; j++) {
                if ($scope.alarmsData[j].selected) {
                    ControlService.acknowledgeAlarm($scope.alarmsData[j].name);
                }
            }
        };

        $scope.knowSelectedAlarms = function () {

            for (var j = 0; j < $scope.alarmsData.length; j++) {
                if ($scope.alarmsData[j].selected) {
                    ControlService.addKnownAlarm($scope.alarmsData[j].name);
                }
            }
        };

        $scope.cancelKnowSelectedAlarms = function () {

            for (var j = 0; j < $scope.knownAlarmsData.length; j++) {
                if ($scope.knownAlarmsData[j].selected) {
                    ControlService.cancelKnowAlarm($scope.knownAlarmsData[j].name);
                }
            }
        };

    });
