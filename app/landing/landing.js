(function () {

    angular.module('katGui.landing', ['ngStorage'])
        .controller('LandingCtrl', LandingCtrl);

    function LandingCtrl($rootScope, $scope, $state, $localStorage, $timeout) {

        var vm = this;
        vm.dashboardWidgetsOrder = [];
        var localStorageName = 'katGuiDashboardLayout';

        if (!$rootScope.jwt) {
            $state.go('login');
        }

        $scope.$watch("vm.dashboardWidgets", _.debounce(function () {
            vm.saveDashboardConfig();
        }, 500), true);

        vm.saveDashboardConfig = function () {
            $localStorage[localStorageName] = vm.dashboardWidgets;
        };

        vm.resetDashboardLayout = function () {
            vm.dashboardWidgets = [{
                name: 'Navigation Widget',
                order: 0,
                templateUrl: 'app/widgets/navigation/navigation-widget-blocks.html',
                visible: true
            }, {
                name: 'Apod Widget',
                order: 1,
                templateUrl: 'app/widgets/apod/apod-widget.html',
                visible: true
            }];
            vm.dashboardWidgets.forEach(function (widget, index) {
                vm.dashboardWidgetsOrder.push(index);
            });
        };

        vm.dashboardWidgets = $localStorage[localStorageName];
        if (!vm.dashboardWidgets) {
            vm.resetDashboardLayout();
        } else {
            vm.dashboardWidgets.forEach(function (widget, index) {
                vm.dashboardWidgetsOrder.push(index);
            });
        }
    }
})();
