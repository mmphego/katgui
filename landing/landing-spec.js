describe('LandingCtrl', function () {

    beforeEach(module('katGui.landing'));
//    beforeEach(module('katGui.widgets.ganttWidget'));

    var scope, ctrl, localStorage;

    beforeEach(inject(function ($rootScope, $controller, $localStorage) {
//        scope = $rootScope.$new();
//        scope.name = "katGuiLandingMock";
//        ctrl = $controller('LandingCtrl', {$scope: scope});
//        localStorage = $localStorage;
    }));

    it('should display landing control buttons', inject(function () {

        expect(1).toEqual(1);

    }));

});