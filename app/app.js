
angular.module('katGui', [ 'ngMaterial',
    'ui.bootstrap', 'ui.utils', 'ui.router',
    'adf',
    'ngAnimate',
    'katGui.alarms',
    'katGui.d3',
    'katGui.health',
    'katGui.widgets.navigationWidget',
    'katGui.widgets.ganttWidget',
    'katGui.dashboardStructure',
    'katGui.landing',
    'katGui.util',
    'katGui.scheduler',
    'katGui.video'])

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
            templateUrl: 'app/login-form/login-form.html',
            data: {
                authorizedRoles: [USER_ROLES.noAuth]
            }
        });
        $stateProvider.state('admin', {
            url: '/admin',
            templateUrl: 'app/admin/admin.html',
            data: {
                authorizedRoles: [USER_ROLES.leadOperator, USER_ROLES.control, USER_ROLES.expert]
            }
        });
        $stateProvider.state('alarms', {
            url: '/alarms',
            templateUrl: 'app/alarms/alarms.html',
            data: {
                authorizedRoles: [USER_ROLES.leadOperator, USER_ROLES.control, USER_ROLES.expert]
            }
        });
        $stateProvider.state('health', {
            url: '/health',
            templateUrl: 'app/health/health.html',
            data: {
                authorizedRoles: [USER_ROLES.all]
            }
        });
        $stateProvider.state('landing', {
            url: '/home',
            templateUrl: 'app/landing/landing.html',
            data: {
                authorizedRoles: [USER_ROLES.all]
            }
        });
        $stateProvider.state('operatorControl', {
            url: '/operatorControl',
            templateUrl: 'app/operator-control/operator-control.html',
            data: {
                authorizedRoles: [USER_ROLES.operator, USER_ROLES.leadOperator, USER_ROLES.control, USER_ROLES.expert]
            }
        });
        $stateProvider.state('scheduler', {
            url: '/scheduler',
            templateUrl: 'app/scheduler/scheduler.html',
            data: {
                authorizedRoles: [USER_ROLES.operator, USER_ROLES.leadOperator, USER_ROLES.control, USER_ROLES.expert]
            }
        });
        $stateProvider.state('sensorGraph', {
            url: '/sensorGraph',
            templateUrl: 'app/sensor-graph/sensor-graph.html',
            data: {
                authorizedRoles: [USER_ROLES.operator, USER_ROLES.leadOperator, USER_ROLES.control, USER_ROLES.expert]
            }
        });
        $stateProvider.state('about', {
            url: '/about',
            templateUrl: 'app/about/about.html',
            data: {
                authorizedRoles: [USER_ROLES.all]
            }
        });
        $stateProvider.state('video', {
            url: '/video',
            templateUrl: 'app/video/video.html',
            data: {
                authorizedRoles: [USER_ROLES.all]
            }
        });
        $stateProvider.state('weather', {
            url: '/weather',
            templateUrl: 'app/weather/weather.html',
            data: {
                authorizedRoles: [USER_ROLES.all]
            }
        });
        /* Add New States Above */
        $urlRouterProvider.otherwise('/login');
    })

    .run(function ($rootScope, AUTH_EVENTS, USER_ROLES, AuthService) {

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

//        $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams) {
//            console.log('$stateChangeError - debugging required. Event: ');
//            console.log(event);
//        });

    })

    .controller('ApplicationCtrl', function ($rootScope, $scope, $state, $location, $interval, $mdSidenav, USER_ROLES, AuthService, Session, AlarmService) {

        $scope.showSideNav = true;
        $scope.showNavbar = true;
        $rootScope.showSideNav = true;
        $rootScope.showNavbar = true;

        //so that other views can $watch the rootScope values
        $scope.$watch('showSideNav', function (value) {
            $rootScope.showSideNav = value;
        });
        $scope.$watch('showNavbar', function (value) {
            $rootScope.showNavbar = value;
        });

        $scope.currentUser = null;
        $scope.userRoles = USER_ROLES;
        $scope.isAuthorized = AuthService.isAuthorized;
        $scope.userCanOperate = false;
        $scope.userLoggedIn = false;

        $scope.actionMenuOpen = false;
        $rootScope.newAlarmWarnCount = 0;
        $rootScope.newAlarmErrorCount = 0;
        $rootScope.newAlarmCritCount = 0;

        $rootScope.setCurrentUser = function (user) {
            $scope.currentUser = user;
            $scope.userLoggedIn = user !== null;
            $scope.userCanOperate = !!user && ($scope.currentUser.role !== USER_ROLES.all && $scope.currentUser.role !== USER_ROLES.monitor);
        };

        $scope.toggleSidenav = function () {
            $mdSidenav('left-sidenav').toggle();
        };

        $rootScope.logout = function () {
            $scope.setCurrentUser(null);
            Session.destroy();
//            gapi.auth.signOut();
            AlarmService.disconnectListener();
            $state.go('login');
        };

        $scope.stateGo = function (newState) {
            $state.go(newState);
        };

        $scope.isPageSelected = function (page) {
            return $state.current.name === page;
        };

        $rootScope.utcTime = moment.utc(new Date()).format('hh:mm:ss');
        $rootScope.localTime = moment().format('hh:mm:ss');

        var updateTimeDisplay = function () {
            $rootScope.utcTime = moment.utc(new Date()).format('hh:mm:ss');
            $rootScope.localTime = moment().format('hh:mm:ss');
        };

        $interval(updateTimeDisplay, 1000); //update clock every second
    });
