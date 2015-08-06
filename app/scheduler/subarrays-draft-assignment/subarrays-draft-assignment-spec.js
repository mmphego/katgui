describe('SubArraysCtrl - draft assignments', function () {

    beforeEach(module('katGui.scheduler'));
    beforeEach(module('ui.router'));
    beforeEach(module('ngMaterial'));

    var scope, ctrl, state, ObsSchedService, q, timeout;

    beforeEach(inject(function ($rootScope, $controller, _ObsSchedService_, _SCHEDULE_BLOCK_TYPES_, $q, $timeout, $state) {
        q = $q;
        timeout = $timeout;
        scope = $rootScope.$new();
        state = $state;
        ObsSchedService = _ObsSchedService_;
        ObsSchedService.connectListener = function () {
        };
        ObsSchedService.disconnectListener = function () {
        };
        ctrl = $controller('SubArraysCtrl', {
            $rootScope: $rootScope, $scope: scope, $state: state,
            ObsSchedService: ObsSchedService
        });

        $rootScope.displayPromiseResult = function () {
        };

        ObsSchedService.scheduleDraftData = [{
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
});
