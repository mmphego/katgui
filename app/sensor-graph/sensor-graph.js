(function () {

    angular.module('katGui')
        .controller('SensorGraphCtrl', SensorGraphCtrl);

    function SensorGraphCtrl($scope, DataService) {

        var vm = this;
        vm.showGridLines = false;
        //vm.sensorInput = 'm062_enviro_gust_wind_speed';
        vm.sensorInput = 'sys_heartbeats_data_3';


        vm.addSensor = function (sensorName) {
            DataService.findSensor(sensorName, 100, 'ms', 'csv')
                .success(function (result) {

                    var newData = d3.csv.parse(result);
                    vm.redrawChart(newData);
                })
                .error(function (error) {
                    console.error(error);
                });
        };
    }
})();
