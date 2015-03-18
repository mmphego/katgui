describe('LoginFormCtrl', function () {

    beforeEach(module('katGui'));

    var scope, ctrl, location, httpBackend;

    beforeEach(inject(function ($rootScope, $controller, $location, $templateCache, $injector) {
        scope = $rootScope.$new();
        $templateCache.put('app/login-form/login-form.html', '');
        $templateCache.put('app/landing/landing.html', '');
        ctrl = $controller('LoginFormCtrl');
        location = $location;
        httpBackend = $injector.get('$httpBackend');
        $rootScope.showSimpleToast = function () {
        };
        $rootScope.connectEvents = function () {
        };
    }));

    it('should ensure user can log in and redirect to landing url', function () {
        var showSimpleToastSpy = spyOn(scope.$root, "showSimpleToast");
        var connectEventsSpy = spyOn(scope.$root, "connectEvents");
        httpBackend.expect('GET', 'http://localhost:9876/katauth/api/v1/user/login').respond(200, {
            session_id: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE0MjU4ODY1ODcsIm5hbWUiOiJGcmFuY29pcyBKb3ViZXJ0IiwiaWQiOjEsInJvbGVzIjpbImNvbnRyb2xfYXV0aG9yaXR5IiwidXNlcl9hZG1pbiIsImxlYWRfb3BlcmF0b3IiLCJvcGVyYXRvciIsInJlYWRfb25seSJdLCJlbWFpbCI6ImZqb3ViZXJ0QHNrYS5hYy56YSJ9.48m_1EJgvtPxqFdAZ6h6pGU6rm6t2xDI90EBPbfvzhw'
        });
        ctrl.credentials = {username: 'fjoubert@ska.ac.za', password: 'test password'};
        ctrl.login();
        httpBackend.flush();
        expect(scope.currentUser.name).toBe('Francois Joubert');
        expect(scope.currentUser.email).toBe('fjoubert@ska.ac.za');
        expect(scope.currentUser.roles.length).toBe(5);
        expect(scope.loggedIn).toBeTruthy();
        var jwtPayload = {email: 'fjoubert@ska.ac.za'};
        var msg = window.btoa(JSON.stringify({
                "alg": "HS256",
                "typ": "JWT"
            })) + "." + window.btoa(JSON.stringify(jwtPayload));
        msg = msg.replace(/=/g, "");
        var pass = CryptoJS.HmacSHA256(msg, CryptoJS.SHA256('test password').toString());
        expect(scope.jwt).toBe(msg + '.' + pass.toString(CryptoJS.enc.Base64));
        expect(location.path()).toBe('/home');
        expect(showSimpleToastSpy).toHaveBeenCalled();
        expect(connectEventsSpy).toHaveBeenCalled();
    });

    it('should ensure user doesnt login with incorrect credentials and is redirected to the login screen', function () {
        var showSimpleToastSpy = spyOn(scope.$root, "showSimpleToast");
        var connectEventsSpy = spyOn(scope.$root, "connectEvents");
        httpBackend.expect('GET', 'http://localhost:9876/katauth/api/v1/user/login').respond(401, {
            session_id: null
        });
        ctrl.credentials = {username: 'fjoubert@ska.ac.za', password: 'test password'};
        ctrl.login();
        httpBackend.flush();
        expect(scope.currentUser).toBe(undefined);
        expect(scope.loggedIn).toBeFalsy();
        expect(location.path()).toBe('/login');
        expect(showSimpleToastSpy).toHaveBeenCalled();
        expect(connectEventsSpy).not.toHaveBeenCalled();
    });

});
