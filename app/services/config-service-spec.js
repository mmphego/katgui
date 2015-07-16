describe('ConfigService', function() {

    beforeEach(module('katGui.services'));

    var scope, ConfigService, httpBackend, q, $log;

    beforeEach(inject(function ($rootScope, _ConfigService_, _$injector_, _$q_, _$log_) {
        $log = _$log_;
        q = _$q_;
        ConfigService = _ConfigService_;
        ConfigService.createRequest = function(){};
        scope = $rootScope.$new();
        httpBackend = _$injector_.get('$httpBackend');
    }));

    afterEach(function() {
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
    });

    it('should load the katobsportal url', inject(function() {
        httpBackend.when('GET', 'http://localhost:9876/katconf/api/v1/system-config/sections/katportal/katobsportal').respond(200, '"www.fakeaddress.com"');
        ConfigService.loadKATObsPortalURL();
        scope.$digest();
        httpBackend.flush();
        expect(ConfigService.KATObsPortalURL).toBe('http://www.fakeaddress.com');
    }));

    it('should log to $log when katobsportal url could not be retrieved', inject(function() {
        spyOn($log, 'error');
        httpBackend.when('GET', 'http://localhost:9876/katconf/api/v1/system-config/sections/katportal/katobsportal').respond(500, 'error message');
        ConfigService.loadKATObsPortalURL();
        scope.$digest();
        httpBackend.flush();
        expect($log.error).toHaveBeenCalledWith('error message');
    }));

    it('should get the status tree for the receptors', function() {
        httpBackend.when('GET', 'http://localhost:9876/katconf/api/v1/statustrees/receptors_view/receptors').respond(200, {});
        var resultPromise = ConfigService.getStatusTreeForReceptor();
        httpBackend.flush();
        expect(resultPromise.success).toBeDefined();
        expect(resultPromise.error).toBeDefined();
    });

    it('should get the status tree for the top health', function() {
        httpBackend.when('GET', 'http://localhost:9876/katconf/api/v1/statustrees/top_view').respond(200, {});
        var resultPromise = ConfigService.getStatusTreesForTop();
        httpBackend.flush();
        expect(resultPromise.success).toBeDefined();
        expect(resultPromise.error).toBeDefined();
    });

    it('should get the receptor list and populate the receptorList data structure and to return a promise', function() {
        httpBackend.when('GET', 'http://localhost:9876/katconf/api/v1/installed-config/receptors').respond(200, ['m011', 'm022', 'm033']);
        var resultPromise = ConfigService.getReceptorList();
        scope.$digest();
        httpBackend.flush();
        expect(resultPromise.then).toBeDefined();
        expect(ConfigService.receptorList.length).toBe(3);
    });

    it('should get the receptor list log an error and to return a promise', function() {
        spyOn($log, 'error');
        httpBackend.when('GET', 'http://localhost:9876/katconf/api/v1/installed-config/receptors').respond(500, 'error message');
        var resultPromise = ConfigService.getReceptorList();
        scope.$digest();
        httpBackend.flush();
        expect(resultPromise.then).toBeDefined();
        expect(ConfigService.receptorList.length).toBe(0);
        expect($log.error).toHaveBeenCalledWith('error message');
    });

    it('should get the site location', function() {
        httpBackend.when('GET', 'http://localhost:9876/katconf/api/v1/array/position').respond(200, {});
        var resultPromise = ConfigService.getSiteLocation();
        httpBackend.flush();
        expect(resultPromise.success).toBeDefined();
        expect(resultPromise.error).toBeDefined();
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
