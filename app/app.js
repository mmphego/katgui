(function () {
    angular.module('katGui', ['ngMaterial',
        'ui.bootstrap', 'ui.utils', 'ui.router',
        'adf',
        'ngAnimate',
        'katGui.admin',
        'katGui.alarms',
        'katGui.config',
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
        .constant('THEMES', [
            {
                name: 'Blue-Grey',
                primary: 'blue-grey',
                secondary: 'deep-purple',
                primaryButtons: 'indigo'
            },
            {
                name: 'Indigo',
                primary: 'indigo',
                secondary: 'teal',
                primaryButtons: 'blue'
            },
            {
                name: 'Teal',
                primary: 'teal',
                secondary: 'amber',
                primaryButtons: 'indigo'
            }]
        )
        .config(configureKatGui)
        .run(runKatGui)
        .controller('ApplicationCtrl', ApplicationCtrl);

    function ApplicationCtrl($rootScope, $scope, $state, $interval, $mdSidenav, $timeout, $localStorage, THEMES, USER_ROLES, AuthService, Session, MonitorService, ControlService, KatGuiUtil) {

        var vm = this;

        var theme = _.find(THEMES, function (theme) {
            return $localStorage['selectedTheme'] === theme.name;
        });

        if (!theme) {
            theme = THEMES[0];
        }

        $rootScope.themePrimary = theme.primary;
        $rootScope.themeSecondary = theme.secondary;
        $rootScope.themePrimaryButtons = theme.primaryButtons;

        vm.showNavbar = true;
        $rootScope.showNavbar = true;
        $rootScope.showLargeAlarms = $localStorage['showLargeAlarms'];
        if (typeof $rootScope.showLargeAlarms === 'undefined') {
            $rootScope.showLargeAlarms = false;
        }

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

        vm.currentStateUpperCase = function () {
            return $state.current.title;
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

        vm.utcTime = '';
        vm.localTime = '';

        var updateTimeDisplay = function () {
            if ($rootScope.serverTimeOnLoad > 0) {
                var utcTime = moment.utc($rootScope.serverTimeOnLoad, 'X');
                var localTime = moment($rootScope.serverTimeOnLoad, 'X');
                vm.utcTime = utcTime.format('HH:mm:ss');
                vm.localTime = localTime.format('HH:mm:ss');

                //TODO: get actual longitude to use
                var longitude = 21.3692096; //site longitude
                var fractionalHours = localTime.hours() + localTime.minutes() / 60 + (localTime.seconds() / 60) / 60;
                vm.localSiderealTime = KatGuiUtil.localSiderealTime(KatGuiUtil.julianDay (utcTime.date(), utcTime.month(), utcTime.year(), fractionalHours), longitude);
                $rootScope.serverTimeOnLoad += 1; //unix time is seconds, so only add one
            }
        };

        function syncTimeWithServer() {
            ControlService.getCurrentServerTime()
                .success(function (serverTime) {
                    $rootScope.serverTimeOnLoad = serverTime.katcontrol_webserver_current_time;
                    console.log('Syncing current time with katcontrol server (utc HH:mm:ss DD-MM-YYYY): ' + moment.utc($rootScope.serverTimeOnLoad, 'X').format('HH:mm:ss DD-MM-YYYY'));
                })
                .error(function (error) {
                    console.log("Error syncing time with katcontrol portal! " + error);
                    $rootScope.serverTimeOnLoad = 0;
                    vm.localSiderealTime = "Error syncing time!";
                });
        }

        syncTimeWithServer();

        $interval(updateTimeDisplay, 1000); //update local clock every second

        $interval(function() {
            syncTimeWithServer();
        }, 600000); //sync time every 10 minutes

        $timeout(function () {
            MonitorService.connectListener();
            ControlService.connectListener();
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

        $mdThemingProvider.alwaysWatchTheme(true);

        $stateProvider.state('login', {
            url: '/login',
            templateUrl: 'app/login-form/login-form.html',
            title: 'Login',
            data: {
                authorizedRoles: [USER_ROLES.noAuth]
            }
        });
        $stateProvider.state('admin', {
            url: '/admin',
            templateUrl: 'app/admin/admin.html',
            title: 'User Admin',
            data: {
                authorizedRoles: [USER_ROLES.leadOperator, USER_ROLES.control, USER_ROLES.expert]
            }
        });
        $stateProvider.state('alarms', {
            url: '/alarms',
            templateUrl: 'app/alarms/alarms.html',
            title: 'Alarms',
            data: {
                authorizedRoles: [USER_ROLES.leadOperator, USER_ROLES.control, USER_ROLES.expert]
            }
        });
        $stateProvider.state('config', {
            url: '/config',
            templateUrl: 'app/config/config.html',
            title: 'Configure katGUI',
            data: {
                authorizedRoles: [USER_ROLES.all]
            }
        });
        $stateProvider.state('health', {
            url: '/health',
            templateUrl: 'app/health/health.html',
            title: 'Health & State',
            data: {
                authorizedRoles: [USER_ROLES.all]
            }
        });
        $stateProvider.state('landing', {
            url: '/home',
            templateUrl: 'app/landing/landing.html',
            title: 'Home',
            data: {
                authorizedRoles: [USER_ROLES.all]
            }
        });
        $stateProvider.state('operatorControl', {
            url: '/operatorControl',
            templateUrl: 'app/operator-control/operator-control.html',
            title: 'Operator Control',
            data: {
                authorizedRoles: [USER_ROLES.operator, USER_ROLES.leadOperator, USER_ROLES.control, USER_ROLES.expert]
            }
        });
        $stateProvider.state('scheduler', {
            url: '/scheduler',
            templateUrl: 'app/scheduler/scheduler.html',
            title: 'Scheduler',
            data: {
                authorizedRoles: [USER_ROLES.operator, USER_ROLES.leadOperator, USER_ROLES.control, USER_ROLES.expert]
            }
        });
        $stateProvider.state('sensorGraph', {
            url: '/sensorGraph',
            templateUrl: 'app/sensor-graph/sensor-graph.html',
            title: 'Sensor Graphs',
            data: {
                authorizedRoles: [USER_ROLES.operator, USER_ROLES.leadOperator, USER_ROLES.control, USER_ROLES.expert]
            }
        });
        $stateProvider.state('about', {
            url: '/about',
            templateUrl: 'app/about/about.html',
            title: 'About',
            data: {
                authorizedRoles: [USER_ROLES.all]
            }
        });
        $stateProvider.state('video', {
            url: '/video',
            templateUrl: 'app/video/video.html',
            title: 'Video',
            data: {
                authorizedRoles: [USER_ROLES.all]
            }
        });
        $stateProvider.state('weather', {
            url: '/weather',
            templateUrl: 'app/weather/weather.html',
            title: 'Weather',
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
