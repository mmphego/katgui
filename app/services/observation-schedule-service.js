(function () {

    angular.module('katGui.services')
        .service('ObservationScheduleService', ObservationScheduleService);

    function ObservationScheduleService($q) {

        var urlBase = 'http://localhost:8020';
        var connection = null;
        var api = {};
        var deferredMap = {};
        api.scheduleDraftData = [];

        function onSockJSOpen() {
            if (connection && connection.readyState) {
                console.log('Observation Schedule Connection Established.');
            }
        }

        function onSockJSClose() {
            console.log('Disconnecting Observation Schedule Connection');
            connection = null;
        }

        function onSockJSMessage(e) {
            var jsonData = JSON.parse(e.data);

            if (e.data['error']) {
                console.error('Server Error when processing command: ');
                console.error(e.data);
            } else {
                var result = jsonData.result;

                if (result.schedule_blocks) {

                    //push each item because some view are binding to the dataset
                    result.schedule_blocks.forEach(function (item) {
                        if (item._state === "DRAFT") {
                            api.scheduleDraftData.push(item);
                        }
                    });

                    deferredMap['get_schedule_blocks'].resolve(result.create_schedule_block);

                } else if (result.create_schedule_block) {

                    api.scheduleDraftData.push(result.create_schedule_block);
                    deferredMap['create_schedule_block'].resolve(result.create_schedule_block);

                } else if (result.observation_schedules) {

                    console.log(result.observation_schedules);

                } else if (result.delete_schedule_block) {

                    if (result.delete_schedule_block.delete_result) {
                        var index = _.indexOf(api.scheduleDraftData, _.findWhere(api.scheduleDraftData, {id_code: result.delete_schedule_block.id_code}));
                        api.scheduleDraftData.splice(index, 1);
                        deferredMap['delete_schedule_block'].resolve(result.create_schedule_block);
                    } else {
                        console.error('Could not delete draft schedule block with id_code: ' + result.delete_schedule_block.id_code + '. Try to reload the page.');
                        deferredMap['delete_schedule_block'].reject(result.create_schedule_block);
                    }

                } else {

                    console.warn('Observation Schedule returned an unfamiliar message: ');
                    console.warn(e);
                }
            }
        }

        api.connectListener = function () {
            console.log('Observation Schedule Connecting...');
            connection = new SockJS(urlBase + '/obs-sched');
            connection.onopen = onSockJSOpen;
            connection.onmessage = onSockJSMessage;
            connection.onclose = onSockJSClose;

            return connection !== null;
        };

        api.disconnectListener = function () {
            if (connection) {
                connection.close();
            }
        };

        api.deleteScheduleDraft = function (idCode) {
            sendObsSchedCommand('delete_schedule_block', idCode);
            deferredMap['delete_schedule_block'] = $q.defer();
            return deferredMap['delete_schedule_block'].promise;
        };

        api.getObservationSchedule = function () {
            return sendObsSchedCommand('get_observation_schedule');
        };

        api.getScheduleBlocks = function () {

            api.scheduleDraftData.splice(0, api.scheduleDraftData.length);
            sendObsSchedCommand('get_schedule_blocks');
            deferredMap['get_schedule_blocks'] = $q.defer();
            return deferredMap['get_schedule_blocks'].promise;
        };

        api.createScheduleBlock = function (resolve, reject) {

            sendObsSchedCommand('create_schedule_block');
            deferredMap['create_schedule_block'] = $q.defer();
            return deferredMap['create_schedule_block'].promise;
        };

        function sendObsSchedCommand(method, funcParams) {

            if (connection) {
                var jsonRPC = {
                    'jsonrpc': '2.0',
                    'method': method,
                    'id': 'abe3d23100'
                };

                if (funcParams) {
                    jsonRPC.params = [funcParams];
                }

                return connection.send(JSON.stringify(jsonRPC));
            } else {
                return false;
            }
        }

        return api;
    }

})();
