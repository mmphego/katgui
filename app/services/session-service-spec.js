//todo refactor with new impl
//describe('SessionService', function () {
//
//    beforeEach(module('katGui.services'));
//    beforeEach(module('ui.router'));
//    beforeEach(module('ngStorage'));
//
//    var scope, SessionService, httpBackend, q, localStorage, state;
//
//    beforeEach(inject(function ($rootScope, _SessionService_, _$injector_, _$q_, _$localStorage_, _$state_) {
//        q = _$q_;
//        state = _$state_;
//        SessionService = _SessionService_;
//        localStorage = _$localStorage_;
//        scope = $rootScope.$new();
//        scope.$root.showSimpleToast = function () {
//        };
//        scope.$root.connectEvents = function () {
//        };
//        httpBackend = _$injector_.get('$httpBackend');
//    }));
//
//    afterEach(function () {
//        httpBackend.verifyNoOutstandingExpectation();
//        httpBackend.verifyNoOutstandingRequest();
//    });
//
//    it('should create a jwt token and send a login request and redirect to home on success', function () {
//        httpBackend.when('GET', 'http://localhost:9876/katauth/api/v1/user/login').respond(200, {session_id: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE0Mjc3OTI1NDUsIm5hbWUiOiJGcmFuY29pcyBKb3ViZXJ0IiwiaWQiOjEsInJvbGVzIjpbImNvbnRyb2xfYXV0aG9yaXR5IiwidXNlcl9hZG1pbiIsImxlYWRfb3BlcmF0b3IiXSwiZW1haWwiOiJmam91YmVydEBza2EuYWMuemEifQ.mW2sk9EVywSosakgSV8aa2R8QUKI4un7fWQVzNNMxNw'});
//        state.current = {name: 'login'};
//        var showSimpleToastSpy = spyOn(scope.$root, 'showSimpleToast');
//        var connectEventsSpy = spyOn(scope.$root, 'connectEvents');
//        var stateGoSpy = spyOn(state, 'go');
//        SessionService.login('fjoubert@ska.ac.za', '1234');
//        expect(scope.$root.jwt).toEqual('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImZqb3ViZXJ0QHNrYS5hYy56YSJ9.iW4zGXNv8QET/gcwUM8parpTFSZUbeRmVF7l0N5MtdY=');
//        httpBackend.flush();
//        expect(showSimpleToastSpy).toHaveBeenCalled();
//        expect(connectEventsSpy).toHaveBeenCalled();
//        expect(stateGoSpy).toHaveBeenCalledWith('home');
//    });
//
//    it('should notify when there was an error logging in and redirect to login screen', function () {
//        httpBackend.when('GET', 'http://localhost:9876/katauth/api/v1/user/login').respond(501, {session_id: null});
//        var stateGoSpy = spyOn(state, 'go');
//        SessionService.login('fjoubert@ska.ac.za', '1234');
//        expect(scope.$root.jwt).toEqual('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImZqb3ViZXJ0QHNrYS5hYy56YSJ9.iW4zGXNv8QET/gcwUM8parpTFSZUbeRmVF7l0N5MtdY=');
//        httpBackend.flush();
//        expect(localStorage['currentUserToken']).not.toBeDefined();
//        expect(stateGoSpy).toHaveBeenCalledWith('login');
//    });
//
//    it('should logout when logged in', function () {
//        var showSimpleToastSpy = spyOn(scope.$root, 'showSimpleToast');
//        scope.$root.loggedIn = false;
//        var stateGoSpy = spyOn(state, 'go');
//        SessionService.logout();
//        expect(stateGoSpy).not.toHaveBeenCalled();
//        scope.$root.loggedIn = true;
//        httpBackend.when('GET', 'http://localhost:9876/katauth/api/v1/user/logout').respond(200, {});
//        SessionService.logout();
//        httpBackend.flush();
//        expect(scope.$root.loggedIn).toBeFalsy();
//        expect(localStorage['currentUserToken']).toBeNull();
//        expect(scope.$root.jwt).toBeNull();
//        expect(stateGoSpy).toHaveBeenCalledWith('login');
//        expect(showSimpleToastSpy).toHaveBeenCalledWith('Logout successful.');
//    });
//
//    it('should not logout when an error occurred', function () {
//        var showSimpleToastSpy = spyOn(scope.$root, 'showSimpleToast');
//        var stateGoSpy = spyOn(state, 'go');
//        scope.$root.loggedIn = true;
//        httpBackend.when('GET', 'http://localhost:9876/katauth/api/v1/user/logout').respond(501, {error: 'error message'});
//        SessionService.logout();
//        httpBackend.flush();
//        expect(scope.$root.loggedIn).toBeFalsy();
//        expect(localStorage['currentUserToken']).toBeNull();
//        expect(scope.$root.jwt).toBeNull();
//        expect(stateGoSpy).toHaveBeenCalledWith('login');
//        expect(showSimpleToastSpy).toHaveBeenCalledWith('Error Logging out, resetting local user session.');
//    });
//
//    it('should log in when there is an existing token on the rootscope', function() {
//        scope.$root.jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImZqb3ViZXJ0QHNrYS5hYy56YSJ9.iW4zGXNv8QET/gcwUM8parpTFSZUbeRmVF7l0N5MtdY=';
//        httpBackend.when('GET', 'http://localhost:9876/katauth/api/v1/user/login').respond(200, {session_id: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE0Mjc3OTI1NDUsIm5hbWUiOiJGcmFuY29pcyBKb3ViZXJ0IiwiaWQiOjEsInJvbGVzIjpbImNvbnRyb2xfYXV0aG9yaXR5IiwidXNlcl9hZG1pbiIsImxlYWRfb3BlcmF0b3IiXSwiZW1haWwiOiJmam91YmVydEBza2EuYWMuemEifQ.mW2sk9EVywSosakgSV8aa2R8QUKI4un7fWQVzNNMxNw'});
//        SessionService.recoverLogin();
//        httpBackend.flush();
//    });
//
//    it('should not log in when there is not an existing token on the rootscope', function() {
//        scope.$root.jwt = undefined;
//        SessionService.recoverLogin();
//        expect(scope.$root.loggedIn).toBeFalsy();
//    });
//});
//
