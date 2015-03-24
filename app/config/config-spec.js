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
        expect(ctrl.selectedTheme).toBe('Blue-Grey');
    });

    it('should update the values correctly when the value changes', function () {
        ctrl.themeChange('Indigo');
        expect(scope.$root.themePrimary).toBe('indigo');
        expect(scope.$root.themeSecondary).toBe('blue');
        expect(scope.$root.themePrimaryButtons).toBe('blue');

        ctrl.showJulianDateChange(false);
        expect(scope.$root.showJulianDate).toBe(false);
        ctrl.showJulianDateChange(true);
        expect(scope.$root.showJulianDate).toBe(true);

        ctrl.showLSTChange(false);
        expect(scope.$root.showLST).toBe(false);
        ctrl.showLSTChange(true);
        expect(scope.$root.showLST).toBe(true);

        ctrl.showLocalAndSASTChange(false);
        expect(scope.$root.showLocalAndSAST).toBe(false);
        ctrl.showLocalAndSASTChange(true);
        expect(scope.$root.showLocalAndSAST).toBe(true);

        ctrl.showLargeAlarmsChange(false);
        expect(scope.$root.showLargeAlarms).toBe(false);
        ctrl.showLargeAlarmsChange(true);
        expect(scope.$root.showLargeAlarms).toBe(true);

        ctrl.showAlarmsChange(false);
        expect(scope.$root.showAlarms).toBe(false);
        ctrl.showAlarmsChange(true);
        expect(scope.$root.showAlarms).toBe(true);

        //test broadcasting for else clause in the change functions
        ctrl.selectedTheme = undefined;
        ctrl.showJulianDate = undefined;
        ctrl.showLST = undefined;
        ctrl.showLocalAndSAST = undefined;
        ctrl.showLargeAlarms = undefined;
        ctrl.showAlarms = undefined;

        expect(scope.$root.showJulianDate).toBe(true);
        expect(scope.$root.showLST).toBe(true);
        expect(scope.$root.showLocalAndSAST).toBe(true);
        expect(scope.$root.showLargeAlarms).toBe(true);
        expect(scope.$root.showAlarms).toBe(true);
    });
});


