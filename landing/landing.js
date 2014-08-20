angular.module('katGui.landing', ['katGui'])

    .controller('LandingCtrl', function ($scope, $state) {

        $scope.operatorControl = function () {
            $state.go('operatorControl');
        };

        $scope.about = function () {
            $state.go('about');
        };

        $scope.changeState = function (newState) {
            $state.go(newState);
        };
    });