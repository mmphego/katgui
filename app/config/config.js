(function () {

    angular.module('katGui.config', [])
        .controller('ConfigCtrl', ConfigCtrl);

    function ConfigCtrl($rootScope, $localStorage, THEMES) {
        var vm = this;

        vm.themes = THEMES;
        vm.selectedTheme = $localStorage['selectedTheme'];
        if (!angular.isDefined(vm.selectedTheme)) {
            vm.selectedTheme = vm.themes[0].name;
        }

        vm.themeChanged = function () {
            var newTheme = _.findWhere(THEMES, {name: vm.selectedTheme});
            $rootScope.themePrimary = newTheme.primary;
            $rootScope.themeSecondary = newTheme.secondary;
            $rootScope.themePrimaryButtons = newTheme.primaryButtons;
            $localStorage['selectedTheme'] = newTheme.name;
            if (newTheme.name === 'Dark') {
                angular.element(document.querySelector('body')).addClass('dark-theme');
            } else {
                angular.element(document.querySelector('body')).removeClass('dark-theme');
            }
        };

        vm.saveToLocalStorage = function (key, value) {
            $localStorage[key] = value;
        };
    }

})();
