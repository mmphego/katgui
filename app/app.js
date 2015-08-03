(function () {
    //

    angular.module('katGui', ['ngMaterial',
        'ui.bootstrap', 'ui.utils', 'ui.router',
        'adf', 'ngAnimate', 'katGui.services',
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
        'katGui.services',
        'katGui.video'
    ])
        .constant('UI_VERSION', '0.0.1')
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
                secondary: 'blue',
                primaryButtons: 'blue'
            },
            {
                name: 'Teal',
                primary: 'teal',
                secondary: 'amber',
                primaryButtons: 'indigo'
            },
            {
                name: 'Dark',
                primary: 'dark',
                secondary: 'dark-secondary',
                primaryButtons: 'dark-buttons'
            }])
        .config(configureKatGui)
        .run(runKatGui)
        .controller('ApplicationCtrl', ApplicationCtrl);

    function ApplicationCtrl($rootScope, $scope, $state, $interval, $mdSidenav, $localStorage, THEMES, AlarmsService,
                             ConfigService, USER_ROLES, MonitorService, ControlService, KatGuiUtil, SessionService,
                             CENTRAL_LOGGER_PORT, $log, DATETIME_FORMAT, NotifyService) {
        var vm = this;
        SessionService.recoverLogin();

        var theme = _.find(THEMES, function (theme) {
            return $localStorage['selectedTheme'] === theme.name;
        });
        if (!theme) {
            theme = THEMES[0];
        }
        if (theme.name === 'Dark') {
            angular.element(document.querySelector('body')).addClass('dark-theme');
        } else {
            angular.element(document.querySelector('body')).removeClass('dark-theme');
        }

        vm.showNavbar = true;
        $rootScope.themePrimary = theme.primary;
        $rootScope.themeSecondary = theme.secondary;
        $rootScope.themePrimaryButtons = theme.primaryButtons;
        $rootScope.showDate = $localStorage['showDate'];
        $rootScope.showDayOfYear = $localStorage['showDayOfYear'];
        $rootScope.showJulianDate = $localStorage['showJulianDate'];
        $rootScope.showLST = $localStorage['showLST'];
        $rootScope.showLocalAndSAST = $localStorage['showLocalAndSAST'];
        $rootScope.showLargeAlarms = $localStorage['showLargeAlarms'];
        $rootScope.sensorListStrategyType = $localStorage['sensorListStrategyType'];
        $rootScope.sensorListStrategyInterval = $localStorage['sensorListStrategyInterval'];
        $rootScope.logNumberOfLines = $localStorage['logNumberOfLines'];
        $rootScope.disableAlarmSounds = $localStorage['disableAlarmSounds'];

        if (!$rootScope.sensorListStrategyType) {
            $rootScope.sensorListStrategyType = 'event-rate';
        }
        if (!$rootScope.logNumberOfLines) {
            $rootScope.logNumberOfLines = 200;
        }
        if (!$rootScope.sensorListStrategyInterval) {
            $rootScope.sensorListStrategyInterval = 10;
        }
        if (!angular.isDefined($rootScope.showLST)) {
            $rootScope.showLST = true;
        }

        if (!angular.isDefined($rootScope.showLocalAndSAST)) {
            $rootScope.showLocalAndSAST = true;
        }

        vm.currentUser = null;
        vm.userRoles = USER_ROLES;
        vm.userCanOperate = false;
        vm.userLoggedIn = false;
        vm.actionMenuOpen = false;
        vm.connectionToMonitorLost = false;
        $rootScope.alarmsData = AlarmsService.alarmsData;
        $rootScope.currentLeadOperator = MonitorService.currentLeadOperator;
        $rootScope.interlockState = MonitorService.interlockState;

        ConfigService.loadKATObsPortalURL();
        ConfigService.getSystemConfig().then(function (systemConfig) {
            $rootScope.systemConfig = systemConfig;
        });

        $rootScope.showAlarms = $localStorage['showAlarmsNotify'];
        if (!angular.isDefined($rootScope.showAlarms)) {
            $rootScope.showAlarms = true;
        }

        $rootScope.isNavbarVisible = function () {
            return vm.showNavbar;
        };

        $rootScope.connectEvents = function () {

            if (!vm.updateTimeDisplayInterval) {
                vm.updateTimeDisplayInterval = $interval(vm.updateTimeDisplay, 1000); //update local clock every second
                vm.syncTimeWithServerInterval = $interval(vm.syncTimeWithServer, 10000); //sync time every 10 seconds
                vm.syncTimeWithServer();
            }

            MonitorService.connectListener()
                .then(function () {
                    if (vm.connectMonitorInterval) {
                        $interval.cancel(vm.connectMonitorInterval);
                        vm.connectMonitorInterval = null;
                        vm.connectionToMonitorLost = false;
                        $log.info('Reconnected Monitor Connection.');
                        vm.syncTimeWithServer();
                    }
                }, function () {
                    $log.error('Could not establish Monitor connection. Retrying every 10 seconds.');
                    if (!vm.connectMonitorInterval) {
                        vm.connectMonitorInterval = $interval($rootScope.connectEvents, 10000);
                        vm.connectionToMonitorLost = true;
                    }
                });
            vm.handleMonitorSocketTimeout();
        };

        vm.toggleNavbar = function () {
            vm.showNavbar = !vm.showNavbar;
        };

        vm.undbindLoginSuccess = $rootScope.$on('loginSuccess', function () {
            vm.showNavbar = true;
        });

        vm.handleMonitorSocketTimeout = function () {
            MonitorService.getTimeoutPromise()
                .then(function () {
                    if (!vm.disconnectIssued) {
                        $log.info('Monitor connection timeout! Attempting to reconnect...');
                        if (!vm.connectMonitorInterval) {
                            vm.connectMonitorInterval = $interval($rootScope.connectEvents, 10000);
                            vm.connectionToMonitorLost = true;
                            $rootScope.connectEvents();
                        }
                    }
                });
        };

        vm.toggleLeftSidenav = function () {
            $mdSidenav('left-sidenav').toggle();
        };

        vm.toggleRightSidenav = function () {
            $mdSidenav('right-sidenav').toggle();
        };

        vm.logout = function () {
            vm.disconnectIssued = true;
            MonitorService.disconnectListener();
            $mdSidenav('right-sidenav').close();
            SessionService.logout();
            vm.showNavbar = false;
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

        vm.currentState = function () {
            return $state.current.title;
        };

        vm.navigateToParentState = function () {
            if ($state.current.parent) {
                $state.go($state.current.parent.name);
            } else {
                $state.go('home');
            }
        };

        vm.utcTime = '';
        vm.localTime = '';

        $rootScope.displayPromiseResult = function (result) {
            if (result.result === 'ok') {
                NotifyService.showSimpleToast(result.message);
            } else {
                NotifyService.showSimpleDialog(result.result, result.message);
            }
        };

        vm.updateTimeDisplay = function () {
            if ($rootScope.serverTimeOnLoad > 0) {
                var utcTime = moment.utc($rootScope.serverTimeOnLoad, 'X');
                var localTime = moment($rootScope.serverTimeOnLoad, 'X');
                $rootScope.utcTime = utcTime.format('HH:mm:ss');
                $rootScope.localTime = localTime.format('HH:mm:ss');
                $rootScope.currentDate = utcTime.format('YYYY-MM-DD');
                $rootScope.dayOfYear = utcTime.dayOfYear();

                var fractionalHours = utcTime.hours() + utcTime.minutes() / 60 + (utcTime.seconds() / 60) / 60;
                var julianDayWithTime = KatGuiUtil.julianDayWithTime(
                    utcTime.date(),
                    utcTime.month() + 1,
                    utcTime.year(),
                    fractionalHours);
                $rootScope.julianDay = Math.round(julianDayWithTime * 1000) / 1000;
                if ($rootScope.longitude) {
                    $rootScope.localSiderealTime = KatGuiUtil.localSiderealTime(julianDayWithTime, $rootScope.longitude);
                }
                $rootScope.serverTimeOnLoad += 1; //unix time is seconds, so only add one
            }
        };

        vm.syncTimeWithServer = function () {
            ControlService.getCurrentServerTime()
                .success(function (serverTime) {
                    $rootScope.serverTimeOnLoad = serverTime.katcontrol_webserver_current_time;
                    $log.info('Syncing current time with KATPortal (utc ' + DATETIME_FORMAT + '): ' +
                    moment.utc($rootScope.serverTimeOnLoad, 'X').format(DATETIME_FORMAT));
                })
                .error(function (error) {
                    $log.error("Error syncing time with KATPortal! " + error);
                    $rootScope.serverTimeOnLoad = 0;
                    vm.localSiderealTime = "Error syncing time!";
                });
            ConfigService.getSiteLocation()
                .success(function (result) {
                    var trimmedResult = result.replace(/"/g, '');
                    $rootScope.longitude = KatGuiUtil.degreesToFloat(trimmedResult.split(',')[1]);
                    $rootScope.latitude = KatGuiUtil.degreesToFloat(trimmedResult.split(',')[0]);
                })
                .error(function (error) {
                    $log.error("Could not retrieve site location from config server, LST will not display correctly. ");
                    $log.error(error);
                });
        };

        $rootScope.objectKeys = function (obj) {
            return Object.keys(obj);
        };

        $rootScope.showSBDetails = NotifyService.showSBDetails;

        vm.openCentralLogger = function () {
            //TODO get from config and eventually redo central logger
            KatGuiUtil.openRelativePath('', CENTRAL_LOGGER_PORT);
        };

        vm.openGangliaLink = function () {
            window.open('ganglia/');
        };

        vm.openIRCDisplay = function ($event) {
            NotifyService.showPreDialog(
                'IRC Information',
                'IRC Server: irc://katfs.kat.ac.za:6667/#channel_name\n  IRC Logs: https://katfs.kat.ac.za/irclog/logs/katirc/\n',
                $event);
        };

        $rootScope.openSystemLogger = function () {
            if (ConfigService.KATObsPortalURL) {
                window.open(ConfigService.KATObsPortalURL + "/logfile/" ).focus();
            } else {
                NotifyService.showSimpleDialog('Error Viewing Logfiles', 'There is no KATObsPortal IP defined in config, please contact CAM support.');
            }
        };

        $rootScope.openKatsnifferLogger = function (logFileName) {
            if (ConfigService.KATObsPortalURL) {
                window.open(ConfigService.KATObsPortalURL + "/logfile/" + logFileName + "/tail/" + $rootScope.logNumberOfLines).focus();
            } else {
                NotifyService.showSimpleDialog('Error Viewing Progress', 'There is no KATObsPortal IP defined in config, please contact CAM support.');
            }
        };

        //so that all controllers and directives has access to which keys are pressed
        document.onkeydown = function (event) {
            event = event || window.event;
            $rootScope.$emit('keydown', event.keyCode);
        };

        $scope.$on('$destroy', function () {
            MonitorService.disconnectListener();
            vm.undbindLoginSuccess();
        });
    }

    function configureKatGui($stateProvider, $urlRouterProvider, $compileProvider, $mdThemingProvider,
                             $httpProvider, USER_ROLES, $locationProvider, $urlMatcherFactoryProvider) {

        $urlMatcherFactoryProvider.strictMode(false);
        //disable this in production for performance boost
        //batarang uses this for scope inspection
        if (window.location.host !== 'localhost:8000') {
            $compileProvider.debugInfoEnabled(false);
        } else {
            $httpProvider.defaults.useXDomain = true;
            delete $httpProvider.defaults.headers.common['X-Requested-With'];
        }
        //todo nginx needs the following config before we can switch on html5Mode
        //https://github.com/angular-ui/ui-router/wiki/Frequently-Asked-Questions#how-to-configure-your-server-to-work-with-html5mode
        //$locationProvider.html5Mode(true);
        configureThemes($mdThemingProvider);


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
        $stateProvider.state('receptorHealth', {
            url: '/receptor-health',
            templateUrl: 'app/health/receptor-health/receptor-health.html',
            title: 'Receptor Health',
            data: {
                authorizedRoles: [USER_ROLES.all]
            }
        });
        $stateProvider.state('receptorStatus', {
            url: '/receptor-status',
            templateUrl: 'app/health/receptor-status/receptor-status.html',
            title: 'Receptor Status',
            data: {
                authorizedRoles: [USER_ROLES.all]
            }
        });
        $stateProvider.state('receptorPointing', {
            url: '/receptor-pointing',
            templateUrl: 'app/health/receptor-pointing/receptor-pointing.html',
            title: 'Receptor Pointing',
            data: {
                authorizedRoles: [USER_ROLES.all]
            }
        });
        $stateProvider.state('customHealth', {
            url: '/custom-health?layout',
            templateUrl: 'app/health/custom-health/custom-health.html',
            title: 'Custom Health',
            data: {
                authorizedRoles: [USER_ROLES.all]
            }
        });
        $stateProvider.state('home', {
            url: '/home',
            templateUrl: 'app/landing/landing.html',
            title: 'Home',
            data: {
                authorizedRoles: [USER_ROLES.all]
            }
        });
        $stateProvider.state('operator-control', {
            url: '/operator-control',
            templateUrl: 'app/operator-control/operator-control.html',
            title: 'Operator Control',
            data: {
                authorizedRoles: [USER_ROLES.operator, USER_ROLES.leadOperator, USER_ROLES.control, USER_ROLES.expert]
            }
        });
        $stateProvider.state('process-control', {
            url: '/process-control',
            templateUrl: 'app/process-control/process-control.html',
            title: 'Process Control',
            data: {
                authorizedRoles: [USER_ROLES.all]
            }
        });
        $stateProvider.state('cam-components', {
            url: '/cam-components',
            templateUrl: 'app/cam-components/cam-components.html',
            title: 'CAM Components',
            data: {
                authorizedRoles: [USER_ROLES.all]
            }
        });
        $stateProvider.state('device-status', {
            url: '/device-status',
            templateUrl: 'app/device-status/device-status.html',
            title: 'Device Status',
            data: {
                authorizedRoles: [USER_ROLES.all]
            }
        });
        $stateProvider.state('instrumental-config', {
            url: '/instrumental-config',
            templateUrl: 'app/instrumental-config/instrumental-config.html',
            title: 'Instrumental Configuration',
            data: {
                authorizedRoles: [USER_ROLES.all]
            }
        });

        var schedulerHome = {
            name: 'scheduler',
            url: '/scheduler',
            templateUrl: 'app/scheduler/scheduler-home.html',
            title: 'Scheduler',
            data: {
                authorizedRoles: [USER_ROLES.operator, USER_ROLES.leadOperator, USER_ROLES.control, USER_ROLES.expert]
            }
        };
        var sbDrafts = {
            name: 'scheduler.drafts',
            parent: schedulerHome,
            url: '/drafts',
            templateUrl: 'app/scheduler/schedule-block-drafts/schedule-block-drafts.html',
            title: 'Scheduler.Drafts',
            data: {
                authorizedRoles: [USER_ROLES.operator, USER_ROLES.leadOperator, USER_ROLES.control, USER_ROLES.expert]
            }
        };
        var subArrays = {
            name: 'scheduler.subarrays',
            parent: schedulerHome,
            url: '/subarrays/:subarray_id',
            templateUrl: 'app/scheduler/subarrays-draft-assignment/subarrays-draft-assignment.html',
            title: 'Scheduler.Schedule Blocks',
            data: {
                authorizedRoles: [USER_ROLES.all]
            }
        };
        var subArrayResources = {
            name: 'scheduler.resources',
            parent: schedulerHome,
            url: '/resources/:subarray_id',
            templateUrl: 'app/scheduler/subarray-resources/subarray-resources.html',
            title: 'Scheduler.Resources',
            data: {
                authorizedRoles: [USER_ROLES.all]
            }
        };
        var observationsOverview = {
            name: 'scheduler.observations',
            parent: schedulerHome,
            url: '/observations',
            templateUrl: 'app/scheduler/observations/observations-overview.html',
            title: 'Scheduler.Observations Schedules',
            data: {
                authorizedRoles: [USER_ROLES.all]
            }

        };
        var observationsDetail = {
            name: 'scheduler.observations.detail',
            parent: schedulerHome,
            url: '/observations/:subarray_id',
            templateUrl: 'app/scheduler/observations/observations-detail.html',
            title: 'Scheduler.Observations',
            data: {
                authorizedRoles: [USER_ROLES.all]
            }
        };

        $stateProvider
            .state(schedulerHome)
            .state(sbDrafts)
            .state(subArrays)
            .state(subArrayResources)
            .state(observationsOverview)
            .state(observationsDetail);
        $stateProvider.state('sensor-graph', {
            url: '/sensor-graph',
            templateUrl: 'app/sensor-graph/sensor-graph.html',
            title: 'Sensor Graphs',
            data: {
                authorizedRoles: [USER_ROLES.operator, USER_ROLES.leadOperator, USER_ROLES.control, USER_ROLES.expert]
            }
        });
        $stateProvider.state('sensor-list', {
            url: '/sensor-list',
            templateUrl: 'app/sensor-list/sensor-list.html',
            title: 'Sensor List',
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
        $stateProvider.state('userlogs', {
            url: '/userlogs',
            templateUrl: 'app/userlogs/userlogs.html',
            title: 'User Logging',
            data: {
                authorizedRoles: [USER_ROLES.all]
            }
        });
        /* Add New States Above */
        $urlRouterProvider.otherwise('/login');
    }

    function runKatGui($rootScope, $state, $localStorage, $log) {

        $rootScope.$on('$stateChangeStart', function (event, toState) {
            if (!$rootScope.loggedIn && toState.name !== 'login') {
                if (!$localStorage['currentUserToken']) {
                    event.preventDefault();
                    $rootScope.requestedStateBeforeLogin = toState.name;
                    $state.go('login');
                }
            } else if ($rootScope.loggedIn && $rootScope.requestedStateBeforeLogin) {
                var newStateName = $rootScope.requestedStateBeforeLogin ? $rootScope.requestedStateBeforeLogin : 'home';
                $rootScope.requestedStateBeforeLogin = null;
                event.preventDefault();
                $state.go(newStateName);
            }
        });

        $rootScope.$on('$stateChangeError', function (event) {
            $log.error('$stateChangeError - debugging required. Event: ');
            $log.error(event);
        });
    }

    //this function includes the style sheets instead of having to link to each individually
    function configureThemes($mdThemingProvider) {
        //$mdThemingProvider.theme('default')
        //    .primaryPalette('indigo');
        //
        $mdThemingProvider.theme('indigo')
            .primaryPalette('indigo')
            .accentPalette('blue');

        $mdThemingProvider.theme('blue')
            .primaryPalette('blue')
            .accentPalette('indigo');

        $mdThemingProvider.theme('red')
            .primaryPalette('red')
            .accentPalette('blue');

        $mdThemingProvider.theme('green')
            .primaryPalette('green')
            .accentPalette('blue');

        $mdThemingProvider.theme('blue-grey')
            .primaryPalette('blue-grey')
            .accentPalette('blue');

        $mdThemingProvider.theme('grey')
            .primaryPalette('grey')
            .accentPalette('blue');

        $mdThemingProvider.theme('deep-purple')
            .primaryPalette('deep-purple')
            .accentPalette('purple');

        $mdThemingProvider.theme('purple')
            .primaryPalette('purple')
            .accentPalette('blue');

        $mdThemingProvider.theme('teal')
            .primaryPalette('teal')
            .accentPalette('blue');

        $mdThemingProvider.theme('yellow')
            .primaryPalette('yellow')
            .accentPalette('blue');

        $mdThemingProvider.theme('amber')
            .primaryPalette('amber')
            .accentPalette('blue');

        $mdThemingProvider.definePalette('white', $mdThemingProvider.extendPalette('blue', {'400': 'ffffff'}));
        $mdThemingProvider.theme('white')
            .primaryPalette('white', {
                'default': '400'
            });

        $mdThemingProvider.theme('dark')
            .primaryPalette('blue-grey')
            .dark();

        $mdThemingProvider.theme('dark-secondary')
            .primaryPalette('indigo')
            .dark();

        $mdThemingProvider.theme('dark-buttons')
            .primaryPalette('blue')
            .dark();

        $mdThemingProvider.alwaysWatchTheme(true);
    }
})();
