(function () {

    angular.module('katGui.widgets.navigationWidget', ['adf.provider', 'katGui.util'])
        .config(configureNavigationWidget)
        .controller('NavigationWidgetCtrl', NavigationWidgetCtrl);

    function configureNavigationWidget(dashboardProvider) {
        dashboardProvider
            .widget('NavigationWidget', {
                title: 'Navigation',
                description: 'Container for navigation controls/buttons',
                templateUrl: 'app/widgets/navigation/navigation-widget.html',
                controllerAs: 'vm',
                controller: 'NavigationWidgetCtrl'
            });
    }

    function NavigationWidgetCtrl($scope, $rootScope, $state, KatGuiUtil, CENTRAL_LOGGER_PORT) {

        var vm = this;

        vm.themePrimaryButtons = $rootScope.themePrimaryButtons;
        vm.themePrimary = $rootScope.themePrimary;

        vm.openCentralLogger = function () {
            //TODO get from config and eventually redo central logger
            KatGuiUtil.openRelativePath('', CENTRAL_LOGGER_PORT);
        };

        vm.schedulerNavData = [{
            name: 'SB Drafts',
            textOffset: -10,
            state: 'scheduler.drafts',
            title: 'Manage Schedule Block Drafts'
        }, {
            name: 'SBs',
            textOffset: -10,
            state: 'scheduler.subarrays',
            title: 'Manage Subarrays Schedule Blocks'
        }, {
            name: 'Resources',
            textOffset: 0,
            state: 'scheduler.resources',
            title: 'Manage Subarray Resources'
        }, {
            name: 'Observations',
            textOffset: 10,
            state: 'scheduler.observations',
            title: 'Observations Overview'
        }, {
            name: 'Workflow',
            textOffset: 10,
            state: 'scheduler',
            title: 'View Schedule Block Workflow'
        }];

        vm.receptorNavData = [{
            name: 'Status',
            state: 'receptorStatus',
            title: 'Receptor Status'
        }, {
            name: 'Pointing',
            state: 'receptorPointing',
            title: 'Receptor Pointing'
        }, {
            name: 'Health',
            state: 'receptorHealth',
            title: 'Receptor Health'
        }];

        vm.sensorsNavData = [{
            name: 'Graph',
            state: 'sensor-graph',
            title: 'Sensor Graph'
        }, {
            name: 'Weather',
            state: 'weather',
            title: 'Weather Sensors'
        }, {
            name: 'List',
            state: 'sensor-list',
            title: 'Sensor List'
        }];

        vm.topNavData = [{
            name: 'Top Health',
            state: 'health',
            title: 'Top Health'
        }, {
            name: 'Custom Health',
            state: 'customHealth',
            title: 'Custom Health'
        }, {
            name: 'Alarms',
            state: 'alarms',
            title: 'Alarms'
        }];

        vm.controlsNavData = [{
            name: 'Components',
            state: 'cam-components',
            title: 'CAM Components & Versions'
        }, {
            name: 'Processes',
            state: 'process-control',
            title: 'CAM Processes Control'
        }, {
            name: 'Operator',
            state: 'operator-control',
            title: 'Operator Controls'
        }];

        vm.logsNavData = [{
            name: 'Central Logs',
            state: vm.openCentralLogger,
            textOffset: -10,
            title: 'Open Central Logger in a new tab'
        }, {
            name: 'System Logs',
            textOffset: -10,
            state: $rootScope.openSystemLogger,
            title: 'Open System Logs in a new tab'
        }, {
            name: 'KATCP Logs',
            textOffset: 5,
            state: $rootScope.openKatsnifferLogger,
            stateParams: ['katcpmsgs.log'],
            title: 'Open KATCP Messages Log in a new tab'
        }, {
            name: 'User Logs',
            state: 'userlogs',
            title: 'User Defined Logs'
        }];

        vm.unbindThemePrimaryButtons = $rootScope.$watch('themePrimaryButtons', function (newVal) {
            vm.themePrimaryButtons = newVal;
        });

        vm.unbindThemePrimary = $rootScope.$watch('themePrimary', function (newVal) {
            vm.themePrimary = newVal;
        });

        vm.stateGo = function (newState) {
            $state.go(newState);
        };

        $scope.$on('$destroy', function () {
            vm.unbindThemePrimary();
            vm.unbindThemePrimaryButtons();
        });
    }
})();
