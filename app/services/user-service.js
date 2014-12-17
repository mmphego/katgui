(function () {

    angular.module('katGui.services')
        .service('UserService', UserService);

    function UserService($http) {

        var urlBase = 'http://localhost:8010';
        var api = {};
        api.users = [];

        api.listUsers = function () {
            $http.get(urlBase + '/user/list').then(function (result) {
                if (result && result.data) {
                    api.users.splice(0, api.users.length);
                    result.data.forEach(function (user) {
                        api.users.push(user);
                    });
                }
                console.log(result);

            });
        };

        api.createUser = function (user) {
            var postStr = urlBase + '/user/add?name=' + encodeURI(user.name) + '&password=' + user.password + '&email=' + encodeURI(user.email) + '&roles=' + encodeURI(user.roles);
            return $http.post(postStr);
        };

        api.updateUser = function (user) {
            var postStr = urlBase + '/user/' + user.id + '?name=' + encodeURI(user.name) + '&password=' + user.password + '&email=' + encodeURI(user.email) + '&roles=' + encodeURI(user.roles);
            return $http.post(postStr);
        };


        return api;
    }

})();
