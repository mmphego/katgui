describe('AboutCtrl', function ($mdThemingProvider) {

    beforeEach(module('katGui'));

    var scope, ctrl, location;



    beforeEach(inject(function ($rootScope, $controller, $location) {
        scope = $rootScope.$new();
        location = $location;

        ctrl = $controller('AboutCtrl', {$scope: scope});
    }));

    it('should bind the content', inject(function () {

        location.path('/about');
        expect(location.path()).toBe('/about');
    }));

});
