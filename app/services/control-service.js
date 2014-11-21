(function () {

    angular.module('katGui')
        .service('ControlService', ControlService);

    function ControlService($http) {

        var urlBase = 'http://192.168.10.127:8020';
        this.connection = null;

        this.onSockJSOpen = function () {
            if (this.connection && this.connection.readyState) {
                console.log('Control Connection Established.');
            }
        };

        this.onSockJSClose = function () {
            console.log('Disconnecting Control Connection');
            this.connection = null;
        };

        this.onSockJSMessage = function (e) {
            console.log(e);
        };

        this.connectListener = function () {
            console.log('Control Connecting...');
            this.connection = new SockJS(urlBase + '/control');
            this.connection.onopen = this.onSockJSOpen;
            this.connection.onmessage = this.onSockJSMessage;
            this.connection.onclose = this.onSockJSClose;

            return this.connection !== null;
        };

        this.disconnectListener = function () {
            if (this.connection) {
                this.connection.close();
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

            if (this.connection) {
                var jsonRPC = {
                    'jsonrpc': '2.0',
                    'method': 'katcp_request',
                    'params': [module, funcName, funcParams]
                };

                this.connection.send(JSON.stringify(jsonRPC));
                return true;
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
