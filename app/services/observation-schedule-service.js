(function () {

    angular.module('katGui.services')
        .service('ObservationScheduleService', ObservationScheduleService);

    function ObservationScheduleService($q) {

        var urlBase = 'http://localhost:8020';
        var connection = null;
        var api = {};
        var deferredMap = {};
        api.scheduleDraftData = [];
        api.scheduleData = [];
        api.scheduleCompletedData = [];

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

            if (jsonData.error) {
                console.error('Server Error when processing command: ');
                console.error(e.data);
            } else {
                var result = jsonData.result;

                console.log(result);

                if (result.get_schedule_blocks) {

                    //push each item because some view are binding to the dataset
                    result.get_schedule_blocks.forEach(function (item) {
                        addItemToApplicableDataModel(item);
                    });

                    deferredMap['get_schedule_blocks'].resolve(result.create_schedule_block);

                } else if (result.get_schedule_block) {

                    for (var i = 0; i < api.scheduleDraftData.length; i++) {
                        if (api.scheduleDraftData[i].id_code === result.get_schedule_block.id_code) {
                            api.scheduleDraftData[i] =  result.get_schedule_block;
                            break;
                        }
                    }
                    deferredMap['get_schedule_block'].resolve(result.get_schedule_block);

                } else if (result.create_schedule_block) {

                    result.create_schedule_block.desired_start_time = '';
                    result.create_schedule_block.hasValidInput = false;
                    result.create_schedule_block.isDirty = true;
                    api.scheduleDraftData.push(result.create_schedule_block);
                    deferredMap['create_schedule_block'].resolve(result.create_schedule_block);

                } else if (result.observation_schedules) {

                    console.log('got observation_schedules response');

                } else if (result.schedule_draft) {

                    console.log('got schedule_draft response');

                } else if (result.verify_schedule_block) {

                    console.log('got verify_schedule_block response');

                    api.getScheduleBlock(result.verify_schedule_block.id_code).then(function () {
                        deferredMap['verify_schedule_block'].resolve(result.verify_schedule_block);
                    });

                } else if (result.delete_schedule_block) {

                    if (result.delete_schedule_block.delete_result) {
                        var index = _.indexOf(api.scheduleDraftData, _.findWhere(api.scheduleDraftData, {id_code: result.delete_schedule_block.id_code}));
                        api.scheduleDraftData.splice(index, 1);
                        deferredMap['delete_schedule_block'].resolve(result.create_schedule_block);
                    } else {
                        console.error('Could not delete draft schedule block with id_code: ' + result.delete_schedule_block.id_code + '. Try to reload the page.');
                        deferredMap['delete_schedule_block'].reject(result.create_schedule_block);
                    }

                } else if (result.update_draft_schedule_block) {
                    var draftToUpdate = _.findWhere(api.scheduleDraftData, {id_code: result.update_draft_schedule_block.id_code});
                    draftToUpdate.description = result.update_draft_schedule_block.description;
                    draftToUpdate.type = result.update_draft_schedule_block.type;
                    draftToUpdate.instruction_set = result.update_draft_schedule_block.instruction_set;
                    draftToUpdate.desired_start_time = result.update_draft_schedule_block.desired_start_time;
                    draftToUpdate.isDirty = false;
                    deferredMap['update_draft_schedule_block'].resolve(result.update_draft_schedule_block);

                } else {

                    console.warn('Observation Schedule returned an unfamiliar message: ');
                    console.warn(e);
                }
            }
        }

        function addItemToApplicableDataModel(item) {
            if (item.state === "DRAFT") {

                if (item.desired_start_time === "None") {
                    item.desired_start_time = "";
                    //item.isDirty = true;
                }
                api.scheduleDraftData.push(item);

            } else if (item.state === "SCHEDULED") {

                api.scheduleData.push(item);

            } else if (item.state === "ACTIVE") {

                api.scheduleData.push(item);

            } else if (item.state === "INTERRUPTED") {

                api.scheduleCompletedData.push(item);

            }  else if (item.state === "COMPLETED") {

                api.scheduleCompletedData.push(item);
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
            sendObsSchedCommand('delete_schedule_block', [idCode]);
            deferredMap['delete_schedule_block'] = $q.defer();
            return deferredMap['delete_schedule_block'].promise;
        };

        api.updateScheduleDraft = function (scheduleBlockDraft) {
            sendObsSchedCommand('update_draft_schedule_block', [
                scheduleBlockDraft.id_code,
                scheduleBlockDraft.type,
                scheduleBlockDraft.instruction_set,
                scheduleBlockDraft.description,
                scheduleBlockDraft.desired_start_time]);
            deferredMap['update_draft_schedule_block'] = $q.defer();
            return deferredMap['update_draft_schedule_block'].promise;
        };

        api.getObservationSchedule = function () {
            return sendObsSchedCommand('get_observation_schedule');
        };

        api.getScheduleBlocks = function () {

            api.scheduleDraftData.splice(0, api.scheduleDraftData.length);
            api.scheduleData.splice(0, api.scheduleData.length);
            api.scheduleCompletedData.splice(0, api.scheduleCompletedData.length);
            sendObsSchedCommand('get_schedule_blocks');
            deferredMap['get_schedule_blocks'] = $q.defer();
            return deferredMap['get_schedule_blocks'].promise;
        };

        api.getScheduleBlock = function (id_code) {

            sendObsSchedCommand('get_schedule_block', [id_code]);
            deferredMap['get_schedule_block'] = $q.defer();
            return deferredMap['get_schedule_block'].promise;
        };

        api.createScheduleBlock = function () {

            sendObsSchedCommand('create_schedule_block');
            deferredMap['create_schedule_block'] = $q.defer();
            return deferredMap['create_schedule_block'].promise;
        };

        api.scheduleDraft = function (id_code) {

            sendObsSchedCommand('schedule_draft', [id_code]);
            deferredMap['schedule_draft'] = $q.defer();
            return deferredMap['schedule_draft'].promise;
        };

        api.verifyScheduleBlock = function (subarray_number, id_code) {

            sendObsSchedCommand('verify_schedule_block', [subarray_number, id_code]);
            deferredMap['verify_schedule_block'] = $q.defer();
            return deferredMap['verify_schedule_block'].promise;
        };

        function sendObsSchedCommand(method, funcParams) {

            if (connection) {
                var jsonRPC = {
                    'jsonrpc': '2.0',
                    'method': method,
                    'id': 'abe3d23100'
                };

                if (funcParams) {
                    jsonRPC.params = funcParams;
                }

                return connection.send(JSON.stringify(jsonRPC));
            } else {
                return false;
            }
        }

        return api;
    }

})();
