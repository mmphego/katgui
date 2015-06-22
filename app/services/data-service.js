(function () {

    angular.module('katGui.services')
        .service('DataService', DataService);

    function DataService($http, SERVER_URL) {

        var urlBase = SERVER_URL + ':8850/katstore/';
        var api = {};

        api.findSensor = function (sensorName, startDate, endDate, limit, time_type, format, interval) {
            var requestStr = urlBase +
                '?sensor=' + sensorName +
                '&start=' + startDate +
                '&end=' + endDate +
                '&limit=' + limit +
                '&time_type=' + time_type +
                '&format=' + format;
            if (interval) {
                requestStr += '&interval=' + interval;
            }
            return $http.get(requestStr);
        };

        api.findSensorName = function (searchStr, sensor_type) {
            return $http.get(urlBase + 'findsensor?sensor=' + searchStr + '&sensor_type=' + sensor_type);
        };

        api.sensorInfo = function (sensorName) {
            return $http.get(urlBase + 'sensor/' + sensorName);
        };

        api.findSensorDataFromRegex = function (sensorName, startDate, endDate, limit, time_type, format, sensor_type) {
            return $http.get(urlBase +
            '?sensor=' + sensorName +
            '&start=' + startDate +
            '&end=' + endDate +
            '&limit=' + limit +
            '&time_type=' + time_type +
            '&format=' + format +
            '&sensor_type=' + sensor_type);
        };

        return api;
    }
})();
