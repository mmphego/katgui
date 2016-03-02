(function () {

    angular.module('katGui.scheduler', ['ui.bootstrap.datetimepicker',
        'katGui.services',
        'katGui.util',
        'ngAnimate'])
        .constant('SCHEDULE_BLOCK_TYPES', [
            'MAINTENANCE',
            'OBSERVATION',
            'MANUAL'])
        .controller('SchedulerHomeCtrl', SchedulerHomeCtrl);

    function SchedulerHomeCtrl($state, $rootScope, $scope, $interval, $log, SensorsService, ObsSchedService, $timeout,
                               NotifyService, MonitorService, ConfigService, $stateParams, $q, $mdDialog, UserService) {

        var vm = this;
        vm.childStateShowing = $state.current.name !== 'scheduler';
        vm.subarrays = ObsSchedService.subarrays;
        vm.disconnectIssued = false;
        vm.connectInterval = null;
        vm.connectionLost = false;
        vm.waitForSubarrayToExistDeferred = $q.defer();
        vm.subarray = null;
        vm.products = [];
        vm.bands = [];
        vm.users = [];
        vm.iAmCA = false;

        if (!$stateParams.subarray_id) {
            $state.go($state.current.name, {subarray_id: '1'});
        }

        UserService.listUsers().then(function () {
            for (var i = 0; i < UserService.users.length; i++) {
                vm.users.push(UserService.users[i]);
            }
        });

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

        vm.stateGo = function (newState, subarray_id) {
            if (subarray_id) {
                $state.go(newState, {subarray_id: subarray_id});
                vm.subarray = _.findWhere(ObsSchedService.subarrays, {id: subarray_id});
            } else if (vm.subarray) {
                $state.go(newState, {subarray_id: vm.subarray.id});
            } else if (newState === 'scheduler.observations' || newState === 'scheduler.drafts') {
                $state.go(newState);
            } else {
                $state.go('scheduler');
            }
        };

        vm.unbindStateChangeStart = $rootScope.$on('$stateChangeStart', function (event, toState) {
            vm.childStateShowing = (toState.name === 'scheduler.drafts' ||
                toState.name === 'scheduler.resources' ||
                toState.name === 'scheduler.execute' ||
                toState.name === 'scheduler.subarrays' ||
                toState.name === 'scheduler.observations' ||
                toState.name === 'scheduler.observations.detail');

            if (toState.name === 'scheduler.observations' ||
                toState.name === 'scheduler.drafts' ||
                toState.name === 'scheduler') {
                vm.subarray = null;
            }
        });

        vm.currentState = function () {
            return $state.current.name;
        };

        MonitorService.subscribe('sched');
        ObsSchedService.getScheduleBlocks();
        ObsSchedService.getScheduledScheduleBlocks();

        vm.checkCASubarrays = function () {
            vm.subarray = _.findWhere(ObsSchedService.subarrays, {id: $stateParams.subarray_id});
            if (vm.subarray) {
                vm.iAmCA = vm.subarray.delegated_ca === $rootScope.currentUser.email && $rootScope.currentUser.req_role === 'control_authority';
            }
        };

        vm.checkCASubarrays();
        if (!vm.subarray) {
            vm.unbindWatchSubarrays = $scope.$watchCollection('vm.subarrays', function () {
                vm.checkCASubarrays();
            });
        }

        vm.unbindDelegateWatch = $scope.$watch('vm.subarray.delegated_ca', function (newVal) {
            vm.checkCASubarrays();
        });

        vm.unbindLoginSuccess = $rootScope.$on('loginSuccess', function () {
            vm.checkCASubarrays();
        });

        vm.waitForSubarrayToExist = function () {
            if (vm.subarray) {
                $timeout(function () {
                    vm.waitForSubarrayToExistDeferred.resolve();
                }, 1);
            } else {
                vm.waitForSubarrayToExistInterval = $interval(function () {
                    if (!vm.subarray && $stateParams.subarray_id) {
                        vm.checkCASubarrays();
                    }
                    if (vm.subarray) {
                        vm.waitForSubarrayToExistDeferred.resolve();
                        $interval.cancel(vm.waitForSubarrayToExistInterval);
                        vm.waitForSubarrayToExistInterval = null;
                    }
                }, 150);
            }
            return vm.waitForSubarrayToExistDeferred.promise;
        };

        vm.openConfigLabelDialog = function (event) {
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
                            ObsSchedService.setConfigLabel(vm.subarray.id, configLabel);
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

        vm.setBand = function (band) {
            ObsSchedService.setBand(vm.subarray.id, band);
        };

        vm.openBandsDialog = function (event) {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog) {
                        $scope.title = 'Select a Band';
                        $scope.bands = vm.bands;

                        $scope.hide = function () {
                            $mdDialog.hide();
                        };
                        $scope.setBand = function (band) {
                            vm.setBand(band);
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

        vm.setProduct = function (product) {
            ObsSchedService.setProduct(vm.subarray.id, product);
        };

        vm.openProductsDialog = function (event) {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog) {
                        $scope.title = 'Select a Product';
                        $scope.products = vm.products;

                        $scope.hide = function () {
                            $mdDialog.hide();
                        };
                        $scope.setProduct = function (product) {
                            vm.setProduct(product);
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

        vm.openCADialog = function (event) {
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
                            ObsSchedService.delegateControl(vm.subarray.id, userName);
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

        vm.delegateControl = function (email) {
            ObsSchedService.delegateControl(vm.subarray.id, email);
        };

        $scope.$on('$destroy', function () {
            MonitorService.unsubscribe('sched', '*');
            vm.unbindStateChangeStart();

            if (vm.connectInterval) {
                $interval.cancel(vm.connectInterval);
            }
            if (vm.unbindWatchSubarrays) {
                vm.unbindWatchSubarrays();
            }
            if (vm.waitForSubarrayToExistInterval) {
                $interval.cancel(vm.waitForSubarrayToExistInterval);
            }
            SensorsService.disconnectListener();
            vm.disconnectIssued = true;
        });
    }
})();
