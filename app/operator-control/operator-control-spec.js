describe('OperatorControlCtrl', function () {

    beforeEach(module('katGui'));

    var scope, ctrl, MonitorService, ControlService;

    beforeEach(inject(function ($rootScope, $controller, _MonitorService_, _ControlService_) {
        scope = $rootScope.$new();
        MonitorService = _MonitorService_;
        ControlService = _ControlService_;
        ctrl = $controller('OperatorControlCtrl', {$scope: scope, MonitorService: MonitorService, ControlService: ControlService});
    }));

    it('should display all the configured receptors', inject(function() {



    }));

});
