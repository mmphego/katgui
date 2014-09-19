describe('AlarmsCtrl', function () {

    beforeEach(module('katGui.alarms'));

    var mockAlarms;

    mockAlarms = {
        connectListener: function () {
            return true;
        },
        disconnectListener: function () {
            return true;
        }
    };

    beforeEach(function () {
        module(function ($provide) {
            $provide.value('AlarmsService', mockAlarms);
        });
    });

    var scope, AlarmsService, httpBackend;

    beforeEach(inject(function ($rootScope, $controller, $httpBackend, _alarms_, _AlarmService_) {
        scope = $rootScope.$new();
        AlarmsService = _AlarmService_;
        httpBackend = $httpBackend;
    }));

    it('should create a SockJS connection', inject(function () {

        var connectResult = AlarmsService.connectListener();
        expect(connectResult).toBeTruthy();
    }));

    it('should attempt to send a message on connection open', inject(function () {

        var connectResult = AlarmsService.connectListener();
        expect(connectResult).toBeTruthy();
        AlarmsService.onSockJSOpen();
        expect(AlarmsService.connection).not.toBeNull();
    }));

    it('should disconnect a SockJS connection', inject(function () {

        var connectResult = AlarmsService.connectListener();
        expect(connectResult).toBeTruthy();
        AlarmsService.disconnectListener();
        expect(AlarmsService.connection).not.toBeNull();
    }));

    it('should remove connection after close', inject(function () {

        AlarmsService.onSockJSClose();
        expect(AlarmsService.connection).toBeNull();
    }));

    it('should broadcast an alarm message', inject(function () {

        var broadCastResult = false;
        scope.$on('alarmMessage', function (event, message) {
            broadCastResult = message !== null;
        });

        var mockEvent = { data: '[{"date": 1411126259.111909, "priority": "new", ' +
            '"message": "sjeldevwdnnjawesiexj", "severity": "critical", ' +
            '"name": "goats"}]'
        };
        AlarmsService.onSockJSMessage(mockEvent);
        expect(broadCastResult).toBeTruthy();
    }));
});