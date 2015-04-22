(function () {

    angular.module('katGui')
        .service('DataService', DataService);

    function DataService($http, SERVER_URL) {

        var urlBase = SERVER_URL + ':8850/katstore/';

        this.findSensor = function (sensorName, limit, time_type, format) {
            return $http.get(urlBase + '?sensor=' + sensorName + '&limit=' + limit + '&time_type=' + time_type + '&format=' + format);
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
