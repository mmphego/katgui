(function () {

    angular.module('katGui.alarms', ['katGui.util'])
        .controller('AlarmsCtrl', AlarmsCtrl)
        .filter('alarmsFilter', function () {
            return function (alarms, showCleared) {
                var filtered = [];
                for (var i = 0; i < alarms.length; i++) {
                    var alarm = alarms[i];
                    if (alarm.priority !== 'known' &&
                        (alarm.priority === 'cleared' && showCleared || alarm.priority !== 'cleared')) {
                        filtered.push(alarm);
                    }
                }
                return filtered;
            };
        })
        .filter('alarmsKnownFilter', function () {
            return function (alarms, showKnownNominalAlarms, showKnownMaintenanceAlarms) {
                var filtered = [];
                for (var i = 0; i < alarms.length; i++) {
                    var alarm = alarms[i];
                    if (alarm.priority === 'known' &&
                        (alarm.severity === 'nominal' && showKnownNominalAlarms || alarm.severity !== 'nominal') &&
                        (alarm.severity === 'maintenance' && showKnownMaintenanceAlarms || alarm.severity !== 'maintenance')) {
                        filtered.push(alarm);
                    }
                }
                return filtered;
            };
        });

    function AlarmsCtrl($rootScope, $scope, ControlService, AlarmsService, ConfigService, $timeout, $log) {

        var vm = this;
        var WAITIMEFORREQ = 250;

        ConfigService.loadKATObsPortalURL();
        ConfigService.loadAggregateSensorDetail();

        vm.alarmsOrderByFields = [
            {label: 'Severity', value: 'severity'},
            {label: 'Timestamp', value: 'timestamp'},
            {label: 'Priority', value: 'priority'},
            {label: 'Name', value: 'name'},
            {label: 'Message', value: 'value'}
        ];
        vm.knownAlarmsOrderByFields = [
            {label: 'Severity', value: 'severity'},
            {label: 'Timestamp', value: 'timestamp'},
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

        vm.setAlarmsOrderBy('timestamp', true);

        vm.setKnownAlarmsOrderBy = function (column, reverse) {
            var newOrderBy = _.findWhere(vm.knownAlarmsOrderByFields, {value: column});
            if (newOrderBy.reverse === undefined) {
                newOrderBy.reverse = reverse || false;
            } else {
                newOrderBy.reverse = !newOrderBy.reverse;
            }
            vm.knownAlarmsOrderBy = newOrderBy;
        };

        vm.setKnownAlarmsOrderBy('timestamp', true);

        vm.toggleSelectAllKnownAlarms = function () {
            vm.selectAllKnownAlarms = !vm.selectAllKnownAlarms;
            $scope.filteredKnownAlarms.forEach(function (item) {
                item.selected = vm.selectAllKnownAlarms;
            });
        };

        vm.toggleSelectAllAlarms = function () {
            vm.selectAllAlarms = !vm.selectAllAlarms;
            $scope.filteredAlarms.forEach(function (item) {
                item.selected = vm.selectAllAlarms;
            });
        };

        vm.clearSelectedAlarms = function () {
            var timeout = 0;
            AlarmsService.alarmsData.forEach(function (item) {
                if (item.selected) {
                    $timeout(function () {
                        ControlService.clearAlarm(item.name);
                    }, timeout);
                    timeout += WAITIMEFORREQ;
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
                    $timeout(function () {
                        ControlService.acknowledgeAlarm(item.name);
                    }, timeout);
                    timeout += WAITIMEFORREQ;
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
                    $timeout(function () {
                        ControlService.addKnownAlarm(item.name);
                    }, timeout);
                    timeout += WAITIMEFORREQ;
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
                    $timeout(function () {
                        ControlService.cancelKnowAlarm(item.name);
                    }, timeout);
                    timeout += WAITIMEFORREQ;
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
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        };

        vm.viewAlarmSystemConfig = function ($event) {
            ConfigService.getSystemConfig()
                .then(function () {
                    ConfigService.getAlarmConfig('static/alarms/common.conf')
                        .success(function (commonResult) {
                            ConfigService.getAlarmConfig(ConfigService.systemConfig.kataware.alarms)
                                .success(function (alarmsResult) {
                                    var displayResult = JSON.parse(commonResult) + '\n\n' + JSON.parse(alarmsResult);
                                    $rootScope.showPreDialog('System Config for Alarms', displayResult, $event);
                                })
                                .error(function (result) {
                                    $log.error(result);
                                })
                        })
                        .error(function (result) {
                            $log.error(result);
                        });
                });
        };

        vm.viewAlarmsHistory = function () {
            AlarmsService.tailAlarmsHistory();
        };

        vm.unbindShortcuts = $rootScope.$on("keydown", vm.keydown);
        $scope.$on('$destroy', function () {
            vm.unbindShortcuts('keydown');
        });
    }
})();
