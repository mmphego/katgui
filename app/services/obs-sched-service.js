(function () {

    angular.module('katGui.services')
        .service('ObsSchedService', ObsSchedService);

    function ObsSchedService($http, SERVER_URL, $rootScope, ConfigService, $log) {

        var urlBase = SERVER_URL + '/katcontrol/api/v1';
        var api = {};
        api.scheduleData = [];
        api.scheduleDraftData = [];
        api.scheduleCompletedData = [];

        api.subarrays = [];
        api.poolResourcesFree = [];

        api.handleRequestResponse = function (request) {
            request
                .success(function (result) {
                    var message = result.result.replace(/\\_/g, ' ').replace(/\\n/, '\n');
                    if (message.split(' ')[1] === 'ok') {
                        $rootScope.showSimpleToast(message);
                    } else {
                        $rootScope.showPreDialog('Error Processing Request', message);
                    }
                })
                .error(function (error) {
                    $rootScope.showSimpleDialog('Error sending request', error);
                });
        };

        api.markResourceFaulty = function (resource, faulty) {
            api.handleRequestResponse($http.post(urlBase + '/resource/' + resource + '/faulty/' + faulty));
        };

        api.markResourceInMaintenance = function (resource, maintenance) {
            api.handleRequestResponse($http.post(urlBase + '/resource/' + resource + '/maintenance/' + maintenance));
        };

        api.deleteScheduleDraft = function (id) {
            return $http.post(urlBase + '/sb/' + id + '/delete');
        };

        api.scheduleDraft = function (sub_nr, id) {
            api.handleRequestResponse($http.post(urlBase + '/sb/' + sub_nr + '/' + id + '/schedule'));
        };

        api.scheduleToDraft = function (sub_nr, id_code) {
            api.handleRequestResponse($http.post(urlBase + '/sb/' + sub_nr + '/' + id_code + '/to-draft'));
        };

        api.scheduleToComplete = function (sub_nr, id_code) {
            api.handleRequestResponse($http.post(urlBase + '/sb/' + sub_nr + '/' + id_code + '/complete'));
        };

        api.verifyScheduleBlock = function (sub_nr, id_code) {
            api.handleRequestResponse($http.post(urlBase + '/sb/' + sub_nr + '/' + id_code + '/verify'));
        };

        api.executeSchedule = function (sub_nr, id_code) {
            api.handleRequestResponse($http.post(urlBase + '/sb/' + sub_nr + '/' + id_code + '/execute'));
        };

        api.stopSchedule = function (sub_nr, id_code) {
            api.handleRequestResponse($http.post(urlBase + '/sb/' + sub_nr + '/' + id_code + '/stop'));
        };

        api.cancelExecuteSchedule = function (sub_nr, id_code) {
            api.handleRequestResponse($http.post(urlBase + '/sb/' + sub_nr + '/' + id_code + '/cancel-execute'));
        };

        api.cloneSchedule = function (id_code) {
            api.handleRequestResponse($http.post(urlBase + '/sb/' + id_code + '/clone'));
        };

        api.assignScheduleBlock = function (sub_nr, id_code) {
            api.handleRequestResponse($http.post(urlBase + '/sb/' + sub_nr + '/' + id_code + '/assign'));
        };

        api.unassignScheduleBlock = function (sub_nr, id_code) {
            api.handleRequestResponse($http.post(urlBase + '/sb/' + sub_nr + '/' + id_code + '/unassign'));
        };

        api.assignResourcesToSubarray = function (sub_nr, resources) {
            api.handleRequestResponse($http.post(urlBase + '/subarray/' + sub_nr + '/assign-resource/' + resources));
        };

        api.unassignResourcesFromSubarray = function (sub_nr, resources) {
            api.handleRequestResponse($http.post(urlBase + '/subarray/' + sub_nr + '/unassign-resource/' + resources));
        };

        api.activateSubarray = function (sub_nr) {
            api.handleRequestResponse($http.post(urlBase + '/subarray/' + sub_nr + '/activate'));
        };

        api.setSubarrayMaintenance = function (sub_nr, maintenance) {
            api.handleRequestResponse($http.post(urlBase + '/subarray/' + sub_nr + '/maintenance/' + maintenance));
        };

        api.freeSubarray = function (sub_nr) {
            api.handleRequestResponse($http.post(urlBase + '/subarray/' + sub_nr + '/free'));
        };

        api.getScheduleBlocks = function () {
            api.scheduleData.splice(0, api.scheduleData.length);
            api.scheduleDraftData.splice(0, api.scheduleDraftData.length);
            $http.get(urlBase + '/sb')
                .success(function (result) {
                    var jsonResult = JSON.parse(result.result);
                    for (var i in jsonResult) {
                        if (jsonResult[i].state === 'DRAFT') {
                            api.scheduleDraftData.push(jsonResult[i]);
                        } else if (jsonResult[i].state === 'ACTIVE' || jsonResult[i].state === 'SCHEDULED') {
                            api.scheduleData.push(jsonResult[i]);
                        } else {
                            api.scheduleCompletedData.push(jsonResult[i]);
                        }
                    }
                })
                .error(function (error) {
                    $log.error(error);
                });
        };

        api.setSchedulerModeForSubarray = function (sub_nr, mode) {
            api.handleRequestResponse($http.post(urlBase + '/subarray/' + sub_nr + '/sched-mode/' + mode));
        };

        api.updateScheduleDraft = function (scheduleBlockDraft) {
            return $http.post(urlBase + '/sb/' + scheduleBlockDraft.id_code, {
                id_code: scheduleBlockDraft.id_code,
                type: scheduleBlockDraft.type,
                instruction_set: scheduleBlockDraft.instruction_set,
                description: scheduleBlockDraft.description,
                desired_start_time: scheduleBlockDraft.desired_start_time
            });
        };

        api.receivedScheduleMessage = function (action, sb) {
            if (action === 'sb_remove') {
                //only drafts can be deleted in the db
                for (var i in api.scheduleDraftData) {
                    if (api.scheduleDraftData[i].id_code === sb.id_code) {
                        api.scheduleDraftData.splice(i, 1);
                        break;
                    }
                }
                $rootScope.showSimpleToast('SB ' + sb.id_code + ' has been removed');
            } else if (action === 'sb_update') {
                var index = -1;
                for (var i in api.scheduleDraftData) {
                    if (api.scheduleDraftData[i].id_code === sb.id_code) {
                        index = i;
                        break;
                    }
                }
                if (index > -1) {
                    api.scheduleDraftData[index] = sb;
                } else {
                    for (var i in api.scheduleData) {
                        if (api.scheduleData[i].id_code === sb.id_code) {
                            index = i;
                            break;
                        }
                    }
                    if (index > -1) {
                        api.scheduleData[index] = sb;
                    } else {
                        for (var i in api.scheduleCompletedData) {
                            if (api.scheduleCompletedData[i].id_code === sb.id_code) {
                                index = i;
                                break;
                            }
                        }
                        if (index > -1) {
                            api.scheduleCompletedData[index] = sb;
                        }
                    }
                }
                //if (index !== -1) {
                //    $rootScope.showSimpleToast('SB ' + sb.id_code + ' has been updated.');
                //}

            } else if (action === 'sb_add') {
                if (sb.state === 'DRAFT') {
                    api.scheduleDraftData.push(sb);
                } else if (sb.state === 'ACTIVE' || sb.state === 'SCHEDULED') {
                    api.scheduleData.push(sb);
                } else {
                    api.scheduleCompletedData.push(sb);
                }
                $rootScope.showSimpleToast('SB ' + sb.id_code + ' has been added.');
            } else {
                $log.error('Dangling ObsSchedService ' + action + ' message for:');
                $log.error(sb)
            }
        };

        api.viewTaskLogForSBIdCode = function (id_code) {
            if (ConfigService.KATObsPortalURL) {
                window.open(ConfigService.KATObsPortalURL + "/tailtask/" + id_code + "/progress").focus();
            } else {
                $rootScope.showSimpleDialog('Error Viewing Progress', 'There is no KATObsPortal IP defined in config, please contact CAM support.');
            }
        };

        return api;
    }

})();
