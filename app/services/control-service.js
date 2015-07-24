(function () {

    angular.module('katGui.services')
        .constant('SERVER_URL', window.location.host === 'localhost:8000' ? 'http://monctl.devf.camlab.kat.ac.za' : window.location.origin)
        .service('ControlService', ControlService);

    function ControlService($http, SERVER_URL, $rootScope) {

        var urlBase = SERVER_URL + '/katcontrol/api/v1';
        var api = {};

        api.stowAll = function () {
            return $http.post(urlBase + '/receptors/stow-all');
        };

        api.inhibitAll = function () {
            return $http.post(urlBase + '/receptors/inhibit-all');
        };

        api.stopAll = function () {
            return $http.post(urlBase + '/receptors/stop-all');
        };

        api.resumeOperations = function () {
            return $http.post(urlBase + '/receptors/resume-all');
        };

        api.floodlightsOn = function (onOff) {
            return $http.post(urlBase + '/vds/floodlights/' + onOff);
        };

        api.shutdownComputing = function () {
            return $http.post(urlBase + '/system/shutdown-computing');
        };

        api.acknowledgeAlarm = function (alarmName) {
            api.handleRequestResponse($http.post(urlBase + '/alarms/' + alarmName + '/acknowledge'));
        };

        api.addKnownAlarm = function (alarmName) {
            api.handleRequestResponse($http.post(urlBase + '/alarms/' + alarmName + '/known'));
        };

        api.cancelKnownAlarm = function (alarmName) {
            api.handleRequestResponse($http.post(urlBase + '/alarms/' + alarmName + '/cancel-known'));
        };

        api.clearAlarm = function (alarmName) {
            api.handleRequestResponse($http.post(urlBase + '/alarms/' + alarmName + '/clear'));
        };

        api.startProcess = function (nodeMan, processName) {
            api.handleRequestResponse($http.post(urlBase + '/process/' + nodeMan + '/' + processName + '/start'));
        };

        api.restartProcess = function (nodeMan, processName) {
            api.handleRequestResponse($http.post(urlBase + '/process/' + nodeMan + '/' + processName + '/restart'));
        };

        api.killProcess = function (nodeMan, processName) {
            api.handleRequestResponse($http.post(urlBase + '/process/' + nodeMan + '/' + processName + '/kill'));
        };

        api.stopProcess = function (nodeMan, processName) {
            api.handleRequestResponse($http.post(urlBase + '/process/' + nodeMan + '/' + processName + '/stop'));
        };

        api.toggleKATCPMessageDevices = function (resource, newValue) {
            api.handleRequestResponse($http.post(urlBase + '/logging/' + resource + '/katcpmsgs-devices/' + newValue));
        };

        api.toggleKATCPMessageProxy = function (resource, newValue) {
            api.handleRequestResponse($http.post(urlBase + '/logging/' + resource + '/katcpmsgs-proxy/' + newValue));
        };

        api.handleRequestResponse = function (request) {
            request
                .success(function (result) {
                    $rootScope.showSimpleToast(result.result.replace(/\\_/g, ' '));
                })
                .error(function (error) {
                    $rootScope.showSimpleDialog('Error sending request', error);
                });
        };

        api.getCurrentServerTime = function () {
            return $http.get(urlBase + '/time');
        };

        return api;
    }

})();
