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
        };
        ObservationScheduleService.disconnectListener = function () {
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
        httpBackend.expect('GET', 'http://localhost:9876/katconf/api/v1/system-config/sections/katportal/katobsportal').respond('urlfortests.com');
        scope.$digest();
    });

    it('should navigate to a new state', function () {
        var stateSpy = spyOn(state, "go");
        ctrl.stateGo('scheduler.drafts');
        expect(stateSpy).toHaveBeenCalled();
    });

    it('should unbind watchers', inject(function () {
        //the get happens because we call $digest
        httpBackend.expect('GET', 'http://localhost:9876/katconf/api/v1/system-config/sections/katportal/katobsportal').respond('urlfortests.com');
        var unbindStateChangeStartSpy = spyOn(ctrl, "unbindStateChangeStart");
        var disconnectListenerSpy = spyOn(ObservationScheduleService, "disconnectListener");
        scope.$emit("$destroy");
        scope.$digest();
        expect(unbindStateChangeStartSpy).toHaveBeenCalled();
        expect(disconnectListenerSpy).toHaveBeenCalled();
    }));

    it('should hide the parent display when navigating to a child state', function () {
        //the get happens because we call $digest
        httpBackend.expect('GET', 'http://localhost:9876/katconf/api/v1/system-config/sections/katportal/katobsportal').respond('urlfortests.com');
        scope.$root.$broadcast('$stateChangeStart', {name: 'scheduler.drafts'});
        scope.$root.$digest();
        expect(ctrl.childStateShowing).toBeTruthy();
        scope.$root.$broadcast('$stateChangeStart', {name: 'home'});
        scope.$root.$digest();
        expect(ctrl.childStateShowing).toBeFalsy();
    });
});
