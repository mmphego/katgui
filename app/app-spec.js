describe('ApplicationCtrl', function () {

    beforeEach(module('ngMaterial'));
    beforeEach(module('ui.router'));
    beforeEach(module('katGui'));
    beforeEach(module('ngStorage'));

    var scope, ctrl, location, state, mdSidenav, SessionService, ControlService, MonitorService, ConfigService, mdToast, interval, recoverLoginSpy, q, httpBackend, localStorage, controller;

    beforeEach(inject(function ($rootScope, $location, $state, $templateCache, _SessionService_, _ControlService_, _MonitorService_, _$mdToast_,
                                _ConfigService_, _$interval_, _$q_, _$injector_, _$localStorage_, _$controller_) {
        httpBackend = _$injector_.get('$httpBackend');
        q = _$q_;
        controller = _$controller_;
        mdToast = _$mdToast_;
        mdToast.show = function () {
        };
        SessionService = _SessionService_;
        ControlService = _ControlService_;
        MonitorService = _MonitorService_;
        ConfigService = _ConfigService_;
        interval = _$interval_;
        localStorage = _$localStorage_;
        localStorage['currentUserToken'] = 'some test value';
        ControlService.disconnectListener = function () {
        };
        MonitorService.disconnectListener = function () {
        };
        SessionService.recoverLogin = function () {
        };
        SessionService.logout = function () {
        };
        _ConfigService_.loadKATObsPortalURL = function () {
        };
        _ConfigService_.getSystemConfig = function () {
            return _$q_.defer().promise;
        };

        httpBackend.when('GET', 'http://localhost:9876/katcontrol/time').respond(200, {});
        httpBackend.when('GET', 'http://localhost:9876/katconf/array/position').respond(200, {});

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
        localStorage = {};
        localStorage['showLST'] = false;
        localStorage['showLocalAndSAST'] = false;
        $templateCache.put('app/landing/landing.html', '');
        $templateCache.put('app/login-form/login-form.html', '');
        $templateCache.put('app/scheduler/scheduler-home.html', '');
        $templateCache.put('app/scheduler/schedule-block-drafts/schedule-block-drafts.html', '');
        $templateCache.put('app/scheduler/observations/observations-detail.html', '');
        $templateCache.put('app/scheduler/observations/observations-overview.html', '');
        ctrl = _$controller_('ApplicationCtrl', {
            $scope: scope, $state: state, $mdSidenav: mdSidenav, SessionService: SessionService, $localStorage: localStorage,
            MonitorService: MonitorService, ControlService: ControlService, $mdToast: mdToast, $interval: interval
        });
        recoverLoginSpy = spyOn(SessionService, 'recoverLogin');
    }));

    it('should init the defaults for variables', function() {
        localStorage = {};
        localStorage['showLST'] = undefined;
        localStorage['showLocalAndSAST'] = undefined;
        localStorage['selectedTheme'] = 'Teal';
        scope.$root.$digest();
        ctrl = controller('ApplicationCtrl', {
            $scope: scope, $state: state, $mdSidenav: mdSidenav, SessionService: SessionService, $localStorage: localStorage,
            MonitorService: MonitorService, ControlService: ControlService, $mdToast: mdToast, $interval: interval
        });
        expect(scope.$root.showLST).toBeTruthy();
        expect(scope.$root.showLocalAndSAST).toBeTruthy();
        expect(scope.$root.themePrimary).toBe('teal');
        expect(scope.$root.themeSecondary).toBe('amber');
        expect(scope.$root.themePrimaryButtons).toBe('indigo');
    });

    it('should toggle the sidenavs without exceptions', inject(function () {
        ctrl.toggleLeftSidenav();
        ctrl.toggleRightSidenav();
    }));

    it('should emit keydown events', function () {
        spyOn(scope.$root, "$emit");
        document.onkeydown({keyCode:27});
        expect(scope.$emit).toHaveBeenCalledWith('keydown', 27);
        document.onkeydown({keyCode:2});
        expect(scope.$emit).toHaveBeenCalledWith('keydown', 2);
        document.onkeydown({keyCode:-1});
        expect(scope.$emit).toHaveBeenCalledWith('keydown', -1);
    });

    //wrap the spy promises so that it looks like the $http promise that our service is returning
    function wrapPromise(promise) {
        return {
            then: promise.then,
            success: function (fn) {
                promise.then(fn);
                return wrapPromise(promise);
            },
            error: function (fn) {
                promise.then(null, fn);
                return wrapPromise(promise);
            }
        };
    }
});

