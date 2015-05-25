(function () {

    angular.module('katGui.config', [])
        .controller('ConfigCtrl', ConfigCtrl);

    function ConfigCtrl($rootScope, $scope, $localStorage, THEMES) {
        var vm = this;

        vm.init = function () {
            var showAlarms = $rootScope.showAlarms;
            if ($rootScope.showAlarms === undefined) {
                showAlarms = true;
            }
            vm.showJulianDate = $rootScope.showJulianDate;
            vm.showLST = $rootScope.showLST;
            vm.showAlarms = showAlarms;
            vm.showLocalAndSAST = $rootScope.showLocalAndSAST;
            $rootScope.showAlarms = showAlarms;
            vm.showLargeAlarms = $rootScope.showLargeAlarms;
            vm.sensorListStrategyInterval = $rootScope.sensorListStrategyInterval;
            vm.sensorListStrategyType = $rootScope.sensorListStrategyType;
            vm.themes = THEMES;
            vm.selectedTheme = $localStorage['selectedTheme'];
            if (!angular.isDefined(vm.selectedTheme)) {
                vm.selectedTheme = vm.themes[0].name;
            }
        };

        vm.themeChange = function (newVal) {
            if (typeof newVal !== 'undefined') {
                var newTheme = _.findWhere(THEMES, {name: newVal});
                $rootScope.themePrimary = newTheme.primary;
                $rootScope.themeSecondary = newTheme.secondary;
                $rootScope.themePrimaryButtons = newTheme.primaryButtons;
                $localStorage['selectedTheme'] = newTheme.name;
                if (newTheme.name === 'Dark') {
                    angular.element('body').addClass('dark-theme');
                } else {
                    angular.element('body').removeClass('dark-theme');
                }
            }
        };

        vm.showJulianDateChange = function (newVal) {
            if (typeof newVal !== 'undefined') {
                $rootScope.showJulianDate = newVal;
                $localStorage['showJulianDate'] = newVal;
            }
        };

        vm.showLSTChange = function (newVal) {
            if (typeof newVal !== 'undefined') {
                $rootScope.showLST = newVal;
                $localStorage['showLST'] = newVal;
            }
        };

        vm.showLocalAndSASTChange = function (newVal) {
            if (typeof newVal !== 'undefined') {
                $rootScope.showLocalAndSAST = newVal;
                $localStorage['showLocalAndSAST'] = newVal;
            }
        };

        vm.showLargeAlarmsChange = function (newVal) {
            if (typeof newVal !== 'undefined') {
                $rootScope.showLargeAlarms = newVal;
                $localStorage['showLargeAlarms'] = newVal;
            }
        };

        vm.showAlarmsChange = function (newVal) {
            if (typeof newVal !== 'undefined') {
                $rootScope.showAlarms = newVal;
                $localStorage['showAlarmsNotify'] = newVal;
            }
        };

        vm.sensorListStrategyTypeChange = function () {
            $rootScope.sensorListStrategyType = vm.sensorListStrategyType;
            $localStorage['sensorListStrategyType'] = vm.sensorListStrategyType;
        };

        vm.sensorListStrategyIntervalChange = function () {
            $rootScope.sensorListStrategyInterval = vm.sensorListStrategyInterval;
            $localStorage['sensorListStrategyInterval'] = vm.sensorListStrategyInterval;
        };

        vm.undbindThemeChange = $scope.$watch('vm.selectedTheme', vm.themeChange);
        vm.undbindShowJulianDate = $scope.$watch('vm.showJulianDate', vm.showJulianDateChange);
        vm.undbindShowLST = $scope.$watch('vm.showLST', vm.showLSTChange);
        vm.undbindShowLocalAndSAST = $scope.$watch('vm.showLocalAndSAST', vm.showLocalAndSASTChange);
        vm.unbindShowLargeAlarms = $scope.$watch('vm.showLargeAlarms', vm.showLargeAlarmsChange);
        vm.unbindShowAlarms = $scope.$watch('vm.showAlarms', vm.showAlarmsChange);

        $scope.$on('$destroy', function () {
            vm.unbindShowAlarms();
            vm.unbindShowLargeAlarms();
            vm.undbindShowJulianDate();
            vm.undbindShowLST();
            vm.undbindShowLocalAndSAST();
            vm.undbindThemeChange();
        });

        vm.init();
    }

})();
