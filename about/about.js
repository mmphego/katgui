angular.module('katGui')

    .controller('AboutCtrl', function ($scope, UI_VERSION) {

        $scope.title = 'About KatGui';
        $scope.uiVersion = UI_VERSION;
        $scope.serverVersion = 'No clue!';
    });