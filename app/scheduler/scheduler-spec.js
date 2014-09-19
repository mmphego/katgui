describe('SchedulerCtrl', function () {

//    beforeEach(module('ui.bootstrap.datetimepicker'));
    beforeEach(module('katGui.scheduler'));

    var scope, ctrl, document;

    beforeEach(inject(function ($rootScope, $controller, $document) {
        scope = $rootScope.$new();
        ctrl = $controller('SchedulerCtrl', {$scope: scope});
        document = $document;
    }));

    it('should add a draft schedule row', inject(function () {

        scope.addDraftSchedule();
        scope.$digest();
        expect(scope.scheduleDraftData.length).toBe(1);
    }));

    it('should remove a draft schedule row', inject(function () {

        scope.addDraftSchedule();
        scope.$digest();
        expect(scope.scheduleDraftData.length).toBe(1);
        scope.removeDraftRow(0);
        scope.$digest();
        expect(scope.scheduleDraftData.length).toBe(0);
    }));

    it('should move a draft row schedule to observation schedule', inject(function () {

        scope.addDraftSchedule();
        scope.$digest();
        expect(scope.scheduleDraftData.length).toBe(1);
        expect(scope.scheduleData.length).toBe(0);
        scope.moveDraftRowToSchedule(0);
        scope.$digest();
        expect(scope.scheduleDraftData.length).toBe(0);
        expect(scope.scheduleData.length).toBe(1);
    }));

    it('should move selected draft schedules to observation schedule', inject(function () {

        scope.addDraftSchedule();
        scope.addDraftSchedule();
        scope.addDraftSchedule();
        scope.addDraftSchedule();
        scope.addDraftSchedule();
        scope.$digest();
        expect(scope.scheduleDraftData.length).toBe(5);
        expect(scope.scheduleData.length).toBe(0);

        scope.gridOptionsDrafts.selectedItems.push(scope.scheduleDraftData[0]);
        scope.gridOptionsDrafts.selectedItems.push(scope.scheduleDraftData[1]);
        scope.gridOptionsDrafts.selectedItems.push(scope.scheduleDraftData[2]);

        expect(scope.gridOptionsDrafts.selectedItems.length).toBe(3);

        scope.moveDraftsToSchedule();
        scope.$digest();
        expect(scope.scheduleDraftData.length).toBe(2);
        expect(scope.scheduleData.length).toBe(3);
        expect(scope.gridOptionsDrafts.selectedItems.length).toBe(0);
    }));

    it('should move selected observation schedules to draft schedule', inject(function () {

        scope.addDraftSchedule();
        scope.addDraftSchedule();
        scope.addDraftSchedule();
        scope.addDraftSchedule();
        scope.addDraftSchedule();
        scope.$digest();
        expect(scope.scheduleDraftData.length).toBe(5);
        expect(scope.scheduleData.length).toBe(0);

        scope.gridOptionsDrafts.selectedItems.push(scope.scheduleDraftData[0]);
        scope.gridOptionsDrafts.selectedItems.push(scope.scheduleDraftData[1]);
        scope.gridOptionsDrafts.selectedItems.push(scope.scheduleDraftData[2]);
        scope.$digest();

        expect(scope.gridOptionsDrafts.selectedItems.length).toBe(3);

        scope.moveDraftsToSchedule();
        scope.$digest();
        expect(scope.scheduleDraftData.length).toBe(2);
        expect(scope.scheduleData.length).toBe(3);
        expect(scope.gridOptionsDrafts.selectedItems.length).toBe(0);

        scope.gridOptionsSchedules.selectedItems.push(scope.scheduleData[0]);
        scope.gridOptionsSchedules.selectedItems.push(scope.scheduleData[1]);
        scope.gridOptionsSchedules.selectedItems.push(scope.scheduleData[2]);

        scope.moveSchedulesToDraft();

        expect(scope.scheduleDraftData.length).toBe(5);
        expect(scope.scheduleData.length).toBe(0);
        expect(scope.gridOptionsSchedules.selectedItems.length).toBe(0);
    }));

    it("should open datetimepicker on click", function () {

        scope.addDraftSchedule();
        scope.$digest();
        expect(scope.scheduleDraftData.length).toBe(1);

        var mockEvent = { currentTarget: { getBoundingClientRect: function () {
           return { left: 0, top: 0};
        }}};

        scope.openDatePicker(0, mockEvent);
        expect(scope.showDatePicker).toBeTruthy();
    });

    it("should close datetimepicker on click for existing row", function () {

        scope.addDraftSchedule();
        scope.$digest();
        expect(scope.scheduleDraftData.length).toBe(1);

        var mockEvent = { currentTarget: { getBoundingClientRect: function () {
            return { left: 0, top: 0};
        }}};

        scope.currentRowDatePickerIndex = 0;
        scope.openDatePicker(0, mockEvent);

        expect(scope.showDatePicker).toBeFalsy();
    });

    it("should close datetimepicker on time set", function () {

        scope.addDraftSchedule();
        scope.$digest();
        expect(scope.scheduleDraftData.length).toBe(1);
        var mockEvent = { currentTarget: { getBoundingClientRect: function () {
            return { left: 0, top: 0};
        }}};
        scope.openDatePicker(0, mockEvent);
        expect(scope.showDatePicker).toBeTruthy();
        scope.onTimeSet();
        expect(scope.showDatePicker).toBeFalsy();
    });
});