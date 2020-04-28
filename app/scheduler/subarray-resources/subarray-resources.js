(function () {

    angular.module('katGui.scheduler')
        .controller('SubArrayResourcesCtrl', SubArrayResourcesCtrl);

    function SubArrayResourcesCtrl($state, $scope, ObsSchedService, $rootScope, $stateParams,
                                   NotifyService, ConfigService, $mdDialog) {

        var vm = this;
        vm.poolResourcesFree = ObsSchedService.poolResourcesFree;
        $scope.parent = $scope.$parent;

        vm.initLastKnownConfig = function () {
            vm.lastKnownSubarrayConfig = ObsSchedService.getLastKnownSubarrayConfig(vm.subarray.id);
        };

        vm.loadLastKnownSubarrayConfig = function () {
            ObsSchedService.loadLastKnownSubarrayConfig(vm.subarray.id);
        };

        $scope.$parent.vm.waitForSubarrayToExist().then(function (subarrayId) {
            vm.subarray = _.findWhere(ObsSchedService.subarrays, {id: subarrayId});
            vm.initLastKnownConfig();
            /* Subarray object is created when the subarray-resources page is opened.
            Again subarray object is created when the scheduler-home page is opened.
            The subarray-resources page call functions like setProduct() defined in scheduler-home page.
            When routing or transitioning to scheduler-resources page it is possible to not
            open scheduler-home this will imply the subarray object(scheduler-home) will be the old one,
            as an example when the user set the product from subarray-resources page(config-container)
            the old subarray object in scheduler-home will be used, and nothing will happen
            because scheduler-resources page now have a new subarray object.
            The function below(checkCASubarrays) ensure that we update the scheduler-home subarray object
            TODO OJ(2020-01-16):
            In future we should consider using only one subarray object, I suggest parent subarray object. */
            $scope.$parent.vm.checkCASubarrays();
        });

        vm.toggleSelectAllUnassignedResources = function () {
            var anySelected = _.any(vm.poolResourcesFree, function(resource) {
                return resource.selected;
            });
            var select = !anySelected;
            vm.poolResourcesFree.forEach(function (item) {
                item.selected = select;
            });
        };

        vm.navigateToSensorSensorGroup = function() {
            /*Go to the SENSOR-GROUPS page.
            Note that the band parameter will be used to determine if
            a call was from scheduler display page or not */
            if (vm.subarray.band) {
                try {
                    $state.go('sensor-groups',
                    {
                        band: vm.subarray.band
                    });
                }
                catch (error) {
                    NotifyService.showSimpleDialog('Error',
                      'Unexpected error occurred (' + error
                +')');
                }
            }
        };

        vm.assignSelectedResources = function () {
            var selectedResources = vm.poolResourcesFree.filter(function(resource) {
                return resource.selected;
            });
            var selectedResourceNames = selectedResources.map(function(resource) {
                return resource.name;
            });
            if (selectedResourceNames) {
                ObsSchedService.assignResourcesToSubarray(vm.subarray.id, selectedResourceNames.join(','));
            }
        };

        vm.assignResource = function (resourceName) {
            ObsSchedService.assignResourcesToSubarray(vm.subarray.id, resourceName);
        };

        vm.assignAllReceptors = function () {
            var allReceptors = ConfigService.systemConfig["antenna_labels"]["ALL"].split(',');
            var freeResources = [];
            for (var j=0; j<vm.poolResourcesFree.length; j++)
                freeResources.push(vm.poolResourcesFree[j].name);

            for (var i=0; i<allReceptors.length; i++) {
                var receptorName = allReceptors[i];
                var isReceptorInMaintenance = $scope.parent.vm.isResourceInMaintenance(receptorName);
                var isReceptorFaulty = $scope.parent.vm.isResourceFaulty(receptorName);
                var subarrayInMaintenance = $scope.parent.vm.sensorValues[vm.subarray.name + '_maintenance'].value;
                if (!freeResources.includes(receptorName))
                    continue;

                if (!subarrayInMaintenance) {
                    if (isReceptorInMaintenance || isReceptorFaulty)
                        continue;
                }

                ObsSchedService.assignResourcesToSubarray(vm.subarray.id, receptorName);
            }
        };

        vm.minGlobalSyncTime = function () {
          // can't work out sync time if initialisation has not finished
          if (!ConfigService.systemConfig || !vm.subarray)
            return undefined;

          var poolResourcesSensor = ObsSchedService.sensorValues[vm.subarray.name + '_pool_resources'];
          if (!poolResourcesSensor)
            return undefined;
          var availableReceptors = poolResourcesSensor.value.split(',');

          var minTimeRemaining = undefined;

          for (var i=0; i<availableReceptors.length; i++) {
              var receptorName = availableReceptors[i];
              if (vm.subarray.band) {
                var sensor = $scope.parent.vm.sensorValues[receptorName +"_dig_" + vm.subarray.band + "_band_time_remaining"];
                if (sensor) {
                  var receptorTimeRemaining = sensor.value;
                  if (minTimeRemaining==undefined) {
                    minTimeRemaining = receptorTimeRemaining;
                  }
                  else if (receptorTimeRemaining<minTimeRemaining) {
                    minTimeRemaining = receptorTimeRemaining;
                  }
                }
              }
          }
          return minTimeRemaining;
        }

        vm.totalBoards = function (resourceName) {
            if (!resourceName.startsWith('cbf'))
                return undefined;
            var boards_marked_standby_sensor = $scope.parent.vm.sensorValues[resourceName + "_boards_marked_standby"];
            var boards_marked_up_sensor = $scope.parent.vm.sensorValues[resourceName + "_boards_marked_up"];
            var boards_marked_assigned_sensor = $scope.parent.vm.sensorValues[resourceName + "_boards_marked_assigned"];
            if (boards_marked_standby_sensor && boards_marked_up_sensor && boards_marked_assigned_sensor) {
                var total_boards = boards_marked_standby_sensor.value + boards_marked_up_sensor.value + boards_marked_assigned_sensor.value;
                return total_boards;
            }
        };

        vm.isReceiverReady = function (receptorName) {
            // return `true` if the receiver of the currently selected band is ready
            // false if not ready and undefined otherwise. Do this only for receptors
            if (!vm.subarray.band)
                return undefined;

            var subscribedSenors = Object.keys($scope.parent.vm.sensorValues);
            for (var i=0; i<subscribedSenors.length; i++) {
                if (subscribedSenors[i].endsWith('ready') && receptorName == subscribedSenors[i].split('_')[3] && subscribedSenors[i].split('_')[5].endsWith(vm.subarray.band)) {
                    var isReady = $scope.parent.vm.sensorValues[subscribedSenors[i]].value;
                    if (isReady == true) {
                        isReady = 'IS ready';
                    } else if (isReady == false) {
                        isReady = 'NOT ready'
                    }
                }
            }
            return isReady;
        }

        vm.resourceAllowedInSubarray = function (resourceName) {
            var genericResources = [];
            var generic_to_specific_resources = ConfigService.systemConfig['internals']['generic_to_specific_resources'].split(',');
            if (vm.subarray) {
                for (var p=0; p<generic_to_specific_resources.length; p++) {
                    var dataProxy = (generic_to_specific_resources[p].split(':')[1]);
                    genericResources.push(dataProxy);
                }

                for (var i=0; i<genericResources.length; i++) {
                    if (resourceName.startsWith(genericResources[i]))
                       return resourceName.endsWith('_' + vm.subarray.id);
                }

                return true;
            }

            return false;
        };

        vm.freeAssignedResource = function (resourceName) {
            ObsSchedService.unassignResourcesFromSubarray(vm.subarray.id, resourceName);
        };

        vm.reactivateReceptor = function (receptors) {
            ObsSchedService.reactivateSubarrayReceptor(vm.subarray.id, receptors);
        };

        vm.openTemplateListDialog = function ($event) {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog) {
                        $scope.title = 'Select a Template';
                        $scope.templates = ObsSchedService.resourceTemplates;
                        ObsSchedService.listResourceTemplates();

                        $scope.hide = function () {
                            $mdDialog.hide();
                        };
                        $scope.templateSelected = function (template) {
                            $mdDialog.hide();
                            ObsSchedService.loadResourceTemplate(vm.subarray, template);
                        };
                    },
                    template:
                        '<md-dialog style="padding: 0; min-width: 800px" md-theme="{{$root.themePrimary}}">' +
                        '   <div style="padding: 0; margin: 0; overflow: hidden" layout="column">' +
                        '       <md-toolbar class="md-primary" layout="row" layout-align="center center">' +
                        '           <span flex style="margin-left: 16px;">{{::title}}</span>' +
                        '           <div layout="row" style="position: absolute; left: 8px; right: 0; bottom: 0; font-size: 12px">' +
                        '               <span style="min-width: 300px; max-width: 300px;">Name</span>' +
                        '               <span style="min-width: 35px; max-width: 35px;">Band</span>' +
                        '               <span style="min-width: 100px; max-width: 100px;">Product</span>' +
                        '               <span style="min-width: 350px; max-width: 350px;">Resources</span>' +
                        '           </div>' +
                        '       </md-toolbar>' +
                        '       <div flex layout="column" layout-align="center center" style="overflow: auto;">' +
                        '           <div flex layout="row" layout-align="center center" ng-repeat="template in displayedTemplates = (templates | filter:{activated: true} | orderBy:name:true) track by $index" ng-click="templateSelected(template); hide()" class="config-label-list-item span-text-overflow-hidden-ellipsis">' +
                        '               <span style="min-width: 300px; max-width: 300px;" title="{{template.name}}">{{template.name}}</span>' +
                        '               <span style="min-width: 35px; max-width: 35px;">{{template.band}}</span>' +
                        '               <span style="min-width: 100px; max-width: 100px;" title="{{template.product}}">{{template.product}}</span>' +
                        '               <span style="min-width: 350px; max-width: 350px;" title="{{template.resources}}">{{template.resources}}</span>' +
                        '           </div>' +
                        '           <i flex ng-show="displayedTemplates.length === 0">No templates found, create one first.</i>' +
                        '       </div>' +
                        '       <div layout="row" layout-align="end end" style="margin-top: 8px; margin-right: 8px; margin-bottom: 8px; min-height: 40px;">' +
                        '           <md-button style="margin-left: 8px;" class="md-primary md-raised" md-theme="{{$root.themePrimaryButtons}}" aria-label="OK" ng-click="hide()">Cancel</md-button>' +
                        '       </div>' +
                        '   </div>' +
                        '</md-dialog>',
                    targetEvent: event
                });
        };

        vm.saveTemplateDialog = function ($event) {

            var allocations = ObsSchedService.sensorValues[vm.subarray.name + '_allocations'].parsedValue;
            var resourceNames = allocations.map(function (allocation) {
                return allocation[0];
            });
            resourceNames = resourceNames.join(',');

            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog) {
                        $scope.title = 'Update an Existing Template...';
                        $scope.templates = ObsSchedService.resourceTemplates;
                        $scope.template = {
                            name: "",
                            resources: resourceNames,
                            band: vm.subarray.band,
                            product: vm.subarray.product};
                        ObsSchedService.listResourceTemplates();

                        $scope.hide = function () {
                            $mdDialog.hide();
                        };
                        $scope.templateSelected = function (template) {
                            NotifyService.showImportantConfirmDialog(event, 'Confirm Overwrite',
                                'Are you sure you want to overwrite the template?',
                                'Yes', 'Cancel')
                                    .then(function () {
                                        $scope.template = template;
                                        $scope.template.resources = resourceNames;
                                        $scope.template.band = vm.subarray.band;
                                        $scope.template.product = vm.subarray.product;
                                        ObsSchedService.modifyResourceTemplate($scope.template);
                                    });
                        };
                        $scope.createNewTemplate = function () {
                            ObsSchedService.addResourceTemplate($scope.template);
                            $mdDialog.hide();
                        };
                        $scope.deactivateResourceTemplate = function (template) {
                            NotifyService.showImportantConfirmDialog(event, 'Confirm Delete',
                                'Are you sure you want to delete the template ' + template.name + '?',
                                'Yes', 'Cancel')
                                    .then(function () {
                                        $scope.template = template;
                                        $scope.template.activated = false;
                                        ObsSchedService.modifyResourceTemplate($scope.template);
                                    });
                        };
                    },
                    template:
                        '<md-dialog style="padding: 0;" md-theme="{{$root.themePrimary}}">' +
                        '   <div style="padding: 0; margin: 0; overflow: hidden" layout="column">' +
                        '       <md-toolbar class="md-primary" layout="row" layout-align="center center">' +
                        '           <span flex style="margin-left: 16px;">{{::title}}</span>' +
                        '           <div layout="row" style="position: absolute; left: 8px; right: 0; bottom: 0; font-size: 12px">' +
                        '               <span style="min-width: 300px; max-width: 300px;">Name</span>' +
                        '               <span style="min-width: 35px; max-width: 35px;">Band</span>' +
                        '               <span style="min-width: 100px; max-width: 100px;">Product</span>' +
                        '               <span style="min-width: 350px; max-width: 350px;">Resources</span>' +
                        '           </div>' +
                        '       </md-toolbar>' +
                        '       <div flex layout="column" style="overflow: auto;">' +
                        '           <div layout="row" layout-align="center center" ng-repeat="template in templates | filter:{activated: true} | orderBy:name:true track by $index" ng-click="templateSelected(template); hide()" class="config-label-list-item">' +
                        '               <span style="min-width: 300px; max-width: 300px;" title="{{template.name}}">{{template.name}}</span>' +
                        '               <span style="min-width: 35px; max-width: 35px;">{{template.band}}</span>' +
                        '               <span style="min-width: 100px; max-width: 100px;" title="{{template.product}}">{{template.product}}</span>' +
                        '               <span style="min-width: 350px; max-width: 350px;" title="{{template.resources}}">{{template.resources}}</span>' +
                        '               <md-button ng-if="$root.expertOrLO" class="md-icon-button inline-action-button"' +
                        '                   ng-click="deactivateResourceTemplate(template); $event.stopPropagation()"' +
                        '                   title="Delete Template" style="margin: 0;padding: 0;max-height: 20px;min-height: 20px;width: 20px;">' +
                        '                   <md-icon class="fa" md-font-icon="fa-trash"></md-icon>' +
                        '               </md-button>' +
                        '           </div>' +
                        '       </div>' +
                        '       <div layout="row" layout-align="center center" style="margin: 0px 8px; min-height: 40px; border-top: 1px dashed #d7d7d7;border-bottom: 1px dashed #d7d7d7;">' +
                        '           <i style="font-size: 18px;">OR create a new template...</i>' +
                        '       </div>' +
                        '       <div layout="row" layout-align="end center" style="margin-top: 0px; min-height: 40px;">' +
                        '           <md-input-container md-no-float md-theme="{{themePrimary}}" flex style="margin: 4px 8px; min-width: 300px;"><input placeholder="Template Name..." ng-model="template.name"></md-input-container>' +
                        '           <md-button ng-disabled="template.name.length < 3" style="margin-left: 8px;" class="md-primary md-raised" md-theme="{{$root.themePrimaryButtons}}" aria-label="OK" ng-click="createNewTemplate()">Create New</md-button>' +
                        '           <md-button style="margin-left: 8px;" class="md-primary md-raised" md-theme="{{$root.themePrimaryButtons}}" aria-label="OK" ng-click="hide()">Cancel</md-button>' +
                        '       </div>' +
                        '   </div>' +
                        '</md-dialog>',
                    targetEvent: event
                });
        };

        vm.unbindShortcuts = $rootScope.$on("keydown", function (e, key) {
            if (key === 27) {
                //clear selection when pressing escape
                ObsSchedService.poolResourcesFree.forEach(function (item) {
                    item.selected = false;
                });
            } else if (key === 13) {
                vm.assignSelectedResources();
            }
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        });

        $scope.$on('$destroy', function () {
            vm.unbindShortcuts('keydown');
        });

        vm.sensorClass = function(status) {
            return status + '-sensor-list-item';
        };
    }

})();
