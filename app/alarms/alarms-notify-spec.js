//describe('Directive: alarms notify', function () {
//
//    beforeEach(module('katGui.alarms'));
//    beforeEach(module('templates'));
//
//    var scope, compile, alarms, element;
//
//    beforeEach(inject(function ($rootScope, $compile, _alarms_) {
//        scope = $rootScope.$new();
//        compile = $compile;
//        alarms = _alarms_;
//
//        var strAlarmsNotify = '<div alarm></div>';
//        element = compile(strAlarmsNotify)(scope);
//        scope.$digest();
//    }));
//
//
////    [{"date": 1410948999.507357, "priority": "new", "message": "wnaneahkgxravrngkqgh", "severity": "unknown", "name": "awesome_alien"}, {"date": 1410948999.507401, "priority": "acknowledged", "message": "kinrumysllcrszkbcdgg", "severity": "warn", "name": "hail"}, {"date": 1410948999.507425, "priority": "known", "message": "detijtxvwjszrebadfma", "severity": "critical", "name": "snow"}, {"date": 1410948999.507448, "priority": "new", "message": "lvawqcajuvvlgujcxvcl", "severity": "warn", "name": "tiny_alien"}, {"date": 1410948999.507472, "priority": "acknowledged", "message": "kfflclqzgiotbunwtpef", "severity": "unknown", "name": "snow"}, {"date": 1410948999.507494, "priority": "acknowledged", "message": "kizavsyhcgjiuleljitl", "severity": "nominal", "name": "snow"}, {"date": 1410948999.507517, "priority": "new", "message": "zcpdnuhrhztypuklbpak", "severity": "nominal", "name": "tiny_alien"}, {"date": 1410948999.507539, "priority": "known", "message": "nbkjnrkeoogsuzvamjwg", "severity": "warn", "name": "rust"}, {"date": 1410948999.507561, "priority": "known", "message": "cmgpdfvsllitvsxnyjnk", "severity": "error", "name": "humidity"}, {"date": 1410948999.507583, "priority": "cleared", "message": "cdzjrvqjwjpnftbugois", "severity": "critical", "name": "snow"}]
//
//    it ('should display alarm when alarm is received and priority is new', function () {
//
//        var alarmObj = {"date": 1410948999.507357, "priority": "new", "message": "alarm message", "severity": "critical", "name": "alarm name"};
//        alarms.addAlarmMessage(alarmObj);
//        scope.$digest();
//
//        expect(element.scope().messages[0]).toBe(alarmObj);
//        expect(element.text()).toContain("alarm message");
//        expect(element.text()).toContain("critical");
//        expect(element.text()).toContain("alarm name");
//    });
//
//    it ('should NOT display alarm when alarm is received and priority is NOT new', function () {
//
//        var alarmObj2 = {"date": 1410948999.507357, "priority": "known", "message": "alarm message2", "severity": "critical", "name": "alarm name2"};
//        alarms.addAlarmMessage(alarmObj2);
//        scope.$digest();
//
//        expect(element.scope().messages[0]).toBe(alarmObj2);
//        expect(element.text()).not.toContain("alarm message2");
//        expect(element.text()).not.toContain("alarm name2");
//    });
//
//});
//
//describe('AlarmsNotifyCtrl', function () {
//
//    beforeEach(module('katGui'));
//    beforeEach(module('katGui.alarms'));
//
//    var rootScope, scope, ctrl, location;
//
//    beforeEach(inject(function ($rootScope, $controller, $location) {
//        scope = $rootScope.$new();
//        location = $location;
//        rootScope = $rootScope;
//
//        ctrl = $controller('AlarmsNotifyCtrl', {$scope: scope});
//    }));
//
//    it('should add an alarm message', inject(function () {
//
//        var alarmObj = {"date": 1410948999.507357, "priority": "new", "message": "alarm message", "severity": "critical", "name": "alarm name"};
//        scope.addAlarmMessage(alarmObj);
//        scope.$digest();
//        expect(scope.messages[0]).toBe(alarmObj);
//    }));
//
//    it('should add ttl to alarm message for unknown, nominal and maintenance alarms', inject(function () {
//
//        var alarmObj = {"date": 1410948999.507357, "priority": "new", "message": "alarm message", "severity": "unknown", "name": "alarm name"};
//        scope.addAlarmMessage(alarmObj);
//        scope.$digest();
//        expect(scope.messages[0].ttl).toBeDefined();
//
//        var alarmObj2 = {"date": 1410948999.507357, "priority": "new", "message": "alarm message", "severity": "nominal", "name": "alarm name"};
//        scope.addAlarmMessage(alarmObj2);
//        scope.$digest();
//        expect(scope.messages[1].ttl).toBeDefined();
//
//        var alarmObj3 = {"date": 1410948999.507357, "priority": "new", "message": "alarm message", "severity": "maintenance", "name": "alarm name"};
//        scope.addAlarmMessage(alarmObj3);
//        scope.$digest();
//        expect(scope.messages[2].ttl).toBeDefined();
//    }));
//
//    it('should remove an alarm message after acknowledge', inject(function () {
//
//        var alarmObj = {"date": 1410948999.507357, "priority": "new", "message": "alarm message", "severity": "critical", "name": "alarm name"};
//        scope.addAlarmMessage(alarmObj);
//        expect(scope.messages[0]).toBe(alarmObj);
//        scope.acknowledgeMessage(alarmObj);
//        expect(scope.messages.length).toBe(0);
//    }));
//
//
//    it('should increment alarm message count on rootScope', inject(function () {
//
//        rootScope.newAlarmCritCount = 0;
//        rootScope.newAlarmWarnCount = 0;
//        rootScope.newAlarmErrorCount = 0;
//
//        var alarmObj = {"date": 1410948999.507357, "priority": "new", "message": "alarm message", "severity": "critical", "name": "alarm name"};
//        rootScope.$broadcast('alarmMessage', alarmObj);
//        scope.$digest();
//        expect(rootScope.newAlarmCritCount).toBe(1);
//
//        alarmObj = {"date": 1410948999.507357, "priority": "new", "message": "alarm message", "severity": "warn", "name": "alarm name"};
//        rootScope.$broadcast('alarmMessage', alarmObj);
//        scope.$digest();
//        expect(rootScope.newAlarmWarnCount).toBe(1);
//
//        alarmObj = {"date": 1410948999.507357, "priority": "new", "message": "alarm message", "severity": "error", "name": "alarm name"};
//        rootScope.$broadcast('alarmMessage', alarmObj);
//        scope.$digest();
//        expect(rootScope.newAlarmErrorCount).toBe(1);
//
//        alarmObj = {"date": 1410948999.507357, "priority": "new", "message": "alarm message", "severity": "bogus", "name": "alarm name"};
//        rootScope.$broadcast('alarmMessage', alarmObj);
//        scope.$digest();
//        expect(rootScope.newAlarmErrorCount).toBe(1);
//        expect(rootScope.newAlarmWarnCount).toBe(1);
//        expect(rootScope.newAlarmCritCount).toBe(1);
//
//        alarmObj = {"date": 1410948999.507357, "priority": "known", "message": "alarm message", "severity": "error", "name": "alarm name"};
//        rootScope.$broadcast('alarmMessage', alarmObj);
//        scope.$digest();
//        expect(rootScope.newAlarmErrorCount).toBe(1);
//    }));
//});
