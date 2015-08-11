describe('OperatorControlCtrl', function () {

    beforeEach(module('katGui'));

    var rootScope, scope, ctrl, receptorStateService, controlService, configService, httpBackend, interval, q;

    beforeEach(inject(function ($rootScope, _$q_, $controller, _ReceptorStateService_, _ConfigService_, _ControlService_, $injector, $templateCache) {
        configService = _ConfigService_;
        q = _$q_;
        rootScope = $rootScope;
        scope = $rootScope.$new();
        scope.$root.loggedIn = true;
        $templateCache.put('app/landing/landing.html', '');
        $templateCache.put('app/login-form/login-form.html', '');
        httpBackend = $injector.get('$httpBackend');
        interval = $injector.get('$interval');
        receptorStateService = _ReceptorStateService_;
        controlService = _ControlService_;

        controlService.inhibitAll = function () {

            receptorStateService.receptorMessageReceived({
                name: 'mon:m011.inhibited',
                value: {
                    received_timestamp: 1425975097.022549,
                    status: 1,
                    timestamp: 1425975097.020974,
                    value: true
                }
            });

            receptorStateService.receptorMessageReceived({
                name: 'mon:m022.inhibited',
                value: {
                    received_timestamp: 1425975097.022549,
                    status: 1,
                    timestamp: 1425975097.020974,
                    value: true
                }
            });

            receptorStateService.receptorMessageReceived({
                name: 'mon:m033.inhibited',
                value: {
                    received_timestamp: 1425975097.022549,
                    status: 1,
                    timestamp: 1425975097.020974,
                    value: true
                }
            });

            receptorStateService.receptorMessageReceived({
                name: 'mon:m044.inhibited',
                value: {
                    received_timestamp: 1425975097.022549,
                    status: 1,
                    timestamp: 1425975097.020974,
                    value: true
                }
            });

            receptorStateService.receptorMessageReceived({
                name: 'mon:m055.inhibited',
                value: {
                    received_timestamp: 1425975097.022549,
                    status: 1,
                    timestamp: 1425975097.020974,
                    value: true
                }
            });
        };

        controlService.stowAll = function () {

            receptorStateService.receptorMessageReceived({
                name: 'mon:m011.mode',
                value: {
                    received_timestamp: 1425975097.022549,
                    status: 1,
                    timestamp: 1425975097.020974,
                    value: 'STOW'
                }
            });

            receptorStateService.receptorMessageReceived({
                name: 'mon:m022.mode',
                value: {
                    received_timestamp: 1425975097.022549,
                    status: 1,
                    timestamp: 1425975097.020974,
                    value: 'STOW'
                }
            });

            receptorStateService.receptorMessageReceived({
                name: 'mon:m033.mode',
                value: {
                    received_timestamp: 1425975097.022549,
                    status: 1,
                    timestamp: 1425975097.020974,
                    value: 'STOW'
                }
            });

            receptorStateService.receptorMessageReceived({
                name: 'mon:m044.mode',
                value: {
                    received_timestamp: 1425975097.022549,
                    status: 1,
                    timestamp: 1425975097.020974,
                    value: 'STOW'
                }
            });

            receptorStateService.receptorMessageReceived({
                name: 'mon:m055.mode',
                value: {
                    received_timestamp: 1425975097.022549,
                    status: 1,
                    timestamp: 1425975097.020974,
                    value: 'STOW'
                }
            });
        };

        controlService.stopAll = function () {
            receptorStateService.receptorMessageReceived({
                name: 'mon:m011.mode',
                value: {
                    received_timestamp: 1425975097.022549,
                    status: 1,
                    timestamp: 1425975097.020974,
                    value: 'STOW'
                }
            });

            receptorStateService.receptorMessageReceived({
                name: 'mon:m022.mode',
                value: {
                    received_timestamp: 1425975097.022549,
                    status: 1,
                    timestamp: 1425975097.020974,
                    value: 'STOW'
                }
            });

            receptorStateService.receptorMessageReceived({
                name: 'mon:m033.mode',
                value: {
                    received_timestamp: 1425975097.022549,
                    status: 1,
                    timestamp: 1425975097.020974,
                    value: 'STOW'
                }
            });

            receptorStateService.receptorMessageReceived({
                name: 'mon:m044.mode',
                value: {
                    received_timestamp: 1425975097.022549,
                    status: 1,
                    timestamp: 1425975097.020974,
                    value: 'STOW'
                }
            });

            receptorStateService.receptorMessageReceived({
                name: 'mon:m055.mode',
                value: {
                    received_timestamp: 1425975097.022549,
                    status: 1,
                    timestamp: 1425975097.020974,
                    value: 'STOW'
                }
            });

            receptorStateService.receptorMessageReceived({
                name: 'mon:m011:inhibited',
                value: {
                    received_timestamp: 1425975097.022549,
                    status: 1,
                    timestamp: 1425975097.020974,
                    value: true
                }
            });

            receptorStateService.receptorMessageReceived({
                name: 'mon:m022:inhibited',
                value: {
                    received_timestamp: 1425975097.022549,
                    status: 1,
                    timestamp: 1425975097.020974,
                    value: true
                }
            });

            receptorStateService.receptorMessageReceived({
                name: 'mon:m033:inhibited',
                value: {
                    received_timestamp: 1425975097.022549,
                    status: 1,
                    timestamp: 1425975097.020974,
                    value: true
                }
            });

            receptorStateService.receptorMessageReceived({
                name: 'mon:m044:inhibited',
                value: {
                    received_timestamp: 1425975097.022549,
                    status: 1,
                    timestamp: 1425975097.020974,
                    value: true
                }
            });

            receptorStateService.receptorMessageReceived({
                name: 'mon:m055:inhibited',
                value: {
                    received_timestamp: 1425975097.022549,
                    status: 1,
                    timestamp: 1425975097.020974,
                    value: true
                }
            });
        };

        controlService.resumeOperations = function () {

            receptorStateService.receptorMessageReceived({
                name: 'mon:m011.mode',
                value: {
                    received_timestamp: 1425975097.022549,
                    status: 1,
                    timestamp: 1425975097.020974,
                    value: 'STOP'
                }
            });

            receptorStateService.receptorMessageReceived({
                name: 'mon:m022.mode',
                value: {
                    received_timestamp: 1425975097.022549,
                    status: 1,
                    timestamp: 1425975097.020974,
                    value: 'STOP'
                }
            });

            receptorStateService.receptorMessageReceived({
                name: 'mon:m033.mode',
                value: {
                    received_timestamp: 1425975097.022549,
                    status: 1,
                    timestamp: 1425975097.020974,
                    value: 'STOP'
                }
            });

            receptorStateService.receptorMessageReceived({
                name: 'mon:m044.mode',
                value: {
                    received_timestamp: 1425975097.022549,
                    status: 1,
                    timestamp: 1425975097.020974,
                    value: 'STOP'
                }
            });

            receptorStateService.receptorMessageReceived({
                name: 'mon:m055.mode',
                value: {
                    received_timestamp: 1425975097.022549,
                    status: 1,
                    timestamp: 1425975097.020974,
                    value: 'STOP'
                }
            });
        };
        ctrl = $controller('OperatorControlCtrl', {$rootScope: rootScope, $scope: scope, ReceptorStateService: receptorStateService, ControlService: controlService});
    }));

    //receptorStateService.receptorsData = [{name: 'm011', inhibited: false}, {name: 'm022', inhibited: false}, {name: 'm033', inhibited: false}, {name: 'm044', inhibited: false}, {
    //    name: 'm055',
    //    inhibited: false
    //}];
    it('should have the configured receptors', inject(function () {
        httpBackend.expect('GET', 'http://localhost:9876/katconf/installed-config/receptors').respond(200, {});
        var deferred = q.defer();
        var getReceptorListSpy = spyOn(configService, 'getReceptorList').and.returnValue(deferred.promise);
        receptorStateService.getReceptorList();
        expect(getReceptorListSpy).toHaveBeenCalled();
        deferred.resolve(['m011', 'm022', 'm033', 'm044', 'm055']);
        scope.$digest();
        expect(ctrl.receptorsData.length).toBe(5);
    }));

    it('should update the time at each interval', function() {
        httpBackend.expect('GET', 'http://localhost:9876/katconf/installed-config/receptors').respond(200, {});
        var deferred = q.defer();
        var getReceptorListSpy = spyOn(configService, 'getReceptorList').and.returnValue(deferred.promise);
        receptorStateService.getReceptorList();
        expect(getReceptorListSpy).toHaveBeenCalled();
        deferred.resolve(['m011', 'm022', 'm033', 'm044', 'm055']);
        scope.$digest();
        expect(ctrl.receptorsData.length).toBe(5);

        receptorStateService.receptorMessageReceived({
            name: 'mon:m011.mode',
            value: {
                received_timestamp: 1425975097.022549,
                status: 1,
                timestamp: 1425975097.020974,
                value: 'STOP'
            }
        });
        expect(ctrl.receptorsData[0].lastUpdate.length).not.toBe(0);
        expect(ctrl.receptorsData[0].since).toBeUndefined();
        expect(ctrl.receptorsData[0].fromNow).toBeUndefined();
        expect(ctrl.receptorsData[0]);
        expect(ctrl.receptorsData.length).toBe(5);
        //these GET happens in this test because we run a $digest loop when calling flush, the other tests doesnt need it
        //because the service is never created completely
        httpBackend.expect('GET', 'http://localhost:9876/katconf/installed-config/receptors').respond(200, {});
        interval.flush(10000);
        expect(ctrl.receptorsData[0].lastUpdate.length).not.toBe(0);
        expect(ctrl.receptorsData[0].since.length).not.toBe(0);
        expect(ctrl.receptorsData[0].fromNow.length).not.toBe(0);
    });

    //it('should update the inhibited message', inject(function () {
    //    httpBackend.expect('GET', 'http://localhost:9876/katconf/installed-config/receptors').respond(200, {});
    //    var deferred = q.defer();
    //    var getReceptorListSpy = spyOn(configService, 'getReceptorList').and.returnValue(deferred.promise);
    //    receptorStateService.getReceptorList();
    //    expect(getReceptorListSpy).toHaveBeenCalled();
    //    deferred.resolve(['m011', 'm022', 'm033', 'm044', 'm055']);
    //    scope.$digest();
    //    expect(ctrl.receptorsData.length).toBe(5);
    //
    //    ctrl.inhibitAll();
    //    ctrl.receptorsData.forEach(function (receptor) {
    //        expect(receptor.inhibited).toBeTruthy();
    //    });
    //    receptorStateService.receptorMessageReceived({
    //        name: 'mon:m055.inhibited',
    //        value: {
    //            received_timestamp: 1425975097.022549,
    //            status: 1,
    //            timestamp: 1425975097.020974,
    //            value: false
    //        }
    //    });
    //    expect(ctrl.receptorsData[4].inhibited).toBeFalsy();
    //    ctrl.receptorsData[4].inhibited = true;
    //    receptorStateService.receptorMessageReceived({
    //        name: 'mon:m055.inhibited',
    //        value: {
    //            received_timestamp: 1425975097.022549,
    //            status: 1,
    //            timestamp: 1425975097.020974,
    //            value: true
    //        }
    //    });
    //    expect(ctrl.receptorsData[4].inhibited).toBeTruthy();
    //}));

    describe('Receptor Controls', function () {

        //it('should inhibit all receptors', inject(function () {
        //    ctrl.inhibitAll();
        //    ctrl.receptorsData.forEach(function (receptor) {
        //        expect(receptor.inhibited).toBeTruthy();
        //    });
        //}));
        //
        //it('should issue stow all', inject(function () {
        //    ctrl.stowAll();
        //    ctrl.receptorsData.forEach(function (receptor) {
        //        expect(receptor.state).toBe('STOW');
        //        expect(receptor.inhibited).toBeFalsy();
        //    });
        //}));
        //
        //it('should issue stop observations', inject(function () {
        //    ctrl.stopAll();
        //    ctrl.receptorsData.forEach(function (receptor) {
        //        expect(receptor.state).toBe('STOW');
        //        expect(receptor.inhibited).toBeTruthy();
        //    });
        //}));
        //
        //it('should issue resume operations', inject(function () {
        //    ctrl.resumeOperations();
        //    ctrl.receptorsData.forEach(function (receptor) {
        //        expect(receptor.state).toBe('STOP');
        //        expect(receptor.inhibited).toBeFalsy();
        //    });
        //}));

        //it('should issue shutdown computing', inject(function () {
        //
        //}));
    });
});
