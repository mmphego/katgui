(function () {

    angular.module('katGui')
        .controller('ProcessControlCtrl', ProcessControlCtrl);

    function ProcessControlCtrl($scope) {

        var vm = this;

        $scope.$on('$destroy', function () {

        });
    }
})();
