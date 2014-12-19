(function () {

    angular.module('katGui.services')
        .service('ObservationScheduleService', ObservationScheduleService);

    function ObservationScheduleService($q, $timeout) {

        var urlBase = 'http://10.8.67.130:8020';
        var connection = null;
        var api = {};
        var deferredMap = {};
        api.scheduleDraftData = [];
        api.scheduleData = [];
        api.scheduleCompletedData = [];
        api.resourcePool = [];

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

                //console.log(result);

                if (result.get_schedule_blocks) {

                    //push each item because some view are binding to the dataset
                    result.get_schedule_blocks.forEach(function (item) {
                        addItemToApplicableDataModel(item);
                    });

                    deferredMap['get_schedule_blocks'].resolve(result.create_schedule_block);

                } else if (result.get_schedule_block) {

                    for (var i = 0; i < api.scheduleDraftData.length; i++) {
                        if (api.scheduleDraftData[i].id_code === result.get_schedule_block.id_code) {
                            api.scheduleDraftData[i] = result.get_schedule_block;
                            break;
                        }
                    }
                    deferredMap['get_schedule_block'].resolve(result.get_schedule_block);

                } else if (result.list_resources) {

                    var resourcePoolResult = result.list_resources.result.split(',');

                    resourcePoolResult.forEach(function (item) {
                        api.resourcePool.push(item);
                    });

                    deferredMap['list_resources'].resolve(result.list_resources);

                } else if (result.create_schedule_block) {

                    result.create_schedule_block.desired_start_time = '';
                    result.create_schedule_block.hasValidInput = false;
                    result.create_schedule_block.isDirty = true;
                    api.scheduleDraftData.push(result.create_schedule_block);
                    deferredMap['create_schedule_block'].resolve(result.create_schedule_block);

                } else if (result.observation_schedules) {

                    console.log('got observation_schedules response');

                } else if (result.execute_schedule) {

                    var execute_schedule_result = result.execute_schedule.result.split(' ');

                    if (execute_schedule_result[1] === "ok") {

                        var indexEx = _.indexOf(api.scheduleDraftData, _.findWhere(api.scheduleData, {id_code: result.schedule_to_draft.id_code}));
                        api.scheduleDraftData[indexEx].state = "ACTIVE";
                        deferredMap['execute_schedule'].resolve(result.execute_schedule);
                    } else {

                        deferredMap['execute_schedule'].reject(result.execute_schedule);
                    }

                } else if (result.cancel_execute_schedule) {

                    var cancel_execute_schedule_result = result.cancel_execute_schedule.result.split(' ');

                    if (cancel_execute_schedule_result[1] === "ok") {

                        var indexStopEx = _.indexOf(api.scheduleDraftData, _.findWhere(api.scheduleData, {id_code: result.schedule_to_draft.id_code}));
                        api.scheduleDraftData[indexStopEx].state = "INTERRUPTED";
                        deferredMap['cancel_execute_schedule'].resolve(result.cancel_execute_schedule);
                    } else {

                        deferredMap['cancel_execute_schedule'].reject(result.cancel_execute_schedule);
                    }

                } else if (result.clone_schedule) {

                    api.scheduleDraftData.push(result.clone_schedule.result);

                    deferredMap['clone_schedule'].resolve(result.clone_schedule);

                } else if (result.schedule_draft) {

                    var schedule_result = result.schedule_draft.result.split(' ');

                    if (schedule_result[1] === "ok") {

                        var index = _.indexOf(api.scheduleDraftData, _.findWhere(api.scheduleDraftData, {id_code: result.schedule_draft.id_code}));
                        var draftThatWasScheduled = api.scheduleDraftData.splice(index, 1);
                        draftThatWasScheduled[0].state = "SCHEDULED";
                        api.scheduleData.push(draftThatWasScheduled[0]);
                        deferredMap['schedule_draft'].resolve(result.schedule_draft);
                    } else {

                        deferredMap['schedule_draft'].reject(result.schedule_draft);
                    }


                } else if (result.schedule_to_draft) {

                    var to_draft_result = result.schedule_to_draft.result.split(' ');

                    if (to_draft_result[1] === "ok") {

                        var index3 = _.indexOf(api.scheduleDraftData, _.findWhere(api.scheduleData, {id_code: result.schedule_to_draft.id_code}));
                        var scheduleToMoveToDraft = api.scheduleData.splice(index3, 1);
                        scheduleToMoveToDraft[0].state = "DRAFT";
                        api.scheduleDraftData.push(scheduleToMoveToDraft[0]);
                        deferredMap['schedule_to_draft'].resolve(result.schedule_to_draft);
                    } else {

                        deferredMap['schedule_to_draft'].reject(result.schedule_to_draft);
                    }


                } else if (result.schedule_to_complete) {

                    var to_complete_result = result.schedule_to_complete.result.split(' ');

                    if (to_complete_result[1] === "ok") {

                        var index4 = _.indexOf(api.scheduleData, _.findWhere(api.scheduleData, {id_code: result.schedule_to_complete.id_code}));
                        var scheduleToMoveToComplete = api.scheduleData.splice(index4, 1);
                        scheduleToMoveToComplete[0].state = "COMPLETED";
                        api.scheduleCompletedData.push(scheduleToMoveToComplete[0]);
                        deferredMap['schedule_to_complete'].resolve(result.schedule_to_complete);
                    } else {

                        deferredMap['schedule_to_complete'].reject(result.schedule_to_complete);
                    }


                } else if (result.verify_schedule_block) {

                    var verify_result = result.verify_schedule_block.result.split(' ');

                    if (verify_result[1] === "ok") {

                        //var index5 = _.indexOf(api.scheduleDraftData, _.findWhere(api.scheduleDraftData, {id_code: result.verify_schedule_block.id_code}));

                        deferredMap['verify_schedule_block'].resolve(result.verify_schedule_block);
                    } else {

                        deferredMap['verify_schedule_block'].reject(result.verify_schedule_block);
                    }

                    api.getScheduleBlock(result.verify_schedule_block.id_code).then(function () {
                        deferredMap['verify_schedule_block'].resolve(result.verify_schedule_block);
                    });

                } else if (result.delete_schedule_block) {

                    if (result.delete_schedule_block.delete_result) {
                        var index2 = _.indexOf(api.scheduleDraftData, _.findWhere(api.scheduleDraftData, {id_code: result.delete_schedule_block.id_code}));
                        api.scheduleDraftData.splice(index2, 1);
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

            } else if (item.state === "COMPLETED") {

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

        api.scheduleDraft = function (subarray_number, id_code) {

            sendObsSchedCommand('schedule_draft', [subarray_number, id_code]);
            deferredMap['schedule_draft'] = $q.defer();
            return deferredMap['schedule_draft'].promise;
        };

        api.scheduleToDraft = function (subarray_number, id_code) {

            sendObsSchedCommand('schedule_to_draft', [subarray_number, id_code]);
            deferredMap['schedule_to_draft'] = $q.defer();
            return deferredMap['schedule_to_draft'].promise;
        };

        api.scheduleToComplete = function (subarray_number, id_code) {

            sendObsSchedCommand('schedule_to_complete', [subarray_number, id_code]);
            deferredMap['schedule_to_complete'] = $q.defer();
            return deferredMap['schedule_to_complete'].promise;
        };

        api.verifyScheduleBlock = function (subarray_number, id_code) {

            sendObsSchedCommand('verify_schedule_block', [subarray_number, id_code]);
            deferredMap['verify_schedule_block'] = $q.defer();
            return deferredMap['verify_schedule_block'].promise;
        };

        api.executeSchedule = function (subarray_number, id_code) {

            sendObsSchedCommand('execute_schedule', [subarray_number, id_code]);
            deferredMap['execute_schedule'] = $q.defer();
            return deferredMap['execute_schedule'].promise;
        };

        api.cancelExecuteSchedule = function (subarray_number, id_code) {

            sendObsSchedCommand('cancel_execute_schedule', [subarray_number, id_code]);
            deferredMap['cancel_execute_schedule'] = $q.defer();
            return deferredMap['cancel_execute_schedule'].promise;
        };

        api.cloneSchedule = function (id_code) {

            sendObsSchedCommand('clone_schedule', [id_code]);
            deferredMap['clone_schedule'] = $q.defer();
            return deferredMap['clone_schedule'].promise;
        };

        api.listResources = function (subarray_number) {

            api.resourcePool.splice(0, api.resourcePool.length);
            sendObsSchedCommand('list_resources', [subarray_number]);
            deferredMap['list_resources'] = $q.defer();
            return deferredMap['list_resources'].promise;
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

                if (connection.readyState === SockJS.OPEN) {
                    connection.send(JSON.stringify(jsonRPC));
                } else {
                    //wait for the connection to be ready and retry the send
                    $timeout(function () {
                        sendObsSchedCommand(method, funcParams);
                    }, 500);
                }

            }
        }

        return api;
    }

})();
