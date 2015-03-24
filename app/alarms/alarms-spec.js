describe('AlarmsCtrl', function () {

    beforeEach(module('katGui.alarms'));
    beforeEach(module('katGui.services'));
    beforeEach(module('ngStorage'));
    beforeEach(module('ui.router'));

    var rootScope, scope, ctrl, location, controlService, monitorService, state, alarmsService, timeout;

    beforeEach(inject(function ($rootScope, $controller, $location, _ControlService_, _MonitorService_, _AlarmsService_, $state, $templateCache, $httpBackend, $timeout) {
        scope = $rootScope.$new();

        rootScope = $rootScope;
        location = $location;
        controlService = _ControlService_;
        monitorService = _MonitorService_;
        alarmsService = _AlarmsService_;
        timeout = $timeout;
        monitorService.$rootScope = rootScope;
        controlService.addKnownAlarm = function () {
            //send mock server response that alarm is now known
            var alarmObj = {severity: "error", priority: "known", name: "kataware:alarm.Katstore_files_status", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
            alarmsService.receivedAlarmMessage("kataware:alarm.Katstore_files_status", alarmObj);
        };
        controlService.cancelKnowAlarm = function () {
            //send mock server response that alarm is now known
            var alarmObj = {severity: "error", priority: "new", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
            alarmsService.receivedAlarmMessage("kataware:alarm.Katstore_files_status", alarmObj);
        };
        controlService.clearAlarm = function () {
            var alarmObj = {severity: "error", priority: "cleared", value: "error,cleared,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
            alarmsService.receivedAlarmMessage("kataware:alarm.Katstore_files_status", alarmObj);
        };
        controlService.acknowledgeAlarm = function () {
            var alarmObj = {severity: "error", priority: "acknowledged", value: "error,acknowledged,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
            alarmsService.receivedAlarmMessage("kataware:alarm.Katstore_files_status", alarmObj);
        };
        state = $state;
        ctrl = $controller('AlarmsCtrl', {$rootScope: rootScope, $scope: scope, ControlService: controlService, AlarmsService: alarmsService});
    }));

    it('should add new alarms', inject(function () {
        var alarmObj = {severity: "error", priority: "new", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        alarmsService.receivedAlarmMessage("kataware:alarm.Katstore_files_status", alarmObj);
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        expect(alarmsService.alarmsData[0].priority).toBe('new');
    }));

    it('should add known alarms', inject(function () {
        var alarmObj = {severity: "error", priority: "known", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        alarmsService.receivedAlarmMessage("kataware:alarm.Katstore_files_status", alarmObj);
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        expect(alarmsService.alarmsData[0].priority).toBe('known');
    }));

    it('should add a \'new\' alarm as \'known\' when \'Add As Known\' is clicked on a selected row', inject(function () {
        var alarmObj = {severity: "error", priority: "new", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        alarmsService.receivedAlarmMessage("kataware:alarm.Katstore_files_status", alarmObj);
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        alarmsService.alarmsData[0].selected = true;
        ctrl.knowSelectedAlarms(alarmObj);
        timeout.flush();
        scope.$digest();
        expect(alarmsService.alarmsData[0].priority).toBe('known');
    }));

    it('should NOT add a \'new\' alarm as \'known\' when \'Add As Known\' is clicked and no rows were selected', inject(function () {
        var alarmObj = {severity: "error", priority: "new", name: "kataware:alarm.Katstore_files_status", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        alarmsService.receivedAlarmMessage("kataware:alarm.Katstore_files_status", alarmObj);
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        ctrl.knowSelectedAlarms(alarmObj);
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        expect(alarmsService.alarmsData[0].priority).toBe('new');
    }));

    it('should add a \'known\' alarm as \'new\' when \'Cancel Known\' is clicked on a selected row', inject(function () {
        var alarmObj = {severity: "error", priority: "known", name: "kataware:alarm.Katstore_files_status", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        alarmsService.receivedAlarmMessage("kataware:alarm.Katstore_files_status", alarmObj);
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        alarmsService.alarmsData[0].selected = true;
        ctrl.cancelKnowSelectedAlarms();
        timeout.flush();
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        expect(alarmsService.alarmsData[0].priority).toBe('new');
    }));

    it('should NOT add a \'known\' alarm as \'new\' when \'Cancel Known\' is clicked and no rows were selected', inject(function () {
        var alarmObj = {severity: "error", priority: "known", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        alarmsService.receivedAlarmMessage("kataware:alarm.Katstore_files_status", alarmObj);
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        //test for no rows selected
        //ctrl.alarmsData[0].selected = true;
        ctrl.cancelKnowSelectedAlarms();
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        expect(alarmsService.alarmsData[0].priority).toBe('known');
    }));

    it('should clear an alarm when \'Clear\' is clicked on a selected row', inject(function () {
        var alarmObj = {severity: "error", priority: "new", name: "kataware:alarm.Katstore_files_status", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        alarmsService.receivedAlarmMessage("kataware:alarm.Katstore_files_status", alarmObj);
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        expect(alarmsService.alarmsData[0].priority).toBe('new');
        alarmsService.alarmsData[0].selected = true;
        ctrl.clearSelectedAlarms();
        timeout.flush();
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        expect(alarmsService.alarmsData[0].priority).toBe('cleared');
    }));

    it('should NOT clear an alarm when \'Clear\' is clicked and no rows were selected', inject(function () {
        var alarmObj = {severity: "error", priority: "new", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        alarmsService.receivedAlarmMessage("kataware:alarm.Katstore_files_status", alarmObj);
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        expect(alarmsService.alarmsData[0].priority).toBe('new');
        //test for no rows selected
        //alarmsService.alarmsData[0].selected = true;
        ctrl.clearSelectedAlarms();
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        expect(alarmsService.alarmsData[0].priority).toBe('new');
    }));

    it('should acknowledge an alarm when \'Acknowledge\' is clicked on a selected row', inject(function () {
        var alarmObj = {severity: "error", priority: "new", name: "kataware:alarm.Katstore_files_status", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        alarmsService.receivedAlarmMessage("kataware:alarm.Katstore_files_status", alarmObj);
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        expect(alarmsService.alarmsData[0].priority).toBe('new');
        alarmsService.alarmsData[0].selected = true;
        ctrl.acknowledgeSelectedAlarms();
        timeout.flush();
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        expect(alarmsService.alarmsData[0].priority).toBe('acknowledged');
    }));

    it('should NOT acknowledge an alarm when \'Acknowledge\' is clicked and no rows were selected', inject(function () {
        var alarmObj = {severity: "error", priority: "new", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        alarmsService.receivedAlarmMessage("kataware:alarm.Katstore_files_status", alarmObj);
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        expect(alarmsService.alarmsData[0].priority).toBe('new');
        //test for no rows selected
        //ctrl.alarmsData[0].selected = true;
        ctrl.acknowledgeSelectedAlarms();
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        expect(alarmsService.alarmsData[0].priority).toBe('new');
    }));

    it('should update an existing known alarm', inject(function () {
        var alarmObj = {severity: "error", priority: "known", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        alarmsService.receivedAlarmMessage("kataware:alarm.Katstore_files_status", alarmObj);
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        expect(alarmsService.alarmsData[0].priority).toBe('known');

        var alarmObj2 = {status: "warn", priority: "known", value: "warn,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        alarmsService.receivedAlarmMessage("kataware:alarm.Katstore_files_status", alarmObj2);
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        expect(alarmsService.alarmsData[0].severity).toBe('warn');
    }));

    it('should set all alarms as selected when checked', inject(function () {
        var alarmObj1 = {severity: "error", priority: "new", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        var alarmObj2 = {severity: "error", priority: "new", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        var alarmObj3 = {severity: "error", priority: "new", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        var alarmObj4 = {severity: "error", priority: "known", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        alarmsService.receivedAlarmMessage("kataware:alarm.1", alarmObj1);
        alarmsService.receivedAlarmMessage("kataware:alarm.2", alarmObj2);
        alarmsService.receivedAlarmMessage("kataware:alarm.3", alarmObj3);
        alarmsService.receivedAlarmMessage("kataware:alarm.4", alarmObj4);
        scope.$digest();
        scope.filteredAlarms = alarmsService.alarmsData;
        expect(alarmsService.alarmsData.length).toBe(4);
        ctrl.toggleSelectAllAlarms(true);
        scope.filteredAlarms.forEach(function (item) {
            if (item.priority === 'new') {
                expect(item.selected).toBeTruthy();
            }
        });
        ctrl.toggleSelectAllAlarms(false);
        scope.filteredAlarms.forEach(function (item) {
            if (item.priority === 'new') {
                expect(item.selected).toBeFalsy();
            }
        });
    }));

    it('should set all known alarms as selected when checked', inject(function () {
        var alarmObj1 = {severity: "error", priority: "known", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        var alarmObj2 = {severity: "error", priority: "known", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        var alarmObj3 = {severity: "error", priority: "known", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        var alarmObj4 = {severity: "error", priority: "warn", value: "error,warn,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        alarmsService.receivedAlarmMessage("kataware:alarm.1", alarmObj1);
        alarmsService.receivedAlarmMessage("kataware:alarm.2", alarmObj2);
        alarmsService.receivedAlarmMessage("kataware:alarm.3", alarmObj3);
        alarmsService.receivedAlarmMessage("kataware:alarm.4", alarmObj4);
        scope.$digest();
        scope.filteredKnownAlarms = alarmsService.alarmsData;
        expect(alarmsService.alarmsData.length).toBe(4);
        ctrl.toggleSelectAllKnownAlarms(true);
        scope.filteredKnownAlarms.forEach(function (item) {
            if (item.priority === 'known') {
                expect(item.selected).toBeTruthy();
            }
        });
        ctrl.toggleSelectAllKnownAlarms(false);
        scope.filteredKnownAlarms.forEach(function (item) {
            if (item.priority === 'known') {
                expect(item.selected).toBeFalsy();
            }
        });
    }));

    it('should clear an alarm', inject(function () {
        var alarmObj = {severity: "error", priority: "new", name: "kataware:alarm.Katstore_files_status", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        alarmsService.receivedAlarmMessage("kataware:alarm.Katstore_files_status", alarmObj);
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        expect(alarmsService.alarmsData[0].priority).toBe('new');
        alarmsService.alarmsData[0].selected = true;
        ctrl.clearAlarm(alarmObj);
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        expect(alarmsService.alarmsData[0].priority).toBe('cleared');
    }));

    it('should acknowledge an alarm', inject(function () {
        var alarmObj = {severity: "error", priority: "new", name: "kataware:alarm.Katstore_files_status", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        alarmsService.receivedAlarmMessage("kataware:alarm.Katstore_files_status", alarmObj);
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        expect(alarmsService.alarmsData[0].priority).toBe('new');
        alarmsService.alarmsData[0].selected = true;
        ctrl.acknowledgeAlarm(alarmObj);
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        expect(alarmsService.alarmsData[0].priority).toBe('acknowledged');
    }));

    it('should know an alarm', inject(function () {
        var alarmObj = {severity: "error", priority: "new", name: "kataware:alarm.Katstore_files_status", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        alarmsService.receivedAlarmMessage("kataware:alarm.Katstore_files_status", alarmObj);
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        expect(alarmsService.alarmsData[0].priority).toBe('new');
        alarmsService.alarmsData[0].selected = true;
        ctrl.knowAlarm(alarmObj);
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        expect(alarmsService.alarmsData[0].priority).toBe('known');
    }));

    it('should cancel a known an alarm', inject(function () {
        var alarmObj = {severity: "error", priority: "new", name: "kataware:alarm.Katstore_files_status", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        alarmsService.receivedAlarmMessage("kataware:alarm.Katstore_files_status", alarmObj);
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        expect(alarmsService.alarmsData[0].priority).toBe('known');
        alarmsService.alarmsData[0].selected = true;
        ctrl.cancelKnowAlarm(alarmObj);
        scope.$digest();
        expect(alarmsService.alarmsData.length).toBe(1);
        expect(alarmsService.alarmsData[0].priority).toBe('new');
    }));

    it('should unbind keyboard shortcuts', inject(function () {
        //ctrl.unbindShortcuts = function() {};
        var unbindShortcutsSpy = spyOn(ctrl, "unbindShortcuts");
        scope.$emit("$destroy");
        scope.$digest();
        expect(unbindShortcutsSpy).toHaveBeenCalled();
    }));

    it('should deselect alarms when escape is pressed', inject(function () {
        var alarmObj1 = {severity: "error", priority: "new", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        var alarmObj2 = {severity: "error", priority: "new", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        var alarmObj3 = {severity: "error", priority: "new", value: "error,new,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        var alarmObj4 = {severity: "error", priority: "known", value: "error,known,agg_anc_katstore_files_ok is 0", time: 1415957781.17167};
        alarmsService.receivedAlarmMessage("kataware:alarm.1", alarmObj1);
        alarmsService.receivedAlarmMessage("kataware:alarm.2", alarmObj2);
        alarmsService.receivedAlarmMessage("kataware:alarm.3", alarmObj3);
        alarmsService.receivedAlarmMessage("kataware:alarm.4", alarmObj4);
        scope.$digest();
        scope.filteredAlarms = alarmsService.alarmsData;
        expect(alarmsService.alarmsData.length).toBe(4);
        ctrl.toggleSelectAllAlarms(true);
        ctrl.keydown(null, 27);
        expect(alarmsService.alarmsData[0].selected).toBeFalsy();
        expect(alarmsService.alarmsData[1].selected).toBeFalsy();
        expect(alarmsService.alarmsData[2].selected).toBeFalsy();
        expect(alarmsService.alarmsData[3].selected).toBeFalsy();
        //does nothing
        ctrl.keydown(null, -1);
    }));

    it('should set the orderby of alarms and reverse it when toggled', inject(function () {
        ctrl.setAlarmsOrderBy('severity');
        expect(ctrl.alarmsOrderBy.value).toBe('severity');
        ctrl.setAlarmsOrderBy('severity');
        expect(ctrl.alarmsOrderBy.reverse).toBeTruthy();
        ctrl.setAlarmsOrderBy('severity', false);
        expect(ctrl.alarmsOrderBy.reverse).toBeFalsy();
    }));

    it('should set the orderby of known alarms and reverse it when toggled', inject(function () {
        ctrl.setKnownAlarmsOrderBy('severity');
        expect(ctrl.knownAlarmsOrderBy.value).toBe('severity');
        ctrl.setKnownAlarmsOrderBy('severity');
        expect(ctrl.knownAlarmsOrderBy.reverse).toBeTruthy();
        ctrl.setKnownAlarmsOrderBy('severity', false);
        expect(ctrl.knownAlarmsOrderBy.reverse).toBeFalsy();
    }));
});
