(function() {

    angular.module('katGui.services')
        .service('MonitorService', MonitorService);

    function MonitorService(KatGuiUtil, $timeout, StatusService, AlarmsService, ObsSchedService, $interval,
        $rootScope, $q, $log, ReceptorStateService, NotifyService, UserLogService, ConfigService,
        SessionService, $http, $state) {

        function urlBase() {
            return $rootScope.portalUrl ? $rootScope.portalUrl + '/katmonitor' : '';
        }
        var api = {};
        api.deferredMap = {};
        api.connection = null;
        api.lastSyncedTime = null;
        api.globalSubscribePatterns = {};

        //websocket default heartbeat is every 30 seconds
        //so allow for 35 seconds before alerting about timeout
        api.heartbeatTimeOutLimit = 35000;
        api.checkAliveConnectionInterval = 10000;

        api.getTimeoutPromise = function() {
            if (!api.deferredMap['timeoutDefer']) {
                api.deferredMap['timeoutDefer'] = $q.defer();
            }
            return api.deferredMap['timeoutDefer'].promise;
        };

        api.subscribeSensorName = function(component, sensorName) {
            api.subscribe('sensor.*.' + component + '.' + sensorName);
        };

        api.subscribeSensor = function(sensor) {
            var sensorWithoutComponent = sensor.name.replace(sensor.component + '_', '');
            // Sensor subjects are sensor.*.<component>.<sensorName>
            api.subscribe('sensor.*.' + sensor.component + '.' + sensorWithoutComponent);
        };

        api.subscribe = function(sub) {
            var jsonRPC = {
                'jsonrpc': '2.0',
                'method': 'subscribe',
                'params': [sub],
                'id': 'monitor-' + KatGuiUtil.generateUUID()
            };

            if (api.connection && api.connection.readyState) {
                return api.connection.send(JSON.stringify(jsonRPC));
            } else {
                $timeout(function() {
                    api.subscribe(sub);
                }, 500);
            }
        };

        api.unsubscribeSensorName = function(component, sensorName) {
            api.unsubscribe('sensor.*.' + component + '.' + sensorName);
        };

        api.unsubscribeSensor = function(sensor) {
            var sensorWithoutComponent = sensor.name.replace(sensor.component + '_', '');
            // Sensor subjects are sensor.*.<component>.<sensorName>
            api.unsubscribe('sensor.*.' + sensor.component + '.' + sensorWithoutComponent);
        };

        api.unsubscribe = function(subscriptions) {
            var jsonRPC = {
                'jsonrpc': '2.0',
                'method': 'unsubscribe',
                'params': [subscriptions],
                'id': 'monitor-' + KatGuiUtil.generateUUID()
            };

            if (api.connection === null) {
                $log.error('No Monitor Connection Present for subscribing, ignoring command for subs ' + subscriptions);
            } else if (api.connection.readyState) {
                return api.connection.send(JSON.stringify(jsonRPC));
            } else {
                $timeout(function() {
                    api.unsubscribe(subscriptions);
                }, 500);
            }
        };

        api.onSockJSOpen = function() {
            if (api.connection && api.connection.readyState) {
                $log.info('Monitor Connection Established.');
                api.deferredMap['connectDefer'].resolve();
                api.subscribeToDefaultChannels();
                ConfigService.checkOutOfDateVersion();
            }
            api.lastHeartBeat = new Date();
            $rootScope.connectedToMonitor = true;
        };

        api.subscribeToDefaultChannels = function() {
            api.subscribe(['portal.time', 'portal.auth.>', 'portal.sched.>']);
        };

        api.checkAlive = function() {
            if (!api.lastHeartBeat || new Date().getTime() - api.lastHeartBeat.getTime() > api.heartbeatTimeOutLimit) {
                $log.warn('Monitor Connection Heartbeat timeout!');
                api.connection = null;
                $rootScope.connectedToMonitor = false;
                api.deferredMap['timeoutDefer'].resolve();
                api.deferredMap['timeoutDefer'] = null;
            }
        };

        api.onSockJSHeartbeat = function() {
            api.lastHeartBeat = new Date();
        };

        api.onSockJSClose = function() {
            $log.info('Disconnecting Monitor Connection.');
            api.connection = null;
            api.lastHeartBeat = null;
            $rootScope.connectedToMonitor = false;
        };

        api.onSockJSMessage = function(e) {
            if (e && e.data) {
                if (e.data.data) {
                    var msg = e.data;
                    var data = JSON.parse(msg.data);
                    if (msg.subject === 'portal.time') {
                        api.lastSyncedTime = data.time + 0.5;
                        api.lastSyncedLST = data.lst;
                    } else if (msg.subject.startsWith('sensor.')) {
                        if ($state.current.name === 'sensor-list') {
                            $rootScope.$emit('sensorUpdateMessage', data, msg.subject);
                        } else if (!api.globalSubscribePatterns[data.component] || (
                                api.globalSubscribePatterns[data.component].sensors &&
                                !api.globalSubscribePatterns[data.component].sensors[data.name])) {
                            $rootScope.$emit('sensorUpdateMessage', data, msg.subject);
                        }
                        if (data.name === "katpool_lo_id") {
                            $rootScope.katpool_lo_id = data;
                        } else if (data.name === "sys_interlock_state") {
                            $rootScope.sys_interlock_state = data;
                        } else if (data.name.startsWith('kataware_alarm')) {
                            AlarmsService.receivedAlarmMessage(data);
                        }
                    } else if (msg.subject === 'portal.sched') {
                        $log.info(msg);
                        // ObsSchedService.receivedScheduleMessage(messages.result.msg_data);
                    } else if (msg.subject.startsWith('portal.userlogs')) {
                        UserLogService.receivedUserlogMessage(msg.subject, data);
                    } else if (msg.subject === 'portal.auth.current_lo') {
                        $rootScope.katpool_lo_id.name = data.lo;
                        if ($rootScope.currentUser &&
                            $rootScope.currentUser.req_role === 'lead_operator' &&
                            $rootScope.katpool_lo_id.name.length > 0 &&
                            $rootScope.katpool_lo_id.name !== $rootScope.currentUser.email) {
                            NotifyService.showDialog(
                                'You have been logged in as the Monitor Role', 'You have lost the Lead Operator Role because ' +
                                $rootScope.katpool_lo_id.name + ' has assumed the Lead Operator role.');
                            //$rootScope.logout();
                            //Do not logout, just loging as a demoted monitor only use
                            SessionService.verifyAs('read_only');
                        }
                    } else {
                        // this was a req reply (list_sensors remote request)
                        if (data.name === "katpool_lo_id") {
                            $rootScope.katpool_lo_id = data;
                        } else if (data.name === "sys_interlock_state") {
                            $rootScope.sys_interlock_state = data;
                        } else if (data.name.startsWith('kataware_alarm')) {
                            AlarmsService.receivedAlarmMessage(data);
                        }
                        if (api.globalSubscribePatterns[data.component]) {
                            if (data.name.includes(api.globalSubscribePatterns[data.component].pattern)) {
                                var sensorWithoutComponent = data.name.replace(data.component + '_', '');
                                if (!api.globalSubscribePatterns[data.component].sensors) {
                                    // dictionary for fast lookup, we check for this on every message!
                                    // ES6 we could use a Set()
                                    api.globalSubscribePatterns[data.component].sensors = {};
                                }
                                api.globalSubscribePatterns[data.component].sensors[data.name] = 1;
                                api.subscribe('sensor.*.' + data.component + '.' + sensorWithoutComponent);
                            }
                            if ($state.current.name === 'sensor-list') {
                                $rootScope.$emit('sensorUpdateMessage', data, msg.subject);
                            }
                            if (data.name.startsWith('kataware_alarm')) {
                               AlarmsService.receivedAlarmMessage(data);
                           }
                        } else {
                            $rootScope.$emit('sensorUpdateMessage', data, msg.subject);
                        }
                    }
                } else {
                    var message = JSON.parse(e.data);
                    if (message.error) {
                        $log.error('There was an error sending a jsonrpc request:');
                        $log.error(message);
                    } else {
                        $log.warn('Dangling websocket message: ' + message);
                    }
                }
            }
        };

        api.connectListener = function() {
            api.deferredMap['connectDefer'] = $q.defer();
            if (!api.connection) {
                $log.info('Monitor Connecting...');
                api.connection = new SockJS(urlBase() + '/client');
                api.connection.onopen = api.onSockJSOpen;
                api.connection.onmessage = api.onSockJSMessage;
                api.connection.onclose = api.onSockJSClose;
                api.connection.onheartbeat = api.onSockJSHeartbeat;
                api.lastHeartBeat = new Date();
            } else {
                $timeout(function() {
                    if ($rootScope.connectedToMonitor) {
                        api.deferredMap['connectDefer'].resolve();
                    } else {
                        api.deferredMap['connectDefer'].reject();
                    }
                }, 1000);
            }
            if (!api.checkAliveInterval) {
                api.checkAliveInterval = $interval(api.checkAlive, api.checkAliveConnectionInterval);
            }
            return api.deferredMap['connectDefer'].promise;
        };

        api.disconnectListener = function() {
            if (api.connection && api.connection.readyState) {
                api.connection.close();
                $interval.cancel(api.checkAliveInterval);
                api.checkAliveInterval = null;
            } else {
                $log.error('Attempting to disconnect an already disconnected connection!');
            }
        };

        api.listSensors = function(component, regex, globalSubscribe) {
            api.sendMonitorCommand('list_sensors', [component, regex]);
            if (globalSubscribe) {
                api.globalSubscribePatterns[component] = {
                    pattern: regex
                };
            }
        };

        api.sendMonitorCommand = function(method, params) {
            if (api.connection && api.connection.readyState) {
                var jsonRPC = {
                    'id': KatGuiUtil.generateUUID(),
                    'jsonrpc': '2.0',
                    'method': method,
                    'params': params
                };

                api.connection.send(JSON.stringify(jsonRPC));
            } else {
                $timeout(function() {
                    api.sendMonitorCommand(method, params);
                }, 500);
            }
        };

        return api;
    }
})();
