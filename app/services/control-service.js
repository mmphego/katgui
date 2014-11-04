angular.module('katGui')

    .service('ControlService', function () {

        var urlBase = 'http://192.168.10.127:8020';
        var controlService = {};
        controlService.connection = null;

        controlService.onSockJSOpen = function () {
            if (controlService.connection && controlService.connection.readyState) {
                console.log('Control Connection Established.');
            }
        };

        controlService.onSockJSClose = function () {
            console.log('Disconnecting Monitor Connection');
            controlService.connection = null;
        };

        controlService.onSockJSMessage = function (e) {
            console.log(e);
        };

        controlService.connectListener = function () {
            console.log('Control Connecting...');
            controlService.connection = new SockJS(urlBase + '/control');
            controlService.connection.onopen = controlService.onSockJSOpen;
            controlService.connection.onmessage = controlService.onSockJSMessage;
            controlService.connection.onclose = controlService.onSockJSClose;

            return controlService.connection !== null;
        };

        controlService.disconnectListener = function () {
            if (controlService.connection) {
                controlService.connection.close();
            }
        };

        controlService.stowAll = function () {
            return controlService.sendControlCommand('sys', 'operator-stow-antennas', '');
        };

        controlService.inhibitAll = function () {
            return controlService.sendControlCommand('sys', 'operator-inhibit-antennas', '');
        };

        controlService.stopAll = function () {
            return controlService.sendControlCommand('sys', 'operator-stop-observations', '');
        };

        controlService.resumeOperations = function () {
            return controlService.sendControlCommand('sys', 'operator-resume-operations', '');
        };

        controlService.shutdownComputing = function () {
            return controlService.sendControlCommand('sys', 'operator-shutdown-computing', '');
        };

        controlService.acknowledgeAlarm = function (alarmName) {
            return controlService.sendControlCommand('kataware', 'alarm-ack', alarmName);
        };

        controlService.addKnownAlarm = function (alarmName) {
            return controlService.sendControlCommand('kataware', 'alarm-know', alarmName);
        };

        controlService.cancelKnowAlarm = function (alarmName) {
            return controlService.sendControlCommand('kataware', 'alarm-cancel-know', alarmName);
        };

        controlService.clearAlarm = function (alarmName) {
            return controlService.sendControlCommand('kataware', 'alarm-clear', alarmName);
        };

        controlService.sendControlCommand = function (module, funcName, funcParams) {

            if (controlService.connection) {
                var jsonRPC = {
                    'jsonrpc': '2.0',
                    'method': 'katcp_request',
                    'params': [module, funcName, funcParams]
                };

                controlService.connection.send(JSON.stringify(jsonRPC));
                return true;
            } else {
                return false;
            }
        };

        return controlService;
    });
