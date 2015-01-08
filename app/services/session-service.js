(function () {

    angular.module('katGui.services')
        .service('SessionService', SessionService);

    function SessionService($http, $state, $rootScope, $localStorage, SERVER_URL) {

        var urlBase = SERVER_URL + ':8010';
        var api = {};
        $rootScope.jwt = $localStorage['currentUserToken'];

        var jwtHeader = {
            "alg": "HS256",
            "type": "JWT"
        };

        api.login = function (email, password) {

            var jwtPayload = { "email": email };
            var msg = window.btoa(JSON.stringify(jwtHeader)) + "." + window.btoa(JSON.stringify(jwtPayload));
            msg = msg.replace(/=/g , "");
            var pass = CryptoJS.HmacSHA256(msg, CryptoJS.SHA256(password).toString());
            $rootScope.jwt = msg + '.' + pass.toString(CryptoJS.enc.Base64);
            $http.get(urlBase + '/user/login');// + $rootScope.jwt).then(loginResultReceived);
        };

        api.logout = function () {
            if ($rootScope.loggedIn) {
                $http.get(urlBase + '/user/' + $rootScope.currentUser.email + '/logout').then(logoutResultReceived);
            }
        };

        api.recoverLogin = function () {
            if ($rootScope.jwt) {
                $http.get(urlBase + '/user/login/' + $rootScope.jwt).then(loginResultReceived);
            }
        };

        function logoutResultReceived(result) {
            $rootScope.showSimpleToast('Logout successful.');
            $rootScope.currentUser = null;
            $rootScope.loggedIn = false;
            $localStorage['currentUserToken'] = null;
            $rootScope.jwt = null;
            $state.go('login');
        }

        function loginResultReceived(result) {

            var a = result.data.split(".");
            var payload = JSON.parse(window.atob(a[1]));
            if (payload.name !== null) {
                $rootScope.currentUser = payload;
                $rootScope.loggedIn = true;
                if (!$localStorage['currentUserToken']) {
                    $state.go('home');
                }
                $localStorage['currentUserToken'] = $rootScope.jwt;
                $rootScope.showSimpleToast('Login successful, welcome ' + payload.name + '.');

                $rootScope.connectEvents();
                //TODO implement timeout
            } else {
                api.currentUser = null;
                api.loggedIn = false;
                $localStorage['currentUserToken'] = null;
                $state.go('login');
                $rootScope.showSimpleToast('Invalid login credentials!');
            }
        }

        return api;
    }

})();
