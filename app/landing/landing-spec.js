var defaultDashboardConfig = {
    title: " ",
    structure: "12/4-4-4",
    rows: [
        {
            columns: [
                {
                    widgets: [
                        {
                            type: "NavigationWidget",
                            config: {},
                            title: "Navigation Controls"
                        }
                    ]
                }, {
                    widgets: [
                        {
                            type: "GanttWidget",
                            config: {},
                            title: "Observation Schedule (EXAMPLE DATA)"
                        }
                    ]
                }
            ]
        }
    ]
};


describe('LandingCtrl', function () {

    beforeEach(module('ngStorage'));
    beforeEach(module('katGui.landing'));

    var scope, ctrl, localStorage, timeout, controller;

    beforeEach(inject(function ($rootScope, $controller, $localStorage, $timeout) {
        timeout = $timeout;
        scope = $rootScope.$new();
        controller = $controller;
        ctrl = $controller('LandingCtrl', {$scope: scope});
        localStorage = $localStorage;
    }));

    it('should save dashboard config on dashboard change', inject(function () {
        scope.$broadcast('adfDashboardChanged', ctrl.name, defaultDashboardConfig);
        scope.$digest();
        expect(localStorage[ctrl.name]).toBe(defaultDashboardConfig);
    }));

    it('should set loadDefault property to local storage when resetting dasboard config', inject(function () {
        var reloadSpy = spyOn(window.location, 'reload');
        ctrl.deleteDashboardLocalStorage();
        scope.$digest();
        expect(localStorage[scope.name]).toBe(undefined);
        timeout.flush();
        expect(reloadSpy).toHaveBeenCalled();
    }));

});
