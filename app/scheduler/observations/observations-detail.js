(function () {

    angular.module('katGui.scheduler')
        .controller('SubArrayObservationsDetail', SubArrayObservationsDetail);

    function SubArrayObservationsDetail($rootScope, $scope, $state, ObsSchedService, $stateParams, $mdDialog, $interval,
                                        NotifyService, KatGuiUtil, $localStorage) {

        var vm = this;

        vm.draftListProcessingServerCall = false;
        vm.scheduleListProcessingServerCall = false;
        vm.selectedSchedule = null;
        vm.modeTypes = ['queue', 'manual'];
        vm.scheduleData = ObsSchedService.scheduleData;
        vm.scheduleCompletedData = ObsSchedService.scheduleCompletedData;
        vm.subarray = $scope.$parent.vm.subarray;

        vm.showSchedSBDetails = $localStorage.showSchedSBDetails;
        vm.showCompletedSBs = $localStorage.showCompletedSBs;
        if (!angular.isDefined(vm.showSchedSBDetails)) {
            vm.showSchedSBDetails = true;
        }
        if (!angular.isDefined(vm.showCompletedSBs)) {
            vm.showCompletedSBs = true;
        }

        $scope.$watch('vm.showSchedSBDetails', function (newValue) {
            $localStorage.showSchedSBDetails = newValue;
        });

        $scope.$watch('vm.showCompletedSBs', function (newValue) {
            $localStorage.showCompletedSBs = newValue;
        });

        $scope.parent = $scope.$parent;
        vm.iAmAtLeastCA = $scope.$parent.vm.iAmAtLeastCA;

        if (!$scope.$parent.vm.subarray) {
            $scope.$parent.vm.waitForSubarrayToExist().then(function () {
                vm.subarray = $scope.$parent.vm.subarray;
                ObsSchedService.getCompletedScheduleBlocks(vm.subarray.id, 100);
            });
        } else {
            vm.subarray = $scope.$parent.vm.subarray;
            ObsSchedService.getCompletedScheduleBlocks(vm.subarray.id, 100);
        }

        vm.completedFields = [
            {label: 'ID', value: 'id_code'},
            {label: 'Description', value: 'description'},
            {label: 'State', value: 'state'},
            {label: 'Outcome', value: 'outcome'},
            {label: 'Date', value: 'desired_start_time'},
            {label: 'State', value: 'state'},
            {label: 'Type', value: 'type'}
        ];

        vm.stateGo = function (state) {
            $state.go(state, {subarray_id: vm.subarray.id});
        };

        vm.setSelectedSchedule = function (selectedSchedule, dontDeselectOnSame) {
            if (vm.selectedSchedule === selectedSchedule && !dontDeselectOnSame) {
                vm.selectedSchedule = null;
            } else {
                vm.selectedSchedule = selectedSchedule;
            }
        };

        vm.freeSubarray = function () {
            ObsSchedService.freeSubarray(vm.subarray.id);
        };

        vm.activateSubarray = function () {
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

        vm.isResourceInMaintenance = function (resource) {
            resource.maintenance = ObsSchedService.resources_in_maintenance.indexOf(resource.name) !== -1;
            return resource.maintenance;
        };

        vm.isResourceFaulty = function (resource) {
            resource.faulty = ObsSchedService.resources_faulty.indexOf(resource.name) !== -1;
            return resource.faulty;
        };

        vm.setSubarrayMaintenance = function (maintenance) {
            ObsSchedService.setSubarrayMaintenance(vm.subarray.id, maintenance ? 'set' : 'clear');
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
                    template: '<md-dialog style="padding: 0;" md-theme="{{$root.themePrimary}}">' +
                    '   <div style="padding: 0; margin: 0; overflow: auto" layout="column">' +
                    '       <md-toolbar class="md-primary" layout="row" layout-align="center center">' +
                    '           <span flex style="margin: 8px;">{{::title}}</span>' +
                    '       </md-toolbar>' +
                    '       <div flex layout="column">' +
                    '           <div layout="row" layout-align="center center" ng-repeat="priority in priorities track by $index" ng-click="setPriority(priority); hide()" class="config-label-list-item">' +
                    '               <b>{{priority}}</b>' +
                    '           </div>' +
                    '       </div>' +
                    '       <div layout="row" layout-align="end end" style="margin-top: 8px; margin-right: 8px; margin-bottom: 8px; min-height: 40px;">' +
                    '           <md-button style="margin-left: 8px;" class="md-primary md-raised" md-theme="{{$root.themePrimaryButtons}}" aria-label="OK" ng-click="hide()">Close</md-button>' +
                    '       </div>' +
                    '   </div>' +
                    '</md-dialog>',
                    targetEvent: event
                });
        };

        vm.cancelListeningToCompletedUpdates = $rootScope.$on('sb_completed_change',function () {
            ObsSchedService.getCompletedScheduleBlocks(vm.subarray.id, 100);
        });

        $scope.$on('$destroy', function () {
            if (vm.progressInterval) {
                $interval.cancel(vm.progressInterval);
            }
            vm.cancelListeningToCompletedUpdates();
            if (vm.unbindDelegateWatch) {
                vm.unbindDelegateWatch();
            }
        });
    }
})();
