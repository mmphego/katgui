(function () {

    angular.module('katGui.services')
        .service('SessionService', SessionService);

    function SessionService($http, $state, $rootScope, $localStorage, $mdDialog, SERVER_URL,
                            KatGuiUtil, $timeout, $q, $interval, $log, $location, NotifyService) {

        var urlBase = SERVER_URL + '/katauth';
        var api = {};
        api.connection = null;
        api.deferredMap = {};
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
                .then(verifySuccess, verifyError);
        };


        api.login = function (session_id) {
            $rootScope.jwt = session_id;
            $http(createRequest('post', urlBase + '/user/login', {}))
                .then(function(result){
                    loginSuccess(result, session_id);
                }, loginError);
        };

        api.logout = function () {
            if ($rootScope.loggedIn) {
                $http(createRequest('post', urlBase + '/user/logout',{}))
                    .then(logoutResultSuccess, logoutResultError);
            }
        };

        api.recoverLogin = function () {
            if ($rootScope.jwt) {
                var b = $rootScope.jwt.split(".");
                var payload = JSON.parse(CryptoJS.enc.Base64.parse(b[1]).toString(CryptoJS.enc.Utf8));
                $http(createRequest('get', urlBase + '/user/verify/' + payload.req_role))
                    .then(verifySuccess, verifyError);
                $rootScope.currentUser = payload;
            }
        };

        api.onSockJSOpen = function () {
            if (api.connection && api.connection.readyState) {
                $log.info('Lead Operator Connection Established.');
                api.deferredMap['connectDefer'].resolve();
                api.connection.send($rootScope.currentUser.email);
            }
        };

        api.onSockJSClose = function () {
            $log.info('Disconnected Lead Operator Connection.');
            api.connection = null;
        };

        api.onSockJSMessage = function (e) {
            //we got a ping for LO so send a pong with our email
            api.connection.send($rootScope.currentUser.email);
        };

        api.connectListener = function (skipDeferObject) {
            $log.info('Lead Operator Connecting...');
            api.connection = new SockJS(urlBase + '/alive');
            api.connection.onopen = api.onSockJSOpen;
            api.connection.onmessage = api.onSockJSMessage;
            api.connection.onclose = api.onSockJSClose;

            if (!skipDeferObject) {
                api.deferredMap['connectDefer'] = $q.defer();
                return api.deferredMap['connectDefer'].promise;
            }
        };

        api.disconnectListener = function () {
            if (api.connection) {
                $log.info('Disconnecting Lead Operator.');
                api.connection.close();
            } else {
                $log.error('Attempting to disconnect an already disconnected connection!');
            }
        };

        function logoutResultSuccess() {
            NotifyService.showSimpleToast('Logout successful.');
            if (api.connection) {
                api.disconnectListener();
            }
            $rootScope.currentUser = null;
            $rootScope.loggedIn = false;
            $localStorage['currentUserToken'] = null;
            $rootScope.jwt = null;
            $state.go('login');
        }

        function logoutResultError(result) {
            NotifyService.showSimpleToast('Error Logging out, resetting local user session.');
            if (api.connection) {
                api.disconnectListener();
            }
            $rootScope.currentUser = null;
            $rootScope.loggedIn = false;
            $localStorage['currentUserToken'] = null;
            $rootScope.jwt = null;
            $state.go('login');
            $log.error('Error logging out, server returned with: ');
            $log.error(result);
        }

        function verifySuccess(result) {
            if (result.data.session_id) {
                if (result.data.confirmation_token) {
                    $log.info('Found confirmation token');
                    var b = result.data.confirmation_token.split(".");
                    var payload = JSON.parse(CryptoJS.enc.Base64.parse(b[1]).toString(CryptoJS.enc.Utf8));
                    if (payload.req_role === 'lead_operator' &&
                        payload.current_lo &&
                        payload.current_lo !== payload.requester) {
                        confirmRole(result.data.session_id, payload);
                    } else {
                        api.login(payload.session_id);
                    }
                } else {
                    api.login(result.data.session_id);
                }
            } else {
                //User's session expired, we got a message
                $localStorage['currentUserToken'] = null;
                $state.go('login');
                NotifyService.showSimpleToast(result.data.message);
            }
        }

        function verifyError(result) {
            if (result.data && result.data.session_id === null) {
                api.currentUser = null;
                api.loggedIn = false;
                $localStorage['currentUserToken'] = undefined;
                NotifyService.showSimpleToast('Invalid username or password.');
                $state.go('login');
            } else {
                if (result.data && result.data.err_msg) {
                    NotifyService.showSimpleToast('Error: ' + result.data.err_msg);
                    $state.go('login');
                } else {
                    if (!window.location.hash.endsWith('sensor-graph')) {
                        NotifyService.showSimpleToast('Error connecting to KATPortal.');
                        $log.error(result);
                    }
                }
            }
        }

        function confirmRole(session_id, payload) {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog) {
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
                    template: '<md-dialog md-theme="{{$root.themePrimary}}" class="md-whiteframe-z1">' +
                        '<md-toolbar class="md-toolbar-tools md-whiteframe-z1">Confirm login as {{requested_role}}</md-toolbar>' +
                        '  <md-dialog-content class="md-padding" layout="column">' +
                        '   <p><b>{{current_lo ? current_lo : "No one"}}</b> is the current Lead Operator.</p>' +
                        '   <p ng-show="current_lo">If you proceed <b>{{current_lo}}</b> will be logged out.</p>' +
                        '  </md-dialog-content>' +
                        '  <div class="md-actions" md-theme="{{$root.themePrimaryButtons}}">' +
                        '    <md-button ng-click="cancel()" class="md-primary md-raised">' +
                        '      Cancel' +
                        '    </md-button>' +
                        '    <md-button ng-click="readOnlyLogin()" class="md-primary md-raised">' +
                        '      Read Only Login' +
                        '    </md-button>' +
                        '    <md-button ng-click="proceed()" class="md-primary md-raised">' +
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
                    if (payload.req_role === 'lead_operator') {
                        api.connectListener(false);
                    }
                }
            } else {
                //User's session expired, we got a message
                $log.info('No session id');
                $localStorage['currentUserToken'] = null;
                $state.go('login');
                NotifyService.showSimpleToast(result.data.message);
            }
        }

        function loginError(result) {
            if (result.data && result.data.session_id === null) {
                api.currentUser = null;
                api.loggedIn = false;
                $localStorage['currentUserToken'] = undefined;
                NotifyService.showSimpleToast('Invalid username or password.');
                $state.go('login');
            } else {
                $log.error('Error logging return, server returned with:');
                $log.error(result.data);
                if (result.data.err_msg) {
                    NotifyService.showSimpleToast(result.data.err_msg);
                } else {
                    NotifyService.showSimpleToast('Error connecting to KATPortal.');
                }
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
