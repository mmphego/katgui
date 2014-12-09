describe('AlarmsCtrl', function () {

    beforeEach(module('katGui.alarms'));
    beforeEach(module('katGui'));

    var rootScope, scope, ctrl, appCtrl, location, controlService, monitorService, state;

    beforeEach(inject(function ($rootScope, $controller, $location, _ControlService_, _MonitorService_, $state, $templateCache, $httpBackend) {
        scope = $rootScope.$new();

        rootScope = $rootScope;
        location = $location;
        controlService = _ControlService_;
        monitorService = _MonitorService_;
        appCtrl = $controller('ApplicationCtrl', {$scope: scope});
        monitorService.$rootScope = rootScope;

        rootScope.alarmsData = [];
        rootScope.knownAlarmsData = [];

        controlService.addKnownAlarm = function () {
            //send mock server response that alarm is now known
            var alarmObj = {severity: "error", priority:"known", name: "kataware:alarm.Katstore_files_status", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
            appCtrl.receivedAlarmMessage(alarmObj);
        };

        controlService.cancelKnowAlarm = function () {
            //send mock server response that alarm is now known
            var alarmObj = {severity: "error", priority:"new", name: "kataware:alarm.Katstore_files_status", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
            appCtrl.receivedAlarmMessage(alarmObj);
        };

        controlService.clearAlarm = function () {
            var alarmObj = {severity: "error", priority:"cleared", name: "kataware:alarm.Katstore_files_status", value: "error,cleared,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
            appCtrl.receivedAlarmMessage(alarmObj);
        };

        controlService.acknowledgeAlarm = function () {
            var alarmObj = {severity: "error", priority:"acknowledged", name: "kataware:alarm.Katstore_files_status", value: "error,acknowledged,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
            appCtrl.receivedAlarmMessage(alarmObj);
        };

        state = $state;

        //$httpBackend.expectGET('/time');
        var timeRequestHandler = $httpBackend.when('GET', 'http://localhost:8020/time')
            .respond({'time': '123'});

        ctrl = $controller('AlarmsCtrl', {$rootScope: rootScope, $scope: scope, ControlService: controlService});

    }));

    it('should add new alarms', inject(function () {

        var alarmObj = {severity: "error", priority:"new", name: "kataware:alarm.Katstore_files_status", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        appCtrl.receivedAlarmMessage(alarmObj);
        scope.$digest();
        expect(rootScope.alarmsData.length).toBe(1);
        expect(rootScope.alarmsData[0].priority).toBe('new');
    }));

    it('should add known alarms', inject(function () {

        var alarmObj = {severity: "error", priority:"known", name: "kataware:alarm.Katstore_files_status", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        appCtrl.receivedAlarmMessage(alarmObj);
        scope.$digest();
        expect(rootScope.knownAlarmsData.length).toBe(1);
        expect(rootScope.knownAlarmsData[0].priority).toBe('known');
    }));

    it('should add a \'new\' alarm as \'known\' when \'Add As Known\' is clicked on a selected row', inject(function () {

        var alarmObj = {severity: "error", priority:"new", name: "kataware:alarm.Katstore_files_status", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        appCtrl.receivedAlarmMessage(alarmObj);
        scope.$digest();
        expect(rootScope.alarmsData.length).toBe(1);
        rootScope.alarmsData[0].selected = true;
        ctrl.knowSelectedAlarms();
        scope.$digest();
        expect(rootScope.alarmsData.length).toBe(0);
        expect(rootScope.knownAlarmsData.length).toBe(1);
        expect(rootScope.knownAlarmsData[0].priority).toBe('known');

    }));

    it('should NOT add a \'new\' alarm as \'known\' when \'Add As Known\' is clicked and no rows were selected', inject(function () {

        var alarmObj = {severity: "error", priority:"new", name: "kataware:alarm.Katstore_files_status", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        appCtrl.receivedAlarmMessage(alarmObj);
        scope.$digest();
        expect(rootScope.alarmsData.length).toBe(1);
        //test for no rows selected
        //rootScope.alarmsData[0].selected = true;
        ctrl.knowSelectedAlarms();
        scope.$digest();
        expect(rootScope.alarmsData.length).toBe(1);
        expect(rootScope.alarmsData[0].priority).toBe('new');
    }));

    it('should add a \'known\' alarm as \'new\' when \'Cancel Known\' is clicked on a selected row', inject(function () {

        var alarmObj = {severity: "error", priority:"known", name: "kataware:alarm.Katstore_files_status", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        appCtrl.receivedAlarmMessage(alarmObj);
        scope.$digest();
        expect(rootScope.knownAlarmsData.length).toBe(1);
        rootScope.knownAlarmsData[0].selected = true;
        ctrl.cancelKnowSelectedAlarms();
        scope.$digest();
        expect(rootScope.knownAlarmsData.length).toBe(0);
        expect(rootScope.alarmsData.length).toBe(1);
        expect(rootScope.alarmsData[0].priority).toBe('new');
    }));

    it('should NOT add a \'known\' alarm as \'new\' when \'Cancel Known\' is clicked and no rows were selected', inject(function () {

        var alarmObj = {severity: "error", priority:"known", name: "kataware:alarm.Katstore_files_status", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        appCtrl.receivedAlarmMessage(alarmObj);
        scope.$digest();
        expect(rootScope.knownAlarmsData.length).toBe(1);
        //test for no rows selected
        //ctrl.knownAlarmsData[0].selected = true;
        ctrl.cancelKnowSelectedAlarms();
        scope.$digest();
        expect(rootScope.knownAlarmsData.length).toBe(1);
        expect(rootScope.knownAlarmsData[0].priority).toBe('known');
    }));

    it('should clear an alarm when \'Clear\' is clicked on a selected row', inject(function () {

        var alarmObj = {severity: "error", priority:"new", name: "kataware:alarm.Katstore_files_status", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        appCtrl.receivedAlarmMessage(alarmObj);
        scope.$digest();
        expect(rootScope.alarmsData.length).toBe(1);
        expect(rootScope.alarmsData[0].priority).toBe('new');
        rootScope.alarmsData[0].selected = true;
        ctrl.clearSelectedAlarms();
        scope.$digest();
        expect(rootScope.alarmsData.length).toBe(1);
        expect(rootScope.alarmsData[0].priority).toBe('cleared');
    }));

    it('should NOT clear an alarm when \'Clear\' is clicked and no rows were selected', inject(function () {

        var alarmObj = {severity: "error", priority:"new", name: "kataware:alarm.Katstore_files_status", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        appCtrl.receivedAlarmMessage(alarmObj);
        scope.$digest();
        expect(rootScope.alarmsData.length).toBe(1);
        expect(rootScope.alarmsData[0].priority).toBe('new');
        //test for no rows selected
        //rootScope.alarmsData[0].selected = true;
        ctrl.clearSelectedAlarms();
        scope.$digest();
        expect(rootScope.alarmsData.length).toBe(1);
        expect(rootScope.alarmsData[0].priority).toBe('new');
    }));

    it('should acknowledge an alarm when \'Acknowledge\' is clicked on a selected row', inject(function () {

        var alarmObj = {severity: "error", priority:"new", name: "kataware:alarm.Katstore_files_status", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        appCtrl.receivedAlarmMessage(alarmObj);
        scope.$digest();
        expect(rootScope.alarmsData.length).toBe(1);
        expect(rootScope.alarmsData[0].priority).toBe('new');
        rootScope.alarmsData[0].selected = true;
        ctrl.acknowledgeSelectedAlarms();
        scope.$digest();
        expect(rootScope.alarmsData.length).toBe(1);
        expect(rootScope.alarmsData[0].priority).toBe('acknowledged');
    }));

    it('should NOT acknowledge an alarm when \'Acknowledge\' is clicked and no rows were selected', inject(function () {

        var alarmObj = {severity: "error", priority:"new", name: "kataware:alarm.Katstore_files_status", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        appCtrl.receivedAlarmMessage(alarmObj);
        scope.$digest();
        expect(rootScope.alarmsData.length).toBe(1);
        expect(rootScope.alarmsData[0].priority).toBe('new');
        //test for no rows selected
        //ctrl.alarmsData[0].selected = true;
        ctrl.acknowledgeSelectedAlarms();
        scope.$digest();
        expect(rootScope.alarmsData.length).toBe(1);
        expect(rootScope.alarmsData[0].priority).toBe('new');
    }));

    it('should update an existing known alarm', inject(function () {

        var alarmObj = {severity: "error", priority:"known", name: "kataware:alarm.Katstore_files_status", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        appCtrl.receivedAlarmMessage(alarmObj);
        scope.$digest();
        console.log(rootScope.knownAlarmsData);
        expect(rootScope.knownAlarmsData.length).toBe(1);
        expect(rootScope.knownAlarmsData[0].priority).toBe('known');

        var alarmObj2 = {status: "warn", priority:"known", name: "kataware:alarm.Katstore_files_status", value: "warn,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        appCtrl.receivedAlarmMessage(alarmObj2);
        scope.$digest();
        console.log(rootScope.knownAlarmsData);

        expect(rootScope.knownAlarmsData.length).toBe(1);
        expect(rootScope.knownAlarmsData[0].severity).toBe('warn');
    }));

    it('should NOT update an existing known alarm if a different alarm is received', inject(function () {

        var alarmObj = {severity: "error", priority:"known", name: "kataware:alarm.Katstore_files_status", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        appCtrl.receivedAlarmMessage(alarmObj);
        scope.$digest();
        expect(rootScope.knownAlarmsData.length).toBe(1);
        expect(rootScope.knownAlarmsData[0].priority).toBe('known');

        alarmObj = {severity: "warn", priority:"known", name: "kataware:alarm.Katstore_files_status2", value: "nominal,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        appCtrl.receivedAlarmMessage(alarmObj);
        scope.$digest();
        expect(rootScope.knownAlarmsData.length).toBe(2);
        expect(rootScope.knownAlarmsData[0].name).toBe('kataware:alarm.Katstore_files_status');
        expect(rootScope.knownAlarmsData[0].severity).toBe('error');
        expect(rootScope.knownAlarmsData[1].name).toBe('kataware:alarm.Katstore_files_status2');
        expect(rootScope.knownAlarmsData[1].severity).toBe('warn');

    }));

    it('should NOT update an existing new alarm if a different alarm is received', inject(function () {

        var alarmObj = {severity: "error", priority:"new", name: "kataware:alarm.Katstore_files_status", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        appCtrl.receivedAlarmMessage(alarmObj);
        scope.$digest();
        expect(rootScope.alarmsData.length).toBe(1);
        expect(rootScope.alarmsData[0].priority).toBe('new');

        alarmObj = {severity: "warn", priority:"new", name: "kataware:alarm.Katstore_files_status2", value: "nominal,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        appCtrl.receivedAlarmMessage(alarmObj);
        scope.$digest();
        expect(rootScope.alarmsData.length).toBe(2);
        expect(rootScope.alarmsData[0].name).toBe('kataware:alarm.Katstore_files_status');
        expect(rootScope.alarmsData[0].severity).toBe('error');
        expect(rootScope.alarmsData[1].name).toBe('kataware:alarm.Katstore_files_status2');
        expect(rootScope.alarmsData[1].severity).toBe('warn');

    }));

    it('should set all alarms as selected when checked', inject(function() {
        var alarmObj1 = {severity: "error", priority:"new", name: "kataware:alarm.Katstore_files_status1", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        var alarmObj2 = {severity: "error", priority:"new", name: "kataware:alarm.Katstore_files_status2", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        var alarmObj3 = {severity: "error", priority:"new", name: "kataware:alarm.Katstore_files_status3", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        appCtrl.receivedAlarmMessage(alarmObj1);
        appCtrl.receivedAlarmMessage(alarmObj2);
        appCtrl.receivedAlarmMessage(alarmObj3);
        scope.$digest();
        expect(rootScope.alarmsData.length).toBe(3);
        ctrl.toggleSelectAllAlarms(true);
        rootScope.alarmsData.forEach(function (item) {
            expect(item.selected).toBeTruthy();
        });
        ctrl.toggleSelectAllAlarms(false);
        rootScope.alarmsData.forEach(function (item) {
            expect(item.selected).toBeFalsy();
        });
    }));

    it('should set all known alarms as selected when checked', inject(function() {
        var alarmObj1 = {severity: "error", priority:"known", name: "kataware:alarm.Katstore_files_status1", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        var alarmObj2 = {severity: "error", priority:"known", name: "kataware:alarm.Katstore_files_status2", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        var alarmObj3 = {severity: "error", priority:"known", name: "kataware:alarm.Katstore_files_status3", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        appCtrl.receivedAlarmMessage(alarmObj1);
        appCtrl.receivedAlarmMessage(alarmObj2);
        appCtrl.receivedAlarmMessage(alarmObj3);
        scope.$digest();
        expect(rootScope.knownAlarmsData.length).toBe(3);
        ctrl.toggleSelectAllKnownAlarms(true);
        rootScope.knownAlarmsData.forEach(function (item) {
            expect(item.selected).toBeTruthy();
        });
        ctrl.toggleSelectAllKnownAlarms(false);
        rootScope.knownAlarmsData.forEach(function (item) {
            expect(item.selected).toBeFalsy();
        });
    }));


});
