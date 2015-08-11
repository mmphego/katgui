(function () {

    angular.module('katGui.scheduler')
        .controller('SubArraysCtrl', SubArraysCtrl);

    function SubArraysCtrl($rootScope, ObsSchedService, $scope, $state, $stateParams, $mdDialog, $log) {

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
        vm.currentActionsMenuIndex = -1;
        vm.showVerifyMenuItem = false;
        vm.scheduleDraftData = ObsSchedService.scheduleDraftData;
        vm.scheduleData = ObsSchedService.scheduleData;
        vm.subarrays = ObsSchedService.subarrays;

        vm.draftsOrderByFields = [
            {label: 'ID', value: 'id_code'},
            {label: 'Description', value: 'description'},
            {label: 'Date', value: 'desired_start_time'},
            {label: 'State', value: 'state'},
            {label: 'Type', value: 'type'}
        ];

        vm.limitTo = 5;
        $scope.loadMore = function() {
            vm.limitTo += 30;
        };

        vm.assignSelectedScheduleBlocks = function (subarray) {
            ObsSchedService.scheduleDraftData.forEach(function (item) {
                if (item.selected) {
                    item.selected = false;
                    ObsSchedService.assignScheduleBlock(subarray.id, item.id_code);
                }
            });
        };

        vm.freeScheduleBlock = function (subarray, sb) {
            ObsSchedService.unassignScheduleBlock(subarray.id, sb.id_code);
        };

        vm.scheduleDraft = function (sb) {
            ObsSchedService.scheduleDraft(sb.sub_nr, sb.id_code);
        };

        vm.verifyDraft = function (sb) {
            ObsSchedService.verifyScheduleBlock(sb.sub_nr, sb.id_code);
        };

        vm.verifySB = function (sb) {
            ObsSchedService.verifyScheduleBlock(vm.subarray_id, sb.id_code);
        };

        vm.viewSBTasklog = function (sb, mode) {
            ObsSchedService.viewTaskLogForSBIdCode(sb.id_code, mode);
        };

        vm.moveScheduleRowToDraft = function (item) {
            ObsSchedService.scheduleToDraft(vm.subarray_id, item.id_code);
        };

        vm.removeDraft = function (item) {
            ObsSchedService.deleteScheduleDraft(item.id_code)
                .then(function (result) {
                    $log.info(result);
                }, function (result) {
                    NotifyService.showSimpleDialog('Error Deleteing SB ' + item.id_code + '.', result);
                });
        };

        vm.setPriority = function (sb, event) {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog) {
                        $scope.title = 'Set Priority - ' + sb.id_code + ' (current: ' + sb.priority + ')';
                        $scope.priorities = ["LOW", "HIGH"];
                        $scope.currentPriority = sb.priority;

                        $scope.hide = function () {
                            $mdDialog.hide();
                        };
                        $scope.setPriority = function (priority) {
                            ObsSchedService.setSchedulePriority(sb.id_code, priority);
                        };
                    },
                    template:
                    '<md-dialog style="padding: 0;" md-theme="{{$root.themePrimary}}">' +
                    '   <div style="padding: 0; margin: 0; overflow: auto" layout="column">' +
                    '       <md-toolbar class="md-primary" layout="row" layout-align="center center">' +
                    '           <span flex style="margin: 8px;">{{::title}}</span>' +
                    '       </md-toolbar>' +
                    '       <div flex layout="column">' +
                    '           <div layout="row" layout-align="center center" ng-repeat="priority in priorities track by $index" ng-click="setPriority(priority); hide()" class="config-label-list-item">' +
                    '               <b>{{priority}}</b>' +
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

        $scope.$on('$destroy', function () {
            vm.unbindIAmCA();
            if (vm.unbindDelegateWatch) {
                vm.unbindDelegateWatch();
            }
        });
    }
})();
