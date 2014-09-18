var defaultDashboardConfig = {
    title: "Dashboard",
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
                },
                {
                    widgets: [
                        {
                            type: "GanttWidget",
                            config: {},
                            title: "Schedule Blocks"
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

    var scope, ctrl, localStorage;

    beforeEach(inject(function ($rootScope, $controller, $localStorage) {
        scope = $rootScope.$new();
        ctrl = $controller('LandingCtrl', {$scope: scope});
        localStorage = $localStorage;
    }));

    it('should save dashboard config on dashboard change', inject(function () {

        scope.$broadcast('adfDashboardChanged', scope.name, defaultDashboardConfig);
        scope.$digest();
        expect(localStorage[scope.name]).toBe(defaultDashboardConfig);
    }));

    it('should set loadDefault property to local storage when resetting dasboard config', inject(function () {

        scope.deleteDashboardLocalStorage();
        scope.$digest();
        expect(localStorage[scope.name]).toBe(undefined);

    }));

});