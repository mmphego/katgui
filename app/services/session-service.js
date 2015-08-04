(function () {

    angular.module('katGui.services')
        .service('SessionService', SessionService);

    function SessionService($http, $state, $rootScope, $localStorage, $mdDialog, SERVER_URL, $log, NotifyService) {

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
            $http(createRequest('post', urlBase + '/user/login', {}))
                .success(function(result){
                    loginSuccess(result, session_id);
                })
                .error(loginError);
        };

        api.logout = function () {
            if ($rootScope.loggedIn) {
                $http(createRequest('post', urlBase + '/user/logout',{}))
                    .success(logoutResultSuccess)
                    .error(logoutResultError);
            }
        };

        api.recoverLogin = function () {
            if ($rootScope.jwt) {
                $http(createRequest('post', urlBase + '/user/login'))
                    .success(function(result){
                        loginSuccess(result, $rootScope.jwt);
                    })
                    .error(loginError);
            }
        };

        function logoutResultSuccess() {
            NotifyService.showSimpleToast('Logout successful.');
            $rootScope.currentUser = null;
            $rootScope.loggedIn = false;
            $localStorage['currentUserToken'] = null;
            $rootScope.jwt = null;
            $state.go('login');
        }

        function logoutResultError(result) {
            NotifyService.showSimpleToast('Error Logging out, resetting local user session.');
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
                    $log.info('Found confirmation token');
                    var b = result.confirmation_token.split(".");
                    var payload = JSON.parse(CryptoJS.enc.Base64.parse(b[1]).toString(CryptoJS.enc.Utf8));
                    if (payload.req_role === 'lead_operator' &&
                        payload.current_lo &&
                        payload.current_lo.length > 0 &&
                        payload.current_lo !== payload.requester) {
                        confirmRole(result.session_id, payload);
                    } else {
                        api.login(payload.session_id);
                    }
                } else {
                    $log.info('No token, off to login');
                    api.login(result.session_id);
                }
            } else {
                //User's session expired, we got a message
                $localStorage['currentUserToken'] = null;
                $state.go('login');
                NotifyService.showSimpleToast(result.message);
            }
        }

        function verifyError(result) {
            if (result && result.session_id === null) {
                api.currentUser = null;
                api.loggedIn = false;
                $localStorage['currentUserToken'] = undefined;
                NotifyService.showSimpleToast('Invalid username or password.');
                $state.go('login');
            } else {
                console.error('Error logging return, server returned with:');
                console.error(result);
                NotifyService.showSimpleToast('Error connecting to KATPortal.');
                $state.go('login');
            }
        }

        function confirmRole(session_id, payload) {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog) {
                        $scope.themePrimary = $rootScope.themePrimary;
                        $scope.themePrimaryButtons = $rootScope.themePrimaryButtons;
                        var readonly_session_id = session_id;
                        var requested_session_id = payload.session_id;
                        $scope.current_lo = payload.current_lo;
                        $scope.requested_role = payload.req_role;
                        $scope.readOnlyLogin = function () {
                            session_id = readonly_session_id;
                            $mdDialog.hide();
                        };
                        $scope.proceed = function () {
                            session_id = requested_session_id;
                            $mdDialog.hide();
                        };

                        $scope.cancel = function () {
                            session_id = null;
                            $mdDialog.hide();
                        };
                    },
                    template: '<md-dialog md-theme="{{themePrimary}}" class="md-whiteframe-z1">' +
                        '<md-toolbar class="md-toolbar-tools md-whiteframe-z1">Confirm login as {{requested_role}}</md-toolbar>' +
                        '  <md-dialog-content class="md-padding" layout="column">' +
                        '   <p><b>{{current_lo ? current_lo : "No one"}}</b> is the current Lead Operator.</p>' +
                        '   <p ng-show="current_lo">If you proceed <b>{{current_lo}}</b> will be logged out.</p>' +
                        '  </md-dialog-content>' +
                        '  <div class="md-actions" md-theme="{{themePrimaryButtons}}">' +
                        '    <md-button ng-click="cancel()" class="md-primary">' +
                        '      Cancel' +
                        '    </md-button>' +
                        '    <md-button ng-click="readOnlyLogin()" class="md-primary">' +
                        '      Read Only Login' +
                        '    </md-button>' +
                        '    <md-button ng-click="proceed()" class="md-primary">' +
                        '      Proceed' +
                        '    </md-button>' +
                        '  </div>' +
                        '</md-dialog>'
                        })
                .then(function() {
                    if (session_id) {
                        api.login(session_id);
                    }
                });
        }

        function loginSuccess(result, session_id) {
            if (session_id) {
                $log.info('Found session id');
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
                    NotifyService.showSimpleToast('Login successful, welcome ' + payload.name + '.');
                    $rootScope.$emit('loginSuccess', true);
                    $rootScope.connectEvents();
                }
            } else {
                //User's session expired, we got a message
                $log.info('No session id');
                $localStorage['currentUserToken'] = null;
                $state.go('login');
                NotifyService.showSimpleToast(result.message);
            }
        }

        function loginError(result) {
            if (result && result.session_id === null) {
                api.currentUser = null;
                api.loggedIn = false;
                $localStorage['currentUserToken'] = undefined;
                NotifyService.showSimpleToast('Invalid username or password.');
                $state.go('login');
            } else {
                $log.error('Error logging return, server returned with:');
                $log.error(result);
                NotifyService.showSimpleToast('Error connecting to KATPortal.');
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
