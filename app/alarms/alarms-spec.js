describe('AlarmsCtrl', function () {

    beforeEach(module('katGui.alarms'), function($provide) {
//        $provide.constant('UI_VERSION', '0.0.1t');
    });

    var scope, ctrl, location, alarmsService, _alarms_;

    beforeEach(inject(function ($rootScope, $controller, $location, alarms, $injector) {
        scope = $rootScope.$new();
        location = $location;
        _alarms_ = alarms;
        alarmsService = $injector.get('AlarmService');

        ctrl = $controller('AlarmsCtrl', {$scope: scope, AlarmService: alarmsService});
    }));

    it('should bind the content', inject(function () {

        location.path('/alarms');
        expect(location.path()).toBe('/alarms');
    }));

    //it('should add and display an alarm when received', inject(function () {
    //
    //    var alarmObj = {"date": 1410948999.507357, "priority": "new", "message": "alarm message", "severity": "critical", "name": "alarm name"};
    //    _alarms_.addAlarmMessage(alarmObj);
    //    scope.$digest();
    //
    //    expect(scope.alarmsData[0]).toBe(alarmObj);
    //
    //}));
});
