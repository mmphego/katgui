(function () {

    angular.module('katGui')
        .controller('SensorGraphCtrl', SensorGraphCtrl);

    function SensorGraphCtrl($rootScope, DataService, $filter, $q) {

        var vm = this;
        vm.showGridLines = false;
        vm.dateTimeError = false;
        vm.sensorNames = ['nm_monctl_mon_monctl_cpu', 'nm_proxy_mon_proxy_cpu'];
        vm.sensorStartDatetime = new Date();
        vm.sensorStartDateReadable = $filter('date')(vm.sensorStartDatetime, 'yyyy-MM-dd HH:mm:ss');

        vm.findSensors = function () {

            $rootScope.showSimpleToast('Retrieving sensor data, please wait.');
            vm.sensorStartDateReadable = $filter('date')(vm.sensorStartDatetime, 'yyyy-MM-dd HH:mm:ss');
            var startDate = vm.sensorStartDatetime.getTime();
            var endDate = (vm.getMillisecondsDifference(
                    vm.plusMinus,
                    vm.sensorStartDatetime.getTime(),
                    vm.unitLength,
                    vm.unitType));
            if (endDate < startDate) {
                startDate = endDate;
                endDate = vm.sensorStartDatetime.getTime();
            }

            var sensorNamesList = vm.sensorNames;
            var sensorNamesFetched = 0;
            var deferred = $q.defer();
            var newData = [];

            vm.sensorNames.forEach(function (sensorName) {

                DataService.findSensor(sensorName, startDate, endDate, 10000, 'ms', 'csv')
                    .success(function (result) {
                        var parsedData = d3.csv.parse(result);
                        parsedData.forEach(function(item) {
                            newData.push(item);
                        });

                        sensorNamesFetched++;
                        if (sensorNamesFetched === sensorNamesList.length) {
                            deferred.resolve();
                        }
                    })
                    .error(function (error) {
                        console.error(error);
                        sensorNamesFetched++;

                        //todo notify the promise on error
                        if (sensorNamesFetched === sensorNamesList.length) {
                            deferred.resolve();
                        }
                    });
            });

            deferred.promise.then(function() {
                if (newData.length !== 0) {
                    vm.redrawChart(newData);
                    $rootScope.showSimpleToast(newData.length + ' sensor data points found for ' + sensorNamesList.join(', ') + '.');
                } else {
                    $rootScope.showSimpleToast('No sensor data found for ' + sensorNamesList.join(', ') + '.');
                }
            });

        };

        vm.onTimeSet = function () {
            vm.sensorStartDateReadable = $filter('date')(vm.sensorStartDatetime, 'yyyy-MM-dd HH:mm:ss');
            vm.dateTimeError = false;
        };

        vm.startTimeChange = function () {

            var parsedDate = Date.parse(vm.sensorStartDateReadable);
            if (parsedDate) {
                vm.sensorStartDatetime = new Date(parsedDate);
                vm.dateTimeError = false;
            } else {
                vm.dateTimeError = true;
            }
        };

        vm.showHelp = function ($event) {
            $rootScope.showDialog('Sensor Graph Input Help',
                'From left to right, set your sensor name, start date, and the duration of the timerange you want to search for. ' +
                'For example: nm_monctl_mon_monctl_cpu, 2015-04-23 11:38:32, -, 1, Day(s), then the plus button will search for ' +
                'the sensor data of nm_monctl_mon_monctl_cpu from 2015-04-22 11:38:32 to 2015-04-23 11:38:32', $event);
        };

        vm.getMillisecondsDifference = function (plusMinus, time, count, type) {
            var multiplySign = plusMinus? -1 : 1;
            switch (type) {
                case 's':
                    return time - (1000 * count * multiplySign);
                case 'm':
                    return time - (1000 * 60 * count * multiplySign);
                case 'h':
                    return time - (1000 * 60 * 60 * count * multiplySign);
                case 'd':
                    return time - (1000 * 60 * 60 * 24 * count * multiplySign);
                default:
                    return time - (count * multiplySign);
            }
        };

        vm.clearData = function () {
            vm.clearChart();
        };
    }
})();
