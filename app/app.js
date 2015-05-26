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
        .constant('TOAST_HIDE_DELAY', 3500)
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

    function ApplicationCtrl($rootScope, $scope, $state, $interval, $mdSidenav, $localStorage, THEMES, AlarmsService, ConfigService,
                             USER_ROLES, MonitorService, ControlService, KatGuiUtil, $mdToast, TOAST_HIDE_DELAY, SessionService, $mdDialog) {

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

        $rootScope.themePrimary = theme.primary;
        $rootScope.themeSecondary = theme.secondary;
        $rootScope.themePrimaryButtons = theme.primaryButtons;
        $rootScope.showDate = $localStorage['showDate'];
        $rootScope.showDayOfYear = $localStorage['showDayOfYear'];
        $rootScope.showJulianDate = $localStorage['showJulianDate'];
        $rootScope.showLST = $localStorage['showLST'];
        $rootScope.showLocalAndSAST = $localStorage['showLocalAndSAST'];
        if (!angular.isDefined($rootScope.showLST)) {
            $rootScope.showLST = true;
        }

        if (!angular.isDefined($rootScope.showLocalAndSAST)) {
            $rootScope.showLocalAndSAST = true;
        }

        vm.showNavbar = true;
        $rootScope.showNavbar = true;
        $rootScope.showLargeAlarms = $localStorage['showLargeAlarms'];
        $scope.$watch('showNavbar', function (value) {
            $rootScope.showNavbar = value;
        });

        $rootScope.sensorListStrategyType = $localStorage['sensorListStrategyType'];
        $rootScope.sensorListStrategyInterval = $localStorage['sensorListStrategyInterval'];

        if (!$rootScope.sensorListStrategyType) {
            $rootScope.sensorListStrategyType = 'event-rate';
        }
        if (!$rootScope.sensorListStrategyInterval) {
            $rootScope.sensorListStrategyInterval = 3;
        }

        vm.currentUser = null;
        vm.userRoles = USER_ROLES;
        vm.userCanOperate = false;
        vm.userLoggedIn = false;
        vm.actionMenuOpen = false;
        $rootScope.toastPosition = 'bottom right';
        $rootScope.alarmsData = AlarmsService.alarmsData;

        $rootScope.showAlarms = $localStorage['showAlarmsNotify'];
        if (!angular.isDefined($rootScope.showAlarms)) {
            $rootScope.showAlarms = true;
        }

        $rootScope.showSimpleToast = function (message) {
            $mdToast.show(
                $mdToast.simple()
                    .content(message)
                    .position($rootScope.toastPosition)
                    .hideDelay(TOAST_HIDE_DELAY)
            );

            console.log('Showing toast-message: ' + message);
        };

        $rootScope.connectEvents = function () {
            vm.showNavbar = true;
            vm.syncTimeWithServer();
            if (!angular.isDefined($scope.stopUpdateTimeDisplay)) {
                $scope.stopUpdateTimeDisplay = $interval(vm.updateTimeDisplay, 1000); //update local clock every second
            }
            $interval(vm.syncTimeWithServer, 60000); //sync time every 1 minutes
            MonitorService.connectListener();
            ControlService.connectListener();
        };

        vm.toggleLeftSidenav = function () {
            $mdSidenav('left-sidenav').toggle();
        };

        vm.toggleRightSidenav = function () {
            $mdSidenav('right-sidenav').toggle();
        };

        vm.logout = function () {
            MonitorService.disconnectListener();
            ControlService.disconnectListener();
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
                if ($state.current.name === 'scheduler.observations.detail') {
                    $state.go('scheduler.observations');
                } else {
                    $state.go($state.current.parent.name);
                }
            } else {
                $state.go('home');
            }
        };

        vm.utcTime = '';
        vm.localTime = '';

        $rootScope.displayPromiseResult = function (result) {
            if (result.result === 'ok') {
                $rootScope.showSimpleToast(result.message);
            } else {
                $rootScope.showSimpleDialog(result.result, result.message);
            }
        };

        $rootScope.showSimpleDialog = function (title, message) {
            $rootScope.showDialog(title, message);
        };

        $rootScope.showDialog = function (title, content, event) {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog) {
                        $scope.themePrimary = $rootScope.themePrimary;
                        $scope.themePrimaryButtons = $rootScope.themePrimaryButtons;
                        $scope.title = title;
                        $scope.content = content;
                        $scope.hide = function () {
                            $mdDialog.hide();
                        };
                    },
                    template:
                    "<md-dialog style='padding: 0;' md-theme='{{themePrimary}}' aria-label=''>" +
                        "<div style='padding: 0px; margin: 0px;' layout='column' layout-padding >" +
                            "<md-toolbar class='md-primary' layout='row' layout-align='center center'><span>{{title}}</span></md-toolbar>" +
                            "<div flex>{{content}}</div>" +
                            "<div layout='row' layout-align='end' style='margin-top: 8px; margin-right: 8px; margin-bottom: 8px; min-height: 40px;'>" +
                                "<md-button style='margin-left: 8px;' class='md-primary md-raised' md-theme='{{themePrimaryButtons}}' aria-label='OK' ng-click='hide()'>Close</md-button>" +
                            "</div>" +
                        "</div>" +
                    "</md-dialog>",
                    targetEvent: event
                });

            console.log('Showing dialog, title: ' + title + ', message: ' + content);
        };

        $rootScope.showSBDetails = function (sb, event) {
            $rootScope.mdDialogSb = sb;
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog) {

                        $scope.themePrimary = $rootScope.themePrimary;
                        $scope.themePrimaryButtons = $rootScope.themePrimaryButtons;
                        $scope.sb = $rootScope.mdDialogSb;
                        $scope.hide = function () {
                            $mdDialog.hide();
                            $rootScope.mdDialogSb = undefined;
                        };
                    },
                    template: "<md-dialog style='padding: 0;' md-theme='{{themePrimary}}' aria-label='Schedule Block Details'>" +
                    "<md-content style='padding: 0px; margin: 0px; width: 500px;height:800px' layout='column' layout-padding >" +
                    "<md-toolbar class='md-primary long-input' layout='row' layout-align='center center'><span>Schedule Block: <b>{{sb.id_code}}</b></span></md-toolbar>" +
                    "<textarea style='resize: none; overflow: auto; border: 0; background: transparent' auto-grow readonly>{{sb | json:4}}</textarea>" +
                    "<div layout='row' layout-align='end' style='margin-top: 8px; margin-right: 8px; margin-bottom: 8px; min-height: 40px;'>" +
                    "<md-button class='md-primary' style='margin-left: 8px;' md-theme='{{themePrimaryButtons}}' aria-label='Done' ng-click='hide()'>Done</md-button>" +
                    "</div>" +
                    "</md-content></md-dialog>",
                    targetEvent: event
                });
        };

        vm.updateTimeDisplay = function () {
            if ($rootScope.serverTimeOnLoad > 0) {
                var utcTime = moment.utc($rootScope.serverTimeOnLoad, 'X');
                var localTime = moment($rootScope.serverTimeOnLoad, 'X');
                vm.utcTime = utcTime.format('HH:mm:ss');
                vm.localTime = localTime.format('HH:mm:ss');
                vm.currentDate = utcTime.format('DD-MM-YYYY');
                vm.dayOfYear = utcTime.dayOfYear();

                var fractionalHours = localTime.hours() + localTime.minutes() / 60 + (localTime.seconds() / 60) / 60;
                var julianDayWithTime = KatGuiUtil.julianDayWithTime(utcTime.date(), utcTime.month() + 1, utcTime.year(), fractionalHours);
                vm.julianDay = Math.round(julianDayWithTime * 1000) / 1000;
                if ($rootScope.longitude) {
                    vm.localSiderealTime = KatGuiUtil.localSiderealTime(julianDayWithTime, $rootScope.longitude);
                }
                $rootScope.serverTimeOnLoad += 1; //unix time is seconds, so only add one
                if (!$scope.$$phase) {
                    $scope.$digest();
                }
            }
        };

        vm.syncTimeWithServer = function () {
            ControlService.getCurrentServerTime()
                .success(function (serverTime) {
                    $rootScope.serverTimeOnLoad = serverTime.katcontrol_webserver_current_time;
                    console.log('Syncing current time with katcontrol server (utc HH:mm:ss DD-MM-YYYY): ' + moment.utc($rootScope.serverTimeOnLoad, 'X').format('HH:mm:ss DD-MM-YYYY'));
                })
                .error(function (error) {
                    console.error("Error syncing time with katcontrol portal! " + error);
                    $rootScope.serverTimeOnLoad = 0;
                    vm.localSiderealTime = "Error syncing time!";
                });
            ConfigService.getSiteLocation()
                .success(function (result) {
                    $rootScope.longitude = KatGuiUtil.getLongitudeFromDegrees(result.split(',')[1]);
                })
                .error(function (error) {
                    console.error("Could not retrieve site location from config server, LST will not display correctly. ");
                    console.error(error);
                });
        };

        //so that all controllers and directives has access to which keys are pressed
        document.onkeydown = function (event) {
            event = event || window.event;
            $rootScope.$emit('keydown', event.keyCode);
        };

        $scope.$on('$destroy', vm.logout);
    }

    function configureKatGui($stateProvider, $urlRouterProvider, $compileProvider, $mdThemingProvider, $httpProvider, USER_ROLES) {

        //disable this in production for performance boost
        //batarang uses this for scope inspection
        //grunt
        if (window.location.host !== 'localhost:8000') {
            $compileProvider.debugInfoEnabled(false);
        }

        delete $httpProvider.defaults.headers.common['X-Requested-With'];

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
        $stateProvider.state('receptorStatus', {
            url: '/receptor-status',
            templateUrl: 'app/health/receptor-status/receptor-status.html',
            title: 'Receptor Status',
            data: {
                authorizedRoles: [USER_ROLES.all]
            }
        });
        $stateProvider.state('customHealth', {
            url: '/custom-health',
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
            url: '/subarrays',
            templateUrl: 'app/scheduler/subarrays-draft-assignment/subarrays-draft-assignment.html',
            title: 'Scheduler.Schedule Blocks',
            data: {
                authorizedRoles: [USER_ROLES.all]
            }
        };

        var subArrayResources = {
            name: 'scheduler.resources',
            parent: schedulerHome,
            url: '/resources',
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
        /* Add New States Above */
        $urlRouterProvider.otherwise('/login');
    }

    function runKatGui($rootScope, $state, $localStorage) {

        $rootScope.$on('$stateChangeStart', function (event, toState) {
            if (!$rootScope.loggedIn && toState.name !== 'login') {
                if (!$localStorage['currentUserToken']) {
                    event.preventDefault();
                    $state.go('login');
                }
            } else if ($rootScope.loggedIn && toState.name === 'login') {
                event.preventDefault();
                $state.go('home');
            }
        });

        $rootScope.$on('$stateChangeError', function (event) {
            console.error('$stateChangeError - debugging required. Event: ');
            console.error(event);
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
