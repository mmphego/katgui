describe('AlarmsCtrl', function () {

    beforeEach(module('katGui.alarms'));
    beforeEach(module('katGui'));

    var rootScope, scope, ctrl, location, controlService, alarmsService, compile;

    beforeEach(inject(function ($rootScope, $controller, $location, _ControlService_, _AlarmsService_, $compile) {
        scope = $rootScope.$new();
        rootScope = $rootScope;
        location = $location;
        controlService = _ControlService_;
        alarmsService = _AlarmsService_;
        compile = $compile;
        controlService.addKnownAlarm = function () {
            //send mock server response that alarm is now known
            var alarmObj = {severity: "error", priority:"known", name: "kataware:alarm.Katstore_files_status", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
            alarmsService.receivedAlarmMessage("kataware:alarm.Katstore_files_status", alarmObj);
        };
        controlService.acknowledgeAlarm = function () {
            var alarmObj = {severity: "error", priority:"acknowledged", value: "error,acknowledged,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
            alarmsService.receivedAlarmMessage("kataware:alarm.Katstore_files_status", alarmObj);
        };

        ctrl = $controller('AlarmsNotifyCtrl', {$rootScope: rootScope, $scope: scope, ControlService: controlService});
        ctrl.alarmsData = [];
    }));

    it('should acknowledge an alarm when \'Ack\' is clicked on a selected row', inject(function () {
        var alarmObj = {severity: "error", priority:"new", name: "kataware:alarm.Katstore_files_status", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        alarmsService.receivedAlarmMessage("kataware:alarm.Katstore_files_status", alarmObj);
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        expect(alarmsService.alarmsData[0].priority).toBe('new');
        alarmsService.alarmsData[0].selected = true;
        ctrl.acknowledgeMessage(alarmObj);
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        expect(alarmsService.alarmsData[0].priority).toBe('acknowledged');
    }));

    it('should know an alarm when \'Knw\' is clicked on a selected row', inject(function () {
        var alarmObj = {severity: "error", priority:"new", name: "kataware:alarm.Katstore_files_status", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        alarmsService.receivedAlarmMessage("kataware:alarm.Katstore_files_status", alarmObj);
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        expect(alarmsService.alarmsData[0].priority).toBe('new');
        alarmsService.alarmsData[0].selected = true;
        ctrl.knowMessage(alarmObj);
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        expect(alarmsService.alarmsData[0].priority).toBe('known');
    }));

    it('should create the notifier directive', inject(function () {
        var element = compile('<alarms-notifier></alarms-notifier>')(scope);
        expect(element[0]).toBeDefined();
    }));
});
