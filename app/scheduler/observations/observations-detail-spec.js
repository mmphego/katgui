describe('SubArrayObservationsDetail', function () {

    beforeEach(module('katGui.scheduler'));
    beforeEach(module('ui.router'));

    var scope, ctrl, ObservationScheduleService, q, timeout;

    beforeEach(inject(function ($rootScope, $controller, _ObservationScheduleService_, _SCHEDULE_BLOCK_TYPES_, $q, $timeout) {
        q = $q;
        timeout = $timeout;
        scope = $rootScope.$new();
        ObservationScheduleService = _ObservationScheduleService_;
        ObservationScheduleService.connectListener = function () {
        };
        ObservationScheduleService.disconnectListener = function () {
        };
        ctrl = $controller('SubArrayObservationsDetail', {
            $rootScope: $rootScope, $scope: scope,
            ObservationScheduleService: ObservationScheduleService
        });

        $rootScope.displayPromiseResult = function () {
        };

        ctrl.subarray_id = 1;

        ObservationScheduleService.scheduleData = [{
            actual_end_time: null,
            description: "test1",
            desired_start_time: "2015-02-11 01:05:00.000Z",
            id: 1,
            id_code: "20150211-0001",
            instruction_set: "ls -la",
            owner: "katportal-tester",
            priority: "LOW",
            state: "SCHEDULED",
            type: "OBSERVATION",
            verification_state: "FAILED",
            sub_nr: 1
        }, {
            actual_end_time: null,
            description: "test2",
            desired_start_time: "2015-02-11 01:05:00.000Z",
            id: 2,
            id_code: "20150211-0002",
            instruction_set: "ls -la",
            owner: "katportal-tester",
            priority: "LOW",
            state: "SCHEDULED",
            type: "OBSERVATION",
            verification_state: "FAILED"
        }, {
            actual_end_time: null,
            description: "test3",
            desired_start_time: "2015-02-11 01:05:00.000Z",
            id: 3,
            id_code: "20150211-0001",
            instruction_set: "ls -la",
            owner: "katportal-tester",
            priority: "LOW",
            state: "SCHEDULED",
            type: "OBSERVATION",
            verification_state: "FAILED"
        }, {
            actual_end_time: null,
            description: "test4",
            desired_start_time: "2015-02-11 01:05:00.000Z",
            id: 4,
            id_code: "20150211-0001",
            instruction_set: "ls -la",
            owner: "katportal-tester",
            priority: "LOW",
            state: "SCHEDULED",
            type: "OBSERVATION",
            verification_state: "FAILED"
        }];

        ctrl.currentScheduleData = ObservationScheduleService.scheduleData;
    }));

    it('should init the controller with some values and bind service values', inject(function () {
        expect(ctrl.scheduleData).toBeDefined();
        expect(ctrl.scheduleCompletedData).toBeDefined();
        expect(ctrl.allocations).toBeDefined();
        expect(ctrl.poolResources).toBeDefined();
        expect(ctrl.schedulerModes).toBeDefined();
    }));

    it('should list the schedule blocks and resources and scheduler mode', function () {
        ObservationScheduleService.schedulerModes['1'] = {stringValue: 'queue'};
        var deferred1 = q.defer();
        var deferred2 = q.defer();
        var deferred3 = q.defer();
        var deferred4 = q.defer();
        var deferred5 = q.defer();
        var getScheduleBlocksSpy = spyOn(ObservationScheduleService, "getScheduleBlocks").and.returnValue(deferred1.promise);
        var getScheduleBlocksFinishedSpy = spyOn(ObservationScheduleService, "getScheduleBlocksFinished").and.returnValue(deferred2.promise);
        var listPoolResourcesSpy = spyOn(ObservationScheduleService, "listPoolResources").and.returnValue(deferred3.promise);
        var listAllocationsForSubarraySpy = spyOn(ObservationScheduleService, "listAllocationsForSubarray").and.returnValue(deferred4.promise);
        var getSchedulerModeForSubarraySpy = spyOn(ObservationScheduleService, "getSchedulerModeForSubarray").and.returnValue(deferred5.promise);
        ctrl.refreshScheduleBlocks();
        expect(getScheduleBlocksSpy).toHaveBeenCalled();
        deferred1.resolve();
        scope.$digest();
        expect(getScheduleBlocksFinishedSpy).toHaveBeenCalled();
        deferred2.resolve();
        scope.$digest();
        expect(listPoolResourcesSpy).toHaveBeenCalled();
        deferred3.resolve();
        scope.$digest();
        expect(listAllocationsForSubarraySpy).toHaveBeenCalledWith(1);
        deferred4.resolve();
        scope.$digest();
        expect(getSchedulerModeForSubarraySpy).toHaveBeenCalledWith(1);
        deferred5.resolve();
        scope.$digest();
    });

    it('should call the service function to execute the schedule', function () {
        var deferred = q.defer();
        var executeScheduleSpy = spyOn(ObservationScheduleService, "executeSchedule").and.returnValue(deferred.promise);
        var displayPromiseSpy = spyOn(scope.$root, "displayPromiseResult");
        ctrl.executeSchedule(ObservationScheduleService.scheduleData[0]);
        expect(executeScheduleSpy).toHaveBeenCalledWith(1, ObservationScheduleService.scheduleData[0].id_code);
        deferred.resolve();
        scope.$digest();
        expect(displayPromiseSpy).toHaveBeenCalled();
    });

    it('should call the service function to stop executing the schedule', function () {
        var deferred = q.defer();
        var cancelExecuteScheduleSpy = spyOn(ObservationScheduleService, "cancelExecuteSchedule").and.returnValue(deferred.promise);
        var displayPromiseSpy = spyOn(scope.$root, "displayPromiseResult");
        ctrl.stopExecuteSchedule(ObservationScheduleService.scheduleData[0]);
        expect(cancelExecuteScheduleSpy).toHaveBeenCalledWith(1, ObservationScheduleService.scheduleData[0].id_code);
        deferred.resolve();
        scope.$digest();
        expect(displayPromiseSpy).toHaveBeenCalled();
    });

    it('should call the service function to clone the schedule', function () {
        var deferred = q.defer();
        var cloneScheduleSpy = spyOn(ObservationScheduleService, "cloneSchedule").and.returnValue(deferred.promise);
        var displayPromiseSpy = spyOn(scope.$root, "displayPromiseResult");
        ctrl.cloneSchedule(ObservationScheduleService.scheduleData[0]);
        expect(cloneScheduleSpy).toHaveBeenCalledWith(ObservationScheduleService.scheduleData[0].id_code);
        deferred.resolve();
        scope.$digest();
        expect(displayPromiseSpy).toHaveBeenCalled();
    });

    it('should call the service function to move the schedule to finished', function () {
        var deferred = q.defer();
        var scheduleToCompleteSpy = spyOn(ObservationScheduleService, "scheduleToComplete").and.returnValue(deferred.promise);
        var displayPromiseSpy = spyOn(scope.$root, "displayPromiseResult");
        ctrl.moveScheduleRowToFinished(ObservationScheduleService.scheduleData[0]);
        expect(scheduleToCompleteSpy).toHaveBeenCalledWith(1, ObservationScheduleService.scheduleData[0].id_code);
        deferred.resolve();
        scope.$digest();
        expect(displayPromiseSpy).toHaveBeenCalled();
        expect(ctrl.selectedSchedule).toBeNull();
    });

    it('should call the service function to move the schedule to draft', function () {
        var deferred = q.defer();
        var scheduleToDraftSpy = spyOn(ObservationScheduleService, "scheduleToDraft").and.returnValue(deferred.promise);
        var displayPromiseSpy = spyOn(scope.$root, "displayPromiseResult");
        ctrl.moveScheduleRowToDraft(ObservationScheduleService.scheduleData[0]);
        expect(scheduleToDraftSpy).toHaveBeenCalledWith(1, ObservationScheduleService.scheduleData[0].id_code);
        deferred.resolve();
        scope.$digest();
        expect(displayPromiseSpy).toHaveBeenCalled();
        expect(ctrl.selectedSchedule).toBeNull();
    });

    it('should call the service function to mark the resource as faulty', function () {
        var deferred = q.defer();
        var markResourceFaultySpy = spyOn(ObservationScheduleService, "markResourceFaulty").and.returnValue(deferred.promise);
        var displayPromiseSpy = spyOn(scope.$root, "displayPromiseResult");
        ctrl.markResourceFaulty({name: 'anc', state: 'faulty'});
        expect(markResourceFaultySpy).toHaveBeenCalledWith(1, 'anc', 0);
        ctrl.markResourceFaulty({name: 'anc', state: 'ok'});
        expect(markResourceFaultySpy).toHaveBeenCalledWith(1, 'anc', 1);
        deferred.resolve();
        scope.$digest();
        expect(displayPromiseSpy).toHaveBeenCalled();
    });

    it('should call the service function when the scheduler mode changed', function () {
        var deferred = q.defer();
        var setSchedulerModeForSubarraySpy = spyOn(ObservationScheduleService, "setSchedulerModeForSubarray").and.returnValue(deferred.promise);
        var displayPromiseSpy = spyOn(scope.$root, "displayPromiseResult");
        ctrl.selectedMode = 'test mode';
        ctrl.schedulerModeChanged();
        expect(setSchedulerModeForSubarraySpy).toHaveBeenCalledWith(1, 'test mode');
        deferred.resolve();
        scope.$digest();
        expect(displayPromiseSpy).toHaveBeenCalled();
    });

    it('should set the selected schedule', function () {
        ctrl.setSelectedSchedule(ctrl.currentScheduleData[0]);
        expect(ctrl.selectedSchedule).toEqual(ctrl.currentScheduleData[0]);
        ctrl.setSelectedSchedule(ctrl.currentScheduleData[0]);
        expect(ctrl.selectedSchedule).toBeNull();
        ctrl.setSelectedSchedule(ctrl.currentScheduleData[0]);
        ctrl.setSelectedSchedule(ctrl.currentScheduleData[0], true);
        expect(ctrl.selectedSchedule).toEqual(ctrl.currentScheduleData[0]);
    });

    it('should set the order by values correctly', inject(function () {
        //order by description
        ctrl.setCompletedOrderBy(ctrl.completedOrderByFields[1].value);
        expect(ctrl.completedOrderBy).toBe(ctrl.completedOrderByFields[1]);
        //order by description again, reverse sort
        ctrl.setCompletedOrderBy(ctrl.completedOrderByFields[1].value);
        expect(ctrl.completedOrderBy.reverse).toBeTruthy();
        //order by description again, clear sorting
        ctrl.setCompletedOrderBy(ctrl.completedOrderByFields[1].value);
        expect(ctrl.completedOrderBy).toBeNull();
        ctrl.setCompletedOrderBy(null);
        expect(ctrl.completedOrderBy).toBe(undefined);
    }));

    it('should clear the reverse sorting properly', function () {
        //order by name
        ctrl.setCompletedOrderBy(ctrl.completedOrderByFields[1].value);
        expect(ctrl.completedOrderBy).toBe(ctrl.completedOrderByFields[1]);
        //order by name again, reverse sort
        ctrl.setCompletedOrderBy(ctrl.completedOrderByFields[1].value);
        expect(ctrl.completedOrderBy.reverse).toBeTruthy();
        //test for existing false reverse set - it should do nothing
        ctrl.completedOrderByFields[1].reverse = false;
        ctrl.setCompletedOrderBy(ctrl.completedOrderByFields[1].value);
        expect(ctrl.completedOrderBy.reverse).toBeFalsy();
    });
});
