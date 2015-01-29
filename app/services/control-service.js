(function () {

    angular.module('katGui.services', [])
        .service('ControlService', ControlService);

    function ControlService($http, SERVER_URL, KatGuiUtil) {

        var urlBase = SERVER_URL + ':8020';
        var connection = null;

        this.onSockJSOpen = function () {
            if (connection && connection.readyState) {
                console.log('Control Connection Established.');
            }
        };

        this.onSockJSClose = function () {
            console.log('Disconnecting Control Connection');
            connection = null;
        };

        this.onSockJSMessage = function (e) {
            console.log(e);
        };

        this.connectListener = function () {
            console.log('Control Connecting...');
            connection = new SockJS(urlBase + '/control');
            connection.onopen = this.onSockJSOpen;
            connection.onmessage = this.onSockJSMessage;
            connection.onclose = this.onSockJSClose;

            return connection !== null;
        };

        this.disconnectListener = function () {
            if (connection) {
                connection.close();
            }
        };

        this.stowAll = function () {
            return this.sendControlCommand('sys', 'operator-stow-antennas', '');
        };

        this.inhibitAll = function () {
            return this.sendControlCommand('sys', 'operator-inhibit-antennas', '');
        };

        this.stopAll = function () {
            return this.sendControlCommand('sys', 'operator-stop-observations', '');
        };

        this.resumeOperations = function () {
            return this.sendControlCommand('sys', 'operator-resume-operations', '');
        };

        this.shutdownComputing = function () {
            return this.sendControlCommand('sys', 'operator-shutdown-computing', '');
        };

        this.acknowledgeAlarm = function (alarmName) {
            return this.sendControlCommand('kataware', 'alarm-ack', alarmName);
        };

        this.addKnownAlarm = function (alarmName) {
            return this.sendControlCommand('kataware', 'alarm-know', alarmName);
        };

        this.cancelKnowAlarm = function (alarmName) {
            return this.sendControlCommand('kataware', 'alarm-cancel-know', alarmName);
        };

        this.clearAlarm = function (alarmName) {
            return this.sendControlCommand('kataware', 'alarm-clear', alarmName);
        };

        this.sendControlCommand = function (module, funcName, funcParams) {

            if (connection) {
                var jsonRPC = {
                    'id': KatGuiUtil.generateUUID(),
                    'jsonrpc': '2.0',
                    'method': 'katcp_request',
                    'params': [module, funcName, funcParams]
                };

                return connection.send(JSON.stringify(jsonRPC));
            } else {
                return false;
            }
        };

        this.getCurrentServerTime = function () {
            return $http.get(urlBase + '/time');
        };

        return this;
    }

})();
