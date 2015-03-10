(function () {

    angular.module('katGui')
        .controller('SensorGraphCtrl', SensorGraphCtrl);

    function SensorGraphCtrl(DataService, $rootScope) {

        var vm = this;

        vm.currentSensorFindSearch = 'wind.speed';
        vm.currentSensorDataSearch = 'anc.averaged.1minute.asc.wind.speed';
        vm.currentSensorMetaDataSearch = 'anc.averaged.1minute.asc.wind.speed';

        vm.d3LineData = [];

        vm.d3LineDataSize = 10;
        vm.d3LineLastX = 10;


        vm.findSensorByString = function () {
            vm.findSensorMessage = null;

            DataService.findSensor(vm.currentSensorFindSearch)
                .success(function (findSensorResult) {
                    vm.findSensorMessage = findSensorResult;
                })
                .error(function (error) {
                    vm.findSensorMessage = 'error retrieving sensor meta data, see console';
                    console.log(error);
                });
        };

        vm.getSensorMetaData = function () {
            vm.sensorMetaData = null;

            DataService.sensorMetaData(vm.currentSensorMetaDataSearch)
                .success(function (metaDataResult) {
                    vm.sensorMetaData = metaDataResult;
                })
                .error(function (error) {
                    vm.sensorMetaData = 'error retrieving sensor meta data, see console';
                    console.log(error);
                });
        };

        vm.getSensorData = function () {
            vm.sensorData = null;

            DataService.sensorData(vm.currentSensorDataSearch)
                .success(function (dataResult) {
                    vm.sensorData = dataResult;
                    if (dataResult.error) {
                        $rootScope.showSimpleDialog('Error Retrieving Data', dataResult.error);
                    } else {
                        vm.mapSensorData();
                    }
                })
                .error(function (error) {
                    vm.sensorData = 'error retrieving sensor meta data, see console';
                    console.log(error);
                });
        };

        vm.mapSensorData = function () {
            vm.d3LineData = vm.sensorData.data;
            vm.d3LineDataSize = vm.d3LineData.length;
        };



//    $interval(function() {
//        var max = 100,
//            min = 0;
//        var randomVal = Math.floor(Math.random() * (max - min + 1)) + min;
//        vm.d3LineData.shift();
//
//        vm.d3LineLastX++;
//        vm.d3LineData.push({x: vm.d3LineLastX, y: randomVal});
//
//        vm.d3LineDataSize++;
//    }, 1000);
    }
})();
