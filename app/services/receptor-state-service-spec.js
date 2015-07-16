describe('ReceptorStateService', function () {

    beforeEach(module('katGui.services'));

    var MonitorService, ConfigService, ReceptorStateService, scope, timeout, q, $log;

    beforeEach(inject(function ($rootScope, _$q_, _$injector_, _MonitorService_, _ConfigService_, _$timeout_, _ReceptorStateService_, _$log_) {
        timeout = _$timeout_;
        $log = _$log_;
        q = _$q_;
        MonitorService = _MonitorService_;
        ReceptorStateService = _ReceptorStateService_;
        ConfigService = _ConfigService_;
        ConfigService.getReceptorList = function () {
            return _$q_.defer().promise;
        };
        scope = $rootScope.$new();
        $rootScope.showSimpleDialog = function () {
        };
        $rootScope.showSimpleToast = function () {
        };
    }));

    it('should get the receptor list and log an error if the service rejected the promise', function () {
        var deferred = q.defer();
        var getReceptorListSpy = spyOn(ConfigService, 'getReceptorList').and.returnValue(deferred.promise);
        ReceptorStateService.getReceptorList();
        expect(getReceptorListSpy).toHaveBeenCalled();
        var errorSpy = spyOn($log, 'error');
        var showSimpleDialogSpy = spyOn(scope.$root, 'showSimpleDialog');
        deferred.reject('test error message');
        scope.$digest();
        expect(ReceptorStateService.receptorsData.length).toBe(0);
        expect(errorSpy).toHaveBeenCalledWith('test error message');
        expect(showSimpleDialogSpy).toHaveBeenCalledWith('Error', 'Error retrieving receptor list, please contact CAM support.');
    });
});
