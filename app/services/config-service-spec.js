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

    it('should get the status tree for the receptors', function() {
        httpBackend.when('GET', 'http://localhost:9876/katconf/statustrees/receptors_view/receptors').respond(200, {});
        var resultPromise = ConfigService.getStatusTreeForReceptor();
        httpBackend.flush();
        expect(resultPromise.success).toBeDefined();
        expect(resultPromise.error).toBeDefined();
    });

    it('should get the status tree for the top health', function() {
        httpBackend.when('GET', 'http://localhost:9876/katconf/statustrees/top_view').respond(200, {});
        var resultPromise = ConfigService.getStatusTreesForTop();
        httpBackend.flush();
        expect(resultPromise.success).toBeDefined();
        expect(resultPromise.error).toBeDefined();
    });

    it('should get the site location', function() {
        httpBackend.when('GET', 'http://localhost:9876/katconf/array/position').respond(200, {});
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
