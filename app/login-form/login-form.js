angular.module('katGui')

    .controller('LoginFormCtrl', function ($scope, $rootScope, $state, Session, AUTH_EVENTS, USER_ROLES, AuthService, AlarmService) {

        $scope.title = 'kat gui';
        $scope.loginResult = "";
        $scope.loginDetails = "";

        $scope.credentials = {
            username: '',
            password: ''
        };

//        $scope.loginGoogle = function () {
//            var options = {
//                'callback': $scope.loginFinished,
//                'clientid': '626410560822-0tncuu7jhpbetei9v9uji2l5oit9np9l.apps.googleusercontent.com',
//                'cookiepolicy': 'single_host_origin'
//            };
//
//            gapi.auth.signIn(options);
//        };

        $scope.login = function (credentials) {

            //until we have a real login post to call
//            var user = { name: credentials.username, role: USER_ROLES.expert};


            Session.create('sessionid1', 'userid1', USER_ROLES.expert);

//            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
//            $rootScope.setCurrentUser(user);

            AlarmService.connectListener();
            $state.go('landing');

//            AuthService.login(credentials).then(function (user) {
//                $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
//                $scope.setCurrentUser(user);
//                  $state.go('landing');
//            }, function () {
//                $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
//            });
        };

        $scope.forgotPassword = function () {
//            alert('nothing to see here yet...');
        };

//        $scope.loginFinished = function (authResult) {
//            if (authResult) {
//                console.log(authResult);
//
//                $scope.loginResult = "";
//
//                if (authResult['status']['signed_in']) {
//                    $scope.loginResult = 'User granted access:';
//                    //gapi.auth.setToken(authResult);
//
//                    Session.create(authResult['sessionState'], authResult['client_id'], USER_ROLES.expert);
//
//                    $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
//
//                    var user = { name: '', role: USER_ROLES.all};
//                    $scope.setCurrentUser(user);
//
////                    gapi.client.load('plus', 'v1', function () {
////                        var request = gapi.client.plus.people.get({
////                            'userId': 'me'
////                        });
////                        request.execute(function (resp) {
////                            var user = { name: resp.displayName, role: USER_ROLES.expert};
////                            $scope.setCurrentUser(user);
////
////                            console.log('Retrieved profile for: ' + resp.displayName);
////                        });
////                    });
//
//                    $state.go('landing');
//
//                } else {
//                    $scope.loginResult = 'Access denied: ' + authResult['error'];
//                    $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
//                }
//                $scope.loginDetails = authResult;
//            } else {
//                $scope.loginResult = 'Empty authResult';
//                $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
//            }
//        };
    });