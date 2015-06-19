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

    it('should get the receptor list from the config service and subscribe to the receptor status sensors', function () {
        var deferred = q.defer();
        var getReceptorListSpy = spyOn(ConfigService, 'getReceptorList').and.returnValue(deferred.promise);
        ReceptorStateService.getReceptorList();
        expect(getReceptorListSpy).toHaveBeenCalled();
        var subscribeToReceptorUpdatesSpy = spyOn(MonitorService, 'subscribeToReceptorUpdates');
        deferred.resolve(['m011', 'm022', 'm033']);
        scope.$digest();
        expect(subscribeToReceptorUpdatesSpy).toHaveBeenCalled();
        expect(ReceptorStateService.receptorsData.length).toBe(3);
    });

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

    it('should update the values when a message is received', function () {
        var deferred = q.defer();
        var getReceptorListSpy = spyOn(ConfigService, 'getReceptorList').and.returnValue(deferred.promise);
        ReceptorStateService.getReceptorList();
        expect(getReceptorListSpy).toHaveBeenCalled();
        var subscribeToReceptorUpdatesSpy = spyOn(MonitorService, 'subscribeToReceptorUpdates');
        deferred.resolve(['m011', 'm022', 'm033']);
        scope.$digest();
        expect(subscribeToReceptorUpdatesSpy).toHaveBeenCalled();
        expect(ReceptorStateService.receptorsData.length).toBe(3);

        expect(ReceptorStateService.receptorsData[0].state).toBeUndefined();
        expect(ReceptorStateService.receptorsData[0].inhibited).toBe(false);
        ReceptorStateService.receptorMessageReceived({name:'mon:m011.mode', value: {value:'STOW', timestamp:1400}});
        expect(ReceptorStateService.receptorsData[0].state).toBe('STOW');
        expect(ReceptorStateService.receptorsData[0].lastUpdate).toBe(moment(1400, 'X').format('HH:mm:ss DD-MM-YYYY'));
        ReceptorStateService.receptorMessageReceived({name:'mon:m011.inhibited', value: {value:true, timestamp:1400}});
        expect(ReceptorStateService.receptorsData[0].inhibited).toEqual(true);
        expect(ReceptorStateService.receptorsData[0].lastUpdate).toBe(moment(1400, 'X').format('HH:mm:ss DD-MM-YYYY'));
    });
});
