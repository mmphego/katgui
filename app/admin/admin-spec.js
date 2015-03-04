describe('AdminCtrl', function () {

    var userListResponse = [{"email":"fjoubert@ska.ac.za","activated":true,"id":1,"roles":["control_authority","lead_operator"],"name":"Francois Joubert"},{"email":"md5@ska.ac.za","activated":true,"id":6,"roles":["read_only"],"name":"md5"},{"email":"theunsa@ska.ac.za","activated":true,"id":3,"roles":["read_only"],"name":"Theuns Alberts"},{"email":"gtrymore@ska.ac.za","activated":true,"id":4,"roles":["read_only","operator"],"name":"Trymore Gatsi"},{"email":"martins@ska.ac.za","activated":true,"id":5,"roles":["read_only"],"name":"Martin Slabbert"},{"email":"new_user@ska.ac.za","activated":true,"id":7,"roles":["read_only"],"name":"new user"}];

    beforeEach(module('katGui.util'));
    beforeEach(module('katGui.admin'));
    beforeEach(module('ngMaterial'));

    var scope, ctrl, UserService;

    beforeEach(inject(function ($rootScope, $controller, $timeout, _UserService_, _SERVER_URL_) {
        scope = $rootScope.$new();
        UserService = _UserService_;

        ctrl = $controller('AdminCtrl', {$scope: scope, UserService: UserService, SERVER_URL: _SERVER_URL_});
    }));

    it('should init the controller with some values and bind service values', inject(function () {

        expect(ctrl.userRoles.length).not.toEqual(0);
        expect(ctrl.orderByFields.length).not.toEqual(0);
        expect(ctrl.userData).not.toBeNull();
    }));

    it('should create a temp user and set that user in edit mode', inject(function () {

        ctrl.createUser();
        expect(UserService.users.length).toEqual(1);
    }));

    it('should set the order by values correctly', inject(function () {

        //order by name
        ctrl.setOrderBy(ctrl.orderByFields[1].value);
        expect(ctrl.orderBy).toBe(ctrl.orderByFields[1]);
        //order by name again, reverse sort
        ctrl.setOrderBy(ctrl.orderByFields[1].value);
        expect(ctrl.orderBy.reverse).toBeTruthy();
        //order by name again, clear sorting
        ctrl.setOrderBy(ctrl.orderByFields[1].value);
        expect(ctrl.orderBy).toBeNull();

        ctrl.setOrderBy(null);
        expect(ctrl.orderBy).toBe(undefined);

    }));

    it('should clear the reverse sorting properly', function () {

        //order by name
        ctrl.setOrderBy(ctrl.orderByFields[1].value);
        expect(ctrl.orderBy).toBe(ctrl.orderByFields[1]);
        //order by name again, reverse sort
        ctrl.setOrderBy(ctrl.orderByFields[1].value);
        expect(ctrl.orderBy.reverse).toBeTruthy();

        //test for existing false reverse set - it should do nothing
        ctrl.orderByFields[1].reverse = false;
        ctrl.setOrderBy(ctrl.orderByFields[1].value);
        expect(ctrl.orderBy.reverse).toBeFalsy();
    });

    it('should set the edit flag on the user', function () {

        UserService.users.push({id: 'fakeId', name: 'fake_name', email: 'fake@email.com', activated: true});

        ctrl.editUser(UserService.users[0]);
        expect(UserService.users[0].editing).toBeTruthy();
        //this should do nothing
        ctrl.editUser(UserService.users[0]);
        expect(UserService.users[0].editing).toBeTruthy();
    });


    //it('should create the user if the user was a temp user', inject(function($httpBackend) {
    //
    //    //?name=new%20user&email=new_user@ska.ac.za&roles=read_only
    //    $httpBackend.expect('POST', UserService.urlBase + '/user/add').respond(200, "");
    //    $httpBackend.expect('GET', UserService.urlBase + '/user/list').respond(200, userListResponse);
    //
    //    ctrl.createUser();
    //    expect(UserService.users.length).toEqual(1);
    //    UserService.users[0].roles = null;
    //    ctrl.saveUser(UserService.users[0]);
    //
    //    $httpBackend.flush();
    //
    //    //?name=new%20user&email=new_user@ska.ac.za&roles=read_only
    //    $httpBackend.expect('POST', UserService.urlBase + '/user/add').respond(200, "");
    //    $httpBackend.expect('GET', UserService.urlBase + '/user/list').respond(200, userListResponse);
    //
    //    ctrl.createUser();
    //    ctrl.saveUser(UserService.users[UserService.users.length - 1]);
    //
    //    $httpBackend.flush();
    //
    //    //?name=Francois%20Joubert&email=fjoubert@ska.ac.za&activated=true&roles=control_authority,lead_operator
    //    $httpBackend.expect('POST', UserService.urlBase + '/user/modify/1').respond(200, "");
    //    $httpBackend.expect('GET', UserService.urlBase + '/user/list').respond(200, userListResponse);
    //
    //    ctrl.saveUser(UserService.users[0]);
    //
    //    $httpBackend.flush();
    //}));
    //
    //it('should list the users', inject(function($httpBackend) {
    //
    //    $httpBackend.expect('GET', UserService.urlBase + '/user/list').respond(200, userListResponse);
    //
    //    //this should only call the api method, the user list is handled in the service
    //    ctrl.listUsers();
    //
    //    $httpBackend.flush();
    //}));
    //
    //it('should undo user changes', function() {
    //
    //    //this should only call the api method, the user list is handled in the service
    //    UserService.users = userListResponse;
    //    ctrl.editUser(UserService.users[0]);
    //    expect(UserService.users[0].editing).toBeTruthy();
    //
    //    UserService.users[0].name = 'new fake name';
    //    UserService.users[0].email = 'newake@email.com';
    //    UserService.users[0].roles = ['new fake role'];
    //
    //    ctrl.undoUserChanges(UserService.users[0]);
    //    expect(UserService.users[0].name).toEqual('Francois Joubert');
    //    expect(UserService.users[0].email).toEqual('fjoubert@ska.ac.za');
    //    expect(UserService.users[0].roles).toEqual(["control_authority","lead_operator"]);
    //
    //});
    //
    //it('should undo user creation if user was temp', function () {
    //    ctrl.createUser();
    //    expect(UserService.users.length).toBe(1);
    //    ctrl.undoUserChanges(UserService.users[0]);
    //    expect(UserService.users.length).toBe(0);
    //});
    //
    //it('should deactivate a user', inject(function($httpBackend) {
    //
    //    //?name=Francois%20Joubert&email=fjoubert@ska.ac.za&activated=false&roles=control_authority,lead_operator
    //    $httpBackend.expect('POST', UserService.urlBase + '/user/modify/1').respond(200, "");
    //    $httpBackend.expect('GET', UserService.urlBase + '/user/list').respond(200, userListResponse);
    //
    //    UserService.users = userListResponse;
    //    ctrl.deactivateUser(UserService.users[0]);
    //
    //    $httpBackend.flush();
    //}));
    //
    //it('should reset the password', inject(function($httpBackend, $mdDialog) {
    //
    //    UserService.users = userListResponse;
    //    ctrl.resetPassword(null, UserService.users[0]);
    //
    //    //$httpBackend.expect('POST', UserService.urlBase + '/user/1?name=Francois%20Joubert&password=undefined&email=fjoubert@ska.ac.za&activated=false&roles=control_authority,lead_operator').respond(200, "");
    //    //$httpBackend.expect('GET', UserService.urlBase + '/user/list').respond(200, userListResponse);
    //
    //    //UserService.users = userListResponse;
    //    //ctrl.deactivateUser(UserService.users[0]);
    //
    //    //$httpBackend.flush();
    //}));

});


