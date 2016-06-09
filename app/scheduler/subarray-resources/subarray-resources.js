(function () {

    angular.module('katGui.scheduler')
        .controller('SubArrayResourcesCtrl', SubArrayResourcesCtrl);

    function SubArrayResourcesCtrl($state, $scope, ObsSchedService, $rootScope, $stateParams,
                                   NotifyService, ConfigService, KatGuiUtil, $mdDialog) {

        var vm = this;
        vm.showDeselectTooltip = false;
        vm.selectedResources = [];
        vm.poolResourcesFree = ObsSchedService.poolResourcesFree;
        vm.resources_faulty = ObsSchedService.resources_faulty;
        vm.resources_in_maintenance = ObsSchedService.resources_in_maintenance;
        if (!$scope.$parent.vm.subarray) {
            $scope.$parent.vm.waitForSubarrayToExist().then(function () {
                vm.subarray = $scope.$parent.vm.subarray;
            });
        } else {
            vm.subarray = $scope.$parent.vm.subarray;
        }
        $scope.parentScope = $scope.$parent;
        vm.iAmAtLeastCA = $scope.$parent.vm.iAmAtLeastCA;

        vm.selectAllUnassignedResources = function (selected) {
            vm.poolResourcesFree.forEach(function (item) {
                item.selected = selected;
                if (selected && vm.selectedResources.indexOf(item) === -1) {
                    vm.selectedResources.push(item);
                }
            });
            if (!selected) {
                vm.selectedResources = [];
            }
            vm.showDeselectTooltip = vm.selectedResources.length !== 0;
        };

        vm.assignSelectedResources = function () {
            var itemsAssigned = [];
            vm.poolResourcesFree.forEach(function (item) {
                if (item.selected) {
                    itemsAssigned.push(item.name);
                    item.selected = false;
                    var indexOfSelected = vm.selectedResources.indexOf(item);
                    if (indexOfSelected > -1) {
                        vm.selectedResources.splice(indexOfSelected, 1);
                    }
                }
            });
            if (itemsAssigned.length > 0) {
                var itemsString = itemsAssigned.join(',');
                ObsSchedService.assignResourcesToSubarray(vm.subarray.id, itemsString);
            }
            vm.showDeselectTooltip = vm.selectedResources.length !== 0;
        };

        vm.assignResource = function (resource) {
            resource.selected = false;
            var indexOfSelected = vm.selectedResources.indexOf(resource);
            if (indexOfSelected > -1) {
                vm.selectedResources.splice(indexOfSelected, 1);
            }
            vm.showDeselectTooltip = vm.selectedResources.length !== 0;
            ObsSchedService.assignResourcesToSubarray(vm.subarray.id, resource.name);
        };

        vm.freeAssignedResource = function (resource) {
            ObsSchedService.unassignResourcesFromSubarray(vm.subarray.id, resource.name);
        };

        vm.freeSubarray = function () {
            vm.subarray.showProgress = true;
            var dataResource = _.find(vm.subarray.allocations, function(resource) {
                return resource.name.startsWith('data_');
            });

            ObsSchedService.freeSubarray(vm.subarray.id).then(function (success) {
                if (success && dataResource) {
                    ObsSchedService.assignResourcesToSubarray(vm.subarray.id, dataResource.name).then(function () {
                        vm.subarray.showProgress = false;
                    });
                } else {
                    vm.subarray.showProgress = false;
                }
            });
        };

        vm.activateSubarray = function () {
            vm.subarray.showProgress = true;
            ObsSchedService.activateSubarray(vm.subarray.id)
                .then(function (result) {
                    var splitMessage = result.data.result.split(' ');
                    var message = KatGuiUtil.sanitizeKATCPMessage(result.data.result);
                    if (splitMessage.length > 2 && splitMessage[1] !== 'ok') {
                        NotifyService.showPreDialog('Error activating subarray', message);
                    } else {
                        NotifyService.showSimpleToast(result.data.result);
                    }
                    vm.subarray.showProgress = false;
                }, function (error) {
                    NotifyService.showSimpleDialog('Could not activate Subarray', error.data.result);
                    vm.subarray.showProgress = false;
                });
        };

        vm.setSubarrayInMaintenance = function () {
            ObsSchedService.setSubarrayMaintenance(vm.subarray.id, vm.subarray.maintenance ? 'clear' : 'set');
        };

        vm.markResourceFaulty = function (resource) {
            ObsSchedService.markResourceFaulty(resource.name, resource.faulty? 'clear' : 'set');
        };

        vm.markResourceInMaintenance = function (resource) {
            ObsSchedService.markResourceInMaintenance(resource.name, resource.maintenance ? 'clear' : 'set');
        };

        vm.listResourceMaintenanceDevicesDialog = function (resource, event) {
            ObsSchedService.listResourceMaintenanceDevicesDialog(vm.subarray.id, resource.name, event);
        };

        vm.isResourceInMaintenance = function (resource) {
            if (ObsSchedService.resources_in_maintenance) {
                resource.maintenance = ObsSchedService.resources_in_maintenance.indexOf(resource.name) !== -1;
                return resource.maintenance;
            } else {
                resource.maintenance = false;
                return false;
            }
        };

        vm.isResourceFaulty = function (resource) {
            resource.faulty = ObsSchedService.resources_faulty.indexOf(resource.name) !== -1;
            return resource.faulty;
        };

        vm.toggleResourceSelect = function (resource, selectedValue) {
            if (angular.isDefined(resource.selected) && selectedValue === resource.selected) {
                return;
            }
            var selected = selectedValue;
            if (!angular.isDefined(selected)) {
                selected = !resource.selected;
            }
            resource.selected = selected;
            var indexOfSelected = vm.selectedResources.indexOf(resource);
            if (indexOfSelected > -1 && !selected) {
                vm.selectedResources.splice(indexOfSelected, 1);
            } else if (selected) {
                vm.selectedResources.push(resource);
            }
            vm.showDeselectTooltip = vm.selectedResources.length !== 0;
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
            var resourceNames = [];
            vm.subarray.allocations.forEach(function (allocation) {
                resourceNames.push(allocation.name);
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
                if (vm.selectedResources.length > 0) {
                    vm.selectedResources = [];
                    vm.showDeselectTooltip = false;
                } else {
                    //clear filter search on free resources
                    vm.q = '';
                }
            } else if (key === 13) {
                vm.assignSelectedResources();
            }
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        });

        vm.initLastKnownConfig = function () {
            vm.lastKnownSubarrayConfig = ObsSchedService.getLastKnownSubarrayConfig(vm.subarray.id);
        };

        vm.loadLastKnownSubarrayConfig = function () {
            ObsSchedService.loadLastKnownSubarrayConfig(vm.subarray.id);
        };

        $scope.$on('$destroy', function () {
            vm.unbindShortcuts('keydown');
            if (vm.unbindDelegateWatch) {
                vm.unbindDelegateWatch();
            }
        });
    }

})();
