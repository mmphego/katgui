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
            expect(ObservationScheduleService.deferredMap.undefined).toBeDefined({});
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

        it('should create a command promise and send obs sched command when getScheduleBlock is called', function () {
            var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
            var sendObsSchedCommandSpy = spyOn(ObservationScheduleService, 'sendObsSchedCommand').and.callThrough();
            ObservationScheduleService.getScheduleBlock('test_code');
            expect(sendObsSchedCommandSpy).toHaveBeenCalledWith('get_schedule_block', ['test_code']);
            expect(ObservationScheduleService.deferredMap['test_id']).toBeDefined({});
            expect(sendSpy).toHaveBeenCalledWith('{"jsonrpc":"2.0","method":"get_schedule_block","id":"test_id","params":["test_code"]}');
        });

        it('should create a command promise and send obs sched command when createScheduleBlock is called', function () {
            var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
            var sendObsSchedCommandSpy = spyOn(ObservationScheduleService, 'sendObsSchedCommand').and.callThrough();
            ObservationScheduleService.createScheduleBlock();
            expect(sendObsSchedCommandSpy).toHaveBeenCalledWith('create_schedule_block');
            expect(ObservationScheduleService.deferredMap['test_id']).toBeDefined({});
            expect(sendSpy).toHaveBeenCalledWith('{"jsonrpc":"2.0","method":"create_schedule_block","id":"test_id"}');
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

        it('should create a command promise and send obs sched command when listPoolResourcesForSubarray is called', function () {
            var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
            var sendObsSchedCommandSpy = spyOn(ObservationScheduleService, 'sendObsSchedCommand').and.callThrough();
            ObservationScheduleService.listPoolResourcesForSubarray('1');
            expect(sendObsSchedCommandSpy).toHaveBeenCalledWith('list_pool_resources_for_subarray', ['1']);
            expect(ObservationScheduleService.deferredMap['test_id']).toBeDefined({});
            expect(sendSpy).toHaveBeenCalledWith('{"jsonrpc":"2.0","method":"list_pool_resources_for_subarray","id":"test_id","params":["1"]}');
        });

        it('should create a command promise and send obs sched command when listPoolResourcesForSubarray is called for free resources', function () {
            ObservationScheduleService['resourcePoolDataFree'] = ['m011'];
            var sendSpy = spyOn(ObservationScheduleService.connection, 'send');
            var sendObsSchedCommandSpy = spyOn(ObservationScheduleService, 'sendObsSchedCommand').and.callThrough();
            ObservationScheduleService.listPoolResourcesForSubarray('free');
            expect(sendObsSchedCommandSpy).toHaveBeenCalledWith('list_pool_resources_for_subarray', ['free']);
            expect(ObservationScheduleService.deferredMap['test_id']).toBeDefined({});
            expect(sendSpy).toHaveBeenCalledWith('{"jsonrpc":"2.0","method":"list_pool_resources_for_subarray","id":"test_id","params":["free"]}');
            expect(ObservationScheduleService['resourcePoolDataFree'].length).toBe(0);
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
});
