(function () {

    angular.module('katGui.scheduler')
        .controller('SubArraysCtrl', SubArraysCtrl);

    function SubArraysCtrl($rootScope, ObsSchedService, $scope, $state, $stateParams, $mdDialog, $log,
                           NotifyService) {

        var vm = this;
        vm.currentActionsMenuIndex = -1;
        vm.showVerifyMenuItem = false;
        vm.scheduleDraftData = ObsSchedService.scheduleDraftData;
        vm.scheduleData = ObsSchedService.scheduleData;

        if (!$scope.$parent.vm.subarray) {
            $scope.$parent.vm.waitForSubarrayToExist().then(function () {
                vm.subarray = $scope.$parent.vm.subarray;
            });
        } else {
            vm.subarray = $scope.$parent.vm.subarray;
        }

        vm.draftsOrderByFields = [
            {label: 'ID', value: 'id_code', reverse: true},
            {label: 'Description', value: 'description'},
            {label: 'Date', value: 'desired_start_time'},
            {label: 'State', value: 'verification_state'},
            {label: 'Expected Duration', value: 'expected_duration'},
            {label: 'Type', value: 'type'}
        ];

        vm.setDraftsOrderBy = function (column) {
            var newOrderBy = _.findWhere(vm.draftsOrderByFields, {value: column});
            if ((vm.draftsOrderBy || {}).value === column) {
                if (newOrderBy.reverse === undefined) {
                    newOrderBy.reverse = true;
                } else if (newOrderBy.reverse) {
                    newOrderBy.reverse = undefined;
                    newOrderBy = null;
                }
            }
            vm.draftsOrderBy = newOrderBy;
        };

        vm.setDraftsOrderBy('id_code');

        vm.assignSelectedScheduleBlocks = function () {
            ObsSchedService.scheduleDraftData.forEach(function (item) {
                if (item.selected) {
                    item.selected = false;
                    ObsSchedService.assignScheduleBlock(vm.subarray.id, item.id_code);
                }
            });
        };

        vm.freeScheduleBlock = function (sb) {
            ObsSchedService.unassignScheduleBlock(vm.subarray.id, sb.id_code);
        };

        vm.scheduleDraft = function (sb) {
            ObsSchedService.scheduleDraft(sb.sub_nr, sb.id_code);
        };

        vm.verifyDraft = function (sb) {
            ObsSchedService.verifyScheduleBlock(sb.sub_nr, sb.id_code);
        };

        vm.verifySB = function (sb) {
            ObsSchedService.verifyScheduleBlock(vm.subarray.id, sb.id_code);
        };

        vm.viewSBTasklog = function (sb, mode) {
            ObsSchedService.viewTaskLogForSBIdCode(sb.id_code, mode);
        };

        vm.moveScheduleRowToDraft = function (item) {
            ObsSchedService.scheduleToDraft(vm.subarray.id, item.id_code);
        };

        vm.removeDraft = function (item) {
            ObsSchedService.deleteScheduleDraft(item.id_code)
                .then(function (result) {
                    $log.info(result.data);
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
            if (vm.unbindDelegateWatch) {
                vm.unbindDelegateWatch();
            }
        });
    }
})();
