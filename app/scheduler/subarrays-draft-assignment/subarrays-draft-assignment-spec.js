describe('SubArraysCtrl - draft assignments', function () {

    beforeEach(module('katGui.scheduler'));
    beforeEach(module('ui.router'));

    var scope, ctrl, state, ObservationScheduleService, q, timeout;

    beforeEach(inject(function ($rootScope, $controller, _ObservationScheduleService_, _SCHEDULE_BLOCK_TYPES_, $q, $timeout, $state) {
        q = $q;
        timeout = $timeout;
        scope = $rootScope.$new();
        state = $state;
        ObservationScheduleService = _ObservationScheduleService_;
        ObservationScheduleService.connectListener = function () {
        };
        ObservationScheduleService.disconnectListener = function () {
        };
        ctrl = $controller('SubArraysCtrl', {
            $rootScope: $rootScope, $scope: scope, $state: state,
            ObservationScheduleService: ObservationScheduleService
        });

        $rootScope.displayPromiseResult = function () {
        };

        ObservationScheduleService.scheduleDraftData = [{
            actual_end_time: null,
            description: "test1",
            desired_start_time: "2015-02-11 01:05:00.000Z",
            id: 1,
            id_code: "20150211-0001",
            instruction_set: "ls -la",
            owner: "katportal-tester",
            priority: "LOW",
            state: "DRAFT",
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
            state: "DRAFT",
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
            state: "DRAFT",
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
            state: "DRAFT",
            type: "OBSERVATION",
            verification_state: "FAILED"
        }];
    }));

    it('should init the controller with some values and bind service values', inject(function () {
        expect(ctrl.scheduleDraftData).toBeDefined();
        expect(ctrl.subarrays).toBeDefined();
    }));

    it('should list the schedule blocks and subarrays', function() {
        var deferred = q.defer();
        var listSubarraysSpy = spyOn(ObservationScheduleService, "listSubarrays").andReturn(deferred.promise);
        var getScheduleBlocksSpy = spyOn(ObservationScheduleService, "getScheduleBlocks");
        ctrl.refreshScheduleBlocks();
        expect(listSubarraysSpy).toHaveBeenCalled();
        deferred.resolve();
        scope.$digest();
        expect(getScheduleBlocksSpy).toHaveBeenCalled();
    });

    it('should call the service function to assign selected schedule blocks', function() {
        var deferred = q.defer();
        var assignScheduleBlockSpy = spyOn(ObservationScheduleService, "assignScheduleBlock").andReturn(deferred.promise);
        var displayPromiseResultSpy = spyOn(scope.$root, "displayPromiseResult");
        ObservationScheduleService.scheduleDraftData[1].selected = true;
        ctrl.assignSelectedScheduleBlocks({id: 1});
        timeout.flush();
        expect(assignScheduleBlockSpy).toHaveBeenCalledWith(1, '20150211-0002');
        deferred.resolve();
        scope.$digest();
        expect(displayPromiseResultSpy).toHaveBeenCalled();
    });

    it('should call the service function to unassign a schedule block', function() {
        var deferred = q.defer();
        var unassignScheduleBlockSpy = spyOn(ObservationScheduleService, "unassignScheduleBlock").andReturn(deferred.promise);
        var displayPromiseResultSpy = spyOn(scope.$root, "displayPromiseResult");
        ctrl.freeScheduleBlock({id: 1}, {id_code: '20150211-0002'});
        expect(unassignScheduleBlockSpy).toHaveBeenCalled();
        deferred.resolve();
        scope.$digest();
        expect(displayPromiseResultSpy).toHaveBeenCalled();
    });

    it('should navigate to scheduler details', function() {
        var stateSpy = spyOn(state, 'go');
        ctrl.navigateToSchedulerDetails(1);
        expect(stateSpy).toHaveBeenCalledWith('scheduler.observations.detail', {subarray_id: 1});
    });
});
