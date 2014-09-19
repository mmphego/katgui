describe('ApplicationCtrl', function () {

    beforeEach(module('ui.router'));
    beforeEach(module('katGui'));

    var scope, ctrl, location, state;

    beforeEach(inject(function ($rootScope, $controller, $location, $state, $templateCache) {
        scope = $rootScope.$new();
        location = $location;
        state = $state;
        $templateCache.put('app/landing/landing.html', '');
        $templateCache.put('app/login-form/login-form.html', '');
        ctrl = $controller('ApplicationCtrl', {$scope: scope, $state: state});
    }));

    it('should set the current user', inject(function () {

        var mockUser = { name: 'testUser', role: 'testRole'};
        scope.setCurrentUser(mockUser);
        expect(scope.currentUser).toBe(mockUser);
    }));

    it('should navigate to landing state when logged in', inject(function () {

        scope.stateGo('landing');
        scope.$digest();
        expect(location.path()).toBe('/landing');
    }));

    it('should log you out and redirect to login page', inject(function () {

        scope.logout();
        scope.$digest();
        expect(scope.currentUser).toBeFalsy();
        expect(location.path()).toBe('/login');
    }));

//    it('should update the current time', inject(function () {
//
//
//    }));
});