(function () {

    angular.module('katGui.services')
        .service('ObservationScheduleService', ObservationScheduleService);

    function ObservationScheduleService($q, $timeout, SERVER_URL, $rootScope, KatGuiUtil) {

        var urlBase = SERVER_URL + ':8020';
        var connection = null;
        var api = {};
        var deferredMap = {};
        api.scheduleDraftData = [];
        api.scheduleData = [];
        api.scheduleCompletedData = [];

        api.subarrays = [];
        api.resources = [];
        api.poolResources = [];
        api.poolResourcesFree = [];
        api.allocations = [];

        function onSockJSOpen() {
            if (connection && connection.readyState) {
                console.log('Observation Schedule Connection Established.');
                authenticateSocketConnection();
            }
        }

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
                    var getResult = JSON.parse(result.get_schedule_blocks);
                    getResult.forEach(function (item) {
                        addItemToApplicableDataModel(item);
                    });
                } else if (result.get_schedule_block) {

                    for (var i = 0; i < api.scheduleDraftData.length; i++) {
                        if (api.scheduleDraftData[i].id_code === result.get_schedule_block.id_code) {
                            api.scheduleDraftData[i] = result.get_schedule_block;
                            break;
                        }
                    }
                } else if (result.list_pool_resources_for_subarray) {

                    var resourcePoolResult = result.list_pool_resources_for_subarray.result.split(',');
                    resourcePoolResult = resourcePoolResult.filter(function (n) {
                        return n !== "";
                    });

                    var sub_nr = result.list_pool_resources_for_subarray.sub_nr;
                    if (sub_nr === 'free') {
                        sub_nr = 'Free';
                    }

                    if (!api['resourcePoolData' + sub_nr]) {
                        api['resourcePoolData' + sub_nr] = [];
                    }

                    resourcePoolResult.forEach(function (item) {
                        api['resourcePoolData' + sub_nr].push(item);
                    });
                } else if (result.create_schedule_block) {

                    result.create_schedule_block.desired_start_time = '';
                    result.create_schedule_block.hasValidInput = false;
                    result.create_schedule_block.isDirty = true;
                    api.scheduleDraftData.push(result.create_schedule_block);
                } else if (result.assign_schedule_to_subarray) {

                    jsonData.clientResult = parseKATCPMessageResult(result.assign_schedule_to_subarray.result);
                    if (jsonData.clientResult.result === 'ok') {
                        var indexAssign = _.indexOf(api.scheduleDraftData, _.findWhere(api.scheduleDraftData, {id_code: result.assign_schedule_to_subarray.id_code}));
                        api.scheduleDraftData[indexAssign].sub_nr = result.assign_schedule_to_subarray.sub_nr;
                    }

                } else if (result.unassign_schedule_to_subarray) {

                    jsonData.clientResult = parseKATCPMessageResult(result.unassign_schedule_to_subarray.result);
                    if (jsonData.clientResult.result === 'ok') {
                        var indexUnassign = _.indexOf(api.scheduleDraftData, _.findWhere(api.scheduleDraftData, {id_code: result.unassign_schedule_to_subarray.id_code}));
                        api.scheduleDraftData[indexUnassign].sub_nr = null;
                    }

                } else if (result.execute_schedule) {

                    //TODO update this case to handle the katcp response better like 'else if (result.assign_schedule_to_subarray) {'
                    jsonData.clientResult = parseKATCPMessageResult(result.execute_schedule.result);
                    var execute_schedule_result = result.execute_schedule.result.split(' ');
                    if (execute_schedule_result[1] === "ok") {
                        var indexEx = _.indexOf(api.scheduleDraftData, _.findWhere(api.scheduleData, {id_code: result.schedule_to_draft.id_code}));
                        api.scheduleDraftData[indexEx].state = "ACTIVE";
                    }
                } else if (result.cancel_execute_schedule) {

                    //TODO update this case to handle the katcp response better like 'else if (result.assign_schedule_to_subarray) {'
                    jsonData.clientResult = parseKATCPMessageResult(result.cancel_execute_schedule.result);
                    var cancel_execute_schedule_result = result.cancel_execute_schedule.result.split(' ');
                    if (cancel_execute_schedule_result[1] === "ok") {
                        var indexStopEx = _.indexOf(api.scheduleDraftData, _.findWhere(api.scheduleData, {id_code: result.schedule_to_draft.id_code}));
                        api.scheduleDraftData[indexStopEx].state = "INTERRUPTED";
                    }
                } else if (result.clone_schedule) {

                    api.scheduleDraftData.push(result.clone_schedule.result);
                } else if (result.schedule_draft) {

                    jsonData.clientResult = parseKATCPMessageResult(result.schedule_draft.result);
                    if (jsonData.clientResult.result === "ok") {
                        var index = _.indexOf(api.scheduleDraftData, _.findWhere(api.scheduleDraftData, {id_code: result.schedule_draft.id_code}));
                        var draftThatWasScheduled = api.scheduleDraftData.splice(index, 1);
                        draftThatWasScheduled[0].state = "SCHEDULED";
                        $timeout(function () {
                            api.scheduleData.push(draftThatWasScheduled[0]);
                        });

                    }
                } else if (result.schedule_to_draft) {

                    //TODO update this case to handle the katcp response better like 'else if (result.assign_schedule_to_subarray) {'
                    jsonData.clientResult = parseKATCPMessageResult(result.schedule_to_draft.result);
                    var to_draft_result = result.schedule_to_draft.result.split(' ');
                    if (to_draft_result[1] === "ok") {
                        var index3 = _.indexOf(api.scheduleDraftData, _.findWhere(api.scheduleData, {id_code: result.schedule_to_draft.id_code}));
                        var scheduleToMoveToDraft = api.scheduleData.splice(index3, 1);
                        scheduleToMoveToDraft[0].state = "DRAFT";
                        api.scheduleDraftData.push(scheduleToMoveToDraft[0]);
                    }
                } else if (result.schedule_to_complete) {

                    //TODO update this case to handle the katcp response better like 'else if (result.assign_schedule_to_subarray) {'
                    jsonData.clientResult = parseKATCPMessageResult(result.schedule_to_complete.result);
                    var to_complete_result = result.schedule_to_complete.result.split(' ');
                    if (to_complete_result[1] === "ok") {

                        var index4 = _.indexOf(api.scheduleData, _.findWhere(api.scheduleData, {id_code: result.schedule_to_complete.id_code}));
                        var scheduleToMoveToComplete = api.scheduleData.splice(index4, 1);
                        scheduleToMoveToComplete[0].state = "COMPLETED";
                        api.scheduleCompletedData.push(scheduleToMoveToComplete[0]);
                    }
                } else if (result.verify_schedule_block) {

                    jsonData.clientResult = parseKATCPMessageResult(result.verify_schedule_block.result);

                } else if (result.delete_schedule_block) {

                    //TODO update this case to handle the katcp response better like 'else if (result.assign_schedule_to_subarray) {'
                    if (result.delete_schedule_block.delete_result) {
                        var index2 = _.indexOf(api.scheduleDraftData, _.findWhere(api.scheduleDraftData, {id_code: result.delete_schedule_block.id_code}));
                        api.scheduleDraftData.splice(index2, 1);
                    } else {
                        console.error('Could not delete draft schedule block with id_code: ' + result.delete_schedule_block.id_code + '. Try to reload the page.');
                        deferredMap[jsonData.id].reject(jsonData.id);
                    }

                } else if (result.update_draft_schedule_block) {
                    var draftToUpdate = _.findWhere(api.scheduleDraftData, {id_code: result.update_draft_schedule_block.id_code});
                    draftToUpdate.description = result.update_draft_schedule_block.description;
                    draftToUpdate.type = result.update_draft_schedule_block.type;
                    draftToUpdate.instruction_set = result.update_draft_schedule_block.instruction_set;
                    draftToUpdate.desired_start_time = result.update_draft_schedule_block.desired_start_time;
                    draftToUpdate.isDirty = false;
                } else if (result.list_all_allocations) {

                    var allocationsResult = JSON.parse(result.list_all_allocations.result);
                    allocationsResult.forEach(function (item) {
                        api.allocations.push(item);
                    });
                } else if (result.list_pool_resources) {

                    var listPoolResources = JSON.parse(result.list_pool_resources);
                    listPoolResources.forEach(function (item) {
                        if (item.sub_nr === 'free') {
                            item.pool_resources.forEach(function (resourceItem) {
                                api.poolResourcesFree.push(resourceItem);
                            });
                        } else {
                            for (var i = 0; i < item.pool_resources.length; i++) {
                                item.pool_resources[i].sub_nr = item.sub_nr;
                                api.poolResources.push(item.pool_resources[i]);
                            }
                        }
                    });

                } else if (result.list_resources) {

                    var listResources = JSON.parse(result.list_resources);
                    listResources.forEach(function (item) {
                        api.resources.push(item);
                    });
                } else if (result.list_subarrays) {

                    var listSubbarrays = JSON.parse(result.list_subarrays);
                    listSubbarrays.forEach(function (item) {
                        api.subarrays.push(item);
                    });
                } else if (result.assign_resources_to_subarray) {

                    jsonData.clientResult = parseKATCPMessageResult(result.assign_resources_to_subarray.result);

                    if (jsonData.clientResult.result === 'ok') {
                        var resources_assigned_list = result.assign_resources_to_subarray.resources_list.split(',');
                        resources_assigned_list.forEach(function (item) {
                            var updatedResource = _.findWhere(api.poolResourcesFree, {name: item});
                            var updatedResourceIndex = _.indexOf(api.poolResourcesFree, updatedResource);
                            api.poolResourcesFree.splice(updatedResourceIndex, 1);
                            updatedResource.sub_nr = result.assign_resources_to_subarray.sub_nr;
                            updatedResource.selected = false;
                            api.poolResources.push(updatedResource);
                        });
                    }

                } else if (result.unassign_resources_from_subarray) {

                    jsonData.clientResult = parseKATCPMessageResult(result.unassign_resources_from_subarray.result);
                    if (jsonData.clientResult.result === 'ok') {

                        var resources_unassigned_list = result.unassign_resources_from_subarray.resources_list.split(',');

                        resources_unassigned_list.forEach(function (item) {
                            var updatedResource = _.findWhere(api.poolResources, {name: item});
                            var updatedResourceIndex = _.indexOf(api.poolResources, updatedResource);
                            api.poolResources.splice(updatedResourceIndex, 1);
                            updatedResource.sub_nr = "free";
                            api.poolResourcesFree.push(updatedResource);
                        });
                    }

                } else if (result.set_subarray_in_use) {

                    jsonData.clientResult = parseKATCPMessageResult(result.set_subarray_in_use.result);
                    if (jsonData.clientResult.result === 'ok') {
                        api.subarrays[_.indexOf(api.subarrays, _.findWhere(api.subarrays, {id: result.set_subarray_in_use.sub_nr}))]
                            .state = result.set_subarray_in_use.in_use ? 'in_use' : 'free';
                    }

                } else if (result.set_subarray_in_maintenance) {

                    jsonData.clientResult = parseKATCPMessageResult(result.set_subarray_in_maintenance.result);
                    if (jsonData.clientResult.result === 'ok') {
                        api.subarrays[_.indexOf(api.subarrays, _.findWhere(api.subarrays, {id: result.set_subarray_in_maintenance.sub_nr}))]
                            .in_maintenance = result.set_subarray_in_maintenance.in_maintenance;
                    }

                } else if (result.set_resources_faulty) {

                    jsonData.clientResult = parseKATCPMessageResult(result.set_resources_faulty.result);
                    if (jsonData.clientResult.result === 'ok') {
                        var updatedResource = _.findWhere(api.poolResources, {name: result.set_resources_faulty.resources_list});
                        if (!updatedResource) {
                            updatedResource = _.findWhere(api.poolResourcesFree, {name: result.set_resources_faulty.resources_list});
                        }
                        updatedResource.state = result.set_resources_faulty.faulty ? 'faulty' : 'ok';
                    }

                } else if (result.set_resources_in_maintenance) {

                    jsonData.clientResult = parseKATCPMessageResult(result.set_resources_in_maintenance.result);
                    if (jsonData.clientResult.result === 'ok') {
                        var updatedResourceM = _.findWhere(api.poolResources, {name: result.set_resources_in_maintenance.resources_list});
                        if (!updatedResourceM) {
                            updatedResourceM = _.findWhere(api.poolResourcesFree, {name: result.set_resources_in_maintenance.resources_list});
                        }
                        updatedResourceM.in_maintenance = result.set_resources_in_maintenance.in_maintenance;
                    }

                } else if (result.free_subarray) {

                    console.log(result.free_subarray);
                } else if (!result.email && result.session_id) {

                    console.warn('Observation Schedule returned an unfamiliar message: ');
                    console.warn(e);
                } else if (result.session_id) {
                    connection.authorized = true;
                }

                if (deferredMap[jsonData.id]) {
                    deferredMap[jsonData.id].resolve(jsonData.clientResult);
                }
            }
        }

        function parseKATCPMessageResult(message) {
            var messageList = message.split(' ');
            var msg = "";

            if (messageList.length > 2) {
                msg = messageList[2].replace(new RegExp('\\\\_', 'g'), ' ').split('\\n').join('|');
            } else {
                msg = "Request Successful";
            }
            return {
                result: messageList[1],
                message: msg
            };
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
            return createCommandPromise(sendObsSchedCommand('delete_schedule_block', [idCode]));
        };

        api.updateScheduleDraft = function (scheduleBlockDraft) {
            return createCommandPromise(sendObsSchedCommand('update_draft_schedule_block', [
                scheduleBlockDraft.id_code,
                scheduleBlockDraft.type,
                scheduleBlockDraft.instruction_set,
                scheduleBlockDraft.description,
                scheduleBlockDraft.desired_start_time]));
        };

        api.getScheduleBlocks = function () {

            api.scheduleDraftData.splice(0, api.scheduleDraftData.length);
            api.scheduleData.splice(0, api.scheduleData.length);
            api.scheduleCompletedData.splice(0, api.scheduleCompletedData.length);
            return createCommandPromise(sendObsSchedCommand('get_schedule_blocks'));
        };

        api.getScheduleBlock = function (id_code) {
            return createCommandPromise(sendObsSchedCommand('get_schedule_block', [id_code]));
        };

        api.createScheduleBlock = function () {
            return createCommandPromise(sendObsSchedCommand('create_schedule_block'));
        };

        api.assignScheduleBlock = function (subarray_number, id_code) {
            return createCommandPromise(sendObsSchedCommand('assign_schedule_to_subarray', [subarray_number, id_code]));
        };

        api.unassignScheduleBlock = function (subarray_number, id_code) {
            return createCommandPromise(sendObsSchedCommand('unassign_schedule_to_subarray', [subarray_number, id_code]));
        };

        api.scheduleDraft = function (subarray_number, id_code) {
            return createCommandPromise(sendObsSchedCommand('schedule_draft', [subarray_number, id_code]));
        };

        api.scheduleToDraft = function (subarray_number, id_code) {
            return createCommandPromise(sendObsSchedCommand('schedule_to_draft', [subarray_number, id_code]));
        };

        api.scheduleToComplete = function (subarray_number, id_code) {
            return createCommandPromise(sendObsSchedCommand('schedule_to_complete', [subarray_number, id_code]));
        };

        api.verifyScheduleBlock = function (subarray_number, id_code) {
            return createCommandPromise(sendObsSchedCommand('verify_schedule_block', [subarray_number, id_code]));
        };

        api.executeSchedule = function (subarray_number, id_code) {
            return createCommandPromise(sendObsSchedCommand('execute_schedule', [subarray_number, id_code]));
        };

        api.cancelExecuteSchedule = function (subarray_number, id_code) {
            return createCommandPromise(sendObsSchedCommand('cancel_execute_schedule', [subarray_number, id_code]));
        };

        api.cloneSchedule = function (id_code) {
            return createCommandPromise(sendObsSchedCommand('clone_schedule', [id_code]));
        };

        api.listPoolResourcesForSubarray = function (subarray_number) {

            var camelCaseSubNr = subarray_number;
            if (camelCaseSubNr === 'free') {
                camelCaseSubNr = 'Free';
            }

            if (api['resourcePoolData' + subarray_number]) {
                api['resourcePoolData' + camelCaseSubNr].splice(0, api['resourcePoolData' + camelCaseSubNr].length);
            }

            return createCommandPromise(sendObsSchedCommand('list_pool_resources_for_subarray', [subarray_number]));
        };

        api.listAllocations = function () {
            api.allocations.splice(0, api.allocations.length);
            return createCommandPromise(sendObsSchedCommand('list_all_allocations', []));
        };

        api.listPoolResources = function () {
            api.poolResourcesFree.splice(0, api.poolResourcesFree.length);
            api.poolResources.splice(0, api.poolResources.length);
            return createCommandPromise(sendObsSchedCommand('list_pool_resources', []));
        };

        api.listResources = function () {
            api.resources.splice(0, api.resources.length);
            return createCommandPromise(sendObsSchedCommand('list_resources', []));
        };

        api.listSubarrays = function () {
            api.subarrays.splice(0, api.subarrays.length);
            return createCommandPromise(sendObsSchedCommand('list_subarrays', []));
        };

        api.assignResourcesToSubarray = function (subarray, resources) {
            return createCommandPromise(sendObsSchedCommand('assign_resources_to_subarray', [subarray, resources]));
        };

        api.unassignResourcesFromSubarray = function (subarray, resources) {
            return createCommandPromise(sendObsSchedCommand('unassign_resources_from_subarray', [subarray, resources]));
        };

        api.setSubarrayInUse = function (subarray, set_to) {
            return createCommandPromise(sendObsSchedCommand('set_subarray_in_use', [subarray, set_to])); //1 for true
        };

        api.setSubarrayMaintenance = function (subarray, set_to) {
            return createCommandPromise(sendObsSchedCommand('set_subarray_in_maintenance', [subarray, set_to])); //1 for true
        };

        api.freeSubarray = function (subarray) {
            return createCommandPromise(sendObsSchedCommand('free_subarray', [subarray]));
        };

        api.markResourceFaulty = function (resource, faulty) {
            return createCommandPromise(sendObsSchedCommand('set_resources_faulty', [resource, faulty]));
        };

        api.markResourceInMaintenance = function (resource, in_maintenance) {
            return createCommandPromise(sendObsSchedCommand('set_resources_in_maintenance', [resource, in_maintenance]));
        };

        function createCommandPromise(promiseId) {
            deferredMap[promiseId] = $q.defer();
            return deferredMap[promiseId].promise;
        }

        function sendObsSchedCommand(method, funcParams, desired_jsonRPCId) {

            if (connection) {
                var jsonRPC = {
                    'jsonrpc': '2.0',
                    'method': method,
                    'id': KatGuiUtil.generateUUID()
                };

                if (desired_jsonRPCId) {
                    jsonRPC.id = desired_jsonRPCId;
                }
                if (funcParams) {
                    jsonRPC.params = funcParams;
                }
                if (connection.readyState === SockJS.OPEN && connection.authorized) {
                    connection.send(JSON.stringify(jsonRPC));
                } else {
                    //wait for the connection to be ready and retry the send
                    $timeout(function () {
                        sendObsSchedCommand(method, funcParams, jsonRPC.id);
                    }, 500);
                }
                return jsonRPC.id;
            }
        }

        return api;
    }

})();
