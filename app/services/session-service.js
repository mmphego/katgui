(function () {

    angular.module('katGui.services')
        .service('SessionService', SessionService);

<<<<<<< HEAD
    function SessionService($http, $state, $rootScope, $localStorage, $mdDialog, SERVER_URL) {
=======
    function SessionService($http, $state, $rootScope, $localStorage, SERVER_URL, $log) {
>>>>>>> master

        var urlBase = SERVER_URL + '/katauth/api/v1';
        var api = {};
        $rootScope.jwt = $localStorage['currentUserToken'];

        var jwtHeader = {
            "alg": "HS256",
            "typ": "JWT"
        };

        api.verify = function (email, password, role) {

            var jwtPayload = { "email": email };
            var msg = window.btoa(JSON.stringify(jwtHeader)) + "." + window.btoa(JSON.stringify(jwtPayload));
            msg = msg.replace(/=/g , "");
            var pass = CryptoJS.HmacSHA256(msg, CryptoJS.SHA256(password).toString());
            $rootScope.jwt = msg + '.' + pass.toString(CryptoJS.enc.Base64);
            $http(createRequest('get', urlBase + '/user/verify/' + role))
                .success(verifySuccess)
                .error(verifyError);
        };
 

        api.login = function (session_id) {

            $rootScope.jwt = session_id;
            $http(createRequest('get', urlBase + '/user/login'))
                .success(function(result){
                    loginSuccess(result, session_id); 
                })
                .error(loginError);
        };

        api.logout = function () {
            if ($rootScope.loggedIn) {
                $http(createRequest('post', urlBase + '/user/logout',
                    {
                        email: $rootScope.currentUser.email                    
                    }))
                    .success(logoutResultSuccess)
                    .error(logoutResultError);
            }
        };

        api.recoverLogin = function () {
            if ($rootScope.jwt) {
                $http(createRequest('get', urlBase + '/user/login'))
                    .success(function(result){
                        console.log('login successfully returned');
                        loginSuccess(result, $rootScope.jwt); 
                    })
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
            $log.error('Error logging out, server returned with: ');
            $log.error(result);
        }

        function verifySuccess(result) {
            if (result.session_id) {
                if (result.confirmation_token) {
                    console.log('Found confirmation token');
                    confirmRole(result.session_id, result.confirmation_token);
                } else {
                    console.log('No token, off to login');
                    api.login(result.session_id);
                }
            } else {
                //User's session expired, we got a message
                $localStorage['currentUserToken'] = null;
                $state.go('login');
                $rootScope.showSimpleToast(result.message);
            }
        }

        function verifyError(result) {
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

        function confirmRole(session_id, confirmation_token) {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog) {
                        $scope.themePrimary = $rootScope.themePrimary;
                        $scope.themePrimaryButtons = $rootScope.themePrimaryButtons;
                        var readonly_session_id = session_id;
                        var b = confirmation_token.split(".");
                        var payload = JSON.parse(CryptoJS.enc.Base64.parse(b[1]).toString(CryptoJS.enc.Utf8));
                        var readonly_session_id = session_id;
                        var requested_session_id = payload.session_id;
                        $scope.current_lo = payload.current_lo;
                        $scope.requested_role = payload.req_role;
                        $scope.hide = function () {
                            session_id = readonly_session_id;
                            $mdDialog.hide();
                        };
                        $scope.proceed = function () {
                            session_id = requested_session_id;
                            $mdDialog.hide();
                        };
                    },
                    template: '<md-dialog md-theme="{{themePrimary}}" class="md-whiteframe-z1">' +
                        '<md-toolbar><div style="padding-left: 20px; padding-top: 10px;"><h3>Confirm login as {{requested_role}}</h3></div></md-toolbar>' +
                        '  <md-dialog-content class="md-padding" layout="column">' +
                        '   <p><strong>{{current_lo}}</strong> is the current Lead Operator?</p>' +
                        '   <p>If you decline you will be logged in as a read-only user.</p>' +        
                        '  </md-dialog-content>' +
                        '  <div class="md-actions">' +
                        '    <md-button ng-click="proceed()" class="md-primary">' +
                        '      Proceed' +
                        '    </md-button>' +
                        '    <md-button ng-click="hide()" class="md-primary">' +
                        '      Cancel' +
                        '    </md-button>' +
                        '  </div>' +
                        '</md-dialog>'
                        })
                .then(function() {
                    api.login(session_id);
                    console.log('Confirmation complete!');   
                });
        };

        function loginSuccess(result, session_id) {
            if (session_id) {
                console.log('Found session id');
                var a = session_id.split(".");
                $rootScope.session_id = session_id;
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
                console.log('No session id');
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
                $log.error('Error logging return, server returned with:');
                $log.error(result);
                $rootScope.showSimpleToast('Error connecting to KATPortal.');
                $state.go('login');
            }
        }

        function createRequest(method, url, data) {
            var req = {
                method: method,
                url: url,
                headers: {
                    'Authorization': 'CustomJWT ' + $rootScope.jwt
                }
            };

            if (data && method === 'post') {
                req.headers['Content-Type'] = 'application/json';
                req.data = data;
            }

            return req;
        }

        return api;
    }

})();
