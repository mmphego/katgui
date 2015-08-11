(function () {

    angular.module('katGui.services')
        .service('ConfigService', ConfigService);

    function ConfigService($q, $http, SERVER_URL, $rootScope, $log, $timeout) {

        var urlBase = SERVER_URL + '/katconf';
        var api = {};
        api.receptorHealthTree = {};
        api.receptorList = [];
        api.KATObsPortalURL = null;
        api.systemConfig = {};
        api.aggregateSensorDetail = null;

        api.loadKATObsPortalURL = function () {
            $http(createRequest('get', urlBase + '/system-config/sections/katportal/katobsportal'))
                .then(function (result) {
                    api.KATObsPortalURL = "http://" + JSON.parse(result);
                }, function (message) {
                    $log.error(message);
                });
        };

        api.loadAggregateSensorDetail = function () {
            var deferred = $q.defer();
            if (!api.aggregateSensorDetail) {
                $http(createRequest('get', urlBase + '/aggregates'))
                    .then(function (result) {
                        api.aggregateSensorDetail = result;
                        deferred.resolve(api.aggregateSensorDetail);
                    }, function (message) {
                        $log.error(message);
                        deferred.reject(message);
                    });
            } else {
                $timeout(function () {
                    deferred.resolve(api.aggregateSensorDetail);
                }, 1);
            }

            return deferred.promise;
        };

        api.getSystemConfig = function () {
            var deferred = $q.defer();
            $http(createRequest('get', urlBase + '/system-config'))
                .then(function (result) {
                    api.systemConfig = result;
                    deferred.resolve(api.systemConfig);
                }, function (message) {
                    $log.error(message);
                    deferred.reject(message);
                });
            return deferred.promise;
        };

        api.getStatusTreeForReceptor = function () {
            return $http(createRequest('get', urlBase + '/statustrees/receptors_view/receptors'));
        };

        api.getStatusTreesForTop = function () {
            return $http(createRequest('get', urlBase + '/statustrees/top_view'));
        };

        api.getReceptorList = function () {
            api.receptorList.splice(0, api.receptorList.length);

            var deferred = $q.defer();
            $http(createRequest('get', urlBase + '/installed-config/receptors'))
                .then(function (result) {
                    result.forEach(function (item) {
                        api.receptorList.push(item);
                    });
                    deferred.resolve(api.receptorList);
                }, function (result) {
                    $log.error(result);
                    deferred.reject();
                });

            return deferred.promise;
        };

        api.getSiteLocation = function () {
            return $http(createRequest('get', urlBase + '/array/position'));
        };

        api.getSources = function () {
            return $http(createRequest('get', urlBase + '/sources'));
        };

        api.getWindstowLimits = function () {
            return $http(createRequest('get', urlBase + '/array/windstow'));
        };

        api.getHorizonMask = function (receptorId) {
            return $http(createRequest('get', urlBase + '/horizon-mask/' + receptorId));
        };

        api.getConfigFileContents = function (filePath) {
            return $http(createRequest('get', urlBase + '/config-file/' + filePath));
        };

        api.getSourceCataloguesList = function () {
            return $http(createRequest('get', urlBase + '/config-file/user/catalogues'));
        };

        api.getNoiseDiodeModelsList = function () {
            return $http(createRequest('get', urlBase + '/config-file/user/noise-diode-models'));
        };

        api.getDelayModelsList = function () {
            return $http(createRequest('get', urlBase + '/config-file/user/delay-models'));
        };

        api.getPointingModelsList = function () {
            return $http(createRequest('get', urlBase + '/config-file/user/pointing-models'));
        };

        api.getCam2SpeadList = function () {
            return $http(createRequest('get', urlBase + '/config-file/user/cam2spead'));
        };

        api.getCorrelatorsList = function () {
            return $http(createRequest('get', urlBase + '/config-file/user/correlators'));
        };

        function createRequest(method, url) {
            return {
                method: method,
                url: url,
                headers: {
                    'Authorization': 'CustomJWT ' + $rootScope.jwt
                }
            };
        }

        return api;
    }

})();
