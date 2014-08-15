angular.module('katGui').controller('SensorGraphCtrl', function ($scope) {

    $scope.d3Data = [
        {name: "Greg", score: 98},
        {name: "Ari", score: 96},
        {name: 'Q', score: 75},
        {name: "Loser", score: 48}
    ];

    $scope.d3LineData=[
        {hour: 1,sales: 54},
        {hour: 2,sales: 66},
        {hour: 3,sales: 77},
        {hour: 4,sales: 70},
        {hour: 5,sales: 60},
        {hour: 6,sales: 63},
        {hour: 7,sales: 55},
        {hour: 8,sales: 47},
        {hour: 9,sales: 55},
        {hour: 10,sales: 30}
    ];

});