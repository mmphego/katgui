(function () {

    angular.module('katGui')
        .controller('SensorGraphCtrl', SensorGraphCtrl);

    function SensorGraphCtrl($rootScope, DataService, $filter, $q) {

        var vm = this;
        vm.showGridLines = false;
        vm.dateTimeError = false;
        vm.sensorNames = [];
        vm.sensorStartDatetime = new Date();
        vm.sensorStartDateReadable = $filter('date')(vm.sensorStartDatetime, 'yyyy-MM-dd HH:mm:ss');
        vm.sensorSearchNames = [];
        vm.sensorSearchStr = "";
        vm.waitingForSearchResult = false;

        vm.findSensorDataForSelection = function () {

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

                DataService.findSensor(sensorName, startDate, endDate, 10000, 'ms', 'json')
                    .success(function (result) {

                        //pack the result in the way our chart needs it
                        //because the json we receive is not good enough
                        for (var attr in result) {
                            vm.sensorNames.push({name: attr});
                            for (var i = 0; i < result[attr].length; i++) {
                                newData.push({Sensor: attr, Timestamp: result[attr][i][0], Value: result[attr][i][1]});
                            }
                        }
                        //var parsedData = d3.csv.parse(result);
                        //parsedData.forEach(function(item) {
                        //    newData.push(item);
                        //});

                        sensorNamesFetched++;
                        if (sensorNamesFetched >= sensorNamesList.length) {
                            deferred.resolve();
                        }
                    })
                    .error(function (error) {
                        console.error(error);
                        sensorNamesFetched++;

                        //todo notify the promise on error
                        if (sensorNamesFetched >= sensorNamesList.length) {
                            deferred.resolve();
                        }
                    });
            });

            deferred.promise.then(function () {
                if (newData.length !== 0) {
                    vm.redrawChart(newData, vm.showGridLines);
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

        vm.showGridLinesChanged = function () {
            vm.redrawChart(null, vm.showGridLines);
        };

        vm.showHelp = function ($event) {
            $rootScope.showDialog('Sensor Graph Input Help',
                'From left to right, set your sensor name, start date, and the duration of the timerange you want to search for. ' +
                'For example: nm_monctl_mon_monctl_cpu, 2015-04-23 11:38:32, -, 1, Day(s), then the plus button will search for ' +
                'the sensor data of nm_monctl_mon_monctl_cpu from 2015-04-22 11:38:32 to 2015-04-23 11:38:32', $event);
        };

        vm.getMillisecondsDifference = function (plusMinus, time, count, type) {
            var multiplySign = plusMinus ? -1 : 1;
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
            vm.sensorNames.splice(0, vm.sensorNames.length);
            vm.clearChart();
        };

        vm.validateSearchInputLength = function (searchStr) {
            if (searchStr.length > 2) {
                vm.sensorSearchFieldLengthError = false;
                vm.sensorSearchFieldShowTooltip = false;

            } else {
                vm.sensorSearchFieldLengthError = true;
                vm.sensorSearchFieldShowTooltip = true;
            }
        };

        vm.findSensorNames = function (searchStr, $event) {

            if ($event.keyCode !== 13) {
                return;
            }
            if (searchStr.length > 2) {
                vm.sensorSearchNames.splice(0, vm.sensorSearchNames.length);
                vm.waitingForSearchResult = true;
                DataService.findSensorName(searchStr)
                    .success(function (result) {
                        result.data.forEach(function (sensor) {
                            vm.sensorSearchNames.push(sensor);
                        });
                        vm.waitingForSearchResult = false;
                    })
                    .error(function (result) {
                        console.error(result);
                        vm.waitingForSearchResult = false;
                    });
            }
        };

        vm.searchSensorClicked = function (sensor) {
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
            vm.findSensorData(sensor.name, startDate, endDate);
        };

        vm.findSensorData = function (sensorName, startDate, endDate) {
            $rootScope.showSimpleToast('Retrieving sensor data, please wait.');
            DataService.findSensor(sensorName, startDate, endDate, 10000, 'ms', 'json')
                .success(function (result) {
                    var newData = [];
                    //pack the result in the way our chart needs it
                    //because the json we receive is not good enough
                    for (var attr in result) {
                        for (var i = 0; i < result[attr].length; i++) {
                            newData.push({Sensor: attr, Timestamp: result[attr][i][0], Value: result[attr][i][1]});
                        }
                    }

                    if (newData.length !== 0) {
                        $rootScope.showSimpleToast(newData.length + ' sensor data points found for ' + sensorName + '.');
                        vm.sensorNames.push({name: sensorName});
                        vm.redrawChart(newData, vm.showGridLines);
                    } else {
                        $rootScope.showSimpleToast('No sensor data found for ' + sensorName + '.');
                    }
                })
                .error(function (error) {
                    console.error(error);
                });
        };

        vm.chipRemovePressed = function (chip) {
            vm.removeSensorLine(chip.name);
        };
    }
})();
