describe('AdminCtrl', function () {

    var userListResponse = [{"email": "fjoubert@ska.ac.za", "activated": true, "id": 1, "roles": ["control_authority", "lead_operator"], "name": "Francois Joubert"}, {
        "email": "md5@ska.ac.za",
        "activated": true,
        "id": 6,
        "roles": ["read_only"],
        "name": "md5"
    }, {"email": "theunsa@ska.ac.za", "activated": true, "id": 3, "roles": ["read_only"], "name": "Theuns Alberts"}, {
        "email": "gtrymore@ska.ac.za",
        "activated": true,
        "id": 4,
        "roles": ["read_only", "operator"],
        "name": "Trymore Gatsi"
    }, {"email": "martins@ska.ac.za", "activated": true, "id": 5, "roles": ["read_only"], "name": "Martin Slabbert"}, {
        "email": "new_user@ska.ac.za",
        "activated": true,
        "id": 7,
        "roles": ["read_only"],
        "name": "new user"
    }];

    beforeEach(module('katGui.util'));
    beforeEach(module('katGui.admin'));
    beforeEach(module('ngMaterial'));

    var scope, ctrl, UserService, rootScope;

    beforeEach(inject(function ($rootScope, $controller, $timeout, _UserService_, _SERVER_URL_) {
        rootScope = $rootScope;
        scope = $rootScope.$new();
        UserService = _UserService_;
        $rootScope.showSimpleToast = function () {
        };
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

    it('should create the user if the user was a temp user', inject(function ($httpBackend) {
        //?name=new%20user&email=new_user@ska.ac.za&roles=read_only
        $httpBackend.expect('POST', UserService.urlBase + '/user/add').respond(200, {
            name: 'test',
            email: 'test@mail.test',
            roles: ['read_only']
        });
        ctrl.createUser();
        expect(UserService.users.length).toEqual(1);
        UserService.users[0].roles = null;
        ctrl.saveUser(UserService.users[0]);
        $httpBackend.flush();
        //?name=new%20user&email=new_user@ska.ac.za&roles=read_only
        $httpBackend.expect('POST', UserService.urlBase + '/user/add').respond(200, "");
        ctrl.createUser();
        ctrl.saveUser(UserService.users[UserService.users.length - 1]);
        $httpBackend.flush();
    }));

    it('should list the users', inject(function ($httpBackend) {
        $httpBackend.expect('GET', UserService.urlBase + '/user/list').respond(200, userListResponse);
        //this should only call the api method, the user list is handled in the service
        ctrl.listUsers();
        $httpBackend.flush();
    }));

    it('should undo user changes', function () {
        //this should only call the api method, the user list is handled in the service
        UserService.users = userListResponse;
        ctrl.editUser(UserService.users[0]);
        expect(UserService.users[0].editing).toBeTruthy();
        UserService.users[0].name = 'new fake name';
        UserService.users[0].email = 'newake@email.com';
        UserService.users[0].roles = ['new fake role'];
        ctrl.undoUserChanges(UserService.users[0]);
        expect(UserService.users[0].name).toEqual('Francois Joubert');
        expect(UserService.users[0].email).toEqual('fjoubert@ska.ac.za');
        expect(UserService.users[0].roles).toEqual(["control_authority", "lead_operator"]);
    });

    it('should not undo user changes if there is no original user data', function () {
        //this should only call the api method, the user list is handled in the service
        UserService.users = userListResponse;
        expect(UserService.users[0].editing).toBeFalsy();
        ctrl.undoUserChanges(UserService.users[0]);
        expect(UserService.users[0].name).toEqual('Francois Joubert');
        expect(UserService.users[0].email).toEqual('fjoubert@ska.ac.za');
        expect(UserService.users[0].roles).toEqual(["control_authority", "lead_operator"]);
    });

    it('should undo user creation if user was temp', function () {
        ctrl.createUser();
        expect(UserService.users.length).toBe(1);
        ctrl.undoUserChanges(UserService.users[0]);
        expect(UserService.users.length).toBe(0);
    });

    it('should reset the password', inject(function () {
        //running the code at least to check for exceptions
        ctrl.resetPassword(null, {name: 'test', roles: [], id: 1});
    }));

    it('should unbind keyboard shortcuts', inject(function () {
        //ctrl.unbindShortcuts = function() {};
        var unbindShortcutsSpy = spyOn(ctrl, "unbindShortcuts");
        var undbindLoginSuccessSpy = spyOn(ctrl, "undbindLoginSuccess");
        scope.$emit("$destroy");
        scope.$digest();
        expect(unbindShortcutsSpy).toHaveBeenCalled();
        expect(undbindLoginSuccessSpy).toHaveBeenCalled();
    }));

    it('should run the afterInit function to lists users if the current user has the user_admin role', function () {
        var listUsersSpy = spyOn(ctrl, "listUsers");
        rootScope.currentUser = {roles: ['user_admin']};
        ctrl.afterInit();
        expect(listUsersSpy).toHaveBeenCalled();

    });

    it('should run the afterInit function and NOT lists users if the current user do not have the user_admin role', function () {
        var listUsersSpy = spyOn(ctrl, "listUsers");
        rootScope.currentUser = {roles: ['read_only']};
        ctrl.afterInit();
        expect(listUsersSpy).not.toHaveBeenCalled();
    });

    it('should undo change when escape is pressed', function () {
        ctrl.sortedUserData = [{id: 'fakeId', name: 'fake_name', email: 'fake@email.com', activated: true, temp: true}];
        var undoUserChangesSpy = spyOn(ctrl, "undoUserChanges");
        ctrl.keydown(null, 27);
        expect(undoUserChangesSpy).toHaveBeenCalled();
    });

    it('should do nothing if there is nothing to undo when escape is pressed', function () {
        ctrl.sortedUserData = [{id: 'fakeId', name: 'fake_name', email: 'fake@email.com', activated: true}];
        var undoUserChangesSpy = spyOn(ctrl, "undoUserChanges");
        ctrl.keydown(null, 27);
        expect(undoUserChangesSpy).not.toHaveBeenCalled();
    });

    it('should NOT undo change when a key is pressed', function () {
        ctrl.sortedUserData = [{id: 'fakeId', name: 'fake_name', email: 'fake@email.com', activated: true}];
        var undoUserChangesSpy = spyOn(ctrl, "undoUserChanges");
        ctrl.keydown(null, -1);
        expect(undoUserChangesSpy).not.toHaveBeenCalled();
    });
});


