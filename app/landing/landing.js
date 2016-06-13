(function () {

    angular.module('katGui.landing', ['ngStorage'])
        .controller('LandingCtrl', LandingCtrl);

    var defaultDashboardConfig = {
        title: " ",
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
                    // , {
                    //    widgets: [
                    //        {
                    //            type: "ApodWidget",
                    //            config: {},
                    //            title: "APOD"
                    //        }
                    //    ]
                    // }
                ]
            }
        ]
    };

    function LandingCtrl($scope, $localStorage, $window, $timeout) {

        var vm = this;
        vm.name = 'katGuiLandingDashboard';

        if (!$localStorage[vm.name]) {
            $localStorage[vm.name] = defaultDashboardConfig;
        }

        vm.dashboardModel = $localStorage[vm.name];
        vm.collapsible = false;

        vm.dashboardWidgets = [{
            templateUrl: 'app/widgets/navigation/navigation-widget-blocks.html'
        }];

        $scope.$on('adfDashboardChanged', function (event, name, model) {
            $localStorage[name] = model;
            vm.dashboardModel = model;
        });

        vm.deleteDashboardLocalStorage = function () {

            delete $localStorage[vm.name];
            vm.dashboardModel = defaultDashboardConfig;
            //TODO: fix this dirty hack to reload the dashboard defaults
            $timeout(function () {
                $window.location.reload();
            }, 500);
        };

    }
})();
