(function () {

    angular.module('katGui.services')
        .constant('SERVER_URL', window.location.host === 'localhost:8000' ? 'http://monctl.devq.camlab.kat.ac.za' : window.location.origin)
        .service('ControlService', ControlService);

    function ControlService($http, SERVER_URL, KatGuiUtil, $rootScope, $timeout, $log, $interval, $q) {

        var urlBase = SERVER_URL + '/katcontrol/api/v1';
        var api = {};
        api.connection = null;
        api.deferredMap = {};
        //websocket default heartbeat is every 30 seconds
        //so allow for 35 seconds before alerting about timeout
        api.heartbeatTimeOutLimit = 35000;
        api.checkAliveConnectionInterval = 10000;

        api.getTimeoutPromise = function () {
            if (!api.deferredMap['timeoutDefer']) {
                api.deferredMap['timeoutDefer'] = $q.defer();
            }
            return api.deferredMap['timeoutDefer'].promise;
        };

        api.onSockJSOpen = function () {
            if (api.connection && api.connection.readyState) {
                $log.info('Control Connection Established. Authenticating...');
                api.authenticateSocketConnection();
            }
        };

        api.onSockJSClose = function () {
            $log.info('Disconnecting Control Connection');
            api.connection = null;
        };

        api.onSockJSMessage = function (e) {
            var result = JSON.parse(e.data);
            if (result.error) {
                $rootScope.showSimpleDialog('Error sending request', result.error.message);
            } else if (result.result.reply) {
                $rootScope.showSimpleToast(result.result.reply.replace(new RegExp('\\\\_', 'g'), ' '));
            }
            else if (result && result.result.session_id) {
                api.connection.authorized = true;
                $log.info('Control Connection Established. Authenticated.');
                api.deferredMap['connectDefer'].resolve();
            } else {
                //bad auth response
                api.connection.authorized = false;
                $log.info('Control Connection Established. Authentication failed.');
                api.deferredMap['connectDefer'].reject();
            }
        };

        api.checkAlive = function () {
            if (!api.lastHeartBeat || new Date().getTime() - api.lastHeartBeat.getTime() > api.heartbeatTimeOutLimit) {
                $log.warn('Control Connection Heartbeat timeout!');
                if (!api.deferredMap['timeoutDefer']) {
                    api.connectListener();
                } else {
                    api.deferredMap['timeoutDefer'].resolve();
                    api.deferredMap['timeoutDefer'] = null;
                }
            }
        };

        api.onSockJSHeartbeat = function () {
            api.lastHeartBeat = new Date();
        };

        api.connectListener = function () {
            api.deferredMap['connectDefer'] = $q.defer();
            $log.info('Control Connecting...');
            api.connection = new SockJS(urlBase + '/control');
            api.connection.onopen = api.onSockJSOpen;
            api.connection.onmessage = api.onSockJSMessage;
            api.connection.onclose = api.onSockJSClose;
            api.connection.onheartbeat = api.onSockJSHeartbeat;
            api.lastHeartBeat = new Date();
            if (!api.checkAliveInterval) {
                api.checkAliveInterval = $interval(api.checkAlive, api.checkAliveConnectionInterval);
            } else {
                $interval.cancel(api.checkAliveInterval);
                api.checkAliveInterval = null;
            }
            return api.deferredMap['connectDefer'].promise;
        };

        api.disconnectListener = function () {
            if (api.connection) {
                api.connection.close();
                $interval.cancel(api.checkAliveInterval);
                api.checkAliveInterval = null;
            } else {
                $log.error('Attempting to disconnect an already disconnected connection!');
            }
        };

        api.authenticateSocketConnection = function () {

            if (api.connection) {
                var jsonRPC = {
                    'jsonrpc': '2.0',
                    'method': 'authorise',
                    'params': [$rootScope.session_id],
                    'id': 'authorise' + KatGuiUtil.generateUUID()
                };
                api.connection.authorized = false;
                return api.connection.send(JSON.stringify(jsonRPC));
            }
        };

        api.stowAll = function () {
            api.sendControlCommand('sys', 'operator_stow_antennas', '');
        };

        api.inhibitAll = function () {
            api.sendControlCommand('sys', 'operator_inhibit_antennas', '');
        };

        api.stopAll = function () {
            api.sendControlCommand('sys', 'operator_stop_observations', '');
        };

        api.resumeOperations = function () {
            api.sendControlCommand('sys', 'operator_resume_operations', '');
        };

        api.floodlightsOn = function (onOff) {
            api.sendControlCommand('anc', 'vds_floodlight_on', onOff);
        };

        api.shutdownComputing = function () {
            api.sendControlCommand('sys', 'operator_shutdown_computing', '');
        };

        api.acknowledgeAlarm = function (alarmName) {
            api.sendControlCommand('kataware', 'alarm_ack', alarmName);
        };

        api.addKnownAlarm = function (alarmName) {
            api.sendControlCommand('kataware', 'alarm_know', alarmName);
        };

        api.cancelKnowAlarm = function (alarmName) {
            api.sendControlCommand('kataware', 'alarm_cancel_know', alarmName);
        };

        api.clearAlarm = function (alarmName) {
            api.sendControlCommand('kataware', 'alarm_clear', alarmName);
        };

        api.sendControlCommand = function (module, funcName, funcParams) {

            if (api.connection && api.connection.authorized) {
                var jsonRPC = {
                    'id': KatGuiUtil.generateUUID(),
                    'jsonrpc': '2.0',
                    'method': 'katcp_request',
                    'params': [module, funcName, funcParams]
                };

                api.connection.send(JSON.stringify(jsonRPC));
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
