var defaultDashboardConfig = {
    title: "Dashboard",
    structure: "12/4-4-4",
    rows: [
        {
            columns: [
                {
                    widgets: [
                        {
                            type: "NavigationWidget",
                            config: {},
                            title: "Navigation Controls"
                        }
                    ]
                },
                {
                    widgets: [
                        {
                            type: "GanttWidget",
                            config: {},
                            title: "Schedule Blocks"
                        }
                    ]
                }
            ]
        }
    ]
};

angular.module('katGui.landing', ['ngStorage'])

    .controller('LandingCtrl', function ($rootScope, $scope, $localStorage, $window, $timeout) {

        $scope.name = 'katGuiLandingDashboard';

        if (!$localStorage[$scope.name]) {
            $localStorage[$scope.name] = defaultDashboardConfig;
        }

        $scope.dashboardModel = $localStorage[$scope.name];
        $scope.collapsible = false;

        $scope.$on('adfDashboardChanged', function (event, name, model) {
            $localStorage[name] = model;
            $scope.dashboardModel = model;
        });

        $scope.deleteDashboardLocalStorage = function () {

            delete $localStorage[$scope.name];
            $scope.dashboardModel = defaultDashboardConfig;
            //TODO: fix this dirty hack to reload the dashboard defaults
            $timeout(function () {
                $window.location.reload();
            }, 500);
        };

    });