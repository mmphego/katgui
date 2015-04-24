(function () {

    angular.module('katGui')
        .service('DataService', DataService);

    function DataService($http, SERVER_URL) {

        var urlBase = SERVER_URL + ':8850/katstore/';

        this.findSensor = function (sensorName, startDate, endDate, limit, time_type, format) {
            return $http.get(urlBase + '?sensor=' + sensorName + '&start_ts=' + startDate + '&end_ts=' + endDate + '&limit=' + limit + '&time_type=' + time_type + '&format=' + format);
        };

        this.findSensorName = function (searchStr) {
            return $http.get(urlBase + 'findsensor?sensor=' + searchStr);
        };

        //this.sensorMetaData = function (sensorName) {
        //    return $http.get(urlBase + 'sensor_info?sensor=' + sensorName);
        //};
        //
        //this.sensorData = function (sensorName) {
        //    return $http.get(urlBase + '?sensor=' + sensorName);
        //};

        return this;
    }
})();
