(function () {

    angular.module('katGui.scheduler')
        .controller('SubArrayResourcesCtrl', SubArrayResourcesCtrl);

    function SubArrayResourcesCtrl($state, $scope, ObsSchedService, $rootScope, $mdDialog, $stateParams, UserService,
                                   NotifyService, ConfigService) {

        var vm = this;

        vm.checkCASubarrays = function () {
            for (var i = 0; i < ObsSchedService.subarrays.length; i++) {
                if (ObsSchedService.subarrays[i]['delegated_ca'] === $rootScope.currentUser.email &&
                    $stateParams.subarray_id === ObsSchedService.subarrays[i].id) {
                    vm.subarray_id = parseInt(ObsSchedService.subarrays[i].id);
                    $scope.subarray = ObsSchedService.subarrays[i];
                }
            }
        };

        if ($stateParams.subarray_id !== '' && $rootScope.iAmLO) {
            vm.subarray_id = parseInt($stateParams.subarray_id);
        } else {
            vm.checkCASubarrays();
        }
        if (!vm.subarray_id) {
            $state.go('scheduler');
        } else {
            vm.unbindDelegateWatch = $scope.$watch('subarray.delegated_ca', function (newVal) {
                if (newVal !== $rootScope.currentUser.email && !$rootScope.iAmLO) {
                    $state.go('scheduler');
                }
            });
        }
        vm.unbindIAmCA = $rootScope.$watch('iAmCA', function () {
            vm.checkCASubarrays();
        });

        vm.subarrays = ObsSchedService.subarrays;
        vm.poolResourcesFree = ObsSchedService.poolResourcesFree;
        vm.resources_faulty = ObsSchedService.resources_faulty;
        vm.resources_in_maintenance = ObsSchedService.resources_in_maintenance;
        vm.bands = [];
        vm.products = [];
        ConfigService.getSystemConfig()
            .then(function (systemConfig) {
                if (systemConfig.system.bands && systemConfig.system.products) {
                    vm.bands = systemConfig.system.bands.split(',');
                    vm.products = systemConfig.system.products.split(',');
                } else {
                    NotifyService.showSimpleDialog('Error loading bands and products',
                        'Bands and products were not found in the system\'s config.');
                }
            });

        vm.selectAllUnassignedResources = function (selected) {
            vm.poolResourcesFree.forEach(function (item) {
                item.selected = selected;
            });
        };

        vm.assignSelectedResources = function (subarray) {
            var itemsAssigned = [];
            vm.poolResourcesFree.forEach(function (item) {
                if (item.selected) {
                    itemsAssigned.push(item.name);
                }
            });
            if (itemsAssigned.length > 0) {
                var itemsString = itemsAssigned.join(',');
                ObsSchedService.assignResourcesToSubarray(subarray.id, itemsString);
            }
            vm.selectAll = false;
        };

        vm.freeAssignedResource = function (subarray, resource) {
            ObsSchedService.unassignResourcesFromSubarray(subarray.id, resource.name);
        };

        vm.freeSubarray = function (subarray) {
            ObsSchedService.freeSubarray(subarray.id);
        };

        vm.activateSubarray = function (subarray) {
            subarray.showProgress = true;
            ObsSchedService.activateSubarray(subarray.id)
                .then(function (result) {
                    NotifyService.showSimpleToast(result.data.result);
                    subarray.showProgress = false;
                }, function (error) {
                    NotifyService.showSimpleDialog('Could not activate Subarray', error.data.result);
                    subarray.showProgress = false;
                });
        };

        vm.setSubarrayInMaintenance = function (subarray) {
            ObsSchedService.setSubarrayMaintenance(subarray.id, subarray.maintenance ? 'clear' : 'set');
        };

        vm.markResourceFaulty = function (resource) {
            ObsSchedService.markResourceFaulty(resource.name, resource.faulty? 'clear' : 'set');
        };

        vm.markResourceInMaintenance = function (resource) {
            ObsSchedService.markResourceInMaintenance(resource.name, resource.maintenance ? 'clear' : 'set');
        };

        vm.listResourceMaintenanceDevicesDialog = function (subarray, resource, event) {
            ObsSchedService.listResourceMaintenanceDevicesDialog(subarray.id, resource.name, event);
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

        vm.openConfigLabelDialog = function (sub_nr, event) {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog) {
                        $scope.title = 'Select a Config Label';
                        $scope.configLabels = ObsSchedService.configLabels;
                        ObsSchedService.listConfigLabels();
                        $scope.configLabelsFields = [
                            {label: 'date', value: 'date'},
                            {label: 'name', value: 'name'}
                        ];
                        $scope.hide = function () {
                            $mdDialog.hide();
                        };
                        $scope.setConfigLabel = function (configLabel) {
                            ObsSchedService.setConfigLabel(sub_nr, configLabel);
                        };
                    },
                    template:
                        '<md-dialog style="padding: 0;" md-theme="{{$root.themePrimary}}">' +
                        '   <div style="padding: 0; margin: 0; overflow: auto" layout="column">' +
                        '       <md-toolbar class="md-primary" layout="row" layout-align="center center">' +
                        '           <span flex style="margin-left: 8px;">{{::title}}</span>' +
                        '           <input type="search" style="font-size: 14px; margin-left: 8px; width: 140px; background: transparent; border: 0" ng-model="q" placeholder="Search Labels..."/>' +
                        '       </md-toolbar>' +
                        '       <div flex layout="column" style="overflow-x: auto; overflow-y: scroll">' +
                        '           <div style="text-align: center" class="config-label-list-item" ng-click="setConfigLabel(\'\');  hide()">Clear Config Label</div>' +
                        '           <div layout="row" ng-repeat="configLabel in configLabels | regexSearch:configLabelsFields:q track by $index" ng-click="setConfigLabel(configLabel.name); hide()" class="config-label-list-item">' +
                        '               <div style="min-width: 178px;">{{configLabel.date}}</div>' +
                        '               <div>{{configLabel.name}}</div>' +
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

        vm.openBandsDialog = function (sub_nr, event) {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog) {
                        $scope.title = 'Select a Band';
                        $scope.bands = vm.bands;

                        $scope.hide = function () {
                            $mdDialog.hide();
                        };
                        $scope.setBand = function (band) {
                            ObsSchedService.setBand(sub_nr, band);
                        };
                    },
                    template:
                        '<md-dialog style="padding: 0;" md-theme="{{$root.themePrimary}}">' +
                        '   <div style="padding: 0; margin: 0; overflow: auto" layout="column">' +
                        '       <md-toolbar class="md-primary" layout="row" layout-align="center center">' +
                        '           <span flex style="margin-left: 8px;">{{::title}}</span>' +
                        '       </md-toolbar>' +
                        '       <div flex layout="column" style="overflow-x: auto; overflow-y: scroll">' +
                        '           <div layout="row" layout-align="center center" ng-repeat="band in bands track by $index" ng-click="setBand(band); hide()" class="config-label-list-item">' +
                        '               <b>{{band}}</b>' +
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

        vm.openProductsDialog = function (sub_nr, event) {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog) {
                        $scope.title = 'Select a Product';
                        $scope.products = vm.products;

                        $scope.hide = function () {
                            $mdDialog.hide();
                        };
                        $scope.setProduct = function (product) {
                            ObsSchedService.setProduct(sub_nr, product);
                        };
                    },
                    template:
                    '<md-dialog style="padding: 0;" md-theme="{{$root.themePrimary}}">' +
                    '   <div style="padding: 0; margin: 0; overflow: auto" layout="column">' +
                    '       <md-toolbar class="md-primary" layout="row" layout-align="center center">' +
                    '           <span flex style="margin-left: 8px;">{{::title}}</span>' +
                    '       </md-toolbar>' +
                    '       <div flex layout="column" style="overflow-x: auto; overflow-y: scroll">' +
                    '           <div layout="row" layout-align="center center" ng-repeat="product in products track by $index" ng-click="setProduct(product); hide()" class="config-label-list-item">' +
                    '               <b>{{product}}</b>' +
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

        vm.openCADialog = function (sub_nr, event) {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog) {
                        $scope.title = 'Select a Control Authority';
                        UserService.listUsers();
                        $scope.users = UserService.users;

                        $scope.hide = function () {
                            $mdDialog.hide();
                        };
                        $scope.setCA = function (userName) {
                            ObsSchedService.delegateControl(sub_nr, userName);
                        };
                        $scope.hasCARole = function (user) {
                            return user.roles.indexOf('control_authority') > -1;
                        };
                    },
                    template:
                    '<md-dialog style="padding: 0;" md-theme="{{$root.themePrimary}}">' +
                    '   <div style="padding: 0; margin: 0; overflow: auto" layout="column">' +
                    '       <md-toolbar class="md-primary" layout="row" layout-align="center center">' +
                    '           <span flex style="margin-left: 8px;">{{::title}}</span>' +
                    '       </md-toolbar>' +
                    '       <div flex layout="column" style="overflow-x: auto; overflow-y: scroll">' +
                    '           <div layout="row" layout-align="center center" ng-click="setCA(\'lo\'); hide()" class="config-label-list-item">' +
                    '               <b>Lead Operator</b>' +
                    '           </div>' +
                    '           <div ng-if="hasCARole(user)" layout="row" layout-align="center center" ng-repeat="user in users track by $index" ng-click="setCA(user.email); hide()" class="config-label-list-item">' +
                    '               <b>{{user.email}}</b>' +
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

        vm.navigateToSchedulerDetails = function (subarray_id) {
            $state.go('scheduler.observations.detail', {subarray_id: subarray_id});
        };

        vm.unbindShortcuts = $rootScope.$on("keydown", function (e, key) {
            if (key === 27) {
                //clear selection when pressing escape
                ObsSchedService.poolResourcesFree.forEach(function (item) {
                    item.selected = false;
                });
                vm.selectAll = false;
            }
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        });

        $scope.$on('$destroy', function () {
            vm.unbindShortcuts('keydown');
            vm.unbindIAmCA();
            if (vm.unbindDelegateWatch) {
                vm.unbindDelegateWatch();
            }
        });
    }

})();
