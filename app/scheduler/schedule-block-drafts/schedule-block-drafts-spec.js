//todo redo these tests
//describe('Schedule Block Drafts Ctrl (SbDraftsCtrl)', function () {
//
//    beforeEach(module('katGui.scheduler'));
//
//    var scope, ctrl, state, ObsSchedService, q;
//
//    beforeEach(inject(function ($rootScope, $controller, _ObsSchedService_, _SCHEDULE_BLOCK_TYPES_, $q) {
//        q = $q;
//        scope = $rootScope.$new();
//        ObsSchedService = _ObsSchedService_;
//        ObsSchedService.connectListener = function () {
//        };
//        ObsSchedService.disconnectListener = function () {
//        };
//        ctrl = $controller('SbDraftsCtrl', {
//            $rootScope: $rootScope, $scope: scope, $state: state,
//            ObsSchedService: ObsSchedService
//        });
//
//        $rootScope.showSimpleDialog = function () {
//        };
//
//        scope.filteredDraftItems = [{
//            actual_end_time: null,
//            description: "test1",
//            desired_start_time: "2015-02-11 01:05:00.000Z",
//            id: 1,
//            id_code: "20150211-0001",
//            instruction_set: "ls -la",
//            owner: "katportal-tester",
//            priority: "LOW",
//            state: "DRAFT",
//            type: "OBSERVATION",
//            verification_state: "FAILED",
//            sub_nr: 1
//        }, {
//            actual_end_time: null,
//            description: "test2",
//            desired_start_time: "2015-02-11 01:05:00.000Z",
//            id: 2,
//            id_code: "20150211-0001",
//            instruction_set: "ls -la",
//            owner: "katportal-tester",
//            priority: "LOW",
//            state: "DRAFT",
//            type: "OBSERVATION",
//            verification_state: "FAILED"
//        }, {
//            actual_end_time: null,
//            description: "test3",
//            desired_start_time: "2015-02-11 01:05:00.000Z",
//            id: 3,
//            id_code: "20150211-0001",
//            instruction_set: "ls -la",
//            owner: "katportal-tester",
//            priority: "LOW",
//            state: "DRAFT",
//            type: "OBSERVATION",
//            verification_state: "FAILED"
//        }];
//    }));
//
//    it('should init the controller with some values and bind service values', inject(function () {
//        expect(ctrl.types.length).not.toEqual(0);
//        expect(ctrl.draftsOrderByFields.length).not.toEqual(0);
//        expect(ctrl.scheduleDraftData).not.toBeNull();
//    }));
//
//    it('should set the order by values correctly', inject(function () {
//        //order by description
//        ctrl.setDraftsOrderBy(ctrl.draftsOrderByFields[1].value);
//        expect(ctrl.draftsOrderBy).toBe(ctrl.draftsOrderByFields[1]);
//        //order by description again, reverse sort
//        ctrl.setDraftsOrderBy(ctrl.draftsOrderByFields[1].value);
//        expect(ctrl.draftsOrderBy.reverse).toBeTruthy();
//        //order by description again, clear sorting
//        ctrl.setDraftsOrderBy(ctrl.draftsOrderByFields[1].value);
//        expect(ctrl.draftsOrderBy).toBeNull();
//        ctrl.setDraftsOrderBy(null);
//        expect(ctrl.draftsOrderBy).toBe(undefined);
//    }));
//
//    it('should clear the reverse sorting properly', function () {
//        //order by name
//        ctrl.setDraftsOrderBy(ctrl.draftsOrderByFields[1].value);
//        expect(ctrl.draftsOrderBy).toBe(ctrl.draftsOrderByFields[1]);
//        //order by name again, reverse sort
//        ctrl.setDraftsOrderBy(ctrl.draftsOrderByFields[1].value);
//        expect(ctrl.draftsOrderBy.reverse).toBeTruthy();
//        //test for existing false reverse set - it should do nothing
//        ctrl.draftsOrderByFields[1].reverse = false;
//        ctrl.setDraftsOrderBy(ctrl.draftsOrderByFields[1].value);
//        expect(ctrl.draftsOrderBy.reverse).toBeFalsy();
//    });
//
//    it('should call the update function in the ObsSchedService when saving', function () {
//        var updateScheduleDraftSpy = spyOn(ObsSchedService, "updateScheduleDraft").and.returnValue(q.defer().promise);
//        scope.filteredDraftItems[0].isDirty = true;
//        ctrl.saveDraft(scope.filteredDraftItems[0]);
//        expect(updateScheduleDraftSpy).toHaveBeenCalledWith(scope.filteredDraftItems[0]);
//    });
//
//    it('should call update for all dirty drafts', function () {
//        var updateScheduleDraftSpy = spyOn(ObsSchedService, "updateScheduleDraft");
//        scope.filteredDraftItems[0].isDirty = false;
//        scope.filteredDraftItems[1].isDirty = true;
//        scope.filteredDraftItems[2].isDirty = true;
//        ctrl.scheduleDraftData = scope.filteredDraftItems;
//
//        ctrl.saveAllDirtyDrafts();
//        expect(updateScheduleDraftSpy).toHaveBeenCalledWith(ctrl.scheduleDraftData[1]);
//        expect(updateScheduleDraftSpy).toHaveBeenCalledWith(ctrl.scheduleDraftData[2]);
//    });
//
//    it('should call the getScheduleBlocks function in the ObsSchedService', function () {
//        var getScheduleBlocksSpy = spyOn(ObsSchedService, "getScheduleBlocks");
//        ctrl.refreshScheduleBlocks(scope.filteredDraftItems[0]);
//        expect(getScheduleBlocksSpy).toHaveBeenCalled();
//    });
//
//    it('should set the selected schedule draft', function () {
//        ctrl.setSelectedScheduleDraft(scope.filteredDraftItems[0]);
//        expect(ctrl.selectedScheduleDraft).toEqual(scope.filteredDraftItems[0]);
//        ctrl.setSelectedScheduleDraft(scope.filteredDraftItems[0]);
//        expect(ctrl.selectedScheduleDraft).toBeNull();
//        ctrl.setSelectedScheduleDraft(scope.filteredDraftItems[0]);
//        ctrl.setSelectedScheduleDraft(scope.filteredDraftItems[0], true);
//        expect(ctrl.selectedScheduleDraft).toEqual(scope.filteredDraftItems[0]);
//    });
//
//    it('should set the time for the current selected draft', function () {
//        //YYYY-MM-DD HH:mm:ss
//        ctrl.currentRowDatePickerIndex = 0;
//        ctrl.onTimeSet('2015-01-01 00:00:00');
//        expect(ctrl.showDatePicker).toBeFalsy();
//        expect(ctrl.currentRowDatePickerIndex).toEqual(-1);
//        expect(scope.filteredDraftItems[0].desired_start_time).toEqual(moment('2015-01-01 00:00:00').format('YYYY-MM-DD HH:mm:ss'));
//        expect(scope.filteredDraftItems[0].isDirty).toBeTruthy();
//    });
//
//    it('should validate an input date', function() {
//        ctrl.validateInputDate(scope.filteredDraftItems[0]);
//        expect(scope.filteredDraftItems[0].hasValidInput).toBeTruthy();
//        scope.filteredDraftItems[0].desired_start_time = 'invalid start time';
//        ctrl.validateInputDate(scope.filteredDraftItems[0]);
//        expect(scope.filteredDraftItems[0].hasValidInput).toBeFalsy();
//    });
//});
