describe('NavigationWidgetCtrl', function () {

    beforeEach(module('ui.router'));
    beforeEach(module('katGui.widgets.navigationWidget'));

    var scope, ctrl, location, state, rootScope;
    var testState = 'about';

    beforeEach(module(function ($stateProvider) {
        $stateProvider.state(testState, { url: '/' + testState });
    }));

    beforeEach(inject(function ($rootScope, $controller, $location, $state) {
        rootScope = $rootScope;
        scope = $rootScope.$new();
        location = $location;
        state = $state;
        ctrl = $controller('NavigationWidgetCtrl', {$scope: scope, $state: state});
    }));

    it('should navigate to state when link is triggered', inject(function () {
        ctrl.stateGo(testState);
        scope.$digest();
        expect(location.path()).toBe('/' + testState);
    }));

    it('should update the local themes when the global theme is updated', function() {
        scope.$root.themePrimaryButtons = 'testVal';
        scope.$root.themePrimary = 'testVal2';
        scope.$root.$digest();
        expect(ctrl.themePrimaryButtons).toEqual('testVal');
        expect(ctrl.themePrimary).toEqual('testVal2');
    });

    it('should unbind watchers', inject(function () {
        var unbindThemePrimarySpy = spyOn(ctrl, "unbindThemePrimary");
        var unbindThemePrimaryButtonsSpy = spyOn(ctrl, "unbindThemePrimaryButtons");
        scope.$emit("$destroy");
        scope.$digest();
        expect(unbindThemePrimarySpy).toHaveBeenCalled();
        expect(unbindThemePrimaryButtonsSpy).toHaveBeenCalled();
    }));

});
