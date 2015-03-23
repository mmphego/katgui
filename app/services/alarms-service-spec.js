describe('AlarmsService', function() {

    beforeEach(module('katGui.services'));

    var scope, AlarmsService;

    beforeEach(inject(function ($rootScope, _AlarmsService_) {
        AlarmsService = _AlarmsService_;
        scope = $rootScope.$new();
    }));

    it('should add alarms', inject(function() {
        spyOn(AlarmsService.alarmsData, 'splice');
        var alarmObj1 = {severity: "error", priority:"known", name: "Katstore_files_status", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        var alarmObj2 = {severity: "error", priority:"known", name: "Katstore_files_status2", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        var alarmObj3 = {severity: "error", priority:"known", name: "Katstore_files_status3", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        var alarmObj4 = {severity: "nominal", priority:"known", name: "Katstore_files_status3", value: "nominal,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        var alarmObj5 = {severity: "error", priority:"known", name: "Katstore_files_status3", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        AlarmsService.receivedAlarmMessage("kataware:alarm_Katstore_files_status", alarmObj1);
        AlarmsService.receivedAlarmMessage("kataware:alarm_Katstore_files_status2", alarmObj2);
        AlarmsService.receivedAlarmMessage("kataware:alarm_Katstore_files_status3", alarmObj3);
        expect(AlarmsService.alarmsData.length).toBe(3);
        AlarmsService.receivedAlarmMessage("kataware:alarm_Katstore_files_status3", alarmObj5);
        expect(AlarmsService.alarmsData.length).toBe(3);
        AlarmsService.receivedAlarmMessage("kataware:alarm_Katstore_files_status3", alarmObj4);
        expect(AlarmsService.alarmsData.length).toBe(3);
    }));
});
