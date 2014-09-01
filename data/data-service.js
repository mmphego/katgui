angular.module('katGui')

    .factory('DataService', function ($http) {

        var urlBase = 'http://192.168.10.167:9999/katstore/';
        var dataService = {};

        dataService.findSensor = function (sensorName) {
            return $http.get(urlBase + 'findsensor?sensor=*' + sensorName + '*');
        };

        dataService.sensorMetaData = function (sensorName) {
            return $http.get(urlBase + 'sensor_info?sensor=' + sensorName);
        };

        dataService.sensorData = function (sensorName) {
            return $http.get(urlBase + '?sensor=' + sensorName);
        };

        return dataService;
    });