(function () {

    angular.module('katGui.widgets.navigationWidget', ['adf.provider'])
        .config(configureNavigationWidget)
        .controller('NavigationWidgetCtrl', NavigationWidgetCtrl);

    function configureNavigationWidget(dashboardProvider) {
        dashboardProvider
            .widget('NavigationWidget', {
                title: 'Navigation Widget',
                description: 'Container for navigation controls/buttons',
                templateUrl: 'app/widgets/navigation/navigation-widget.html',
                controller: 'NavigationWidgetCtrl'
            });
    }

    function NavigationWidgetCtrl($state) {

        var vm = this;

        vm.stateGo = function (newState) {
            $state.go(newState);
        };
    }
})();
