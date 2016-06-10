(function () {

    angular.module('katGui.scheduler')
        .controller('SubArraysCtrl', SubArraysCtrl);

    function SubArraysCtrl($rootScope, ObsSchedService, $scope, $state, $stateParams, $mdDialog, $log,
                           NotifyService) {

        var vm = this;
        vm.selectedSBs = [];
        vm.showDeselectTooltip = false;
        vm.scheduleDraftData = ObsSchedService.scheduleDraftData;
        vm.scheduleData = ObsSchedService.scheduleData;

        if (!$scope.$parent.vm.subarray) {
            $scope.$parent.vm.waitForSubarrayToExist().then(function () {
                vm.subarray = $scope.$parent.vm.subarray;
            });
        } else {
            vm.subarray = $scope.$parent.vm.subarray;
        }
        $scope.parent = $scope.$parent;

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

        //TODO we need a bulk assign schedule blocks function
        vm.assignSelectedScheduleBlocks = function () {
            ObsSchedService.scheduleDraftData.forEach(function (item) {
                if (item.selected) {
                    item.selected = false;
                    ObsSchedService.assignScheduleBlock(vm.subarray.id, item.id_code);
                    var indexOfSelected = vm.selectedSBs.indexOf(item);
                    if (indexOfSelected > -1) {
                        vm.selectedSBs.splice(indexOfSelected, 1);
                    }
                }
            });
            vm.showDeselectTooltip = vm.selectedSBs.length !== 0;
        };

        vm.assignScheduleBlock = function (sb) {
            var indexOfSelected = vm.selectedSBs.indexOf(sb);
            if (indexOfSelected > -1) {
                vm.selectedSBs.splice(indexOfSelected, 1);
            }
            vm.showDeselectTooltip = vm.selectedSBs.length !== 0;
            ObsSchedService.assignScheduleBlock(vm.subarray.id, sb.id_code);
        };

        vm.toggleSBSelect = function (sb, selectedValue) {
            if (!$scope.parent.vm.iAmAtLeastCA() || angular.isDefined(sb.selected) && selectedValue === sb.selected) {
                return;
            }
            var selected = selectedValue;
            if (!angular.isDefined(selected)) {
                selected = !sb.selected;
            }
            sb.selected = selected;
            var indexOfSelected = vm.selectedSBs.indexOf(sb);
            if (indexOfSelected > -1 && !selected) {
                vm.selectedSBs.splice(indexOfSelected, 1);
            } else if (selected) {
                vm.selectedSBs.push(sb);
            }
            vm.showDeselectTooltip = vm.selectedSBs.length !== 0;
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

        vm.removeDraft = function (item) {
            ObsSchedService.deleteScheduleDraft(item.id_code)
                .then(function (result) {
                    // $log.info(result.data);
                    var indexOfSelected = vm.selectedSBs.indexOf(item);
                    if (indexOfSelected > -1) {
                        vm.selectedSBs.splice(indexOfSelected, 1);
                    }
                    vm.showDeselectTooltip = vm.selectedSBs.length !== 0;
                }, function (result) {
                    NotifyService.showSimpleDialog('Error Deleteing SB ' + item.id_code + '.', result);
                });
        };

        vm.unbindShortcuts = $rootScope.$on("keydown", function (e, key) {
            if (key === 27) {
                //clear selection when pressing escape
                ObsSchedService.scheduleDraftData.forEach(function (item) {
                    item.selected = false;
                });
                if (vm.selectedSBs.length > 0) {
                    vm.selectedSBs = [];
                    vm.showDeselectTooltip = false;
                } else {
                    //clear filter search on free resources
                    vm.q = '';
                }
            } else if (key === 13) {
                vm.assignSelectedScheduleBlocks();
            }
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        });

        $scope.$on('$destroy', function () {
            vm.unbindShortcuts('keydown');
            if (vm.unbindDelegateWatch) {
                vm.unbindDelegateWatch();
            }
        });
    }
})();
