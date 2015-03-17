describe('SchedulerHomeCtrl', function () {

    beforeEach(module('katGui.scheduler'));
    beforeEach(module('ui.router'));
    beforeEach(module('ngStorage'));

    var scope, ctrl, state, httpBackend, ObservationScheduleService, MonitorService, ConfigService, connectListenerSpy, subscribeSpy;

    beforeEach(inject(function ($rootScope, $controller, $state, _ObservationScheduleService_, _ConfigService_, _MonitorService_, $injector) {
        scope = $rootScope.$new();
        state = $state;
        httpBackend = $injector.get('$httpBackend');
        ObservationScheduleService = _ObservationScheduleService_;
        MonitorService = _MonitorService_;
        ConfigService = _ConfigService_;
        ObservationScheduleService.connectListener = function () {
            console.log('spying');
        };
        ObservationScheduleService.disconnectListener = function() {
        };
        MonitorService.subscribe = function () {
        };
        connectListenerSpy = spyOn(ObservationScheduleService, "connectListener");

        subscribeSpy = spyOn(MonitorService, "subscribe");
        ctrl = $controller('SchedulerHomeCtrl', {
            $rootScope: $rootScope, $scope: scope, $state: state,
            ObservationScheduleService: ObservationScheduleService, ConfigService: ConfigService, MonitorService: MonitorService
        });
    }));

    it('should load the KATObsPortalUrl for the task log view', function () {
        expect(connectListenerSpy).toHaveBeenCalled();
        expect(subscribeSpy).toHaveBeenCalled();
        httpBackend.expect('GET', 'http://localhost:9876:8840/system-config/sections/katportal/katobsportal').respond('urlfortests.com');
        scope.$digest();
    });

    it('should navigate to a new state', function () {
        var stateSpy = spyOn(state, "go");
        ctrl.stateGo('scheduler.drafts');
        expect(stateSpy).toHaveBeenCalled();
    });

    it('should unbind watchers', inject(function () {
        //the get happens because we call $digest
        httpBackend.expect('GET', 'http://localhost:9876:8840/system-config/sections/katportal/katobsportal').respond('urlfortests.com');
        var unbindStateChangeStartSpy = spyOn(ctrl, "unbindStateChangeStart");
        var disconnectListenerSpy = spyOn(ObservationScheduleService, "disconnectListener");
        scope.$emit("$destroy");
        scope.$digest();
        expect(unbindStateChangeStartSpy).toHaveBeenCalled();
        expect(disconnectListenerSpy).toHaveBeenCalled();
    }));

    it('should hide the parent display when navigating to a child state', function () {
        //the get happens because we call $digest
        httpBackend.expect('GET', 'http://localhost:9876:8840/system-config/sections/katportal/katobsportal').respond('urlfortests.com');
        scope.$root.$broadcast('$stateChangeStart', {name: 'scheduler.drafts'});
        scope.$root.$digest();
        expect(ctrl.childStateShowing).toBeTruthy();
        scope.$root.$broadcast('$stateChangeStart', {name: 'home'});
        scope.$root.$digest();
        expect(ctrl.childStateShowing).toBeFalsy();
    });

//    it('should add a draft schedule row', inject(function () {
//
//        scope.addDraftSchedule();
//        scope.$digest();
//        expect(scope.scheduleDraftData.length).toBe(1);
//    }));
//
//    it('should remove a draft schedule row', inject(function () {
//
//        scope.addDraftSchedule();
//        scope.$digest();
//        expect(scope.scheduleDraftData.length).toBe(1);
//        scope.removeDraftRow(0);
//        scope.$digest();
//        expect(scope.scheduleDraftData.length).toBe(0);
//    }));
//
//    it('should move a draft row schedule to observation schedule', inject(function () {
//
//        scope.addDraftSchedule();
//        scope.$digest();
//        expect(scope.scheduleDraftData.length).toBe(1);
//        expect(scope.scheduleData.length).toBe(0);
//        scope.moveDraftRowToSchedule(0);
//        scope.$digest();
//        expect(scope.scheduleDraftData.length).toBe(0);
//        expect(scope.scheduleData.length).toBe(1);
//    }));
//
//    it('should move selected draft schedules to observation schedule', inject(function () {
//
//        scope.addDraftSchedule();
//        scope.addDraftSchedule();
//        scope.addDraftSchedule();
//        scope.addDraftSchedule();
//        scope.addDraftSchedule();
//        scope.$digest();
//        expect(scope.scheduleDraftData.length).toBe(5);
//        expect(scope.scheduleData.length).toBe(0);
//
//        scope.gridOptionsDrafts.selectedItems.push(scope.scheduleDraftData[0]);
//        scope.gridOptionsDrafts.selectedItems.push(scope.scheduleDraftData[1]);
//        scope.gridOptionsDrafts.selectedItems.push(scope.scheduleDraftData[2]);
//
//        expect(scope.gridOptionsDrafts.selectedItems.length).toBe(3);
//
//        scope.moveDraftsToSchedule();
//        scope.$digest();
//        expect(scope.scheduleDraftData.length).toBe(2);
//        expect(scope.scheduleData.length).toBe(3);
//        expect(scope.gridOptionsDrafts.selectedItems.length).toBe(0);
//    }));
//
//    it('should move selected observation schedules to draft schedule', inject(function () {
//
//        scope.addDraftSchedule();
//        scope.addDraftSchedule();
//        scope.addDraftSchedule();
//        scope.addDraftSchedule();
//        scope.addDraftSchedule();
//        scope.$digest();
//        expect(scope.scheduleDraftData.length).toBe(5);
//        expect(scope.scheduleData.length).toBe(0);
//
//        scope.gridOptionsDrafts.selectedItems.push(scope.scheduleDraftData[0]);
//        scope.gridOptionsDrafts.selectedItems.push(scope.scheduleDraftData[1]);
//        scope.gridOptionsDrafts.selectedItems.push(scope.scheduleDraftData[2]);
//        scope.$digest();
//
//        expect(scope.gridOptionsDrafts.selectedItems.length).toBe(3);
//
//        scope.moveDraftsToSchedule();
//        scope.$digest();
//        expect(scope.scheduleDraftData.length).toBe(2);
//        expect(scope.scheduleData.length).toBe(3);
//        expect(scope.gridOptionsDrafts.selectedItems.length).toBe(0);
//
//        scope.gridOptionsSchedules.selectedItems.push(scope.scheduleData[0]);
//        scope.gridOptionsSchedules.selectedItems.push(scope.scheduleData[1]);
//        scope.gridOptionsSchedules.selectedItems.push(scope.scheduleData[2]);
//
//        scope.moveSchedulesToDraft();
//
//        expect(scope.scheduleDraftData.length).toBe(5);
//        expect(scope.scheduleData.length).toBe(0);
//        expect(scope.gridOptionsSchedules.selectedItems.length).toBe(0);
//    }));
//
//    it("should open datetimepicker on click", function () {
//
//        scope.addDraftSchedule();
//        scope.$digest();
//        expect(scope.scheduleDraftData.length).toBe(1);
//
//        var mockEvent = { currentTarget: { getBoundingClientRect: function () {
//           return { left: 0, top: 0};
//        }}};
//
//        scope.openDatePicker(0, mockEvent);
//        expect(scope.showDatePicker).toBeTruthy();
//    });
//
//    it("should close datetimepicker on click for existing row", function () {
//
//        scope.addDraftSchedule();
//        scope.$digest();
//        expect(scope.scheduleDraftData.length).toBe(1);
//
//        var mockEvent = { currentTarget: { getBoundingClientRect: function () {
//            return { left: 0, top: 0};
//        }}};
//
//        scope.currentRowDatePickerIndex = 0;
//        scope.openDatePicker(0, mockEvent);
//
//        expect(scope.showDatePicker).toBeFalsy();
//    });
//
//    it("should close datetimepicker on time set", function () {
//
//        scope.addDraftSchedule();
//        scope.$digest();
//        expect(scope.scheduleDraftData.length).toBe(1);
//        var mockEvent = { currentTarget: { getBoundingClientRect: function () {
//            return { left: 0, top: 0};
//        }}};
//        scope.openDatePicker(0, mockEvent);
//        expect(scope.showDatePicker).toBeTruthy();
//        scope.onTimeSet();
//        expect(scope.showDatePicker).toBeFalsy();
//    });
});
