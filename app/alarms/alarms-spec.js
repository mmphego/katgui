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

        controlService.cancelKnowAlarm = function () {
            //send mock server response that alarm is now known
            var alarmObj = {status: "error", name: "kataware:alarm.Katstore_files_status", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
            monitorService.alarmMessageReceived(alarmObj);
        };

        controlService.clearAlarm = function () {
            var alarmObj = {status: "error", name: "kataware:alarm.Katstore_files_status", value: "error,cleared,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
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

    it('should add new alarms', inject(function () {

        var alarmObj = {status: "error", name: "kataware:alarm.Katstore_files_status", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        monitorService.alarmMessageReceived(alarmObj);
        scope.$digest();
        expect(ctrl.alarmsData.length).toBe(1);
        expect(ctrl.alarmsData[0].priority).toBe('new');
    }));

    it('should add known alarms', inject(function () {

        var alarmObj = {status: "error", name: "kataware:alarm.Katstore_files_status", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        monitorService.alarmMessageReceived(alarmObj);
        scope.$digest();
        expect(ctrl.knownAlarmsData.length).toBe(1);
        expect(ctrl.knownAlarmsData[0].priority).toBe('known');
    }));

    it('should add a \'new\' alarm as \'known\' when \'Add As Known\' is clicked on a selected row', inject(function () {

        var alarmObj = {status: "error", name: "kataware:alarm.Katstore_files_status", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        monitorService.alarmMessageReceived(alarmObj);
        scope.$digest();
        expect(ctrl.alarmsData.length).toBe(1);
        ctrl.alarmsData[0].selected = true;
        ctrl.knowSelectedAlarms();
        scope.$digest();
        expect(ctrl.alarmsData.length).toBe(0);
        expect(ctrl.knownAlarmsData.length).toBe(1);
        expect(ctrl.knownAlarmsData[0].priority).toBe('known');

    }));

    it('should NOT add a \'new\' alarm as \'known\' when \'Add As Known\' is clicked and no rows were selected', inject(function () {

        var alarmObj = {status: "error", name: "kataware:alarm.Katstore_files_status", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        monitorService.alarmMessageReceived(alarmObj);
        scope.$digest();
        expect(ctrl.alarmsData.length).toBe(1);
        //test for no rows selected
        //ctrl.alarmsData[0].selected = true;
        ctrl.knowSelectedAlarms();
        scope.$digest();
        expect(ctrl.alarmsData.length).toBe(1);
        expect(ctrl.alarmsData[0].priority).toBe('new');
    }));

    it('should add a \'known\' alarm as \'new\' when \'Cancel Known\' is clicked on a selected row', inject(function () {

        var alarmObj = {status: "error", name: "kataware:alarm.Katstore_files_status", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        monitorService.alarmMessageReceived(alarmObj);
        scope.$digest();
        expect(ctrl.knownAlarmsData.length).toBe(1);
        ctrl.knownAlarmsData[0].selected = true;
        ctrl.cancelKnowSelectedAlarms();
        scope.$digest();
        expect(ctrl.knownAlarmsData.length).toBe(0);
        expect(ctrl.alarmsData.length).toBe(1);
        expect(ctrl.alarmsData[0].priority).toBe('new');
    }));

    it('should NOT add a \'known\' alarm as \'new\' when \'Cancel Known\' is clicked and no rows were selected', inject(function () {

        var alarmObj = {status: "error", name: "kataware:alarm.Katstore_files_status", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        monitorService.alarmMessageReceived(alarmObj);
        scope.$digest();
        expect(ctrl.knownAlarmsData.length).toBe(1);
        //test for no rows selected
        //ctrl.knownAlarmsData[0].selected = true;
        ctrl.cancelKnowSelectedAlarms();
        scope.$digest();
        expect(ctrl.knownAlarmsData.length).toBe(1);
        expect(ctrl.knownAlarmsData[0].priority).toBe('known');
    }));

    it('should clear an alarm when \'Clear\' is clicked on a selected row', inject(function () {

        var alarmObj = {status: "error", name: "kataware:alarm.Katstore_files_status", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        monitorService.alarmMessageReceived(alarmObj);
        scope.$digest();
        expect(ctrl.alarmsData.length).toBe(1);
        expect(ctrl.alarmsData[0].priority).toBe('new');
        ctrl.alarmsData[0].selected = true;
        ctrl.clearSelectedAlarms();
        scope.$digest();
        expect(ctrl.alarmsData.length).toBe(1);
        expect(ctrl.alarmsData[0].priority).toBe('cleared');
    }));

    it('should NOT clear an alarm when \'Clear\' is clicked and no rows were selected', inject(function () {

        var alarmObj = {status: "error", name: "kataware:alarm.Katstore_files_status", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        monitorService.alarmMessageReceived(alarmObj);
        scope.$digest();
        expect(ctrl.alarmsData.length).toBe(1);
        expect(ctrl.alarmsData[0].priority).toBe('new');
        //test for no rows selected
        //ctrl.alarmsData[0].selected = true;
        ctrl.clearSelectedAlarms();
        scope.$digest();
        expect(ctrl.alarmsData.length).toBe(1);
        expect(ctrl.alarmsData[0].priority).toBe('new');
    }));

    it('should acknowledge an alarm when \'Acknowledge\' is clicked on a selected row', inject(function () {

        var alarmObj = {status: "error", name: "kataware:alarm.Katstore_files_status", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        monitorService.alarmMessageReceived(alarmObj);
        scope.$digest();
        expect(ctrl.alarmsData.length).toBe(1);
        expect(ctrl.alarmsData[0].priority).toBe('new');
        ctrl.alarmsData[0].selected = true;
        ctrl.acknowledgeSelectedAlarms();
        scope.$digest();
        expect(ctrl.alarmsData.length).toBe(1);
        expect(ctrl.alarmsData[0].priority).toBe('acknowledged');
    }));

    it('should NOT acknowledge an alarm when \'Acknowledge\' is clicked and no rows were selected', inject(function () {

        var alarmObj = {status: "error", name: "kataware:alarm.Katstore_files_status", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        monitorService.alarmMessageReceived(alarmObj);
        scope.$digest();
        expect(ctrl.alarmsData.length).toBe(1);
        expect(ctrl.alarmsData[0].priority).toBe('new');
        //test for no rows selected
        //ctrl.alarmsData[0].selected = true;
        ctrl.acknowledgeSelectedAlarms();
        scope.$digest();
        expect(ctrl.alarmsData.length).toBe(1);
        expect(ctrl.alarmsData[0].priority).toBe('new');
    }));

    it('should update an existing known alarm', inject(function () {

        var alarmObj = {status: "error", name: "kataware:alarm.Katstore_files_status", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        monitorService.alarmMessageReceived(alarmObj);
        scope.$digest();
        expect(ctrl.knownAlarmsData.length).toBe(1);
        expect(ctrl.knownAlarmsData[0].priority).toBe('known');

        alarmObj = {status: "nominal", name: "kataware:alarm.Katstore_files_status", value: "nominal,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        monitorService.alarmMessageReceived(alarmObj);
        scope.$digest();
        expect(ctrl.knownAlarmsData.length).toBe(1);
        expect(ctrl.knownAlarmsData[0].severity).toBe('nominal');
    }));

    it('should NOT update an existing known alarm if a different alarm is received', inject(function () {

        var alarmObj = {status: "error", name: "kataware:alarm.Katstore_files_status", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        monitorService.alarmMessageReceived(alarmObj);
        scope.$digest();
        expect(ctrl.knownAlarmsData.length).toBe(1);
        expect(ctrl.knownAlarmsData[0].priority).toBe('known');

        alarmObj = {status: "nominal", name: "kataware:alarm.Katstore_files_status2", value: "nominal,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        monitorService.alarmMessageReceived(alarmObj);
        scope.$digest();
        expect(ctrl.knownAlarmsData.length).toBe(2);
        expect(ctrl.knownAlarmsData[0].name).toBe('Katstore_files_status');
        expect(ctrl.knownAlarmsData[0].severity).toBe('error');
        expect(ctrl.knownAlarmsData[1].name).toBe('Katstore_files_status2');
        expect(ctrl.knownAlarmsData[1].severity).toBe('nominal');

    }));

    it('should NOT update an existing new alarm if a different alarm is received', inject(function () {

        var alarmObj = {status: "error", name: "kataware:alarm.Katstore_files_status", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        monitorService.alarmMessageReceived(alarmObj);
        scope.$digest();
        expect(ctrl.alarmsData.length).toBe(1);
        expect(ctrl.alarmsData[0].priority).toBe('new');

        alarmObj = {status: "nominal", name: "kataware:alarm.Katstore_files_status2", value: "nominal,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        monitorService.alarmMessageReceived(alarmObj);
        scope.$digest();
        expect(ctrl.alarmsData.length).toBe(2);
        expect(ctrl.alarmsData[0].name).toBe('Katstore_files_status');
        expect(ctrl.alarmsData[0].severity).toBe('error');
        expect(ctrl.alarmsData[1].name).toBe('Katstore_files_status2');
        expect(ctrl.alarmsData[1].severity).toBe('nominal');

    }));

    it('should set all alarms as selected when checked', inject(function() {
        var alarmObj1 = {status: "error", name: "kataware:alarm.Katstore_files_status1", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        var alarmObj2 = {status: "error", name: "kataware:alarm.Katstore_files_status2", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        var alarmObj3 = {status: "error", name: "kataware:alarm.Katstore_files_status3", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        monitorService.alarmMessageReceived(alarmObj1);
        monitorService.alarmMessageReceived(alarmObj2);
        monitorService.alarmMessageReceived(alarmObj3);
        scope.$digest();
        expect(ctrl.alarmsData.length).toBe(3);
        ctrl.toggleSelectAllAlarms(true);
        ctrl.alarmsData.forEach(function (item) {
            expect(item.selected).toBeTruthy();
        });
        ctrl.toggleSelectAllAlarms(false);
        ctrl.alarmsData.forEach(function (item) {
            expect(item.selected).toBeFalsy();
        });
    }));

    it('should set all known alarms as selected when checked', inject(function() {
        var alarmObj1 = {status: "error", name: "kataware:alarm.Katstore_files_status1", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        var alarmObj2 = {status: "error", name: "kataware:alarm.Katstore_files_status2", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        var alarmObj3 = {status: "error", name: "kataware:alarm.Katstore_files_status3", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        monitorService.alarmMessageReceived(alarmObj1);
        monitorService.alarmMessageReceived(alarmObj2);
        monitorService.alarmMessageReceived(alarmObj3);
        scope.$digest();
        expect(ctrl.knownAlarmsData.length).toBe(3);
        ctrl.toggleSelectAllKnownAlarms(true);
        ctrl.knownAlarmsData.forEach(function (item) {
            expect(item.selected).toBeTruthy();
        });
        ctrl.toggleSelectAllKnownAlarms(false);
        ctrl.knownAlarmsData.forEach(function (item) {
            expect(item.selected).toBeFalsy();
        });
    }));


});
