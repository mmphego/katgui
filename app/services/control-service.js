(function () {

    angular.module('katGui.services')
        .service('ControlService', ControlService);

    function ControlService($rootScope, $http, NotifyService, KatGuiUtil, $q) {

        function urlBase() {
            return $rootScope.portalUrl? $rootScope.portalUrl + '/katcontrol' : '';
        }

        var api = {};

        api.stowAll = function () {
            return $http(createRequest('post', urlBase() + '/receptors/stow-all'));
        };

        api.inhibitAll = function () {
            return $http(createRequest('post', urlBase() + '/receptors/inhibit-all'));
        };

        api.stopAll = function () {
            return $http(createRequest('post', urlBase() + '/receptors/stop-all'));
        };

        api.resumeOperations = function () {
            return $http(createRequest('post', urlBase() + '/receptors/resume-all'));
        };

        api.shutdownComputing = function () {
            return $http(createRequest('post', urlBase() + '/system/shutdown-computing'));
        };

        api.shutdownSPCorr = function () {
            return $http(createRequest('post', urlBase() + '/system/shutdown-sp-corr'));
        };

        api.acknowledgeAlarm = function (alarmName) {
            return api.handleRequestResponse($http(createRequest('post', urlBase() + '/alarms/' + alarmName + '/acknowledge')));
        };

        api.addKnownAlarm = function (alarmName) {
            return api.handleRequestResponse($http(createRequest('post', urlBase() + '/alarms/' + alarmName + '/known')));
        };

        api.cancelKnownAlarm = function (alarmName) {
            return api.handleRequestResponse($http(createRequest('post', urlBase() + '/alarms/' + alarmName + '/cancel-known')));
        };

        api.clearAlarm = function (alarmName) {
            return api.handleRequestResponse($http(createRequest('post', urlBase() + '/alarms/' + alarmName + '/clear')));
        };

        api.startProcess = function (nodeMan, processName) {
            return api.handleRequestResponse($http(createRequest('post', urlBase() + '/process/' + nodeMan + '/' + processName + '/start')));
        };

        api.restartProcess = function (nodeMan, processName) {
            return api.handleRequestResponse($http(createRequest('post', urlBase() + '/process/' + nodeMan + '/' + processName + '/restart')));
        };

        api.killProcess = function (nodeMan, processName) {
            return api.handleRequestResponse($http(createRequest('post', urlBase() + '/process/' + nodeMan + '/' + processName + '/kill')));
        };

        api.stopProcess = function (nodeMan, processName) {
            return api.handleRequestResponse($http(createRequest('post', urlBase() + '/process/' + nodeMan + '/' + processName + '/stop')));
        };

        api.toggleKATCPMessageDevices = function (resource, newValue) {
            return api.handleRequestResponse($http(createRequest('post', urlBase() + '/logging/' + resource + '/katcpmsgs-devices/' + newValue)));
        };

        api.toggleKATCPMessageProxy = function (resource, newValue) {
            return api.handleRequestResponse($http(createRequest('post', urlBase() + '/logging/' + resource + '/katcpmsgs-proxy/' + newValue)));
        };

        api.tailProcess = function (nodeman, process, lines) {
            return $http(createRequest('get', urlBase() + '/tail/process/' + nodeman + '/' + process + '/' + lines));
        };

        api.handleRequestResponse = function (request) {
            var deferred = $q.defer();
            request.then(function (result) {
                    var splitMessage = result.data.result.split(' ');
                    var message = KatGuiUtil.sanitizeKATCPMessage(result.data.result);
                    if (splitMessage.length > 2 && splitMessage[1] !== 'ok') {
                        NotifyService.showPreDialog('Error sending request', message);
                        deferred.reject(message);
                    } else {
                        NotifyService.showSimpleToast(message);
                        deferred.resolve(result);
                    }
                }, function (error) {
                    NotifyService.showHttpErrorDialog('Error sending request', error);
                    deferred.reject(error);
                });
            return deferred.promise;
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
