angular.module('katGui', ['ui.bootstrap', 'ui.utils', 'ui.router', 'ngAnimate'])

    .constant('UI_VERSION', '0.0.1')

    .constant('AUTH_EVENTS', {
        loginSuccess: 'auth-login-success',
        loginFailed: 'auth-login-failed',
        logoutSuccess: 'auth-logout-success',
        sessionTimeout: 'auth-session-timeout',
        notAuthenticated: 'auth-not-authenticated',
        notAuthorized: 'auth-not-authorized'
    })

    .constant('USER_ROLES', {
        noAuth: 'noAuth',
        all: '*',
        monitor: 'monitor',
        operator: 'operator',
        leadOperator: 'leadOperator',
        control: 'control',
        expert: 'expert'
    })

    .config(function ($stateProvider, $urlRouterProvider, USER_ROLES) {

        $stateProvider.state('login', {
            url: '/login',
            templateUrl: 'login-form/login-form.html',
            data: {
                authorizedRoles: [USER_ROLES.noAuth]
            }
        });
        $stateProvider.state('admin', {
            url: '/admin',
            templateUrl: 'admin/admin.html',
            data: {
                authorizedRoles: [USER_ROLES.leadOperator, USER_ROLES.control, USER_ROLES.expert]
            }
        });
        $stateProvider.state('alarms', {
            url: '/alarms',
            templateUrl: 'alarms/alarms.html',
            data: {
                authorizedRoles: [USER_ROLES.leadOperator, USER_ROLES.control, USER_ROLES.expert]
            }
        });
        $stateProvider.state('landing', {
            url: '/landing',
            templateUrl: 'landing/landing.html',
            data: {
                authorizedRoles: [USER_ROLES.all]
            }
        });
        $stateProvider.state('operatorControl', {
            url: '/operatorControl',
            templateUrl: 'operator-control/operator-control.html',
            data: {
                authorizedRoles: [USER_ROLES.operator, USER_ROLES.leadOperator, USER_ROLES.control, USER_ROLES.expert]
            }
        });
        $stateProvider.state('sensorGraph', {
            url: '/sensorGraph',
            templateUrl: 'sensor-graph/sensor-graph.html',
            data: {
                authorizedRoles: [USER_ROLES.operator, USER_ROLES.leadOperator, USER_ROLES.control, USER_ROLES.expert]
            }
        });
        $stateProvider.state('about', {
            url: '/about',
            templateUrl: 'about/about.html',
            data: {
                authorizedRoles: [USER_ROLES.all]
            }
        });
        /* Add New States Above */
        $urlRouterProvider.otherwise('/login');

    })

    .run(function ($rootScope, AUTH_EVENTS, USER_ROLES, AuthService) {

        $rootScope.safeApply = function (fn) {
            var phase = $rootScope.$$phase;
            if (phase === '$apply' || phase === '$digest') {
                if (fn && (typeof(fn) === 'function')) {
                    fn();
                }
            } else {
                this.$apply(fn);
            }
        };

        $rootScope.$on('$stateChangeStart', function (event, next) {
//        var authorizedRoles = next.data.authorizedRoles;
//        if (!AuthService.isAuthorized(authorizedRoles) && next.data.authorizedRoles[0] !== USER_ROLES.noAuth) {
//            event.preventDefault();
//            if (AuthService.isAuthenticated()) {
//                // user is not allowed
//                $rootScope.$broadcast(AUTH_EVENTS.notAuthorized);
//            } else {
//                // user is not logged in
//                $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
//            }
//        }
        });

        $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams) {
            console.log('$stateChangeError - debugging required. Event: ');
            console.log(event);
        });

    })

    .controller('ApplicationController', function ($rootScope, $scope, $state, USER_ROLES, AuthService, Session, AlarmService) {

        $scope.currentUser = null;
        $scope.userRoles = USER_ROLES;
        $scope.isAuthorized = AuthService.isAuthorized;
        $scope.userCanOperate = false;
        $scope.userLoggedIn = false;
        $scope.navbarCollapsed = false;

        $scope.setCurrentUser = function (user) {
            $scope.currentUser = user;
            $scope.userLoggedIn = user !== null;

            $scope.userCanOperate = !!user && ($scope.currentUser.role !== USER_ROLES.all && $scope.currentUser.role !== USER_ROLES.monitor);

            if (!$scope.$$phase) {
                $scope.$apply();
            }
        };

        $scope.logout = function () {
            $scope.setCurrentUser(null);
            Session.destroy();
            gapi.auth.signOut();
            AlarmService.disconnectListener();
            $state.go('login');
        };

        $rootScope.stateGo = function (newState) {
            $state.go(newState);
        };

    });
