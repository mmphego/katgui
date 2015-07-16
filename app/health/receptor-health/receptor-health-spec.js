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
});
