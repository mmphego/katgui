(function () {

    angular.module('katGui.config', [])
        .controller('ConfigCtrl', ConfigCtrl);

    function ConfigCtrl($rootScope, $scope, $localStorage, THEMES) {
        var vm = this;

        var showAlarms = $localStorage['showAlarmsNotify'] || $rootScope.showAlarms;
        if ($rootScope.showAlarms === undefined) {
            showAlarms = true;
        }

        vm.showJulianDate = $rootScope.showJulianDate;
        vm.showLST = $rootScope.showLST;
        vm.showAlarms = showAlarms;
        vm.showLocalAndSAST = $rootScope.showLocalAndSAST;
        $rootScope.showAlarms = showAlarms;
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

        var undbindShowJulianDate = $scope.$watch('vm.showJulianDate', function (newVal) {
            if (typeof newVal !== 'undefined') {
                $rootScope.showJulianDate = newVal;
                $localStorage['showJulianDate'] = newVal;
            }
        });

        var undbindShowLST = $scope.$watch('vm.showLST', function (newVal) {
            if (typeof newVal !== 'undefined') {
                $rootScope.showLST = newVal;
                $localStorage['showLST'] = newVal;
            }
        });

        var undbindShowLocalAndSAST = $scope.$watch('vm.showLocalAndSAST', function (newVal) {
            if (typeof newVal !== 'undefined') {
                $rootScope.showLocalAndSAST = newVal;
                $localStorage['showLocalAndSAST'] = newVal;
            }
        });

        var unbindShowLargeAlarms = $scope.$watch('vm.showLargeAlarms', function (newVal) {
            if (typeof newVal !== 'undefined') {
                $rootScope.showLargeAlarms = newVal;
                $localStorage['showLargeAlarms'] = newVal;
            }
        });

        var unbindShowAlarms = $scope.$watch('vm.showAlarms', function (newVal) {
            if (typeof newVal !== 'undefined') {
                $rootScope.showAlarms = newVal;
                $localStorage['showAlarmsNotify'] = newVal;
            }
        });

        $scope.$on('$destroy', function () {
            unbindShowAlarms();
            unbindShowLargeAlarms();
            undbindShowJulianDate();
            undbindShowLST();
            undbindShowLocalAndSAST();
        });
    }

})();
