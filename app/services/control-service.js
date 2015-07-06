(function () {

    angular.module('katGui.services')
        .constant('SERVER_URL', window.location.host === 'localhost:8000' ? 'http://monctl.devf.camlab.kat.ac.za' : window.location.origin)
        .service('ControlService', ControlService);

    function ControlService($http, SERVER_URL, KatGuiUtil, $rootScope, $timeout, $log) {

        var urlBase = SERVER_URL + '/katcontrol/api/v1';
        var api = {};

        api.stowAll = function () {
            api.handleRequestResponse($http.get(urlBase + '/stow-all'));
        };

        api.inhibitAll = function () {
            api.handleRequestResponse($http.get(urlBase + '/inhibit-all'));
        };

        api.stopAll = function () {
            api.handleRequestResponse($http.get(urlBase + '/stop-all'));
        };

        api.resumeOperations = function () {
            api.handleRequestResponse($http.get(urlBase + '/resume-all'));
        };

        api.floodlightsOn = function (onOff) {
            api.handleRequestResponse($http.get(urlBase + '/floodlights/' + onOff));
        };

        api.shutdownComputing = function () {
            api.handleRequestResponse($http.get(urlBase + '/shutdown-computing'));
        };

        api.acknowledgeAlarm = function (alarmName) {
            api.handleRequestResponse($http.get(urlBase + '/acknowledge-alarm/' + alarmName));
        };

        api.addKnownAlarm = function (alarmName) {
            api.handleRequestResponse($http.get(urlBase + '/know-alarm/' + alarmName));
        };

        api.cancelKnowAlarm = function (alarmName) {
            api.handleRequestResponse($http.get(urlBase + '/cancel-know-alarm/' + alarmName));
        };

        api.clearAlarm = function (alarmName) {
            api.handleRequestResponse($http.get(urlBase + '/clear-alarm/' + alarmName));
        };

        api.startProcess = function (nodeMan, processName) {
            api.handleRequestResponse($http.get(urlBase + '/start-process/' + nodeMan + '/' + processName));
        };

        api.restartProcess = function (nodeMan, processName) {
            api.handleRequestResponse($http.get(urlBase + '/restart-process/' + nodeMan + '/' + processName));
        };

        api.killProcess = function (nodeMan, processName) {
            api.handleRequestResponse($http.get(urlBase + '/kill-process/' + nodeMan + '/' + processName));
        };

        api.stopProcess = function (nodeMan, processName) {
            api.handleRequestResponse($http.get(urlBase + '/stop-process/' + nodeMan + '/' + processName));
        };

        api.toggleKATCPMessageDevices = function (resource, newValue) {
            api.handleRequestResponse($http.get(urlBase + '/enable-katcpmsgs-devices-logging/' + resource + '/' + newValue));
        };

        api.toggleKATCPMessageProxy = function (resource, newValue) {
            api.handleRequestResponse($http.get(urlBase + '/enable-katcpmsgs-proxy-logging/' + resource + '/' + newValue));
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
