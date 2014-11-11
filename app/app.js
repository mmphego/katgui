(function () {
    angular.module('katGui', ['ngMaterial',
        'ui.bootstrap', 'ui.utils', 'ui.router',
        'adf',
        'ngAnimate',
        'katGui.admin',
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
        .config(configureKatGui)
        .run(runKatGui)
        .controller('ApplicationCtrl', ApplicationCtrl);

    function ApplicationCtrl($rootScope, $scope, $state, $interval, $mdSidenav, $timeout, USER_ROLES, AuthService, Session, MonitorService, ControlService) {

        var vm = this;

        //defaults: primary = indigo, secondary = light-blue-dark, primary-buttons = blue
        $rootScope.themePrimary = "blue-grey";
        $rootScope.themeSecondary = "deep-purple";
        $rootScope.themePrimaryButtons = "indigo";

        vm.showNavbar = true;
        $rootScope.showNavbar = true;

        $scope.$watch('showNavbar', function (value) {
            $rootScope.showNavbar = value;
        });

        vm.currentUser = null;
        vm.userRoles = USER_ROLES;
        vm.isAuthorized = AuthService.isAuthorized;
        vm.userCanOperate = false;
        vm.userLoggedIn = false;

        vm.actionMenuOpen = false;
        $rootScope.newAlarmWarnCount = 0;
        $rootScope.newAlarmErrorCount = 0;
        $rootScope.newAlarmCritCount = 0;

        $rootScope.setCurrentUser = function (user) {
            vm.currentUser = user;
            vm.userLoggedIn = user !== null;
            vm.userCanOperate = !!user && (vm.currentUser.role !== USER_ROLES.all && vm.currentUser.role !== USER_ROLES.monitor);
        };

        vm.toggleLeftSidenav = function () {
            $mdSidenav('left-sidenav').toggle();
        };

        vm.toggleRightSidenav = function () {
            $mdSidenav('right-sidenav').toggle();
        };

        vm.logout = function () {
            $rootScope.setCurrentUser(null);
            Session.destroy();
//            gapi.auth.signOut();
            MonitorService.disconnectListener();
            ControlService.disconnectListener();
            $mdSidenav('right-sidenav').close();
            $state.go('login');
        };

        vm.stateGo = function (newState) {
            $state.go(newState);
        };


        vm.sideNavStateGo = function (newState) {
            vm.stateGo(newState);
            $mdSidenav('left-sidenav').close();
        };

        vm.sideNavRightStateGo = function (newState) {
            vm.stateGo(newState);
            $mdSidenav('right-sidenav').close();
        };

        vm.isPageSelected = function (page) {
            return $state.current.name === page;
        };

        vm.operatorActionMenuItemSelected = function () {
            $state.go('operatorControl');
            vm.operatorControlMenuHover = false;
        };

        vm.inhibitAll = function () {
            ControlService.inhibitAll();
            vm.operatorActionMenuItemSelected();
        };

        vm.stowAll = function () {
            ControlService.stowAll();
            vm.operatorActionMenuItemSelected();
        };

        vm.stopAll = function () {
            ControlService.stopAll();
            vm.operatorActionMenuItemSelected();
        };

        vm.resumeOperations = function () {
            ControlService.resumeOperations();
            vm.operatorActionMenuItemSelected();
        };

        vm.shutdownComputing = function () {
            ControlService.shutdownComputing();
            vm.operatorActionMenuItemSelected();
        };

        vm.utcTime = moment.utc(new Date()).format('hh:mm:ss');
        vm.localTime = moment().format('hh:mm:ss');

        var updateTimeDisplay = function () {
            vm.utcTime = moment.utc(new Date()).format('hh:mm:ss');
            vm.localTime = moment().format('hh:mm:ss');
        };

        $interval(updateTimeDisplay, 1000); //update clock every second

        $timeout(function () {
            //MonitorService.connectListener();
            //ControlService.connectListener();
        }, 200);

        $rootScope.alarmsData = [];
        $rootScope.knownAlarmsData = [];

        var unbindAlarmMessage = $rootScope.$on('alarmMessage', function (event, message) {

            var found = false;

            if (message.priority === 'known') {

                for (var i = 0; i < $rootScope.knownAlarmsData.length; i++) {
                    if ($rootScope.knownAlarmsData[i].name === message.name) {
                        $rootScope.knownAlarmsData[i].priority = message.priority;
                        $rootScope.knownAlarmsData[i].severity = message.status;
                        $rootScope.knownAlarmsData[i].dateUnix = message.dateUnix;
                        $rootScope.knownAlarmsData[i].date = message.date;
                        $rootScope.knownAlarmsData[i].description = message.value;
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    $rootScope.knownAlarmsData.push(message);
                }
            } else {

                for (var j = 0; j < $rootScope.alarmsData.length; j++) {
                    if ($rootScope.alarmsData[j].name === message.name) {
                        $rootScope.alarmsData[j].priority = message.priority;
                        $rootScope.alarmsData[j].severity = message.status;
                        $rootScope.alarmsData[j].dateUnix = message.dateUnix;
                        $rootScope.alarmsData[j].date = message.date;
                        $rootScope.alarmsData[j].description = message.value;
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    $rootScope.alarmsData.push(message);
                }
            }

        });

        $scope.$on('$destroy', unbindAlarmMessage);
    }

    function configureKatGui($stateProvider, $urlRouterProvider, $compileProvider, $mdThemingProvider, USER_ROLES) {

        //disable this in production for performance boost
        //batarang uses this for scope inspection
        //https://docs.angularjs.org/guide/production
        //$compileProvider.debugInfoEnabled(false);

        //$mdThemingProvider.alwaysWatchTheme(true);

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
    }

    function runKatGui($rootScope) {

        $rootScope.$on('$stateChangeStart', function (event, next) {
//        var authorizedRoles = next.data.authorizedRoles;
//        if (!AuthService.isAuthorized(authorizedRoles) && next.data.authorizedRoles[0] !== USER_ROLES.noAuth) {
//            event.preventDefault();
//            if (AuthService.isAuthenticated()) {
//                // user is not allowed
//                $rootScope.$emit(AUTH_EVENTS.notAuthorized);
//            } else {
//                // user is not logged in
//                $rootScope.$emit(AUTH_EVENTS.notAuthenticated);
//            }
//        }
        });

//        $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams) {
//            console.log('$stateChangeError - debugging required. Event: ');
//            console.log(event);
//        });

    }
})();
