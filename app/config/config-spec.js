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


});


