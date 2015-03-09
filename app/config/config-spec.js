describe('ConfigCtrl', function () {

    beforeEach(module('katGui'));
    beforeEach(module('katGui.config'));
    beforeEach(module('katGui.services'));
    beforeEach(module('ngStorage'));

    var scope, ctrl, ConfigService, rootScope, localStorage;

    beforeEach(inject(function ($rootScope, $controller, $timeout, _ConfigService_, _THEMES_, $localStorage) {
        rootScope = $rootScope;
        scope = $rootScope.$new();
        ConfigService = _ConfigService_;
        localStorage = $localStorage;
        ctrl = $controller('ConfigCtrl', {$rootScope: rootScope, $scope: scope, $localStorage: localStorage, ConfigService: ConfigService, THEMES: _THEMES_});
    }));

    it('should unbind watchers', inject(function () {
        var unbindShowAlarmsSpy = spyOn(ctrl, "unbindShowAlarms");
        var unbindShowLargeAlarmsSpy = spyOn(ctrl, "unbindShowLargeAlarms");
        var undbindShowJulianDateSpy = spyOn(ctrl, "undbindShowJulianDate");
        var undbindShowLSTSpy = spyOn(ctrl, "undbindShowLST");
        var undbindShowLocalAndSASTSpy = spyOn(ctrl, "undbindShowLocalAndSAST");
        var undbindThemeChangeSpy = spyOn(ctrl, "undbindThemeChange");
        scope.$emit("$destroy");
        scope.$digest();
        expect(unbindShowAlarmsSpy).toHaveBeenCalled();
        expect(unbindShowLargeAlarmsSpy).toHaveBeenCalled();
        expect(undbindShowJulianDateSpy).toHaveBeenCalled();
        expect(undbindShowLSTSpy).toHaveBeenCalled();
        expect(undbindShowLocalAndSASTSpy).toHaveBeenCalled();
        expect(undbindThemeChangeSpy).toHaveBeenCalled();
    }));

    it('should implement defaults if nothing is found in local storage', function () {
        rootScope.showAlarms = undefined;
        ctrl.init();
        expect(rootScope.showAlarms).toBeTruthy();

        rootScope.showAlarms = false;
        ctrl.init();
        expect(rootScope.showAlarms).toBeFalsy();

        localStorage['selectedTheme'] = 'Blue-Grey';
        ctrl.init();
        expect(ctrl.selectedThemeObj.name).toBe('Blue-Grey');
    });

    it('should save the theme to storage when the selected value changes', function () {

        //ctrl.selectedTheme = 'Indigo';
        //scope.$digest();

        //ctrl.showJulianDate = true;
        //scope.$digest();
    });
});


