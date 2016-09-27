(function () {

    angular.module('katGui.services')
        .service('DataService', DataService);

    function DataService($http, $rootScope) {

        function urlBase() {
            return $rootScope.portalUrl? $rootScope.portalUrl + '/katstore/' : '';
        }
        var api = {};

        api.sensorsInfo = function (sensorNames, type, limit) {
            var requestStr = urlBase() +
                'sensors?sensors=' + sensorNames +
                '&sensor_type=' + type +
                '&limit=' + limit;
            return $http.get(requestStr);
        };

        api.sensorData = function (namespace, sensorName, startDate, endDate, limit, interval) {
            var requestStr = urlBase() +
                'samples?sensor=' + sensorName +
                '&start=' + startDate +
                '&end=' + endDate +
                '&limit=' + limit +
                '&results_in_chunks=' + 0 +
                '&time_type=ms';

            if (namespace) {
                requestStr += '&namespace=' + encodeURI(namespace);
            }
            if (interval) {
                requestStr += '&interval=' + interval;
            }
            return $http.get(requestStr);
        };

        api.sensorDataRegex = function (namespace, sensorNames, startDate, endDate, limit, interval) {
            var data = {
                sensors: sensorNames,
                start_ts: startDate,
                end_ts: endDate,
                limit: limit,
                time_type: 'ms'
            };
            if (namespace) {
                data.namespace = namespace;
            }
            if (interval) {
                data.interval = interval;
            }

            var req = {
                method: 'post',
                url: urlBase() + 'samples',
                headers: {},
                data: data
            };
            req.headers['Content-Type'] = 'application/json';
            return $http(req);
        };

        api.sampleValueDuration = function (sensorNames, startDate, endDate) {
            var requestStr = urlBase() +
                'sample-value-duration?sensors=' + sensorNames +
                '&start=' + startDate +
                '&end=' + endDate +
                '&time_type=s';
                return $http.get(requestStr);
        };

        return api;
    }
})();
