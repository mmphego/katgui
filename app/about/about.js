angular.module('katGui').controller('AboutCtrl',function($scope, UI_VERSION){

    $scope.title = 'About page below...';
    $scope.uiVersion = UI_VERSION;
    $scope.serverVersion = 'No clue!';
});