angular.module('katGui').controller('OperatorControlCtrl', function ($scope) {

    $scope.title = 'Operator Controls';

    //test data
    $scope.receptorsData = [
        {
            name: "atn1",
            state: "STOW",
            inhibited: false
        },
        {
            name: "atn2",
            state: "STOW",
            inhibited: true
        },
        {
            name: "atn3",
            state: "STOW",
            inhibited: false
        },
        {
            name: "atn4",
            state: "STOW",
            inhibited: false
        },
        {
            name: "atn5",
            state: "STOW",
            inhibited: true
        },
        {
            name: "atn6",
            state: "STOW",
            inhibited: true
        },
        {
            name: "atn7",
            state: "STOW",
            inhibited: true
        }
    ];


    $scope.receptors = [];

    var maxCols = 8;
    var maxRows = 8;
    var counter = 0;
    var doBreak = false;
    var dataLength = $scope.receptorsData.length;

    for (var i = 0; i < maxRows; i++) {
        $scope.receptors.push([]);
        for (var j = 0; j < maxCols; j++) {
            if (counter < dataLength) {
                var obj = {id: counter, receptor: $scope.receptorsData[counter]};
                $scope.receptors[i][j] = obj;
                counter++;
            } else {
                doBreak = true;
                break;
            }
        }
        if (doBreak) {
            break;
        }
    }
});

//$scope.receptorsData = [{
//    name: "atn1",
//    state: "STOW",
//    inhibited: false
//}, {
//    name: "atn2",
//    state: "STOW",
//    inhibited: true
//}, {
//    name: "atn3",
//    state: "STOW",
//    inhibited: false
//}, {
//    name: "atn4",
//    state: "STOW",
//    inhibited: false
//}, {
//    name: "atn5",
//    state: "STOW",
//    inhibited: true
//}, {
//    name: "atn6",
//    state: "STOW",
//    inhibited: true
//}, {
//    name: "atn7",
//    state: "STOW",
//    inhibited: true
//}, {
//    name: "atn5",
//    state: "STOW",
//    inhibited: true
//}, {
//    name: "atn5",
//    state: "STOW",
//    inhibited: true
//}, {
//    name: "atn5",
//    state: "STOW",
//    inhibited: true
//}, {
//    name: "atn5",
//    state: "STOW",
//    inhibited: true
//}, {
//    name: "atn5",
//    state: "STOW",
//    inhibited: true
//}, {
//    name: "atn5",
//    state: "STOW",
//    inhibited: true
//}, {
//    name: "atn5",
//    state: "STOW",
//    inhibited: true
//}];