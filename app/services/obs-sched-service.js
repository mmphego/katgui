(function () {

    angular.module('katGui.services')
        .service('ObsSchedService', ObsSchedService);

    function ObsSchedService($rootScope, $http, SERVER_URL, ConfigService, $log, $q, $mdDialog, NotifyService) {

        var urlBase = SERVER_URL + '/katcontrol';
        var api = {};
        api.scheduleData = [];
        api.scheduleDraftData = [];
        api.scheduleCompletedData = [];

        api.subarrays = [];
        api.poolResourcesFree = [];
        api.configLabels = [];
        api.resourceTemplates = [];

        api.handleRequestResponse = function (request, defer) {
            var deferred;
            if (defer) {
                deferred = $q.defer();
            }
            request
                .then(function (result) {
                    var message = result.data.result.replace(/\\_/g, ' ').replace(/\\n/, '\n');
                    if (message.split(' ')[1] === 'ok') {
                        NotifyService.showSimpleToast(message);
                    } else {
                        NotifyService.showPreDialog('Error Processing Request', message);
                    }
                    if (deferred) {
                        deferred.resolve();
                    }
                }, function (error) {
                    NotifyService.showSimpleDialog('Error sending request', error);
                    if (deferred) {
                        deferred.resolve();
                    }
                });
            if (deferred) {
                return deferred.promise;
            }
        };

        api.markResourceFaulty = function (resource, faulty) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/resource/' + resource + '/faulty/' + faulty)));
        };

        api.markResourceInMaintenance = function (resource, maintenance) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/resource/' + resource + '/maintenance/' + maintenance)));
        };

        api.restartMaintenanceDevice = function (sub_nr, resource, device) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/subarray/' + sub_nr + '/resource/' + resource + '/device/' + device + '/restart')));
        };

        api.listResourceMaintenanceDevices = function (resource) {
            return $http(createRequest('get',  urlBase + '/resource/' + resource + '/maintenance-device-list'));
        };

        api.deleteScheduleDraft = function (id) {
            return $http(createRequest('post', urlBase + '/sb/' + id + '/delete'));
        };

        api.scheduleDraft = function (sub_nr, id) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/sb/' + sub_nr + '/' + id + '/schedule')));
        };

        api.scheduleToDraft = function (sub_nr, id_code) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/sb/' + sub_nr + '/' + id_code + '/to-draft')));
        };

        api.scheduleToComplete = function (sub_nr, id_code) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/sb/' + sub_nr + '/' + id_code + '/complete')));
        };

        api.setSchedulePriority = function (id_code, priority) {
            $http(createRequest('post', urlBase + '/sb/' + id_code + '/priority/' + priority))
                .then(function (result) {
                    NotifyService.showSimpleToast('Set Priority ' + id_code + ' to ' + priority);
                    $log.info(result);
                }, function (error) {
                    $log.error(error);
                });
        };

        api.verifyScheduleBlock = function (sub_nr, id_code) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/sb/' + sub_nr + '/' + id_code + '/verify')));
        };

        api.executeSchedule = function (sub_nr, id_code) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/sb/' + sub_nr + '/' + id_code + '/execute')));
        };

        api.stopSchedule = function (sub_nr, id_code) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/sb/' + sub_nr + '/' + id_code + '/stop')));
        };

        api.cancelExecuteSchedule = function (sub_nr, id_code) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/sb/' + sub_nr + '/' + id_code + '/cancel-execute')));
        };

        api.cloneSchedule = function (id_code) {
            return $http(createRequest('post', urlBase + '/sb/' + id_code + '/clone'));
        };

        api.assignScheduleBlock = function (sub_nr, id_code) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/sb/' + sub_nr + '/' + id_code + '/assign')));
        };

        api.unassignScheduleBlock = function (sub_nr, id_code) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/sb/' + sub_nr + '/' + id_code + '/unassign')));
        };

        api.assignResourcesToSubarray = function (sub_nr, resources) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/subarray/' + sub_nr + '/assign-resource/' + resources)));
        };

        api.unassignResourcesFromSubarray = function (sub_nr, resources) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/subarray/' + sub_nr + '/unassign-resource/' + resources)));
        };

        api.activateSubarray = function (sub_nr) {
            return $http(createRequest('post', urlBase + '/subarray/' + sub_nr + '/activate'), true);
        };

        api.setSubarrayMaintenance = function (sub_nr, maintenance) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/subarray/' + sub_nr + '/maintenance/' + maintenance)));
        };

        api.freeSubarray = function (sub_nr) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/subarray/' + sub_nr + '/free')));
        };

        api.getScheduleBlocks = function () {
            api.scheduleDraftData.splice(0, api.scheduleDraftData.length);
            $http(createRequest('get', urlBase + '/sb'))
                .then(function (result) {
                    var jsonResult = JSON.parse(result.data.result);
                    for (var i in jsonResult) {
                        if (jsonResult[i].state === 'DRAFT') {
                            api.scheduleDraftData.push(jsonResult[i]);
                        }
                    }
                }, function (error) {
                    $log.error(error);
                });
        };

        api.getScheduledScheduleBlocks = function () {
            api.scheduleData.splice(0, api.scheduleData.length);
            $http(createRequest('get', urlBase + '/sb/scheduled'))
                .then(function (result) {
                    var jsonResult = JSON.parse(result.data.result);
                    for (var i in jsonResult) {
                        api.scheduleData.push(jsonResult[i]);
                    }
                }, function (error) {
                    $log.error(error);
                });
        };

        api.getCompletedScheduleBlocks = function (sub_nr, max_nr) {
            api.scheduleCompletedData.splice(0, api.scheduleCompletedData.length);
            $http(createRequest('get', urlBase + '/sb/completed/' + sub_nr + '/' + max_nr))
                .then(function (result) {
                    var jsonResult = JSON.parse(result.data.result);
                    for (var i in jsonResult) {
                        api.scheduleCompletedData.push(jsonResult[i]);
                    }
                }, function (error) {
                    $log.error(error);
                });
        };

        api.setSchedulerModeForSubarray = function (sub_nr, mode) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/subarray/' + sub_nr + '/sched-mode/' + mode)));
        };

        api.updateScheduleDraft = function (scheduleBlockDraft) {
            return $http(createRequest('post', urlBase + '/sb/' + scheduleBlockDraft.id_code, {
                id_code: scheduleBlockDraft.id_code,
                type: scheduleBlockDraft.type,
                instruction_set: scheduleBlockDraft.instruction_set,
                description: scheduleBlockDraft.description,
                desired_start_time: scheduleBlockDraft.desired_start_time
            }));
        };

        api.receivedScheduleMessage = function (action, sb) {
            if (action === 'sb_remove') {
                //only drafts can be deleted in the db
                var removedSB = null;
                for (var i in api.scheduleDraftData) {
                    if (api.scheduleDraftData[i].id === sb.id) {
                        removedSB = api.scheduleDraftData[i];
                        api.scheduleDraftData.splice(i, 1);
                        break;
                    }
                }
                if (removedSB) {
                    NotifyService.showSimpleToast('SB ' + removedSB.id_code + ' has been removed');
                }
            } else if (action === 'sb_update') {

                var draftIndex = _.findLastIndex(api.scheduleDraftData, {id_code: sb.id_code});
                var scheduledIndex = _.findLastIndex(api.scheduleData, {id_code: sb.id_code});

                if (draftIndex > -1 && sb.state !== 'DRAFT') {
                    api.scheduleDraftData.splice(draftIndex, 1);
                } else if (draftIndex > -1 && sb.state === 'DRAFT') {
                    api.scheduleDraftData[draftIndex] = sb;
                } else if (draftIndex === -1 && sb.state === 'DRAFT'){
                    api.scheduleDraftData.push(sb);
                }
                if (scheduledIndex > -1 && (sb.state !== 'SCHEDULED' && sb.state !== 'ACTIVE')) {
                    api.scheduleData.splice(scheduledIndex, 1);
                } else if (scheduledIndex > -1 && (sb.state === 'SCHEDULED' || sb.state === 'ACTIVE')) {
                    api.scheduleData[scheduledIndex] = sb;
                } else if (scheduledIndex === -1 && (sb.state === 'SCHEDULED' || sb.state === 'ACTIVE')) {
                    api.scheduleData.push(sb);
                }
            } else if (action === 'sb_add') {
                if (sb.state === 'DRAFT') {
                    api.scheduleDraftData.push(sb);
                } else if (sb.state === 'ACTIVE' || sb.state === 'SCHEDULED') {
                    api.scheduleData.push(sb);
                } else {
                    api.scheduleCompletedData.push(sb);
                }
                NotifyService.showSimpleToast('SB ' + sb.id_code + ' has been added.');
            } else if (action === 'sb_order_change') {
                NotifyService.showSimpleToast('Reloading sb order from KATPortal.');
                api.getScheduledScheduleBlocks();
            } else if (action === 'sb_completed_change') {
                $rootScope.$emit('sb_completed_change', '');
            } else {
                $log.error('Dangling ObsSchedService ' + action + ' message for:');
                $log.error(sb);
            }
        };

        api.listConfigLabels = function () {
            api.configLabels.splice(0, api.configLabels.length);
            $http(createRequest('get', urlBase + '/config-labels'))
                .then(function (result) {
                    result.data.forEach(function (item) {
                        var configLabel = JSON.parse(item);
                        configLabel.date = moment.utc(configLabel.date).format('YYYY-MM-DD hh:mm:ss');
                        api.configLabels.push(configLabel);
                    });
                }, function (error) {
                    $log.error(error);
                });
        };

        api.setConfigLabel = function (sub_nr, config_label) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/config-labels/' + sub_nr + '/' + config_label)));
        };

        api.setBand = function (sub_nr, band) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/bands/' + sub_nr + '/' + band)));
        };

        api.setProduct = function (sub_nr, product) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/products/' + sub_nr + '/' + product)));
        };

        api.delegateControl = function (sub_nr, userName) {
            api.handleRequestResponse($http(createRequest('post', urlBase + '/subarray/' + sub_nr + '/delegate-control/' + userName)));
        };

        api.viewTaskLogForSBIdCode = function (id_code, mode) {
            if (ConfigService.GetKATTaskFileServerURL()) {
                window.open(ConfigService.GetKATTaskFileServerURL() + "/tailtask/" + id_code + "/" + mode).focus();
            } else {
                NotifyService.showSimpleDialog('Error Viewing Progress', 'There is no KATTaskFileServer IP defined in config, please contact CAM support.');
            }
        };

        api.listResourceMaintenanceDevicesDialog = function (sub_nr, resource, event) {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog) {
                        $scope.title = 'Select a Device in ' + resource + ' to Restart';
                        $scope.devices = [];
                        api.listResourceMaintenanceDevices(resource)
                            .then(function (result) {
                                var resultList = JSON.parse(result.data.result.replace(/\"/g, '').replace(/\'/g, '"'));
                                for (var i in resultList) {
                                    $scope.devices.push(resultList[i]);
                                }
                            }, function (error) {
                                $log.error(error);
                            });

                        $scope.hide = function () {
                            $mdDialog.hide();
                        };
                        $scope.restartMaintenanceDevice = function (device) {
                            api.restartMaintenanceDevice(sub_nr, resource, device);
                        };
                    },
                    template:
                    '<md-dialog style="padding: 0;" md-theme="{{$root.themePrimary}}">' +
                    '   <div style="padding: 0; margin: 0; overflow: auto" layout="column">' +
                    '       <md-toolbar class="md-primary" layout="row" layout-align="center center">' +
                    '           <span flex style="margin: 16px;">{{::title}}</span>' +
                    '       </md-toolbar>' +
                    '       <div flex layout="column">' +
                    '           <div layout="row" layout-align="center center" ng-repeat="device in devices track by $index">' +
                    '               <md-button style="margin: 0" flex title="Restart {{device}} Device"' +
                    '                   ng-click="restartMaintenanceDevice(device); $event.stopPropagation()">' +
                    '                   <span style="margin-right: 8px;" class="fa fa-refresh"></span>' +
                    '                   <span>{{device}}</span>' +
                    '               </md-button>' +
                    '           </div>' +
                    '       </div>' +
                    '       <div layout="row" layout-align="end" style="margin-top: 8px; margin-right: 8px; margin-bottom: 8px; min-height: 40px;">' +
                    '           <md-button style="margin-left: 8px;" class="md-primary md-raised" md-theme="{{$root.themePrimaryButtons}}" aria-label="OK" ng-click="hide()">Close</md-button>' +
                    '       </div>' +
                    '   </div>' +
                    '</md-dialog>',
                    targetEvent: event
                });
        };

        api.listResourceTemplates = function () {
            api.resourceTemplates.splice(0, api.resourceTemplates.length);
            $http.get(urlBase + '/subarray/template/list')
                .then(function (result) {
                    result.data.forEach(function (item) {
                        api.resourceTemplates.push(item);
                    });
                }, function (error) {
                    $log.error(error);
                });
        };

        api.loadResourceTemplate = function (subarray, template) {
            if (ConfigService.systemConfig.system.bands.indexOf(template.band) === -1) {
                $log.error('Could not set band ' + template.band + '.');
            } else if (subarray.band !== template.band) {
                api.setBand(subarray.id, template.band);
            }

            if (subarray.product !== template.product) {
                api.setProduct(subarray.id, template.product);
            }

            api.assignResourcesToSubarray(subarray.id, template.resources);
        };

        api.addResourceTemplate = function (template) {
            $http(createRequest('post',
                urlBase + '/subarray/template/add',
                {
                    name: template.name,
                    owner: $rootScope.currentUser.email,
                    resources: template.resources,
                    band: template.band,
                    product: template.product
                }))
                .then(function (result) {
                    api.resourceTemplates.push(result.data);
                    NotifyService.showSimpleToast("Created resource template");
                }, function (result) {
                    NotifyService.showSimpleDialog("Error creating resource template", result);
                });
        };

        api.modifyResourceTemplate = function (template) {
            $http(createRequest('post',
                urlBase + '/subarray/template/modify/' + template.id,
                {
                    name: template.name,
                    owner: $rootScope.currentUser.email,
                    resources: template.resources,
                    band: template.band,
                    product: template.product,
                    activated: template.activated
                }))
                .then(function (result) {
                    var oldResource = _.findWhere(api.resourceTemplates, {id: template.id});
                    oldResource = result.data;
                    NotifyService.showSimpleToast("Modified resource template");
                }, function (result) {
                    NotifyService.showSimpleDialog("Error modifying resource template", result);
                });
        };

        function createRequest(method, url, data) {
            var req = {
                method: method,
                url: url,
                headers: {
                    'Authorization': 'CustomJWT ' + $rootScope.jwt
                }
            };

            if (data && method === 'post') {
                req.headers['Content-Type'] = 'application/json';
                req.data = data;
            }

            return req;
        }

        return api;
    }

})();
