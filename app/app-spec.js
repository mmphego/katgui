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
        ControlService.disconnectListener = function () {
        };
        MonitorService.disconnectListener = function () {
        };
        SessionService.recoverLogin = function () {
        };
        SessionService.logout = function () {
        };

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

    it('should call the $mdToast show function', function () {
        var mdToastShow = spyOn(mdToast, 'show');
        scope.$root.showSimpleToast('message');
        expect(mdToastShow).toHaveBeenCalledWith(mdToast.simple()
            .content('message')
            .position(scope.$root.toastPosition)
            .hideDelay(3500));
    });

    it('should connect events and start the time sync with the web server', function () {
        var MonitorServiceConnectSpy = spyOn(MonitorService, 'connectListener');
        var ControlServiceConnectSpy = spyOn(ControlService, 'connectListener');
        var updateTimeDisplaySpy = spyOn(ctrl, 'updateTimeDisplay');
        var syncTimeWithServerSpy = spyOn(ctrl, 'syncTimeWithServer');
        scope.$root.connectEvents();
        expect(ctrl.showNavbar).toBeTruthy();
        expect(MonitorServiceConnectSpy).toHaveBeenCalled();
        expect(ControlServiceConnectSpy).toHaveBeenCalled();
        interval.flush(60000);
        expect(updateTimeDisplaySpy).toHaveBeenCalled();
        expect(syncTimeWithServerSpy).toHaveBeenCalled();
    });

    it('should navigate to a new state', function () {
        var stateSpy = spyOn(state, "go");
        ctrl.stateGo('scheduler.drafts');
        expect(stateSpy).toHaveBeenCalled();
    });

    it('should change state when links are clicked in the left sidenav', function () {
        var stateSpy = spyOn(ctrl, "stateGo");
        ctrl.sideNavStateGo('test state');
        expect(stateSpy).toHaveBeenCalledWith('test state');
    });

    it('should change state when links are clicked in the right sidenav', function () {
        var stateSpy = spyOn(ctrl, "stateGo");
        ctrl.sideNavRightStateGo('test state');
        expect(stateSpy).toHaveBeenCalledWith('test state');
    });

    it('should return the current state\'s title', function () {
        ctrl.stateGo('home');
        scope.$root.$digest();
        expect(ctrl.currentState()).toEqual('Home');
    });

    it('should navigate to the parent state', function () {
        ctrl.stateGo('scheduler');
        scope.$root.$digest();
        expect(ctrl.currentState()).toEqual('Scheduler');
        ctrl.navigateToParentState();
        scope.$root.$digest();
        expect(ctrl.currentState()).toEqual('Home');
        ctrl.stateGo('scheduler.drafts');
        scope.$root.$digest();
        expect(ctrl.currentState()).toEqual('Scheduler.Drafts');
        ctrl.navigateToParentState();
        scope.$root.$digest();
        expect(ctrl.currentState()).toEqual('Scheduler');
        ctrl.navigateToParentState();
        scope.$root.$digest();
        expect(ctrl.currentState()).toEqual('Home');
        ctrl.stateGo('scheduler.observations.detail');
        scope.$root.$digest();
        expect(ctrl.currentState()).toEqual('Scheduler.Observations Details');
        ctrl.navigateToParentState();
        scope.$root.$digest();
        expect(ctrl.currentState()).toEqual('Scheduler.Observations Overview');
    });

    it('should display the promise result as a toast when result is ok or a dialog when there\'s an error', function () {
        var showSimpleToastSpy = spyOn(scope.$root, 'showSimpleToast');
        var showSimpleDialogSpy = spyOn(scope.$root, 'showSimpleDialog');
        scope.$root.displayPromiseResult({result: 'ok', message: 'test message'});
        expect(showSimpleToastSpy).toHaveBeenCalledWith('test message');
        scope.$root.displayPromiseResult({result: 'error doing something', message: 'test message'});
        expect(showSimpleDialogSpy).toHaveBeenCalledWith('error doing something', 'test message');
    });

    it('should update the time display with utc, sast, julian date and lst', function () {
        scope.$root.serverTimeOnLoad = 0;
        ctrl.updateTimeDisplay();
        expect(scope.$root.serverTimeOnLoad).toBe(0);
        scope.$root.serverTimeOnLoad = 1400;
        ctrl.updateTimeDisplay();
        expect(ctrl.utcTime).toEqual('00:23:20');
        expect(ctrl.localTime).toEqual('02:23:20');
        expect(ctrl.julianDay).toEqual(2440585.6);
        expect(ctrl.localSiderealTime).not.toBeDefined();
        expect(scope.$root.serverTimeOnLoad).toBe(1401);

        scope.$root.longitude = 21.410555555555554;
        ctrl.updateTimeDisplay();
        expect(ctrl.utcTime).toEqual('00:23:21');
        expect(ctrl.localTime).toEqual('02:23:21');
        expect(ctrl.julianDay).toEqual(2440585.6);
        expect(ctrl.localSiderealTime).toBe('10:22:25');
        expect(scope.$root.serverTimeOnLoad).toBe(1402);

        scope.$root.serverTimeOnLoad = 14000;
        ctrl.updateTimeDisplay();
        expect(ctrl.utcTime).toEqual('03:53:20');
        expect(ctrl.localTime).toEqual('05:53:20');
        expect(ctrl.julianDay).toEqual(2440585.745);
        expect(ctrl.localSiderealTime).toBe('13:52:59');
        expect(scope.$root.serverTimeOnLoad).toBe(14001);
    });

    it('should call the service functions to sync time with the server and set the serverTimeOnLoad on success', function () {
        httpBackend.expect('GET', 'http://localhost:9876:8840/array/position').respond(21.410555555555554);
        var deferred = q.defer();
        var getCurrentServerTimeSpy = spyOn(ControlService, 'getCurrentServerTime').and.returnValue(wrapPromise(deferred.promise));
        var deferred2 = q.defer();
        var getSiteLocationSpy = spyOn(ConfigService, 'getSiteLocation').and.returnValue(wrapPromise(deferred2.promise));
        ctrl.syncTimeWithServer();
        expect(getCurrentServerTimeSpy).toHaveBeenCalled();
        expect(getSiteLocationSpy).toHaveBeenCalled();
        deferred.resolve({katcontrol_webserver_current_time: 12000});
        deferred2.resolve('"-30:43:17.34, 21:24:38.46, 1038"');
        scope.$root.$digest();
        expect(scope.$root.serverTimeOnLoad).toBe(12000);
        expect(scope.$root.longitude).toBe(21.410555555555554);
    });

    it('should call the service functions to sync time with the server and set the serverTimeOnLoad on error and LST errors', function () {
        httpBackend.expect('GET', 'http://localhost:9876:8840/array/position').respond(21.410555555555554);
        var deferred = q.defer();
        var getCurrentServerTimeSpy = spyOn(ControlService, 'getCurrentServerTime').and.returnValue(wrapPromise(deferred.promise));
        var deferred2 = q.defer();
        var getSiteLocationSpy = spyOn(ConfigService, 'getSiteLocation').and.returnValue(wrapPromise(deferred2.promise));
        ctrl.syncTimeWithServer();
        expect(getCurrentServerTimeSpy).toHaveBeenCalled();
        expect(getSiteLocationSpy).toHaveBeenCalled();
        deferred.reject('test error');
        deferred2.reject('test error 2');
        scope.$root.$digest();
        expect(scope.$root.serverTimeOnLoad).toBe(0);
        expect(ctrl.localSiderealTime).toBe('Error syncing time!');
        expect(scope.$root.longitude).not.toBeDefined();
    });

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

