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
            title: 'Manage Schedule Block Drafts'
        }, {
            name: 'Observations',
            textOffset: 0,
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
        }, {
            name: 'Processes',
            state: 'process-control',
            title: 'CAM Processes Control',
        }, {
            name: 'Operator',
            state: 'operator-control',
            title: 'Operator Controls',
        }];

        vm.logsNavData = [{
            name: 'Central Logs',
            state: $rootScope.openCentralLogger,
            textOffset: -15,
            title: 'Open Central Logger in a new tab'
        }, {
            name: 'System Logs',
            textOffset: -10,
            state: $rootScope.openSystemLogger,
            title: 'Open System Logs in a new tab'
        }, {
            name: 'KATCP Logs',
            textOffset: 0,
            state: $rootScope.openKatsnifferLogger,
            stateParams: ['katcpmsgs.log'],
            title: 'Open KATCP Messages Log in a new tab'
        }, {
            name: 'CAM Docs',
            textOffset: 5,
            state: $rootScope.openUrlInNewTab,
            stateParams: ['https://drive.google.com/drive/folders/0B8fhAW5QnZQWVkdXYm1GTnZ2X1k'],
            title: 'Open the CAM deployment docs'
        }, {
            name: 'User Logs',
            textOffset: 5,
            state: 'userlogs',
            title: 'User Defined Logs'
        }];

        //$scope.$on('$destroy', function () {
        //});
    }
})();
