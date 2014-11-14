(function () {

    angular.module('katGui.config', [])
        .controller('ConfigCtrl', ConfigCtrl);

    function ConfigCtrl($rootScope, $scope, $localStorage, THEMES) {
        var vm = this;

        vm.showLargeAlarms = $rootScope.showLargeAlarms;
        vm.themes = THEMES;
        vm.selectedTheme = _.find(THEMES, function (theme) {
            return $localStorage['selectedTheme'] === theme.name;
        });

        if (!vm.selectedTheme) {
            vm.selectedTheme = vm.themes[0];
        } else {
            vm.selectedTheme = _.find(THEMES, function (theme) {
                return $localStorage['selectedTheme'] === theme.name;
            });
        }

        vm.selectedThemeChanged = function (newTheme) {
            $rootScope.themePrimary = newTheme.primary;
            $rootScope.themeSecondary = newTheme.secondary;
            $rootScope.themePrimaryButtons = newTheme.primaryButtons;

            $localStorage['selectedTheme'] = newTheme.name;
        };

        $scope.$watch('vm.showLargeAlarms', function (newVal) {
            if (typeof newVal !== 'undefined') {
                $rootScope.showLargeAlarms = newVal;
                $localStorage['showLargeAlarms'] = newVal;
            }
        });
    }

})();
