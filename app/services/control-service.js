(function () {

    angular.module('katGui.services', [])
        .service('ControlService', ControlService);

    function ControlService($http, SERVER_URL, KatGuiUtil, $rootScope, $timeout) {

        var urlBase = SERVER_URL + ':8020';
        var connection = null,
            api = {};

        api.onSockJSOpen = function () {
            if (connection && connection.readyState) {
                console.log('Control Connection Established.');
                authenticateSocketConnection();
            }
        };

        api.onSockJSClose = function () {
            console.log('Disconnecting Control Connection');
            connection = null;
        };

        api.onSockJSMessage = function (e) {
            var result = JSON.parse(e.data);
            if (result && result.session_id) {
                connection.authorized = true;
            }
        };

        api.connectListener = function () {
            console.log('Control Connecting...');
            connection = new SockJS(urlBase + '/control');
            connection.onopen = api.onSockJSOpen;
            connection.onmessage = api.onSockJSMessage;
            connection.onclose = api.onSockJSClose;

            return connection !== null;
        };

        api.disconnectListener = function () {
            if (connection) {
                connection.close();
            }
        };

        function authenticateSocketConnection() {

            if (connection) {
                var jsonRPC = {
                    'jsonrpc': '2.0',
                    'method': 'authorise',
                    'params': [$rootScope.session_id],
                    'id': 'authorise' + KatGuiUtil.generateUUID()
                };
                connection.authorized = false;
                return connection.send(JSON.stringify(jsonRPC));
            }
        }

        api.stowAll = function () {
            return api.sendControlCommand('sys', 'operator-stow-antennas', '');
        };

        api.inhibitAll = function () {
            return api.sendControlCommand('sys', 'operator-inhibit-antennas', '');
        };

        api.stopAll = function () {
            return api.sendControlCommand('sys', 'operator-stop-observations', '');
        };

        api.resumeOperations = function () {
            return api.sendControlCommand('sys', 'operator-resume-operations', '');
        };

        api.shutdownComputing = function () {
            return api.sendControlCommand('sys', 'operator-shutdown-computing', '');
        };

        api.acknowledgeAlarm = function (alarmName) {
            return api.sendControlCommand('kataware', 'kataware_alarm_ack', alarmName);
        };

        api.addKnownAlarm = function (alarmName) {
            return api.sendControlCommand('kataware', 'kataware_alarm_know', alarmName);
        };

        api.cancelKnowAlarm = function (alarmName) {
            return api.sendControlCommand('kataware', 'alarm-cancel-know', alarmName);
        };

        api.clearAlarm = function (alarmName) {
            return api.sendControlCommand('kataware', 'alarm-clear', alarmName);
        };

        api.sendControlCommand = function (module, funcName, funcParams) {

            if (connection && connection.authorized) {
                var jsonRPC = {
                    'id': KatGuiUtil.generateUUID(),
                    'jsonrpc': '2.0',
                    'method': 'katcp_request',
                    'params': [funcName, funcParams]
                };

                connection.send(JSON.stringify(jsonRPC));
            } else {
                $timeout(function () {
                    api.sendControlCommand(module, funcName, funcParams);
                }, 500);
            }
        };

        api.getCurrentServerTime = function () {
            return $http.get(urlBase + '/time');
        };

        return api;
    }

})();
