angular.module('katGui.landing', ['LocalStorageModule'])

    .config(['localStorageServiceProvider', function (localStorageServiceProvider) {
        localStorageServiceProvider.setPrefix('adf');
    }])

    .controller('LandingCtrl', function ($scope, localStorageService) {

        var name = 'katGuiLandingDashboard';
        var dashboardModel = localStorageService.get(name);

        if (!dashboardModel) {
            dashboardModel = {
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
                            }
                        ]
                    }
                ]
            };
        }

        $scope.name = name;
        $scope.dashboardModel = dashboardModel;
        $scope.collapsible = false;

        $scope.$on('adfDashboardChanged', function (event, name, model) {
            localStorageService.set(name, model);
        });

    });