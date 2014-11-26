describe('AlarmsCtrl', function () {

    beforeEach(module('katGui.alarms'));
    beforeEach(module('katGui'));

    var rootScope, scope, ctrl, location, controlService, monitorService;

    beforeEach(inject(function ($rootScope, $controller, $location, _ControlService_, _MonitorService_) {
        scope = $rootScope.$new();
        rootScope = $rootScope;
        location = $location;
        controlService = _ControlService_;
        monitorService = _MonitorService_;

        controlService.addKnownAlarm = function () {
            //send mock server response that alarm is now known
            var alarmObj = {status: "error", name: "kataware:alarm.Katstore_files_status", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
            monitorService.alarmMessageReceived(alarmObj);
        };

        controlService.acknowledgeAlarm = function () {
            var alarmObj = {status: "error", name: "kataware:alarm.Katstore_files_status", value: "error,acknowledged,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
            monitorService.alarmMessageReceived(alarmObj);
        };

        ctrl = $controller('AlarmsCtrl', {$rootScope: rootScope, $scope: scope, ControlService: controlService});
        ctrl.alarmsData = [];
        ctrl.knownAlarmsData = [];
    }));





});
