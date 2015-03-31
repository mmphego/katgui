describe('ObservationScheduleService', function () {

    beforeEach(module('katGui.services'));
    beforeEach(module('katGui.util'));

    var scope, ObservationScheduleService, q, timeout, KatGuiUtil, ConfigService;

    beforeEach(inject(function ($rootScope, _ObservationScheduleService_, _$q_, _$timeout_, _KatGuiUtil_, _ConfigService_) {
        spyOn(console, 'log');
        KatGuiUtil = _KatGuiUtil_;
        ConfigService = _ConfigService_;
        timeout = _$timeout_;
        q = _$q_;
        ObservationScheduleService = _ObservationScheduleService_;
        scope = $rootScope.$new();
        $rootScope.showSimpleDialog = function () {
        };
        $rootScope.showSimpleToast = function () {
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
    }));

    it('should create a SockJS class and set the functions when connecting the listener', function () {
        var result = ObservationScheduleService.connectListener();
        expect(ObservationScheduleService.connection).toBeDefined();
        expect(result).toBeTruthy();
    });

    it('should disconnect the connection', function () {
        var result = ObservationScheduleService.connectListener();
        expect(ObservationScheduleService.connection).toBeDefined();
        expect(result).toBeTruthy();
        var closeSpy = spyOn(ObservationScheduleService.connection, 'close');
        ObservationScheduleService.disconnectListener();
        expect(closeSpy).toHaveBeenCalled();
    });

    it('should not disconnect the connection when there is no connection', function () {
        spyOn(console, 'error');
        ObservationScheduleService.disconnectListener();
        expect(console.error).toHaveBeenCalledWith('Attempting to disconnect an already disconnected connection!');
    });

    it('should authenticate the socket connection on socket open when connection is in readyState', function () {
        var authSpy = spyOn(ObservationScheduleService, 'authenticateSocketConnection');
        var result = ObservationScheduleService.connectListener();
        expect(ObservationScheduleService.connection).toBeDefined();
        expect(result).toBeTruthy();
        ObservationScheduleService.connection.readyState = true;
        ObservationScheduleService.onSockJSOpen();
        expect(authSpy).toHaveBeenCalled();
    });

    it('should NOT authenticate the socket connection on socket open when connection is not in readyState', function () {
        var authSpy = spyOn(ObservationScheduleService, 'authenticateSocketConnection');
        var result = ObservationScheduleService.connectListener();
        expect(ObservationScheduleService.connection).toBeDefined();
        expect(result).toBeTruthy();
        ObservationScheduleService.onSockJSOpen();
        expect(authSpy).not.toHaveBeenCalled();
    });

    it('should set the connection to null on disconnect', function () {
        var result = ObservationScheduleService.connectListener();
        expect(ObservationScheduleService.connection).toBeDefined();
        expect(result).toBeTruthy();
        var closeSpy = spyOn(ObservationScheduleService.connection, 'close');
        ObservationScheduleService.disconnectListener();
        expect(closeSpy).toHaveBeenCalled();
        ObservationScheduleService.onSockJSClose();
        expect(ObservationScheduleService.connection).toBeNull();
    });

    it('should send the authentication message', function () {
        var result = ObservationScheduleService.connectListener();
        expect(ObservationScheduleService.connection).toBeDefined();
        expect(result).toBeTruthy();
        var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
        scope.$root.session_id = "test_session_id";
        ObservationScheduleService.authenticateSocketConnection();
        expect(ObservationScheduleService.connection.authorized).toBeFalsy();
        scope.$root.session_id = "test_session_id";
        expect(sendSpy.calls.mostRecent().args[0]).toMatch(/\{"jsonrpc":"2.0","method":"authorise","params":\["test_session_id"\],"id":"authorise.*\}/);
    });

    it('should NOT send the authentication message when there is no connection', function () {
        var result = ObservationScheduleService.connectListener();
        expect(ObservationScheduleService.connection).toBeDefined();
        expect(result).toBeTruthy();
        var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
        var closeSpy = spyOn(ObservationScheduleService.connection, 'close');
        ObservationScheduleService.disconnectListener();
        ObservationScheduleService.onSockJSClose();
        expect(ObservationScheduleService.connection).toBeNull();
        ObservationScheduleService.authenticateSocketConnection();
        expect(closeSpy).toHaveBeenCalled();
        expect(sendSpy).not.toHaveBeenCalled();
    });

    describe('scheduler api commands', function () {

        beforeEach(inject(function () {
            var result = ObservationScheduleService.connectListener();
            expect(ObservationScheduleService.connection).toBeDefined();
            expect(result).toBeTruthy();
            ObservationScheduleService.connection.authorized = true;
            spyOn(KatGuiUtil, 'generateUUID').and.returnValue('test_id');
            ObservationScheduleService.connection.readyState = SockJS.OPEN;
        }));

        it('should not create a command promise and send obs sched command when the connection is not authorized', function () {
            var result = ObservationScheduleService.connectListener();
            expect(ObservationScheduleService.connection).toBeDefined();
            expect(result).toBeTruthy();
            ObservationScheduleService.connection.authorized = false;
            var sendObsSchedCommandSpy = spyOn(ObservationScheduleService, 'sendObsSchedCommand').and.callThrough();
            ObservationScheduleService.deleteScheduleDraft('testCode');
            expect(sendObsSchedCommandSpy).toHaveBeenCalledWith('delete_schedule_block', ['testCode']);
            expect(ObservationScheduleService.deferredMap.undefined).not.toBeDefined();
        });

        it('should create a command promise and send obs sched command when deleteScheduleDraft is called', function () {
            var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
            var sendObsSchedCommandSpy = spyOn(ObservationScheduleService, 'sendObsSchedCommand').and.callThrough();
            ObservationScheduleService.deleteScheduleDraft('test_code');
            expect(sendObsSchedCommandSpy).toHaveBeenCalledWith('delete_schedule_block', ['test_code']);
            expect(ObservationScheduleService.deferredMap['test_id']).toBeDefined({});
            expect(sendSpy).toHaveBeenCalledWith('{"jsonrpc":"2.0","method":"delete_schedule_block","id":"test_id","params":["test_code"]}');
        });

        it('should create a command promise and send obs sched command when updateScheduleDraft is called', function () {
            var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
            var sendObsSchedCommandSpy = spyOn(ObservationScheduleService, 'sendObsSchedCommand').and.callThrough();
            ObservationScheduleService.updateScheduleDraft({id_code: 'test_id', type: 'test_type', instruction_set: 'test', description: 'test descp', desired_start_time: '1'});
            expect(sendObsSchedCommandSpy).toHaveBeenCalledWith('update_draft_schedule_block', ['test_id', 'test_type', 'test', 'test descp', '1']);
            expect(ObservationScheduleService.deferredMap['test_id']).toBeDefined({});
            expect(sendSpy).toHaveBeenCalledWith('{"jsonrpc":"2.0","method":"update_draft_schedule_block","id":"test_id","params":["test_id","test_type","test","test descp","1"]}');
        });

        it('should create a command promise and send obs sched command when getScheduleBlocksFinished is called', function () {
            var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
            var sendObsSchedCommandSpy = spyOn(ObservationScheduleService, 'sendObsSchedCommand').and.callThrough();
            ObservationScheduleService.getScheduleBlocksFinished();
            expect(sendObsSchedCommandSpy).toHaveBeenCalledWith('get_schedule_blocks_finished');
            expect(ObservationScheduleService.scheduleCompletedData.length).toBe(0);
            expect(ObservationScheduleService.deferredMap['test_id']).toBeDefined({});
            expect(sendSpy).toHaveBeenCalledWith('{"jsonrpc":"2.0","method":"get_schedule_blocks_finished","id":"test_id"}');
        });

        it('should create a command promise and send obs sched command when assignScheduleBlock is called', function () {
            var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
            var sendObsSchedCommandSpy = spyOn(ObservationScheduleService, 'sendObsSchedCommand').and.callThrough();
            ObservationScheduleService.assignScheduleBlock('2', 'test_code');
            expect(sendObsSchedCommandSpy).toHaveBeenCalledWith('assign_schedule_to_subarray', ['2', 'test_code']);
            expect(ObservationScheduleService.deferredMap['test_id']).toBeDefined({});
            expect(sendSpy).toHaveBeenCalledWith('{"jsonrpc":"2.0","method":"assign_schedule_to_subarray","id":"test_id","params":["2","test_code"]}');
        });

        it('should create a command promise and send obs sched command when unassignScheduleBlock is called', function () {
            var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
            var sendObsSchedCommandSpy = spyOn(ObservationScheduleService, 'sendObsSchedCommand').and.callThrough();
            ObservationScheduleService.unassignScheduleBlock('2', 'test_code');
            expect(sendObsSchedCommandSpy).toHaveBeenCalledWith('unassign_schedule_to_subarray', ['2', 'test_code']);
            expect(ObservationScheduleService.deferredMap['test_id']).toBeDefined({});
            expect(sendSpy).toHaveBeenCalledWith('{"jsonrpc":"2.0","method":"unassign_schedule_to_subarray","id":"test_id","params":["2","test_code"]}');
        });

        it('should create a command promise and send obs sched command when scheduleDraft is called', function () {
            var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
            var sendObsSchedCommandSpy = spyOn(ObservationScheduleService, 'sendObsSchedCommand').and.callThrough();
            ObservationScheduleService.scheduleDraft('2', 'test_code');
            expect(sendObsSchedCommandSpy).toHaveBeenCalledWith('schedule_draft', ['2', 'test_code']);
            expect(ObservationScheduleService.deferredMap['test_id']).toBeDefined({});
            expect(sendSpy).toHaveBeenCalledWith('{"jsonrpc":"2.0","method":"schedule_draft","id":"test_id","params":["2","test_code"]}');
        });

        it('should create a command promise and send obs sched command when scheduleToDraft is called', function () {
            var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
            var sendObsSchedCommandSpy = spyOn(ObservationScheduleService, 'sendObsSchedCommand').and.callThrough();
            ObservationScheduleService.scheduleToDraft('2', 'test_code');
            expect(sendObsSchedCommandSpy).toHaveBeenCalledWith('schedule_to_draft', ['2', 'test_code']);
            expect(ObservationScheduleService.deferredMap['test_id']).toBeDefined({});
            expect(sendSpy).toHaveBeenCalledWith('{"jsonrpc":"2.0","method":"schedule_to_draft","id":"test_id","params":["2","test_code"]}');
        });

        it('should create a command promise and send obs sched command when scheduleToComplete is called', function () {
            var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
            var sendObsSchedCommandSpy = spyOn(ObservationScheduleService, 'sendObsSchedCommand').and.callThrough();
            ObservationScheduleService.scheduleToComplete('2', 'test_code');
            expect(sendObsSchedCommandSpy).toHaveBeenCalledWith('schedule_to_complete', ['2', 'test_code']);
            expect(ObservationScheduleService.deferredMap['test_id']).toBeDefined({});
            expect(sendSpy).toHaveBeenCalledWith('{"jsonrpc":"2.0","method":"schedule_to_complete","id":"test_id","params":["2","test_code"]}');
        });

        it('should create a command promise and send obs sched command when verifyScheduleBlock is called', function () {
            var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
            var sendObsSchedCommandSpy = spyOn(ObservationScheduleService, 'sendObsSchedCommand').and.callThrough();
            ObservationScheduleService.verifyScheduleBlock('2', 'test_code');
            expect(sendObsSchedCommandSpy).toHaveBeenCalledWith('verify_schedule_block', ['2', 'test_code']);
            expect(ObservationScheduleService.deferredMap['test_id']).toBeDefined({});
            expect(sendSpy).toHaveBeenCalledWith('{"jsonrpc":"2.0","method":"verify_schedule_block","id":"test_id","params":["2","test_code"]}');
        });

        it('should create a command promise and send obs sched command when executeSchedule is called', function () {
            var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
            var sendObsSchedCommandSpy = spyOn(ObservationScheduleService, 'sendObsSchedCommand').and.callThrough();
            ObservationScheduleService.executeSchedule('2', 'test_code');
            expect(sendObsSchedCommandSpy).toHaveBeenCalledWith('execute_schedule', ['2', 'test_code']);
            expect(ObservationScheduleService.deferredMap['test_id']).toBeDefined({});
            expect(sendSpy).toHaveBeenCalledWith('{"jsonrpc":"2.0","method":"execute_schedule","id":"test_id","params":["2","test_code"]}');
        });

        it('should create a command promise and send obs sched command when cancelExecuteSchedule is called', function () {
            var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
            var sendObsSchedCommandSpy = spyOn(ObservationScheduleService, 'sendObsSchedCommand').and.callThrough();
            ObservationScheduleService.cancelExecuteSchedule('2', 'test_code');
            expect(sendObsSchedCommandSpy).toHaveBeenCalledWith('cancel_execute_schedule', ['2', 'test_code']);
            expect(ObservationScheduleService.deferredMap['test_id']).toBeDefined({});
            expect(sendSpy).toHaveBeenCalledWith('{"jsonrpc":"2.0","method":"cancel_execute_schedule","id":"test_id","params":["2","test_code"]}');
        });

        it('should create a command promise and send obs sched command when cloneSchedule is called', function () {
            var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
            var sendObsSchedCommandSpy = spyOn(ObservationScheduleService, 'sendObsSchedCommand').and.callThrough();
            ObservationScheduleService.cloneSchedule('test_code');
            expect(sendObsSchedCommandSpy).toHaveBeenCalledWith('clone_schedule', ['test_code']);
            expect(ObservationScheduleService.deferredMap['test_id']).toBeDefined({});
            expect(sendSpy).toHaveBeenCalledWith('{"jsonrpc":"2.0","method":"clone_schedule","id":"test_id","params":["test_code"]}');
        });

        it('should create a command promise and send obs sched command when listPoolResources is called', function () {
            ObservationScheduleService.poolResourcesFree = ['m011'];
            ObservationScheduleService.poolResources = ['m022'];
            var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
            var sendObsSchedCommandSpy = spyOn(ObservationScheduleService, 'sendObsSchedCommand').and.callThrough();
            ObservationScheduleService.listPoolResources();
            expect(sendObsSchedCommandSpy).toHaveBeenCalledWith('list_pool_resources');
            expect(ObservationScheduleService.poolResourcesFree.length).toBe(0);
            expect(ObservationScheduleService.poolResources.length).toBe(0);
            expect(ObservationScheduleService.deferredMap['test_id']).toBeDefined({});
            expect(sendSpy).toHaveBeenCalledWith('{"jsonrpc":"2.0","method":"list_pool_resources","id":"test_id"}');
        });

        it('should create a command promise and send obs sched command when listSubarrays is called', function () {
            ObservationScheduleService.subarrays = ['1', '2'];
            var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
            var sendObsSchedCommandSpy = spyOn(ObservationScheduleService, 'sendObsSchedCommand').and.callThrough();
            ObservationScheduleService.listSubarrays();
            expect(sendObsSchedCommandSpy).toHaveBeenCalledWith('list_subarrays');
            expect(ObservationScheduleService.subarrays.length).toBe(0);
            expect(ObservationScheduleService.deferredMap['test_id']).toBeDefined({});
            expect(sendSpy).toHaveBeenCalledWith('{"jsonrpc":"2.0","method":"list_subarrays","id":"test_id"}');
        });

        it('should create a command promise and send obs sched command when assignResourcesToSubarray is called', function () {
            var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
            var sendObsSchedCommandSpy = spyOn(ObservationScheduleService, 'sendObsSchedCommand').and.callThrough();
            ObservationScheduleService.assignResourcesToSubarray('2', ['m011', 'm022']);
            expect(sendObsSchedCommandSpy).toHaveBeenCalledWith('assign_resources_to_subarray', ['2', ['m011', 'm022']]);
            expect(ObservationScheduleService.deferredMap['test_id']).toBeDefined({});
            expect(sendSpy).toHaveBeenCalledWith('{"jsonrpc":"2.0","method":"assign_resources_to_subarray","id":"test_id","params":["2",["m011","m022"]]}');
        });

        it('should create a command promise and send obs sched command when unassignResourcesFromSubarray is called', function () {
            var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
            var sendObsSchedCommandSpy = spyOn(ObservationScheduleService, 'sendObsSchedCommand').and.callThrough();
            ObservationScheduleService.unassignResourcesFromSubarray('2', ['m011', 'm022']);
            expect(sendObsSchedCommandSpy).toHaveBeenCalledWith('unassign_resources_from_subarray', ['2', ['m011', 'm022']]);
            expect(ObservationScheduleService.deferredMap['test_id']).toBeDefined({});
            expect(sendSpy).toHaveBeenCalledWith('{"jsonrpc":"2.0","method":"unassign_resources_from_subarray","id":"test_id","params":["2",["m011","m022"]]}');
        });

        it('should create a command promise and send obs sched command when setSubarrayInUse is called', function () {
            var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
            var sendObsSchedCommandSpy = spyOn(ObservationScheduleService, 'sendObsSchedCommand').and.callThrough();
            ObservationScheduleService.setSubarrayInUse('2', '1');
            expect(sendObsSchedCommandSpy).toHaveBeenCalledWith('set_subarray_in_use', ['2', '1']);
            expect(ObservationScheduleService.deferredMap['test_id']).toBeDefined({});
            expect(sendSpy).toHaveBeenCalledWith('{"jsonrpc":"2.0","method":"set_subarray_in_use","id":"test_id","params":["2","1"]}');
        });

        it('should create a command promise and send obs sched command when setSubarrayMaintenance is called', function () {
            var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
            var sendObsSchedCommandSpy = spyOn(ObservationScheduleService, 'sendObsSchedCommand').and.callThrough();
            ObservationScheduleService.setSubarrayMaintenance('2', '1');
            expect(sendObsSchedCommandSpy).toHaveBeenCalledWith('set_subarray_in_maintenance', ['2', '1']);
            expect(ObservationScheduleService.deferredMap['test_id']).toBeDefined({});
            expect(sendSpy).toHaveBeenCalledWith('{"jsonrpc":"2.0","method":"set_subarray_in_maintenance","id":"test_id","params":["2","1"]}');
        });

        it('should create a command promise and send obs sched command when freeSubarray is called', function () {
            var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
            var sendObsSchedCommandSpy = spyOn(ObservationScheduleService, 'sendObsSchedCommand').and.callThrough();
            ObservationScheduleService.freeSubarray('2');
            expect(sendObsSchedCommandSpy).toHaveBeenCalledWith('free_subarray', ['2']);
            expect(ObservationScheduleService.deferredMap['test_id']).toBeDefined({});
            expect(sendSpy).toHaveBeenCalledWith('{"jsonrpc":"2.0","method":"free_subarray","id":"test_id","params":["2"]}');
        });

        it('should create a command promise and send obs sched command when markResourceFaulty is called', function () {
            var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
            var sendObsSchedCommandSpy = spyOn(ObservationScheduleService, 'sendObsSchedCommand').and.callThrough();
            ObservationScheduleService.markResourceFaulty('m022', '1');
            expect(sendObsSchedCommandSpy).toHaveBeenCalledWith('set_resources_faulty', ['m022', '1']);
            expect(ObservationScheduleService.deferredMap['test_id']).toBeDefined({});
            expect(sendSpy).toHaveBeenCalledWith('{"jsonrpc":"2.0","method":"set_resources_faulty","id":"test_id","params":["m022","1"]}');
        });

        it('should create a command promise and send obs sched command when markResourceInMaintenance is called', function () {
            var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
            var sendObsSchedCommandSpy = spyOn(ObservationScheduleService, 'sendObsSchedCommand').and.callThrough();
            ObservationScheduleService.markResourceInMaintenance('m022', '1');
            expect(sendObsSchedCommandSpy).toHaveBeenCalledWith('set_resources_in_maintenance', ['m022', '1']);
            expect(ObservationScheduleService.deferredMap['test_id']).toBeDefined({});
            expect(sendSpy).toHaveBeenCalledWith('{"jsonrpc":"2.0","method":"set_resources_in_maintenance","id":"test_id","params":["m022","1"]}');
        });

        it('should create a command promise and send obs sched command when listAllocationsForSubarray is called', function () {
            ObservationScheduleService.allocations = ['1', '2'];
            var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
            var sendObsSchedCommandSpy = spyOn(ObservationScheduleService, 'sendObsSchedCommand').and.callThrough();
            ObservationScheduleService.listAllocationsForSubarray('1');
            expect(sendObsSchedCommandSpy).toHaveBeenCalledWith('list_allocations_for_subarray', ['1']);
            expect(ObservationScheduleService.allocations.length).toBe(0);
            expect(ObservationScheduleService.deferredMap['test_id']).toBeDefined({});
            expect(sendSpy).toHaveBeenCalledWith('{"jsonrpc":"2.0","method":"list_allocations_for_subarray","id":"test_id","params":["1"]}');
        });

        it('should create a command promise and send obs sched command when getSchedulerModeForSubarray is called', function () {
            var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
            var sendObsSchedCommandSpy = spyOn(ObservationScheduleService, 'sendObsSchedCommand').and.callThrough();
            ObservationScheduleService.getSchedulerModeForSubarray('1');
            expect(sendObsSchedCommandSpy).toHaveBeenCalledWith('get_scheduler_mode_by_subarray', ['1']);
            expect(ObservationScheduleService.deferredMap['test_id']).toBeDefined({});
            expect(sendSpy).toHaveBeenCalledWith('{"jsonrpc":"2.0","method":"get_scheduler_mode_by_subarray","id":"test_id","params":["1"]}');
        });

        it('should create a command promise and send obs sched command when setSchedulerModeForSubarray is called', function () {
            var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
            var sendObsSchedCommandSpy = spyOn(ObservationScheduleService, 'sendObsSchedCommand').and.callThrough();
            ObservationScheduleService.setSchedulerModeForSubarray('1', 'queue');
            expect(sendObsSchedCommandSpy).toHaveBeenCalledWith('set_scheduler_mode_by_subarray', ['1', 'queue']);
            expect(ObservationScheduleService.deferredMap['test_id']).toBeDefined({});
            expect(sendSpy).toHaveBeenCalledWith('{"jsonrpc":"2.0","method":"set_scheduler_mode_by_subarray","id":"test_id","params":["1","queue"]}');
        });

        it('should open a new tab when viewing a tasklog for a schedule block', function () {
            var openSpy = spyOn(window, 'open').and.callThrough();
            var showSimpleDialogSpy = spyOn(scope.$root, 'showSimpleDialog');
            ObservationScheduleService.viewTaskLogForSBIdCode('testCode');
            expect(showSimpleDialogSpy).toHaveBeenCalledWith('Error Viewing Progress', 'There is no KATObsPortal IP defined in config, please contact CAM support.');
            ConfigService.KATObsPortalURL = 'http://www.testurl.com';
            ObservationScheduleService.viewTaskLogForSBIdCode('testCode');
            expect(openSpy).toHaveBeenCalledWith('http://www.testurl.com/tailtask/testCode/progress');
        });
    });


    describe('scheduler messages received', function () {

        var errorMessage = {data: '{"error":"some error"}'};
        var get_schedule_blocks = {data: '{"result": {"get_schedule_blocks": "[{\\"id_code\\":\\"1\\",\\"state\\":\\"DRAFT\\"},{\\"id_code\\":\\"2\\",\\"state\\":\\"SCHEDULED\\"},{\\"id_code\\":\\"3\\",\\"state\\":\\"COMPLETED\\"}]"}}'};
        var get_schedule_blocks_finished = {data: '{"result": {"get_schedule_blocks_finished": "[{\\"id_code\\":\\"1\\",\\"state\\":\\"COMPLETED\\"},{\\"id_code\\":\\"2\\",\\"state\\":\\"INTERRUPTED\\"},{\\"id_code\\":\\"3\\",\\"state\\":\\"COMPLETED\\"}]"}}'};
        var list_allocations_for_subarray = {data: '{"result": {"list_allocations_for_subarray": {"result" :"[[\\"data_3\\"],[\\"m011\\"],[\\"m022\\"]]", "sub_nr":"2"}}}'};
        var assign_schedule_to_subarray = {data: '{"result": {"assign_schedule_to_subarray": {"result" :"!sb-assign[1] ok", "id_code":"1", "sub_nr":"1"}}}'};
        var unassign_schedule_to_subarray = {data: '{"result": {"unassign_schedule_to_subarray": {"result" :"!sb-assign[1] ok", "id_code":"1", "sub_nr":"1"}}}'};
        var execute_schedule = {data: '{"result": {"execute_schedule": {"result" :"!sb-execute[1] ok", "id_code":"2", "sub_nr":"1"}}}'};
        var cancel_execute_schedule = {data: '{"result": {"cancel_execute_schedule": {"result" :"!sb-execute[1] ok", "id_code":"2", "sub_nr":"1"}}}'};
        var clone_schedule = {data: '{"result": {"clone_schedule": {"result" :{"id_code":"cloned","state":"DRAFT"}, "id_code":"2"}}}'};
        var schedule_draft = {data: '{"result": {"schedule_draft": {"result" :"!sb-schedule[1] ok", "id_code":"1", "sub_nr":"1"}}}'};
        var schedule_to_draft = {data: '{"result": {"schedule_to_draft": {"result" :"!sb-schedule[1] ok", "id_code":"2", "sub_nr":"1"}}}'};
        var schedule_to_complete = {data: '{"result": {"schedule_to_complete": {"result" :"!sb-schedule[1] ok", "id_code":"2", "sub_nr":"1"}}}'};
        var verify_schedule_block = {data: '{"result": {"verify_schedule_block": {"result" :"!sb-verify[1] ok", "id_code":"1", "sub_nr":"1"}}}'};
        var delete_schedule_block = {data: '{"result": {"delete_schedule_block": {"delete_result" :true, "id_code":"1", "sub_nr":"1"}}}'};
        var update_draft_schedule_block = {data: '{"result": {"update_draft_schedule_block": {"id_code":"1","state":"DRAFT","description":"new description","type":"new type","desired_start_time":"new dst"}}}'};
        var list_pool_resources = {data: '{"result": {"list_pool_resources": "[{\\"pool_resources\\":[{\\"state\\":\\"ok\\",\\"name\\":\\"data_2\\"}],\\"sub_nr\\":\\"1\\"},{\\"pool_resources\\":[{\\"state\\":\\"ok\\",\\"name\\":\\"m011\\"},{\\"state\\":\\"ok\\",\\"name\\":\\"m022\\"}],\\"sub_nr\\":\\"free\\"}]"}}'};
        var list_subarrays = {data: '{"result": {"list_subarrays": "[{\\"state\\":\\"free\\",\\"in_maintenance\\":true,\\"id\\":\\"1\\"},{\\"state\\":\\"in_use\\",\\"in_maintenance\\":true,\\"id\\":\\"2\\"}]"}}'};
        var assign_resources_to_subarray = {data: '{"result": {"assign_resources_to_subarray": {"result" :"!assign-resources[1] ok", "resources_list":"m011,m022", "sub_nr":"1"}}}'};
        var unassign_resources_from_subarray = {data: '{"result": {"unassign_resources_from_subarray": {"result" :"!assign-resources[1] ok", "resources_list":"data_2", "sub_nr":"1"}}}'};
        var set_subarray_in_use = {data: '{"result": {"set_subarray_in_use": {"result" :"!set-subarray-in-use[1] ok", "in_use":1, "sub_nr":"1"}}}'};
        var set_subarray_in_use_off = {data: '{"result": {"set_subarray_in_use": {"result" :"!set-subarray-in-use[1] ok", "in_use":0, "sub_nr":"2"}}}'};
        var set_subarray_in_maintenance = {data: '{"result": {"set_subarray_in_maintenance": {"result" :"!set-subarray-in-maintenance[1] ok", "in_maintenance":1, "sub_nr":"1"}}}'};
        var set_subarray_in_maintenance_off = {data: '{"result": {"set_subarray_in_maintenance": {"result" :"!set-subarray-in-maintenance[1] ok", "in_maintenance":0, "sub_nr":"1"}}}'};
        var set_resources_faulty = {data: '{"result": {"set_resources_faulty": {"result" :"!set-resources-faulty[1] ok", "faulty":1, "resources_list":"data_2"}}}'};
        var set_resources_in_maintenance = {data: '{"result": {"set_resources_in_maintenance": {"result" :"!set-resources-in-maintenance[1] ok", "in_maintenance":1, "resources_list":"data_2"}}}'};
        var set_resources_faulty_free = {data: '{"result": {"set_resources_faulty": {"result" :"!set-resources-faulty[1] ok", "faulty":1, "resources_list":"m011"}}}'};
        var set_resources_in_maintenance_free = {data: '{"result": {"set_resources_in_maintenance": {"result" :"!set-resources-in-maintenance[1] ok", "in_maintenance":1, "resources_list":"m011"}}}'};
        var get_scheduler_mode_by_subarray = {data: '{"result": {"get_scheduler_mode_by_subarray": {"result" :"!mode[1] ok 2 queue", "sub_nr":2}}}'};
        var set_scheduler_mode_by_subarray = {data: '{"result": {"set_scheduler_mode_by_subarray": {"result" :"!mode[1] ok 2 manual", "sub_nr":2, "mode":"manual"}}}'};
        var free_subarray = {data: '{"result": {"free_subarray": {"result" :"!free-subarray[1] ok", "sub_nr":2}}}'};
        var session_id_msg = {data: '{"result": {"email":"some@email.com","session_id": "some session id"}}'};
        var session_id_unknown_msg = {data: '{"result": {"session_id": "some session id"}}'};
        var session_id_unknown_error_msg = {data: '{"result": {}}'};

        it('should log an error to console when the message contains an error attribute', function () {
            var errorSpy = spyOn(console, 'error');
            ObservationScheduleService.onSockJSMessage(errorMessage);
            expect(errorSpy).toHaveBeenCalled();
        });

        it('should push sb to the scheduleData and scheduleDraftData array', function () {
            ObservationScheduleService.onSockJSMessage(get_schedule_blocks);
            expect(ObservationScheduleService.scheduleDraftData.length).toBe(1);
            expect(ObservationScheduleService.scheduleData.length).toBe(1);
        });

        it('should push sb to the scheduleCompletedData array', function () {
            ObservationScheduleService.onSockJSMessage(get_schedule_blocks_finished);
            expect(ObservationScheduleService.scheduleCompletedData.length).toBe(3);
        });

        it('should push allocations to the allocations array', function () {
            ObservationScheduleService.onSockJSMessage(list_allocations_for_subarray);
            expect(ObservationScheduleService.allocations.length).toBe(3);
        });

        it('should assign a sb to a subarray', function () {
            ObservationScheduleService.onSockJSMessage(get_schedule_blocks);
            expect(ObservationScheduleService.scheduleDraftData.length).toBe(1);
            ObservationScheduleService.onSockJSMessage(assign_schedule_to_subarray);
            expect(ObservationScheduleService.scheduleDraftData[0].sub_nr).toBe('1');
        });

        it('should unassign a sb to a subarray', function () {
            ObservationScheduleService.onSockJSMessage(get_schedule_blocks);
            expect(ObservationScheduleService.scheduleDraftData.length).toBe(1);
            ObservationScheduleService.scheduleDraftData[0].sub_nr = '1';
            ObservationScheduleService.onSockJSMessage(unassign_schedule_to_subarray);
            expect(ObservationScheduleService.scheduleDraftData[0].sub_nr).toBeNull();
        });

        it('should set the state to active when executing a schedule', function () {
            ObservationScheduleService.onSockJSMessage(get_schedule_blocks);
            expect(ObservationScheduleService.scheduleData.length).toBe(1);
            ObservationScheduleService.onSockJSMessage(execute_schedule);
            expect(ObservationScheduleService.scheduleData[0].state).toBe('ACTIVE');
        });

        it('should set the state to interrupted when cancel executing a schedule', function () {
            ObservationScheduleService.onSockJSMessage(get_schedule_blocks);
            expect(ObservationScheduleService.scheduleData.length).toBe(1);
            ObservationScheduleService.onSockJSMessage(cancel_execute_schedule);
            expect(ObservationScheduleService.scheduleCompletedData[0].state).toBe('INTERRUPTED');
        });

        it('should clone a completed sb', function () {
            ObservationScheduleService.onSockJSMessage(get_schedule_blocks_finished);
            expect(ObservationScheduleService.scheduleCompletedData.length).toBe(3);
            ObservationScheduleService.onSockJSMessage(clone_schedule);
            expect(ObservationScheduleService.scheduleDraftData[0].id_code).toBe('cloned');
        });

        it('should set the state of a draft to scheduled and move it to the schedule data array', function () {
            ObservationScheduleService.onSockJSMessage(get_schedule_blocks);
            expect(ObservationScheduleService.scheduleDraftData.length).toBe(1);
            ObservationScheduleService.onSockJSMessage(schedule_draft);
            expect(ObservationScheduleService.scheduleDraftData.length).toBe(0);
            timeout.flush();
            expect(ObservationScheduleService.scheduleData[1].id_code).toBe('1');
            expect(ObservationScheduleService.scheduleData[1].state).toBe('SCHEDULED');
        });

        it('should set the state of a schedule to draft and move it to the schedule draft data array', function () {
            ObservationScheduleService.onSockJSMessage(get_schedule_blocks);
            expect(ObservationScheduleService.scheduleDraftData.length).toBe(1);
            ObservationScheduleService.onSockJSMessage(schedule_to_draft);
            expect(ObservationScheduleService.scheduleData.length).toBe(0);
            expect(ObservationScheduleService.scheduleDraftData[1].id_code).toBe('2');
            expect(ObservationScheduleService.scheduleDraftData[1].state).toBe('DRAFT');
        });

        it('should set the state of a schedule to completed and move it to the schedule completed data array', function () {
            ObservationScheduleService.onSockJSMessage(get_schedule_blocks);
            expect(ObservationScheduleService.scheduleDraftData.length).toBe(1);
            ObservationScheduleService.onSockJSMessage(schedule_to_complete);
            expect(ObservationScheduleService.scheduleData.length).toBe(0);
            expect(ObservationScheduleService.scheduleCompletedData[0].id_code).toBe('2');
            expect(ObservationScheduleService.scheduleCompletedData[0].state).toBe('COMPLETED');
        });

        it('should do nothing with the result when verifying a schedule block', function () {
            ObservationScheduleService.onSockJSMessage(verify_schedule_block);
        });

        it('should delete a sb', function () {
            ObservationScheduleService.onSockJSMessage(get_schedule_blocks);
            expect(ObservationScheduleService.scheduleDraftData.length).toBe(1);
            ObservationScheduleService.onSockJSMessage(delete_schedule_block);
            expect(ObservationScheduleService.scheduleDraftData.length).toBe(0);
        });

        it('should update a draft schedule block', function () {
            ObservationScheduleService.onSockJSMessage(get_schedule_blocks);
            expect(ObservationScheduleService.scheduleDraftData.length).toBe(1);
            ObservationScheduleService.onSockJSMessage(update_draft_schedule_block);
            expect(expect(ObservationScheduleService.scheduleDraftData[0].description).toBe('new description'));
            expect(expect(ObservationScheduleService.scheduleDraftData[0].type).toBe('new type'));
            expect(expect(ObservationScheduleService.scheduleDraftData[0].desired_start_time).toBe('new dst'));
        });

        it('should push pool resources to the poolResources or poolResourcesFree array', function () {
            ObservationScheduleService.onSockJSMessage(list_pool_resources);
            expect(ObservationScheduleService.poolResources.length).toBe(1);
            expect(ObservationScheduleService.poolResourcesFree.length).toBe(2);
        });

        it('should push subarrays to the subarrays array', function () {
            ObservationScheduleService.onSockJSMessage(list_subarrays);
            expect(ObservationScheduleService.subarrays.length).toBe(2);
        });

        it('should assign resources to the subarray, removing it from the poolResourcesFree array and pusing to poolResources array', function () {
            ObservationScheduleService.onSockJSMessage(list_pool_resources);
            expect(ObservationScheduleService.poolResources.length).toBe(1);
            expect(ObservationScheduleService.poolResourcesFree.length).toBe(2);
            ObservationScheduleService.onSockJSMessage(assign_resources_to_subarray);
            expect(ObservationScheduleService.poolResourcesFree.length).toBe(0);
            expect(ObservationScheduleService.poolResources.length).toBe(3);
        });

        it('should unassign resources from the subarray, removing it from the poolResources array and pusing to poolResourcesFree array', function () {
            ObservationScheduleService.onSockJSMessage(list_pool_resources);
            expect(ObservationScheduleService.poolResources.length).toBe(1);
            expect(ObservationScheduleService.poolResourcesFree.length).toBe(2);
            ObservationScheduleService.onSockJSMessage(unassign_resources_from_subarray);
            expect(ObservationScheduleService.poolResources.length).toBe(0);
            expect(ObservationScheduleService.poolResourcesFree.length).toBe(3);
        });

        it('should set the subarray flag in use', function () {
            ObservationScheduleService.onSockJSMessage(list_subarrays);
            expect(ObservationScheduleService.subarrays.length).toBe(2);
            ObservationScheduleService.onSockJSMessage(set_subarray_in_use);
            expect(ObservationScheduleService.subarrays[0].state).toBe('in_use');
            ObservationScheduleService.onSockJSMessage(set_subarray_in_use_off);
            expect(ObservationScheduleService.subarrays[1].state).toBe('free');
        });

        it('should set the subarray maintenance flag on/off', function () {
            ObservationScheduleService.onSockJSMessage(list_subarrays);
            expect(ObservationScheduleService.subarrays.length).toBe(2);
            ObservationScheduleService.onSockJSMessage(set_subarray_in_maintenance);
            expect(ObservationScheduleService.subarrays[0].in_maintenance).toBeTruthy();
            ObservationScheduleService.onSockJSMessage(set_subarray_in_maintenance_off);
            expect(ObservationScheduleService.subarrays[0].in_maintenance).toBeFalsy();
        });

        it('should set the resource faulty', function () {
            ObservationScheduleService.onSockJSMessage(list_pool_resources);
            expect(ObservationScheduleService.poolResources.length).toBe(1);
            expect(ObservationScheduleService.poolResourcesFree.length).toBe(2);
            ObservationScheduleService.onSockJSMessage(set_resources_faulty_free);
            expect(ObservationScheduleService.poolResourcesFree[0].state).toBe('faulty');
            ObservationScheduleService.onSockJSMessage(set_resources_faulty);
            expect(ObservationScheduleService.poolResources[0].state).toBe('faulty');
        });

        it('should set the resource as in maintenance', function () {
            ObservationScheduleService.onSockJSMessage(list_pool_resources);
            expect(ObservationScheduleService.poolResources.length).toBe(1);
            expect(ObservationScheduleService.poolResourcesFree.length).toBe(2);
            ObservationScheduleService.onSockJSMessage(set_resources_in_maintenance_free);
            expect(ObservationScheduleService.poolResourcesFree[0].in_maintenance).toBeTruthy();
            ObservationScheduleService.onSockJSMessage(set_resources_in_maintenance);
            expect(ObservationScheduleService.poolResources[0].in_maintenance).toBeTruthy();
        });

        it('should get the scheduler mode by subarray', function () {
            ObservationScheduleService.onSockJSMessage(get_scheduler_mode_by_subarray);
            expect(ObservationScheduleService.schedulerModes['2'].stringValue).toBe('queue');
        });

        it('should set the scheduler mode by subarray', function () {
            ObservationScheduleService.onSockJSMessage(set_scheduler_mode_by_subarray);
            expect(ObservationScheduleService.schedulerModes['2'].stringValue).toBe('manual');
        });

        it('should do nothing with the result when freeing a subarray', function () {
            ObservationScheduleService.onSockJSMessage(free_subarray);
        });

        it('should authenticate the connection when a session id is received', function () {
            ObservationScheduleService.connectListener();
            expect(ObservationScheduleService.connection).toBeDefined();
            ObservationScheduleService.onSockJSMessage(session_id_msg);
            expect(ObservationScheduleService.connection.authorized).toBeTruthy();
            var warnSpy = spyOn(console, 'warn');
            var errorSpy = spyOn(console, 'error');
            ObservationScheduleService.onSockJSMessage(session_id_unknown_msg);
            expect(warnSpy).toHaveBeenCalled();
            ObservationScheduleService.onSockJSMessage(session_id_unknown_error_msg);
            expect(errorSpy).toHaveBeenCalled();
        });
    });
});
