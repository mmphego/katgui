(function () {

    angular.module('katGui.services')
        .service('SessionService', SessionService);

    function SessionService($http, $state, $rootScope, $localStorage, SERVER_URL) {

        var urlBase = 'http://monctl.devw.camlab.kat.ac.za:8810'; //SERVER_URL + '/katauth/api/v1';
        var api = {};
        $rootScope.jwt = $localStorage['currentUserToken'];

        var jwtHeader = {
            "alg": "HS256",
            "typ": "JWT"
        };

        api.login = function (email, password) {

            var jwtPayload = { "email": email };
            var msg = window.btoa(JSON.stringify(jwtHeader)) + "." + window.btoa(JSON.stringify(jwtPayload));
            msg = msg.replace(/=/g , "");
            var pass = CryptoJS.HmacSHA256(msg, CryptoJS.SHA256(password).toString());
            $rootScope.jwt = msg + '.' + pass.toString(CryptoJS.enc.Base64);
            $http(createRequest('get', urlBase + '/user/login'))
                .success(loginSuccess)
                .error(loginError);
        };

        api.logout = function () {
            if ($rootScope.loggedIn) {
                $http(createRequest('get', urlBase + '/user/logout'))
                    .success(logoutResultSuccess)
                    .error(logoutResultError);
            }
        };

        api.recoverLogin = function () {
            if ($rootScope.jwt) {
                $http(createRequest('get', urlBase + '/user/login'))
                    .success(loginSuccess)
                    .error(loginError);
            }
        };

        function logoutResultSuccess() {
            $rootScope.showSimpleToast('Logout successful.');
            $rootScope.currentUser = null;
            $rootScope.loggedIn = false;
            $localStorage['currentUserToken'] = null;
            $rootScope.jwt = null;
            $state.go('login');
        }

        function logoutResultError(result) {
            $rootScope.showSimpleToast('Error Logging out, resetting local user session.');
            $rootScope.currentUser = null;
            $rootScope.loggedIn = false;
            $localStorage['currentUserToken'] = null;
            $rootScope.jwt = null;
            $state.go('login');
            console.error('Error logging out, server returned with: ');
            console.error(result);
        }

        function loginSuccess(result) {
            if (result.session_id) {
                var a = result.session_id.split(".");
                $rootScope.session_id = result.session_id;
                var payload = JSON.parse(CryptoJS.enc.Base64.parse(a[1]).toString(CryptoJS.enc.Utf8));
                if (payload.name !== null) {
                    $rootScope.currentUser = payload;
                    $rootScope.loggedIn = true;
                    //only redirect when logging in from login screen
                    if ($state.current.name === 'login') {
                        $state.go('home');
                    }
                    $localStorage['currentUserToken'] = $rootScope.jwt;
                    $rootScope.showSimpleToast('Login successful, welcome ' + payload.name + '.');
                    $rootScope.$emit('loginSuccess', true);
                    $rootScope.connectEvents();
                }
            } else {
                //User's session expired, we got a message
                $localStorage['currentUserToken'] = null;
                $state.go('login');
                $rootScope.showSimpleToast(result.message);
            }
        }

        function loginError(result) {
            if (result && result.session_id === null) {
                api.currentUser = null;
                api.loggedIn = false;
                $localStorage['currentUserToken'] = undefined;
                $rootScope.showSimpleToast('Invalid username or password.');
                $state.go('login');
            } else {
                console.error('Error logging return, server returned with:');
                console.error(result);
                $rootScope.showSimpleToast('Error connecting to KATPortal.');
                $state.go('login');
            }
        }

        function createRequest(method, url) {
            return {
                method: method,
                url: url,
                headers: {
                    'Authorization': 'CustomJWT ' + $rootScope.jwt
                }
            };
        }

        return api;
    }

})();
