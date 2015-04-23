describe('DataService', function () {

    beforeEach(module('katGui'));

    var httpBackend, DataService;

    beforeEach(inject(function (_$injector_, _DataService_, $templateCache) {
        httpBackend = _$injector_.get('$httpBackend');
        DataService = _DataService_;
        $templateCache.put('app/login-form/login-form.html', '');
    }));

    it('should return a promise when calling the service function findSensor', inject(function () {
        httpBackend.when('GET', 'http://localhost:9876:8888/katstore/findsensor?sensor=*testSensor*').respond(200, {});
        var resultPromise = DataService.findSensor('testSensor');
        httpBackend.flush();
        expect(resultPromise.success).toBeDefined();
        expect(resultPromise.error).toBeDefined();
    }));

    //it('should return a promise when calling the service function sensorMetaData', inject(function () {
    //    httpBackend.when('GET', 'http://localhost:9876:8888/katstore/sensor_info?sensor=testSensor').respond(200, {});
    //    var resultPromise = DataService.sensorMetaData('testSensor');
    //    httpBackend.flush();
    //    expect(resultPromise.success).toBeDefined();
    //    expect(resultPromise.error).toBeDefined();
    //}));

    //it('should return a promise when calling the service function sensorData', inject(function () {
    //    httpBackend.when('GET', 'http://localhost:9876:8888/katstore/?sensor=testSensor').respond(200, {});
    //    var resultPromise = DataService.sensorData('testSensor');
    //    httpBackend.flush();
    //    expect(resultPromise.success).toBeDefined();
    //    expect(resultPromise.error).toBeDefined();
    //}));
});
