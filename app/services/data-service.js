(function () {

    angular.module('katGui.services')
        .service('DataService', DataService);

    function DataService($http, $rootScope) {

        function urlBase() {
            return $rootScope.portalUrl? $rootScope.portalUrl + '/katstore/' : '';
        }
        var api = {};

        api.sensorsInfo = function (sensorsRegex, searchNumericOnly, includeStaleSensors) {
            // example: katstore/api/search/?stale=true&q=device.status&numeric=true
            var requestStr = urlBase() +
                'api/search/?meta=true&q=' + sensorsRegex +
                '&numeric=' + (searchNumericOnly? 'true' : 'false') +
                '&stale=' + (includeStaleSensors? 'true' : 'false');
            return $http.get(requestStr);
        };

        api.sensorData = function (params) {
            // example: katstore/api/query/?sensor=anc_air_relative_humidity&start_time=1515040457&end_time=1515562457&limit=1000000&interval=600&avg=1
            var requestStr = urlBase() +
                'api/query/?sensor=' + params.name +
                '&start_time=' + params.start +
                '&end_time=' + params.end +
                '&limit=' + params.limit +
		'&include_value_time=True';
            if (params.interval >= 0) {
                requestStr += '&interval=' + params.interval + '&avg=1';
            }
            if (params.allFields) {
                requestStr += '&all_fields=1';
            }
            return $http.get(requestStr);
        };

        api.sampleValueDuration = function (sensorNames, startDate, endDate) {
            // example: katstore/sample-value-duration?sensors=agg*&start_time=1520180800&end_time=1520380800
            var requestStr = urlBase() +
                'sample-value-duration?sensors=' + sensorNames +
                '&start_time=' + startDate +
                '&end_time=' + endDate;
                return $http.get(requestStr);
        };

        return api;
    }
})();
