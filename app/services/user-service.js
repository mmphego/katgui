(function () {

    angular.module('katGui.services')
        .service('UserService', UserService);

    function UserService($http, $q, SERVER_URL) {

        var api = {};
        api.urlBase = SERVER_URL + ':8010';
        api.users = [];

        api.listUsers = function () {

            var def = $q.defer();

            $http.get(api.urlBase + '/user/list').then(function (result) {

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
            var postStr = api.urlBase + '/user/add?name=' + encodeURI(user.name) + '&email=' + encodeURI(user.email) + '&roles=' + encodeURI(user.roles);
            return $http.post(postStr);
        };

        api.updateUser = function (user) {
            var postStr = api.urlBase + '/user/' + user.id + '?name=' + encodeURI(user.name) + '&email=' + encodeURI(user.email) + '&activated=' + user.activated + '&roles=' + encodeURI(user.roles);
            return $http.post(postStr);
        };

        api.resetPassword = function (user, passwordHash) {
            var postStr = api.urlBase + '/user/reset/' + user.id + '?password=' + passwordHash;
            return $http.post(postStr);
        };

        api.addTempCreatedUser = function (user) {
            api.users.push(user);
        };

        api.removeTempUser = function (user) {
            api.users.splice(_.indexOf(api.users, {id: user.id}), 1);
        };

        return api;
    }

})();
