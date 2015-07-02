describe('ReceptorHealthCtrl', function () {

    beforeEach(module('katGui.health'));
    beforeEach(module('ngStorage'));

    var scope, ctrl, ConfigService, StatusService, MonitorService, localStorage, q;

    beforeEach(inject(function ($rootScope, $controller, _ConfigService_, _StatusService_, _MonitorService_, $localStorage, $q) {
        q = $q;
        scope = $rootScope.$new();
        ConfigService = _ConfigService_;
        StatusService = _StatusService_;
        MonitorService = _MonitorService_;
        localStorage = $localStorage;
        localStorage['receptorHealthDisplayMapType'] = 'Pack';

        ctrl = $controller('ReceptorHealthCtrl', {
            $scope: scope, ConfigService: ConfigService,
            StatusService: StatusService, MonitorService: MonitorService, $localStorage: localStorage
        });
    }));

    it('should init the controller variables', function () {
        expect(ctrl.receptorHealthTree).toBeDefined();
        expect(ctrl.receptorList).toBeDefined();
        expect(ctrl.mapTypes).toBeDefined();
        expect(ctrl.treeChartSize).toBeDefined();
        expect(ctrl.mapType).toEqual('Pack');
    });

    describe('ReceptorHealthCtrl init without local storage', function () {

        beforeEach(inject(function ($controller) {
            delete localStorage['receptorHealthDisplayMapType'];
            ctrl = $controller('ReceptorHealthCtrl', {
                $scope: scope, ConfigService: ConfigService,
                StatusService: StatusService, MonitorService: MonitorService, $localStorage: localStorage
            });
        }));

        it('should set defaults without local storage', function () {
            expect(ctrl.mapType).toEqual('Partition');
        });

        it('should subscribe to child sensors in the tree structure', function() {
            var subscribeSpy = spyOn(MonitorService, 'subscribe');
            StatusService.statusData['m011'] = {
                name: 'm011',
                sensor: 'testsensor',
                children: [{
                    name: 'ap',
                    sensor: 'aptestsensor',
                    children: [{
                        name: 'apchild',
                        sensor: 'apchildtestsensor',
                        subs: ['apchildtestsub1', 'apchildtestsub2']
                    }, {
                        name: 'ap2',
                        sensor: 'aptestsensor2'
                    }]
                }]
            };
            ctrl.subscribeToChildSensors(StatusService.statusData['m011'], 'm011');
            expect(subscribeSpy).toHaveBeenCalledWith('m011.apchildtestsub1');
            expect(subscribeSpy).toHaveBeenCalledWith('m011.apchildtestsub2');
            expect(subscribeSpy).toHaveBeenCalledWith('m011.apchildtestsensor');
            expect(subscribeSpy).toHaveBeenCalledWith('m011.aptestsensor');
            expect(subscribeSpy).toHaveBeenCalledWith('m011.aptestsensor2');
            expect(subscribeSpy).toHaveBeenCalledWith('m011.testsensor');
        });
    });
});
