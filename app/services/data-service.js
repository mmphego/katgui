(function () {

    angular.module('katGui')
        .service('DataService', DataService);

    function DataService($http, SERVER_URL) {

        var urlBase = SERVER_URL + ':8888/katstore/';

        this.findSensor = function (sensorName) {
            return $http.get(urlBase + 'findsensor?sensor=*' + sensorName + '*');
        };

        this.sensorMetaData = function (sensorName) {
            return $http.get(urlBase + 'sensor_info?sensor=' + sensorName);
        };

        this.sensorData = function (sensorName) {
            return $http.get(urlBase + '?sensor=' + sensorName);
        };

        return this;
    }
})();
