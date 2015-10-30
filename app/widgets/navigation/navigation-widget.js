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

    function NavigationWidgetCtrl($rootScope, KatGuiUtil, CENTRAL_LOGGER_PORT) {

        var vm = this;

        vm.schedulerNavData = [{
            name: 'SB Drafts',
            textOffset: -10,
            state: 'scheduler.drafts',
            title: 'Manage Schedule Block Drafts',
            hide: $rootScope.currentUser && $rootScope.currentUser.req_role !== 'lead_operator' &&
            $rootScope.currentUser.req_role !== 'control_authority'
        }, {
            name: 'SBs',
            textOffset: -10,
            state: 'scheduler.subarrays',
            title: 'Manage Subarrays Schedule Blocks',
            hide: $rootScope.currentUser && $rootScope.currentUser.req_role !== 'lead_operator' &&
            $rootScope.currentUser.req_role !== 'control_authority'
        }, {
            name: 'Set-up Subs',
            textOffset: 0,
            state: 'scheduler.resources',
            title: 'Set-up Subarray',
            hide: $rootScope.currentUser && $rootScope.currentUser.req_role !== 'lead_operator' &&
            $rootScope.currentUser.req_role !== 'control_authority'
        }, {
            name: 'Observations',
            textOffset: 10,
            state: 'scheduler.observations',
            title: 'Observations Overview'
        }, {
            name: 'Workflow',
            textOffset: 10,
            state: 'scheduler',
            title: 'View Schedule Block Workflow',
            hide: $rootScope.currentUser && $rootScope.currentUser.req_role !== 'lead_operator' &&
            $rootScope.currentUser.req_role !== 'control_authority'
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
        }, {
            name: 'Sub Health',
            textOffset: 10,
            state: 'subarrayHealth',
            title: 'Subarray Health'
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
            title: 'CAM Components & Versions',
            hide: $rootScope.currentUser && $rootScope.currentUser.req_role !== 'lead_operator'
        }, {
            name: 'Processes',
            state: 'process-control',
            title: 'CAM Processes Control',
            hide: $rootScope.currentUser && $rootScope.currentUser.req_role !== 'lead_operator'
        }, {
            name: 'Operator',
            state: 'operator-control',
            title: 'Operator Controls',
            hide: $rootScope.currentUser && $rootScope.currentUser.req_role !== 'lead_operator' && $rootScope.currentUser.req_role !== 'operator'
        }];

        vm.logsNavData = [{
            name: 'Central Logs',
            state: $rootScope.openCentralLogger,
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

        //$scope.$on('$destroy', function () {
        //});
    }
})();
