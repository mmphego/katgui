describe('MonitorService', function () {

    beforeEach(module('katGui.services'));

    var errorMessage = {
        type: "message",
        data: '{"error": {"message":"test error"}}'
    };

    var goodMessageKataware = {
        type: "message",
        data: '{"result": {"msg_channel":"", "msg_data":""}, "id":"redis-pubsub"}'
    };

    var badMessage = {
        type: "message",
        data: '{"id":"redis-pubsub"}'
    };

    var goodMessageKataware2 = {
        type: "message",
        data: '{"id":"redis-pubsub-init", "result": [{"msg_channel":"mon:kataware.test", "msg_data":{"value":"test_value"}}]}'
    };

    var goodMessageMode = {
        type: "message",
        data: '{"id":"redis-pubsub-init", "result": [{"msg_channel":"mon:test.mode", "msg_data":{"value":"test_value"}}]}'
    };

    var goodMessageStatus = {
        type: "message",
        data: '{"id":"redis-pubsub-init", "result": [{"msg_channel":"mon:test.test", "msg_data":{"value":"test_value"}}]}'
    };

    var goodMessageSched = {
        type: "message",
        data: '{"id":"redis-pubsub-init", "result": [{"msg_channel":"mon:sched.test", "msg_data":{"value":"test_value"}}]}'
    };

    var badIDMessage = {
        type: "message",
        data: '{"id":"redis-pubsub-init", "result": [{"msg_channel":"", "msg_data":""}]}'
    };

    var garbageMessage = {
        type: "message",
        data: '{"id":"redis-pubsub-init", "result": [{"msg_channel":"1"}]}'
    };

    var httpBackend, MonitorService, AlarmsService, ConfigService, ObsSchedService, StatusService,  scope, timeout, $log;

    beforeEach(inject(function ($rootScope, _$injector_, _MonitorService_, _ConfigService_, _$timeout_, _AlarmsService_, _ObsSchedService_, _StatusService_, $templateCache, _$log_) {
        $log = _$log_;
        timeout = _$timeout_;
        httpBackend = _$injector_.get('$httpBackend');
        MonitorService = _MonitorService_;
        ConfigService = _ConfigService_;
        AlarmsService = _AlarmsService_;
        ObsSchedService = _ObsSchedService_;
        StatusService = _StatusService_;
        scope = $rootScope.$new();
        $rootScope.showSimpleDialog = function () {
        };
        $rootScope.showSimpleToast = function () {
        };
        AlarmsService.receivedAlarmMessage = function () {
        };

        window.SockJS = (function () {
            function SockJS() {
            }

            SockJS.prototype.send = function () {

            };
            SockJS.prototype.close = function () {

            };
            return SockJS;
        })();

        $templateCache.put('app/login-form/login-form.html', '');
    }));

    it('should create a SockJS class and set the functions when connecting the listener', function () {
        var result = MonitorService.connectListener();
        expect(MonitorService.connection).toBeDefined();
        expect(result).toBeTruthy();
    });

    it('should disconnect the connection', function () {
        var result = MonitorService.connectListener();
        expect(MonitorService.connection).toBeDefined();
        expect(result).toBeTruthy();
        var closeSpy = spyOn(MonitorService.connection, 'close');
        MonitorService.disconnectListener();
        expect(closeSpy).toHaveBeenCalled();
    });

    it('should set the connection to null on disconnect', function () {
        var result = MonitorService.connectListener();
        expect(MonitorService.connection).toBeDefined();
        expect(result).toBeTruthy();
        var closeSpy = spyOn(MonitorService.connection, 'close');
        MonitorService.disconnectListener();
        expect(closeSpy).toHaveBeenCalled();
        MonitorService.onSockJSClose();
        expect(MonitorService.connection).toBeNull();
    });

    it('should send the subscribe command', function () {
        var result = MonitorService.connectListener();
        expect(MonitorService.connection).toBeDefined();
        expect(result).toBeTruthy();
        var sendSpy = spyOn(MonitorService.connection, 'send');
        MonitorService.connection.readyState = true;
        MonitorService.subscribe('test_subsribe');
        expect(sendSpy.calls.mostRecent().args[0]).toMatch(/\{"jsonrpc":"2.0","method":"subscribe","params":\["test_subsribe",true\],"id":"monitor.*"\}/);
    });

    it('should not send the subscribe command, but should create a timeout for a retry when the connection is not in readyState', function () {
        var result = MonitorService.connectListener();
        expect(MonitorService.connection).toBeDefined();
        expect(result).toBeTruthy();
        var sendSpy = spyOn(MonitorService.connection, 'send');
        MonitorService.subscribe('test_subscribe');
        expect(sendSpy).not.toHaveBeenCalled();
        var sendControlCommandSpy = spyOn(MonitorService, 'subscribe');
        timeout.flush(500);
        expect(sendControlCommandSpy).toHaveBeenCalledWith('test_subscribe');
    });

    it('should log an error when receiving an error message', function () {
        var errorSpy = spyOn($log, 'error');
        var result = MonitorService.connectListener();
        expect(MonitorService.connection).toBeDefined();
        expect(result).toBeTruthy();
        MonitorService.onSockJSMessage(errorMessage);
        expect(errorSpy).toHaveBeenCalledWith('There was an error sending a jsonrpc request:');
    });

    it('should log an error message when receiving an unknown message type', function () {
        var errorSpy = spyOn($log, 'error');
        var result = MonitorService.connectListener();
        expect(MonitorService.connection).toBeDefined();
        expect(result).toBeTruthy();
        MonitorService.onSockJSMessage({data: '{"a": ""}'});
        expect(errorSpy).toHaveBeenCalledWith('Dangling monitor message...');
    });

    it('should add the message in an array if it was not received in an array', function () {
        var errorSpy = spyOn($log, 'error');
        var result = MonitorService.connectListener();
        expect(MonitorService.connection).toBeDefined();
        expect(result).toBeTruthy();
        MonitorService.onSockJSMessage(goodMessageKataware);
        expect(errorSpy).toHaveBeenCalledWith('Dangling monitor message...');
    });

    it('should do nothing when there is no data in the message', function () {
        var errorSpy = spyOn($log, 'error');
        MonitorService.onSockJSMessage(badMessage);
        expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should not push the data into an array when the id is redis-pubsub-init', function () {
        var errorSpy = spyOn($log, 'error');
        var result = MonitorService.connectListener();
        expect(MonitorService.connection).toBeDefined();
        expect(result).toBeTruthy();
        MonitorService.onSockJSMessage(badIDMessage);
        expect(errorSpy).toHaveBeenCalledWith('Dangling monitor message...');
    });

    it('should call the AlarmService function when receiving the appropriate alarm message', function () {
        var receivedAlarmMessageSpy = spyOn(AlarmsService, 'receivedAlarmMessage');
        MonitorService.onSockJSMessage(goodMessageKataware2);
        expect(receivedAlarmMessageSpy).toHaveBeenCalledWith('mon:kataware.test', { value: 'test_value' });
    });

    it('should call the StatusService function when receiving the appropriate status message', function () {
        var messageReceivedSensorsSpy = spyOn(StatusService, 'messageReceivedSensors');
        MonitorService.onSockJSMessage(goodMessageStatus);
        expect(messageReceivedSensorsSpy).toHaveBeenCalledWith('mon:test.test', { value: 'test_value' });
    });

    it('should not parse an invalid message (the JSON string has no data attribute)', function() {
        var errorSpy = spyOn($log, 'error');
        MonitorService.onSockJSMessage();
        expect(errorSpy).toHaveBeenCalledWith('Dangling monitor message...');
    });
});
