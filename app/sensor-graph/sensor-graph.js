(function () {

    angular.module('katGui')
        .controller('SensorGraphCtrl', SensorGraphCtrl);

    function SensorGraphCtrl(DataService) {

        var vm = this;
        vm.showGridLines = false;
        vm.sensorInput = 'm062_enviro_gust_wind_speed';
        vm.sensorData = {};

        vm.addSensor = function (sensorName) {
            DataService.findSensor(sensorName)
                .success(function (result) {
                    vm.sensorData = result;
                })
                .error(function (error) {
                    console.error(error);
                });
        };

        vm.mapSensorData = function () {
            vm.d3LineData = vm.sensorData.data;
        };
    }
})();
