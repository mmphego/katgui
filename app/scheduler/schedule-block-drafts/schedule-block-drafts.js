(function () {

    angular.module('katGui.scheduler')
        .controller('SbDraftsCtrl', SbDraftsCtrl);

    function SbDraftsCtrl($scope, ObsSchedService, SCHEDULE_BLOCK_TYPES, $log, NotifyService, $rootScope) {

        var vm = this;
        vm.selectedScheduleDraft = null;
        vm.types = SCHEDULE_BLOCK_TYPES;
        vm.scheduleDraftData = ObsSchedService.scheduleDraftData;
        $scope.$parent.vm.subarray = null;
        $scope.parent = $scope.$parent;

        vm.draftsOrderByFields = [
            {label: 'ID', value: 'id_code'},
            {label: 'Description', value: 'description'},
            {label: 'Expected Duration', value: 'expected_duration'},
            {label: 'Verification State', value: 'verification_state'},
            {label: 'Date', value: 'desired_start_time'},
            {label: 'State', value: 'state'},
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

        vm.setDraftsOrderBy('id_code', true);

        vm.saveDraft = function (item) {
            item.editing = false;
            ObsSchedService.updateScheduleDraft(item)
                .then(function (result) {
                    delete item.isDirty;
                    delete item.editing;
                    NotifyService.showSimpleToast('Saved SB ' + item.id_code);
                }, function (result) {
                    NotifyService.showPreDialog('Error Saving SB ' + item.id_code, result.data);
                });
        };

        vm.saveAllDirtyDrafts = function () {
            vm.scheduleDraftData.forEach(function (item) {
                item.editing = false;
                if (item.isDirty) {
                    ObsSchedService.updateScheduleDraft(item);
                    item.isDirty = false;
                }
            });
        };

        vm.verifyDraft = function (item) {
            ObsSchedService.verifyScheduleBlock(item.sub_nr, item.id_code);
        };

        vm.removeDraft = function (item) {
            ObsSchedService.deleteScheduleDraft(item.id_code)
                .then(function (result) {
                    var index = ObsSchedService.scheduleDraftData.indexOf(item);
                    if (index > -1) {
                        ObsSchedService.scheduleDraftData.splice(index, 1);
                    }
                    NotifyService.showSimpleToast('Deleted SB ' + item.id_code);
                }, function (result) {
                    NotifyService.showSimpleDialog('Error Deleteing SB ' + item.id_code, result.data);
                });
        };

        vm.setSelectedScheduleDraft = function (selectedDraft, dontDeselectOnSame) {
            if (vm.selectedScheduleDraft === selectedDraft && !dontDeselectOnSame) {
                vm.selectedScheduleDraft = null;
            } else {
                vm.selectedScheduleDraft = selectedDraft;
            }
        };

        vm.viewSBTasklog = function (item) {
            ObsSchedService.viewTaskLogForSBIdCode(item.id_code, 'dryrun');
        };

        vm.onTimeSet = function (newDate) {
            $scope.filteredDraftItems[vm.currentRowDatePickerIndex].desired_start_time = moment(newDate).format('YYYY-MM-DD HH:mm:ss');
            $scope.filteredDraftItems[vm.currentRowDatePickerIndex].isDirty = true;
            vm.showDatePicker = false;
            vm.currentSelectedDate = moment.utc(newDate);
            vm.currentRowDatePickerIndex = -1;
        };

        vm.openDatePicker = function (item, $event, $index) {

            if (vm.currentRowDatePickerIndex !== $index) {
                vm.setSelectedScheduleDraft(item, true);
                var existingVal = item.desired_start_time;
                if (existingVal && existingVal.length > 0) {
                    vm.currentSelectedDate = existingVal;
                }
                var rect = $event.currentTarget.getBoundingClientRect();
                var offset = {x: 0, y: 24};
                var overLayCSS = {
                    left: rect.left + offset.x + 'px',
                    top: rect.top + offset.y + 'px'
                };
                angular.element(document.getElementById('schedulerDatePickerMenu')).css(overLayCSS);
                vm.currentRowDatePickerIndex = $index;
                vm.showDatePicker = true;
            } else {
                //the same row's button was clicked, so close the popup
                vm.closeDatePickerMenu();
            }
            $event.stopPropagation();
        };

        vm.validateInputDate = function (item) {
            var d = moment(item.desired_start_time, 'YYYY-MM-DD HH:mm:ss');
            item.hasValidInput = d.isValid();
            return d.isValid();
        };

        vm.closeDatePickerMenu = function () {
            if (vm.showDatePicker) {
                vm.showDatePicker = false;
                vm.currentRowDatePickerIndex = -1;
            }
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        };

        vm.unbindShortcuts = $rootScope.$on("keydown", function (e, key) {
            if (key === 27) {
                //clear selection when pressing escape
                vm.selectedScheduleDraft = null;
            }

            if (!$scope.$$phase) {
                $scope.$apply();
            }
        });

        $scope.$on('$destroy', function () {
            vm.unbindShortcuts('keydown');
        });
    }

})();
