describe('ControlService', function () {

    beforeEach(module('katGui.services'));
    beforeEach(module('katGui.util'));

    var authMessage = {
        type: "message",
        data: '{"jsonrpc": "2.0",' +
        '"result": {' +
        '"email": "fjoubert@ska.ac.za",' +
        '"session_id": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE0MjYxNDk5OTcsIm5hbWUiOiJGcmFuY29pcyBKb3ViZXJ0IiwiaWQiOjEsInJvbGVzIjpbImNvbnRyb2xfYXV0aG9yaXR5IiwidXNlcl9hZG1pbiIsImxlYWRfb3BlcmF0b3IiLCJvcGVyYXRvciIsInJlYWRfb25seSJdLCJlbWFpbCI6ImZqb3ViZXJ0QHNrYS5hYy56YSJ9.F0f9i3b-ns8p4igqdhGiRCRI6N5S3B2dRSzgCt0Czqo"' +
        '},' +
        '"id": "authorise190d6c08-af9b-4432-a5d1-15ab9be24bdc"' +
        '}'
    };

    var badAuthMessage = {
        type: "message",
        data: '{"jsonrpc": "2.0",' +
        '"result": "error",' +
        '"id": "authorise190d6c08-af9b-4432-a5d1-15ab9be24bdc"' +
        '}'
    };

    var errorMessage = {
        type: "message",
        data: '{"error": {"message":"test error"}}'
    };

    var goodMessage = {
        type: "message",
        data: '{"result": {"reply":"test message"}}'
    };

    var scope, ControlService, httpBackend, q, timeout;

    beforeEach(inject(function ($rootScope, _ControlService_, _$injector_, _$q_, _$timeout_) {
        timeout = _$timeout_;
        q = _$q_;
        ControlService = _ControlService_;
        scope = $rootScope.$new();
        $rootScope.showSimpleDialog = function() {
        };
        $rootScope.showSimpleToast = function() {
        };

        httpBackend = _$injector_.get('$httpBackend');

        window.SockJS = (function () {
            function SockJS() {
            }

            SockJS.prototype.send = function () {

            };
            SockJS.prototype.close = function () {

            };
            return SockJS;
        })();
    }));

    afterEach(function () {
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
    });

    it('should create a SockJS class and set the functions when connecting the listener', function () {
        var result = ControlService.connectListener();
        expect(ControlService.connection).toBeDefined();
        expect(result).toBeTruthy();
    });

    it('should disconnect the connection', function () {
        var result = ControlService.connectListener();
        expect(ControlService.connection).toBeDefined();
        expect(result).toBeTruthy();
        var closeSpy = spyOn(ControlService.connection, 'close');
        ControlService.disconnectListener();
        expect(closeSpy).toHaveBeenCalled();
    });

    it('should not disconnect the connection when there is no connection', function () {
        spyOn(console, 'error');
        ControlService.disconnectListener();
        expect(console.error).toHaveBeenCalledWith('Attempting to disconnect an already disconnected connection!');
    });

    it('should authenticate the socket connection on socket open when connection is in readyState', function () {
        var authSpy = spyOn(ControlService, 'authenticateSocketConnection');
        var result = ControlService.connectListener();
        expect(ControlService.connection).toBeDefined();
        expect(result).toBeTruthy();
        ControlService.connection.readyState = true;
        ControlService.onSockJSOpen();
        expect(authSpy).toHaveBeenCalled();
    });

    it('should NOT authenticate the socket connection on socket open when connection is not in readyState', function () {
        var authSpy = spyOn(ControlService, 'authenticateSocketConnection');
        var result = ControlService.connectListener();
        expect(ControlService.connection).toBeDefined();
        expect(result).toBeTruthy();
        ControlService.onSockJSOpen();
        expect(authSpy).not.toHaveBeenCalled();
    });

    it('should set the connection to null on disconnect', function () {
        var result = ControlService.connectListener();
        expect(ControlService.connection).toBeDefined();
        expect(result).toBeTruthy();
        var closeSpy = spyOn(ControlService.connection, 'close');
        ControlService.disconnectListener();
        expect(closeSpy).toHaveBeenCalled();
        ControlService.onSockJSClose();
        expect(ControlService.connection).toBeNull();
    });

    it('should send the authentication message', function () {
        var result = ControlService.connectListener();
        expect(ControlService.connection).toBeDefined();
        expect(result).toBeTruthy();
        var sendSpy = spyOn(ControlService.connection, 'send');
        scope.$root.session_id = "test_session_id";
        ControlService.authenticateSocketConnection();
        expect(ControlService.connection.authorized).toBeFalsy();
        scope.$root.session_id = "test_session_id";
        expect(sendSpy.calls.mostRecent().args[0]).toMatch(/\{"jsonrpc":"2.0","method":"authorise","params":\["test_session_id"\],"id":"authorise.*\}/);
    });

    it('should NOT send the authentication message when there is no connection', function () {
        var result = ControlService.connectListener();
        expect(ControlService.connection).toBeDefined();
        expect(result).toBeTruthy();
        var sendSpy = spyOn(ControlService.connection, 'send');
        var closeSpy = spyOn(ControlService.connection, 'close');
        ControlService.disconnectListener();
        ControlService.onSockJSClose();
        expect(ControlService.connection).toBeNull();
        ControlService.authenticateSocketConnection();
        expect(closeSpy).toHaveBeenCalled();
        expect(sendSpy).not.toHaveBeenCalled();
    });

    it('should send the control command on the connection', function () {
        var result = ControlService.connectListener();
        expect(ControlService.connection).toBeDefined();
        expect(result).toBeTruthy();
        var sendSpy = spyOn(ControlService.connection, 'send');
        ControlService.connection.authorized = true;
        ControlService.sendControlCommand('kataware', 'test_command', 'testarg');
        expect(sendSpy.calls.mostRecent().args[0]).toMatch(/\{"id":".*","jsonrpc":"2.0","method":"katcp_request","params":\["kataware","test_command","testarg"\]\}/);
    });

    it('should not send the control command on the connection, but should create a timeout for a retry', function () {
        var result = ControlService.connectListener();
        expect(ControlService.connection).toBeDefined();
        expect(result).toBeTruthy();
        var sendSpy = spyOn(ControlService.connection, 'send');
        ControlService.connection.authorized = false;
        ControlService.sendControlCommand('kataware', 'test_command', 'testarg');
        expect(sendSpy).not.toHaveBeenCalled();
        var sendControlCommandSpy = spyOn(ControlService, 'sendControlCommand');
        timeout.flush(500);
        expect(sendControlCommandSpy).toHaveBeenCalledWith('kataware', 'test_command', 'testarg');
    });

    it('should get the current server time', function () {
        httpBackend.when('GET', 'http://localhost:9876:8820/time').respond(200, {});
        var resultPromise = ControlService.getCurrentServerTime();
        httpBackend.flush();
        expect(resultPromise.success).toBeDefined();
        expect(resultPromise.error).toBeDefined();
    });

    it('should send the stow all command', function () {
        var result = ControlService.connectListener();
        expect(ControlService.connection).toBeDefined();
        expect(result).toBeTruthy();
        var sendSpy = spyOn(ControlService.connection, 'send');
        ControlService.connection.authorized = true;
        ControlService.stowAll();
        expect(sendSpy.calls.mostRecent().args[0]).toMatch(/\{"id":".*","jsonrpc":"2.0","method":"katcp_request","params":\["sys","operator_stow_antennas",""\]\}/);
    });

    it('should send the inhibit all command', function () {
        var result = ControlService.connectListener();
        expect(ControlService.connection).toBeDefined();
        expect(result).toBeTruthy();
        var sendSpy = spyOn(ControlService.connection, 'send');
        ControlService.connection.authorized = true;
        ControlService.inhibitAll();
        expect(sendSpy.calls.mostRecent().args[0]).toMatch(/\{"id":".*","jsonrpc":"2.0","method":"katcp_request","params":\["sys","operator_inhibit_antennas",""\]\}/);
    });

    it('should send the stop all command', function () {
        var result = ControlService.connectListener();
        expect(ControlService.connection).toBeDefined();
        expect(result).toBeTruthy();
        var sendSpy = spyOn(ControlService.connection, 'send');
        ControlService.connection.authorized = true;
        ControlService.stopAll();
        expect(sendSpy.calls.mostRecent().args[0]).toMatch(/\{"id":".*","jsonrpc":"2.0","method":"katcp_request","params":\["sys","operator_stop_observations",""\]\}/);
    });

    it('should send the resume operations command', function () {
        var result = ControlService.connectListener();
        expect(ControlService.connection).toBeDefined();
        expect(result).toBeTruthy();
        var sendSpy = spyOn(ControlService.connection, 'send');
        ControlService.connection.authorized = true;
        ControlService.resumeOperations();
        expect(sendSpy.calls.mostRecent().args[0]).toMatch(/\{"id":".*","jsonrpc":"2.0","method":"katcp_request","params":\["sys","operator_resume_operations",""\]\}/);
    });

    it('should send the shutdown computing command', function () {
        var result = ControlService.connectListener();
        expect(ControlService.connection).toBeDefined();
        expect(result).toBeTruthy();
        var sendSpy = spyOn(ControlService.connection, 'send');
        ControlService.connection.authorized = true;
        ControlService.shutdownComputing();
        expect(sendSpy.calls.mostRecent().args[0]).toMatch(/\{"id":".*","jsonrpc":"2.0","method":"katcp_request","params":\["sys","operator_shutdown_computing",""\]\}/);
    });

    it('should send the acknowledge alarm command', function () {
        var result = ControlService.connectListener();
        expect(ControlService.connection).toBeDefined();
        expect(result).toBeTruthy();
        var sendSpy = spyOn(ControlService.connection, 'send');
        ControlService.connection.authorized = true;
        ControlService.acknowledgeAlarm('test_alarm_name');
        expect(sendSpy.calls.mostRecent().args[0]).toMatch(/\{"id":".*","jsonrpc":"2.0","method":"katcp_request","params":\["kataware","alarm_ack","test_alarm_name"\]\}/);
    });

    it('should send the add known alarm command', function () {
        var result = ControlService.connectListener();
        expect(ControlService.connection).toBeDefined();
        expect(result).toBeTruthy();
        var sendSpy = spyOn(ControlService.connection, 'send');
        ControlService.connection.authorized = true;
        ControlService.addKnownAlarm('test_alarm_name');
        expect(sendSpy.calls.mostRecent().args[0]).toMatch(/\{"id":".*","jsonrpc":"2.0","method":"katcp_request","params":\["kataware","alarm_know","test_alarm_name"\]\}/);
    });

    it('should send the cancel known alarm command', function () {
        var result = ControlService.connectListener();
        expect(ControlService.connection).toBeDefined();
        expect(result).toBeTruthy();
        var sendSpy = spyOn(ControlService.connection, 'send');
        ControlService.connection.authorized = true;
        ControlService.cancelKnowAlarm('test_alarm_name');
        expect(sendSpy.calls.mostRecent().args[0]).toMatch(/\{"id":".*","jsonrpc":"2.0","method":"katcp_request","params":\["kataware","alarm_cancel_know","test_alarm_name"\]\}/);
    });

    it('should send the clear alarm command', function () {
        var result = ControlService.connectListener();
        expect(ControlService.connection).toBeDefined();
        expect(result).toBeTruthy();
        var sendSpy = spyOn(ControlService.connection, 'send');
        ControlService.connection.authorized = true;
        ControlService.clearAlarm('test_alarm_name');
        expect(sendSpy.calls.mostRecent().args[0]).toMatch(/\{"id":".*","jsonrpc":"2.0","method":"katcp_request","params":\["kataware","alarm_clear","test_alarm_name"\]\}/);
    });

    it('should set the connection as authorized when a session_id is received', function () {
        var result = ControlService.connectListener();
        expect(ControlService.connection).toBeDefined();
        expect(result).toBeTruthy();
        ControlService.onSockJSMessage(authMessage);
        expect(ControlService.connection.authorized).toBeTruthy();
    });

    it('should NOT set the connection as authorized when a session_id is NOT received', function () {
        var result = ControlService.connectListener();
        expect(ControlService.connection).toBeDefined();
        expect(result).toBeTruthy();
        ControlService.onSockJSMessage(badAuthMessage);
        expect(ControlService.connection.authorized).toBeFalsy();
    });

    it('should display an error dialog when receiving an error message', function () {
        var showSimpleDialogSpy = spyOn(scope.$root, 'showSimpleDialog');
        var result = ControlService.connectListener();
        expect(ControlService.connection).toBeDefined();
        expect(result).toBeTruthy();
        ControlService.onSockJSMessage(errorMessage);
        expect(showSimpleDialogSpy).toHaveBeenCalledWith('Error sending request', 'test error');
    });

    it('should display a toast message when receiving an command response', function () {
        var showSimpleToastSpy = spyOn(scope.$root, 'showSimpleToast');
        var result = ControlService.connectListener();
        expect(ControlService.connection).toBeDefined();
        expect(result).toBeTruthy();
        ControlService.onSockJSMessage(goodMessage);
        expect(showSimpleToastSpy).toHaveBeenCalledWith('test message');
    });

    //wrap the spy promises so that it looks like the $http promise that our service is returning
    function wrapPromise(promise) {
        return {
            then: promise.then,
            success: function (fn) {
                promise.then(fn);
                return wrapPromise(promise);
            },
            error: function (fn) {
                promise.then(null, fn);
                return wrapPromise(promise);
            }
        };
    }
});
