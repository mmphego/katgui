(function () {

    angular.module('katGui')
        .controller('SensorGraphCtrl', SensorGraphCtrl);

    function SensorGraphCtrl(DataService) {

        var vm = this;
        vm.showGridLines = false;
        vm.sensorData = [
            [{'x': 1, 'y': 0}, {'x': 2, 'y': 5}, {'x': 3, 'y': 10}, {'x': 4, 'y': 0}, {
                'x': 5,
                'y': 6
            }, {'x': 6, 'y': 11}, {'x': 7, 'y': 9}, {'x': 8, 'y': 4}, {'x': 9, 'y': 11}, {'x': 10, 'y': 2}],
            [{'x': 1, 'y': 1}, {'x': 2, 'y': 6}, {'x': 3, 'y': 11}, {'x': 4, 'y': 1}, {
                'x': 5,
                'y': 7
            }, {'x': 6, 'y': 12}, {'x': 7, 'y': 8}, {'x': 8, 'y': 3}, {'x': 9, 'y': 13}, {'x': 10, 'y': 3}],
            [{'x': 1, 'y': 2}, {'x': 2, 'y': 7}, {'x': 3, 'y': 12}, {'x': 4, 'y': 2}, {
                'x': 5,
                'y': 8
            }, {'x': 6, 'y': 13}, {'x': 7, 'y': 7}, {'x': 8, 'y': 2}, {'x': 9, 'y': 4}, {'x': 10, 'y': 7}],
            [{'x': 1, 'y': 3}, {'x': 2, 'y': 8}, {'x': 3, 'y': 13}, {'x': 4, 'y': 3}, {
                'x': 5,
                'y': 9
            }, {'x': 6, 'y': 14}, {'x': 7, 'y': 6}, {'x': 8, 'y': 1}, {'x': 9, 'y': 7}, {'x': 10, 'y': 9}],
            [{'x': 1, 'y': 4}, {'x': 2, 'y': 9}, {'x': 3, 'y': 14}, {'x': 4, 'y': 4}, {
                'x': 5,
                'y': 10
            }, {'x': 6, 'y': 15}, {'x': 7, 'y': 5}, {'x': 8, 'y': 0}, {'x': 9, 'y': 8}, {'x': 10, 'y': 5}]
        ];

        vm.addSensor = function (sensorName) {
            DataService.findSensor(sensorName)
                .success(function (result) {
                    console.log(result);
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
