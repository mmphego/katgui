(function () {

    angular.module('katGui.services')
        .service('ObsSchedService', ObsSchedService);

    function ObsSchedService($http, SERVER_URL, $rootScope, ConfigService, $log) {

        var urlBase = SERVER_URL + '/katcontrol/api/v1';
        var api = {};
        api.scheduleData = [];
        api.scheduleDraftData = [];

        api.subarrays = [];
        api.poolResourcesFree = [];

        api.handleRequestResponse = function (request) {
            request
                .success(function (result) {
                    $rootScope.showSimpleToast(result.result.replace(/\\_/g, ' '));
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
            api.handleRequestResponse($http.post(urlBase + '/sb/' + id + '/delete'));
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
                        } else {
                            api.scheduleData.push(jsonResult[i]);
                        }
                    }
                })
                .error(function (error) {
                    $log.error(error);
                });
        };

        api.setSchedulerModeForSubarray = function (sub_nr, mode) {
            api.handleRequestResponse($http.post(urlBase + '/subarray/' + sub_nr + '/mode/' + mode));
        };

        api.updateScheduleDraft = function (scheduleBlockDraft) {
            return $http.post(
                urlBase + '/sb/' +
                scheduleBlockDraft.id_code + '/' +
                scheduleBlockDraft.type + '/' +
                scheduleBlockDraft.instruction_set + '/' +
                scheduleBlockDraft.description + '/' +
                scheduleBlockDraft.desired_start_time + '/update');
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
