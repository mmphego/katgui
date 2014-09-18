describe('NavigationWidgetCtrl', function () {

    beforeEach(module('ui.router'));
    beforeEach(module('katGui.widgets.navigationWidget'));

    var scope, ctrl, location, state;

    var testState = 'about';

    beforeEach(module(function ($stateProvider) {
        $stateProvider.state(testState, { url: '/' + testState });
    }));

    beforeEach(inject(function ($rootScope, $controller, $location, $state) {
        scope = $rootScope.$new();
        location = $location;
        state = $state;
        ctrl = $controller('NavigationWidgetCtrl', {$scope: scope, $state: state});
    }));

    it('should navigate to state when link is triggered', inject(function () {

        scope.stateGo(testState);
        scope.$digest();
        expect(location.path()).toBe('/' + testState);
    }));

});