describe('Schedule Block Drafts Ctrl (SbDraftsCtrl)', function () {

    beforeEach(module('katGui.scheduler'));

    var scope, ctrl, state, ObservationScheduleService, q;

    beforeEach(inject(function ($rootScope, $controller, _ObservationScheduleService_, _SCHEDULE_BLOCK_TYPES_, $q) {
        q = $q;
        scope = $rootScope.$new();
        ObservationScheduleService = _ObservationScheduleService_;
        ObservationScheduleService.connectListener = function () {
        };
        ObservationScheduleService.disconnectListener = function () {
        };
        ctrl = $controller('SbDraftsCtrl', {
            $rootScope: $rootScope, $scope: scope, $state: state,
            ObservationScheduleService: ObservationScheduleService
        });

        $rootScope.showSimpleDialog = function () {
        };

        scope.filteredDraftItems = [{
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
            id_code: "20150211-0001",
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
        }];
    }));

    it('should init the controller with some values and bind service values', inject(function () {
        expect(ctrl.types.length).not.toEqual(0);
        expect(ctrl.draftsOrderByFields.length).not.toEqual(0);
        expect(ctrl.scheduleDraftData).not.toBeNull();
    }));

    it('should set the order by values correctly', inject(function () {
        //order by description
        ctrl.setDraftsOrderBy(ctrl.draftsOrderByFields[1].value);
        expect(ctrl.draftsOrderBy).toBe(ctrl.draftsOrderByFields[1]);
        //order by description again, reverse sort
        ctrl.setDraftsOrderBy(ctrl.draftsOrderByFields[1].value);
        expect(ctrl.draftsOrderBy.reverse).toBeTruthy();
        //order by description again, clear sorting
        ctrl.setDraftsOrderBy(ctrl.draftsOrderByFields[1].value);
        expect(ctrl.draftsOrderBy).toBeNull();
        ctrl.setDraftsOrderBy(null);
        expect(ctrl.draftsOrderBy).toBe(undefined);
    }));

    it('should clear the reverse sorting properly', function () {
        //order by name
        ctrl.setDraftsOrderBy(ctrl.draftsOrderByFields[1].value);
        expect(ctrl.draftsOrderBy).toBe(ctrl.draftsOrderByFields[1]);
        //order by name again, reverse sort
        ctrl.setDraftsOrderBy(ctrl.draftsOrderByFields[1].value);
        expect(ctrl.draftsOrderBy.reverse).toBeTruthy();
        //test for existing false reverse set - it should do nothing
        ctrl.draftsOrderByFields[1].reverse = false;
        ctrl.setDraftsOrderBy(ctrl.draftsOrderByFields[1].value);
        expect(ctrl.draftsOrderBy.reverse).toBeFalsy();
    });

    it('should select the next and previous sb draft when up and down arrows are pressed', function () {

        var setSelectedScheduleDraftSpy = spyOn(ctrl, "setSelectedScheduleDraft");
        var closeDatePickerMenuSpy = spyOn(ctrl, "closeDatePickerMenu");
        var closeEditMenuSpy = spyOn(ctrl, "closeEditMenu");
        //down arrow
        ctrl.keydown(null, 40);
        expect(setSelectedScheduleDraftSpy).toHaveBeenCalledWith(scope.filteredDraftItems[0], true);
        ctrl.selectedScheduleDraft = scope.filteredDraftItems[0];
        ctrl.keydown(null, 40);
        expect(setSelectedScheduleDraftSpy).toHaveBeenCalledWith(scope.filteredDraftItems[1], true);
        ctrl.selectedScheduleDraft = scope.filteredDraftItems[1];
        ctrl.keydown(null, 40);
        expect(setSelectedScheduleDraftSpy).toHaveBeenCalledWith(scope.filteredDraftItems[2], true);
        ctrl.selectedScheduleDraft = scope.filteredDraftItems[2];
        //up arrow
        ctrl.keydown(null, 38);
        expect(setSelectedScheduleDraftSpy).toHaveBeenCalledWith(scope.filteredDraftItems[1], true);
        ctrl.selectedScheduleDraft = scope.filteredDraftItems[1];
        ctrl.keydown(null, 38);
        expect(setSelectedScheduleDraftSpy).toHaveBeenCalledWith(scope.filteredDraftItems[0], true);
        ctrl.selectedScheduleDraft = scope.filteredDraftItems[0];
        ctrl.keydown(null, 38);
        expect(setSelectedScheduleDraftSpy).toHaveBeenCalledWith(scope.filteredDraftItems[2], true);

        //escape
        ctrl.keydown(null, 27);
        expect(setSelectedScheduleDraftSpy).toHaveBeenCalledWith(null);
        expect(closeEditMenuSpy).toHaveBeenCalled();
        expect(closeDatePickerMenuSpy).toHaveBeenCalled();
    });

    it('should not do something unexpected when the filtered list is empty or when an invalid key is pressed', function () {
        var setSelectedScheduleDraftSpy = spyOn(ctrl, "setSelectedScheduleDraft");
        var closeDatePickerMenuSpy = spyOn(ctrl, "closeDatePickerMenu");
        var closeEditMenuSpy = spyOn(ctrl, "closeEditMenu");
        scope.filteredDraftItems = [];
        ctrl.keydown(null, 40);
        expect(setSelectedScheduleDraftSpy).not.toHaveBeenCalled();
        ctrl.keydown(null, 38);
        expect(setSelectedScheduleDraftSpy).not.toHaveBeenCalled();

        ctrl.keydown(null, -1);
        expect(setSelectedScheduleDraftSpy).not.toHaveBeenCalled();
        expect(closeEditMenuSpy).not.toHaveBeenCalled();
        expect(closeDatePickerMenuSpy).not.toHaveBeenCalled();
    });

    it('should call the update function in the ObservationScheduleService when saving', function () {
        var updateScheduleDraftSpy = spyOn(ObservationScheduleService, "updateScheduleDraft");
        scope.filteredDraftItems[0].isDirty = true;
        ctrl.saveDraft(scope.filteredDraftItems[0]);
        expect(updateScheduleDraftSpy).toHaveBeenCalledWith(scope.filteredDraftItems[0]);
    });

    it('should call update for all dirty drafts', function () {
        var updateScheduleDraftSpy = spyOn(ObservationScheduleService, "updateScheduleDraft");
        scope.filteredDraftItems[0].isDirty = false;
        scope.filteredDraftItems[1].isDirty = true;
        scope.filteredDraftItems[2].isDirty = true;
        ctrl.scheduleDraftData = scope.filteredDraftItems;

        ctrl.saveAllDirtyDrafts();
        expect(updateScheduleDraftSpy).toHaveBeenCalledWith(ctrl.scheduleDraftData[1]);
        expect(updateScheduleDraftSpy).toHaveBeenCalledWith(ctrl.scheduleDraftData[2]);
    });

    it('should verify the selected draft row and close the edit menu', function () {
        var verifyDraftRowSpy = spyOn(ctrl, "verifyDraftRow");
        ctrl.selectedScheduleDraft = null;
        ctrl.verifySelectedDraftRow();
        expect(verifyDraftRowSpy).not.toHaveBeenCalled();
        ctrl.selectedScheduleDraft = scope.filteredDraftItems[0];
        ctrl.verifySelectedDraftRow();
        expect(verifyDraftRowSpy).toHaveBeenCalledWith(ctrl.selectedScheduleDraft);
        expect(ctrl.showEditMenu).toBeFalsy();
    });

    it('should call the verifyScheduleBlock function in the ObservationScheduleService', function () {
        var verifyScheduleBlockSpy = spyOn(ObservationScheduleService, "verifyScheduleBlock").and.returnValue(q.defer().promise);
        ctrl.verifyDraftRow(scope.filteredDraftItems[0]);
        expect(verifyScheduleBlockSpy).toHaveBeenCalledWith(1, "20150211-0001");
        expect(ctrl.selectedScheduleDraft).toBeNull();
    });

    it('should call the remove on the selected draft row', function () {
        var removeDraftRowSpy = spyOn(ctrl, "removeDraftRow");
        ctrl.selectedScheduleDraft = null;
        ctrl.removeSelectedDraftRow();
        expect(removeDraftRowSpy).not.toHaveBeenCalled();
        ctrl.selectedScheduleDraft = scope.filteredDraftItems[0];
        ctrl.removeSelectedDraftRow();
        expect(removeDraftRowSpy).toHaveBeenCalledWith(ctrl.selectedScheduleDraft);
        expect(ctrl.showEditMenu).toBeFalsy();
    });

    it('should call the deleteScheduleDraft function in the ObservationScheduleService', function () {
        var deleteScheduleDraftSpy = spyOn(ObservationScheduleService, "deleteScheduleDraft").and.returnValue(q.defer().promise);
        ctrl.removeDraftRow(scope.filteredDraftItems[0]);
        expect(deleteScheduleDraftSpy).toHaveBeenCalledWith("20150211-0001");
        expect(ctrl.selectedScheduleDraft).toBeNull();
    });

    it('should call the getScheduleBlocks function in the ObservationScheduleService', function () {
        var getScheduleBlocksSpy = spyOn(ObservationScheduleService, "getScheduleBlocks");
        ctrl.refreshScheduleBlocks(scope.filteredDraftItems[0]);
        expect(getScheduleBlocksSpy).toHaveBeenCalled();
    });

    it('should set the selected schedule draft', function () {
        ctrl.setSelectedScheduleDraft(scope.filteredDraftItems[0]);
        expect(ctrl.selectedScheduleDraft).toEqual(scope.filteredDraftItems[0]);
        ctrl.setSelectedScheduleDraft(scope.filteredDraftItems[0]);
        expect(ctrl.selectedScheduleDraft).toBeNull();
        ctrl.setSelectedScheduleDraft(scope.filteredDraftItems[0]);
        ctrl.setSelectedScheduleDraft(scope.filteredDraftItems[0], true);
        expect(ctrl.selectedScheduleDraft).toEqual(scope.filteredDraftItems[0]);
    });

    it('should call the viewTaskLogForSBIdCode in the ObservationScheduleService', function () {
        var closeEditMenuSpy = spyOn(ctrl, "closeEditMenu");
        var viewTaskLogForSBIdCodeSpy = spyOn(ObservationScheduleService, "viewTaskLogForSBIdCode");
        ctrl.selectedScheduleDraft = scope.filteredDraftItems[0];
        ctrl.viewSBTasklog();
        expect(closeEditMenuSpy).toHaveBeenCalled();
        expect(viewTaskLogForSBIdCodeSpy).toHaveBeenCalled();
    });

    it('should set the time for the current selected draft', function () {
        //YYYY-MM-DD HH:mm:ss
        ctrl.currentRowDatePickerIndex = 0;
        ctrl.onTimeSet('2015-01-01 00:00:00');
        expect(ctrl.showDatePicker).toBeFalsy();
        expect(ctrl.currentRowDatePickerIndex).toEqual(-1);
        expect(scope.filteredDraftItems[0].desired_start_time).toEqual(moment('2015-01-01 00:00:00').format('YYYY-MM-DD HH:mm:ss'));
        expect(scope.filteredDraftItems[0].isDirty).toBeTruthy();
    });

    it('should validate an input date', function() {
        ctrl.validateInputDate(scope.filteredDraftItems[0]);
        expect(scope.filteredDraftItems[0].hasValidInput).toBeTruthy();
        scope.filteredDraftItems[0].desired_start_time = 'invalid start time';
        ctrl.validateInputDate(scope.filteredDraftItems[0]);
        expect(scope.filteredDraftItems[0].hasValidInput).toBeFalsy();
    });

    it('should unbind watchers', inject(function () {
        var unbindShortcutsSpy = spyOn(ctrl, "unbindShortcuts");
        scope.$emit("$destroy");
        scope.$digest();
        expect(unbindShortcutsSpy).toHaveBeenCalled();
    }));
});
