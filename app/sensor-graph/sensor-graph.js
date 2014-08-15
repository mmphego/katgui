angular.module('katGui').controller('SensorGraphCtrl', function ($scope, $interval, DataService) {

    $scope.currentSensorFindSearch = 'wind.speed';
    $scope.currentSensorDataSearch = 'anc.averaged.1minute.asc.wind.speed';
    $scope.currentSensorMetaDataSearch = 'anc.averaged.1minute.asc.wind.speed';

    $scope.d3LineData = [
    ];

    $scope.d3LineDataSize = 10;
    $scope.d3LineLastX = 10;


    $scope.findSensorByString = function () {
        $scope.findSensorMessage = null;

        DataService.findSensor($scope.currentSensorFindSearch)
            .success(function (findSensorResult) {
                $scope.findSensorMessage = findSensorResult;
            })
            .error(function (error) {
                $scope.findSensorMessage = 'error retrieving sensor meta data, see console';
                console.log(error);
            });
    };

    $scope.getSensorMetaData = function () {
        $scope.sensorMetaData = null;

        DataService.sensorMetaData($scope.currentSensorMetaDataSearch)
            .success(function (metaDataResult) {
                $scope.sensorMetaData = metaDataResult;
            })
            .error(function (error) {
                $scope.sensorMetaData = 'error retrieving sensor meta data, see console';
                console.log(error);
            });
    };

    $scope.getSensorData = function () {
        $scope.sensorData = null;

        DataService.sensorData($scope.currentSensorDataSearch)
            .success(function (dataResult) {
                $scope.sensorData = dataResult;
            })
            .error(function (error) {
                $scope.sensorData = 'error retrieving sensor meta data, see console';
                console.log(error);
            });
    };

    $scope.mapSensorData = function () {
        $scope.d3LineData = $scope.sensorData.data;
        $scope.d3LineDataSize = $scope.d3LineData.length;
    };

//    $interval(function() {
//        var max = 100,
//            min = 0;
//        var randomVal = Math.floor(Math.random() * (max - min + 1)) + min;
//        $scope.d3LineData.shift();
//
//        $scope.d3LineLastX++;
//        $scope.d3LineData.push({x: $scope.d3LineLastX, y: randomVal});
//
//        $scope.d3LineDataSize++;
//    }, 1000);
});