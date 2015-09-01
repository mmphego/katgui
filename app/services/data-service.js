(function () {

    angular.module('katGui.services')
        .service('DataService', DataService);

    function DataService($http, SERVER_URL) {

        var urlBase = SERVER_URL + '/katstore/';
        var api = {};

        api.sensorData = function (sensorName, startDate, endDate, limit, time_type, format, interval) {
            var requestStr = urlBase +
                'sensor-samples?sensor=' + sensorName +
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

        api.sensorsInfo = function (sensorNames) {
            var request = {
                method: 'post',
                url: urlBase + 'sensors-info',
                headers: {}
            };
            request.headers['Content-Type'] = 'application/json';
            request.data = sensorNames;
            return $http(request);
        };

        return api;
    }
})();
