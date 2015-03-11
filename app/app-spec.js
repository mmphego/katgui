describe('ApplicationCtrl', function () {

//    beforeEach(module('ngMaterial'));
    beforeEach(module('ui.router'));
    beforeEach(module('katGui'));


    var scope, ctrl, location, state, mdSidenav, SessionService, ControlService, MonitorService;

    beforeEach(inject(function ($rootScope, $controller, $location, $state, $templateCache, _SessionService_, _ControlService_, _MonitorService_) {

        SessionService = _SessionService_;
        ControlService = _ControlService_;
        MonitorService = _MonitorService_;

        ControlService.disconnectListener = function() {};
        MonitorService.disconnectListener = function() {};
        SessionService.logout = function() {};

        mdSidenav = function () {
            return {
                toggle: function () {
                },
                close: function () {
                }
            };
        };
        scope = $rootScope.$new();
        location = $location;
        state = $state;
        $templateCache.put('app/landing/landing.html', '');
        $templateCache.put('app/login-form/login-form.html', '');
        ctrl = $controller('ApplicationCtrl', {
            $scope: scope, $state: state, $mdSidenav: mdSidenav, SessionService: SessionService,
            MonitorService: MonitorService, ControlService: ControlService
        });
    }));

    it('should call the service functions to log the user out and disconnect all listeners', inject(function () {
        var disconnectControlServiceSpy = spyOn(ControlService, 'disconnectListener');
        var disconnectMonitorServiceSpy = spyOn(MonitorService, 'disconnectListener');
        var logoutSessionServiceSpy = spyOn(SessionService, 'logout');
        ctrl.logout();
        expect(disconnectControlServiceSpy).toHaveBeenCalled();
        expect(disconnectMonitorServiceSpy).toHaveBeenCalled();
        expect(logoutSessionServiceSpy).toHaveBeenCalled();
        expect(ctrl.showNavbar).toBe(false);
    }));

    it('should toggle the sidenavs without exceptions', inject(function () {
        ctrl.toggleLeftSidenav();
        ctrl.toggleRightSidenav();
    }));
});
