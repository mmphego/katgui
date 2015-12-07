(function () {

    angular.module('katGui.services')
        .constant('SERVER_URL', window.location.host === 'localhost:8000' ? 'http://portal.mkat.karoo.kat.ac.za' : window.location.origin)
        .service('ControlService', ControlService);

    function ControlService($rootScope, $http, SERVER_URL, NotifyService) {

        var urlBase = SERVER_URL + '/katcontrol';
        var api = {};

        api.stowAll = function () {
            return $http(createRequest('post', urlBase + '/receptors/stow-all'));
        };

        api.inhibitAll = function () {
            return $http(createRequest('post', urlBase + '/receptors/inhibit-all'));
        };

        api.stopAll = function () {
            return $http(createRequest('post', urlBase + '/receptors/stop-all'));
        };

        api.resumeOperations = function () {
            return $http(createRequest('post', urlBase + '/receptors/resume-all'));
        };

        api.floodlightsOn = function (onOff) {
            return $http(createRequest('post', urlBase + '/vds/floodlights/' + onOff));
        };

        api.shutdownComputing = function () {
            return $http(createRequest('post', urlBase + '/system/shutdown-computing'));
        };

        api.shutdownSPCorr = function () {
            return $http(createRequest('post', urlBase + '/system/shutdown-sp-corr'));
        };

        api.acknowledgeAlarm = function (alarmName) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/alarms/' + alarmName + '/acknowledge')));
        };

        api.addKnownAlarm = function (alarmName) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/alarms/' + alarmName + '/known')));
        };

        api.cancelKnownAlarm = function (alarmName) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/alarms/' + alarmName + '/cancel-known')));
        };

        api.clearAlarm = function (alarmName) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/alarms/' + alarmName + '/clear')));
        };

        api.startProcess = function (nodeMan, processName) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/process/' + nodeMan + '/' + processName + '/start')));
        };

        api.restartProcess = function (nodeMan, processName) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/process/' + nodeMan + '/' + processName + '/restart')));
        };

        api.killProcess = function (nodeMan, processName) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/process/' + nodeMan + '/' + processName + '/kill')));
        };

        api.stopProcess = function (nodeMan, processName) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/process/' + nodeMan + '/' + processName + '/stop')));
        };

        api.toggleKATCPMessageDevices = function (resource, newValue) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/logging/' + resource + '/katcpmsgs-devices/' + newValue)));
        };

        api.toggleKATCPMessageProxy = function (resource, newValue) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/logging/' + resource + '/katcpmsgs-proxy/' + newValue)));
        };

        api.handleRequestResponse = function (request) {
            request
                .then(function (result) {
                    NotifyService.showSimpleToast(result.data.result.replace(/\\_/g, ' '));
                }, function (error) {
                    NotifyService.showSimpleDialog('Error sending request', error);
                });
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
