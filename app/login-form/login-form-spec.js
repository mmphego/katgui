describe('LoginFormCtrl', function () {

    beforeEach(module('katGui'));

    var scope, ctrl, location, USER_ROLES;

    beforeEach(inject(function ($rootScope, $controller, $location, $templateCache, _USER_ROLES_) {
        scope = $rootScope.$new();
        $templateCache.put('app/landing/landing.html', '');
        ctrl = $controller('LoginFormCtrl');
        USER_ROLES = _USER_ROLES_;
        location = $location;
    }));


    it('should ensure user can log in and redirect to landing url', function () {
        var mockCredentials = { name: 'testUserName', role: USER_ROLES.expert};
        ctrl.login(mockCredentials);
        scope.$digest();
//        expect(scope.currentUser).toBe(mockCredentials);
        expect(location.path()).toBe('/home');
    });

});
