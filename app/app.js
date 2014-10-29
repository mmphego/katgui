
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

    .controller('ApplicationCtrl', function ($rootScope, $scope, $state, $location, $interval, $mdSidenav, $timeout, USER_ROLES, AuthService, Session, AlarmService, MonitorService) {

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
            MonitorService.disconnectListener();
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

        $timeout(function() {
            MonitorService.connectListener();
        }, 500);
    })


    .factory('MonitorService', function ($rootScope, alarms) {

        var urlBase = 'http://192.168.10.127:8030';
        var monitorService = {};
        monitorService.connection = null;

        monitorService.onSockJSOpen = function () {
            if (monitorService.connection && monitorService.connection.readyState) {

                var jsonRPC = { 'jsonrpc':'2.0',
                    'method':'psubscribe',
                    'params':['kataware:alarm*'],
                    'id': 'abe3d23201' };

                monitorService.connection.send(JSON.stringify(jsonRPC));

                jsonRPC = { 'jsonrpc':'2.0',
                    'method':'subscribe',
                    'params':[['m000:mode', 'm000:inhibited', 'm001:mode', 'm001:inhibited', 'm062:mode', 'm062:inhibited', 'm063:mode', 'm063:inhibited']],
                    'id': 'abe3d23201' };
                monitorService.connection.send(JSON.stringify(jsonRPC));
                console.log('Monitor Connection Established.');
            }
        };

        monitorService.onSockJSClose = function () {
            console.log('Disconnecting Monitor Connection');
            monitorService.connection = null;
        };

        monitorService.onSockJSMessage = function (e) {
            //console.log(e);

            var message = JSON.parse(e.data);

            if (!message['jsonrpc']) {
                if (message.sensor.indexOf('kataware:') === 0) {

                    var alarmName = message.sensor.split(':')[1];
                    //var alarmStatus = message.status;
                    var alarmDate = message.time;
                    var alarmValue = message.value.split(',');
                    var severity = alarmValue[0];
                    var priority = alarmValue[1];
                    var description = alarmValue[2];

                    var alarmObj = {
                        priority: priority,
                        severity: severity,
                        name: alarmName,
                        dateUnix: alarmDate,
                        date: moment.utc(alarmDate, 'X').format('HH:mm:ss DD-MM-YYYY'),
                        message: description
                    };

                    alarms.addAlarmMessage(alarmObj);

                } else {
                    $rootScope.$broadcast('receptorMessage', message);
                }
            }
        };

        monitorService.connectListener = function () {
            console.log('Monitor Connecting...');
            monitorService.connection = new SockJS(urlBase + '/monitor');
            monitorService.connection.onopen = monitorService.onSockJSOpen;
            monitorService.connection.onmessage = monitorService.onSockJSMessage;
            monitorService.connection.onclose = monitorService.onSockJSClose;

            return monitorService.connection !== null;
        };

        monitorService.disconnectListener = function () {
            if (monitorService.connection) {
                monitorService.connection.close();
            }
        };

        return monitorService;
    });
