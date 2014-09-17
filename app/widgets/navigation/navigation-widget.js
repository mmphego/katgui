angular.module('katGui.widgets.navigationWidget', ['adf.provider'])

    .config(function(dashboardProvider) {
        dashboardProvider
            .widget('NavigationWidget', {
                title: 'Navigation Widget',
                description: 'Container for navigation controls/buttons',
                templateUrl: 'app/widgets/navigation/navigation-widget.html',
                controller: 'NavigationWidgetCtrl'
            });
    })

    .controller('NavigationWidgetCtrl', function($rootScope, $scope){

        $scope.stateGo = function (newState) {
          $rootScope.stateGo(newState);
        };
    });
