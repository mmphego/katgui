angular.module('katGui').controller('LandingCtrl',function($scope, $state){

    $scope.operatorControl = function() {
        $state.go('operatorControl');
    };

    $scope.about = function() {
        $state.go('about');
    };
});