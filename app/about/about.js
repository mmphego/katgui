(function () {
    angular.module('katGui')
        .controller('AboutCtrl', AboutCtrl);

    function AboutCtrl(UI_VERSION) {

        var vm = this;
        vm.uiVersion = UI_VERSION;
        vm.serverVersion = 'No clue!';
    }
})();
