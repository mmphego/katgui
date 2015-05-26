describe('katGui util', function () {

    beforeEach(module('katGui.util'));

    var scope, timeout, element, compile, filter;

    beforeEach(inject(function ($rootScope, $compile, _$timeout_, _$filter_) {
        compile = $compile;
        timeout = _$timeout_;
        scope = $rootScope.$new();
        filter = _$filter_;
    }));

    it('should search with a regex expression using a custom filter', function () {
        var orderByFields = [
            {label: 'Id', value: 'id'},
            {label: 'Name', value: 'name'},
            {label: 'Email', value: 'email'},
            {label: 'Roles', value: 'roles'}
        ];
        var userList = [
            {
                "email": "fjoubert@ska.ac.za",
                "activated": true,
                "id": 1,
                "roles": ["control_authority", "lead_operator"],
                "name": "Francois Joubert"
            }, {
                "email": "md5@ska.ac.za",
                "activated": true,
                "id": 6,
                "roles": ["read_only"],
                "name": "md5"
            }, {
                "email": "theunsa@ska.ac.za",
                "activated": true,
                "id": 3,
                "roles": ["read_only"],
                "name": "Theuns Alberts"
            }, {
                "email": "gtrymore@ska.ac.za",
                "activated": true,
                "id": 4,
                "roles": ["read_only", "operator"],
                "name": "Trymore Gatsi"
            }, {
                "email": "martins@ska.ac.za",
                "activated": true,
                "id": 5,
                "roles": ["read_only"],
                "name": "Martin Slabbert"
            }, {
                "email": "new_user@ska.ac.za",
                "activated": true,
                "id": 7,
                "roles": ["read_only"],
                "name": "new user"
            }, {
                "email": "new_use2@ska.ac.za",
                "activated": true,
                "id": 8,
                "roles": ["read_only"],
                "name": "new use2"
            }];
        var result = filter('regexSearch')(userList, orderByFields, 'try.ore');
        expect(result.length).toBe(1);
        result = filter('regexSearch')(userList, orderByFields, 'new.*');
        expect(result.length).toBe(2);
        result = filter('regexSearch')(userList, orderByFields, '8');
        expect(result.length).toBe(1);
        result = filter('regexSearch')(userList, orderByFields, '.*ope*');
        expect(result.length).toBe(2);
        result = filter('regexSearch')(userList, orderByFields, '');
        expect(result.length).toBe(7);
    });
});
