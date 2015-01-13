(function () {

    angular.module('katGui.services')
        .service('UserService', UserService);

    function UserService($http, $q, SERVER_URL, $rootScope) {

        var api = {};
        api.urlBase = SERVER_URL + ':8010';
        api.users = [];

        api.listUsers = function () {

            var def = $q.defer();

            $http(createRequest('get', api.urlBase + '/user/list')).then(

                function (result) {

                    if (result && result.data) {
                        api.users.splice(0, api.users.length);
                        result.data.forEach(function (user) {
                            api.users.push(user);
                        });
                        def.resolve();
                    } else {
                        console.error('Could not retrieve any users.');
                        def.reject();
                    }
                });

            return def.promise;
        };

        api.createUser = function (user) {
            return $http(createRequest('post',
                api.urlBase + '/user/add',
                {
                    name: user.name,
                    email: user.email,
                    roles: user.roles
                }));
        };

        api.updateUser = function (user) {
            return $http(createRequest('post',
                api.urlBase + '/user/modify/' + user.id,
                {
                    name: user.name,
                    email: user.email,
                    activated: user.activated,
                    roles: user.roles.join(',')
                }));
        };

        api.resetPassword = function (user, passwordHash) {
            return $http(createRequest('post',
                api.urlBase + '/user/reset/' + user.id,
                {'password': passwordHash}));
        };

        api.addTempCreatedUser = function (user) {
            api.users.push(user);
        };

        api.removeTempUser = function (user) {
            api.users.splice(_.indexOf(api.users, {id: user.id}), 1);
        };

        function createRequest(method, url, data) {
            var req = {
                method: method,
                url: url,
                headers: {
                    'Authorization': 'CustomJWT ' + $rootScope.jwt
                }
            };

            if (data && method === 'post') {
                req.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                req.params = data;
            }

            return req;
        }

        return api;
    }

})();
