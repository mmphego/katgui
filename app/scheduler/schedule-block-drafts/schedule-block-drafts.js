(function () {

    angular.module('katGui.scheduler')
        .controller('SbDraftsCtrl', SbDraftsCtrl);

    function SbDraftsCtrl($scope, ObservationScheduleService, $timeout, SCHEDULE_BLOCK_TYPES, $rootScope) {

        var vm = this;
        vm.selectedScheduleDraft = null;
        vm.types = SCHEDULE_BLOCK_TYPES;
        vm.scheduleDraftData = ObservationScheduleService.scheduleDraftData;
        vm.draftsOrderByFields = [
            {label: 'ID', value: 'id_code'},
            {label: 'Description', value: 'description'},
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

        vm.keydown = function (e, key) {
            if (key === 40) {
                //down arrow
                var index = $scope.filteredDraftItems.indexOf(vm.selectedScheduleDraft);
                if (index > -1 && index + 1 < $scope.filteredDraftItems.length) {
                    vm.setSelectedScheduleDraft($scope.filteredDraftItems[index + 1], true);
                } else if ($scope.filteredDraftItems.length > 0) {
                    vm.setSelectedScheduleDraft($scope.filteredDraftItems[0], true);
                }
            } else if (key === 38) {
                //up arrow
                var indexUp = $scope.filteredDraftItems.indexOf(vm.selectedScheduleDraft);
                if (indexUp > -1 && indexUp - 1 > -1) {
                    vm.setSelectedScheduleDraft($scope.filteredDraftItems[indexUp - 1], true);
                } else if ($scope.filteredDraftItems.length > 0) {
                    vm.setSelectedScheduleDraft($scope.filteredDraftItems[$scope.filteredDraftItems.length - 1], true);
                }
            } else if (key === 27) {
                //escape
                vm.setSelectedScheduleDraft(null);
                vm.closeDatePickerMenu();
                vm.closeEditMenu();
            }
            $scope.$apply();
        };
        vm.unbindShortcuts = $rootScope.$on("keydown", vm.keydown);

        /* istanbul ignore next */
        //we can ignore these because the menu's are going to be replaced in angular material 0.10
        vm.unbindScroll = angular.element('#schedule-draft-data-list-id').bind("scroll", function () {
            vm.closeDatePickerMenu();
            vm.closeEditMenu();
        });

        /* istanbul ignore next */
        //we can ignore these because the menu's are going to be replaced in angular material 0.10
        vm.unbindClick = angular.element('body').bind("click", function (e) {
            if (!e.target.parentNode.classList.contains('schedule-item-input')) {
                vm.closeEditMenu();
                vm.closeDatePickerMenu();
            }
        });

        vm.saveDraft = function (item) {
            ObservationScheduleService.updateScheduleDraft(item);
        };

        vm.saveAllDirtyDrafts = function () {
            vm.scheduleDraftData.forEach(function (item) {
                if (item.isDirty) {
                    ObservationScheduleService.updateScheduleDraft(item);
                }
            });
        };

        vm.verifySelectedDraftRow = function () {
            if (vm.selectedScheduleDraft) {
                vm.verifyDraftRow(vm.selectedScheduleDraft);
                vm.showEditMenu = false;
            }
        };

        vm.verifyDraftRow = function (item) {
            ObservationScheduleService.verifyScheduleBlock(item.sub_nr, item.id_code)
                .then($rootScope.displayPromiseResult);
            vm.selectedScheduleDraft = null;
        };

        vm.removeSelectedDraftRow = function () {
            if (vm.selectedScheduleDraft) {
                vm.removeDraftRow(vm.selectedScheduleDraft);
                vm.showEditMenu = false;
            }
        };

        vm.removeDraftRow = function (item) {
            ObservationScheduleService.deleteScheduleDraft(item.id_code);
            vm.selectedScheduleDraft = null;
        };

        vm.refreshScheduleBlocks = function () {
            ObservationScheduleService.getScheduleBlocks();
        };

        vm.setSelectedScheduleDraft = function (selectedDraft, dontDeselectOnSame) {
            if (vm.selectedScheduleDraft === selectedDraft && !dontDeselectOnSame) {
                vm.selectedScheduleDraft = null;
            } else {
                vm.selectedScheduleDraft = selectedDraft;
            }
        };

        vm.viewSBTasklog = function () {
            ObservationScheduleService.viewTaskLogForSBIdCode(vm.selectedScheduleDraft.id_code);
            vm.closeEditMenu();
        };

        vm.onTimeSet = function (newDate) {
            $scope.filteredDraftItems[vm.currentRowDatePickerIndex].desired_start_time = moment(newDate).format('YYYY-MM-DD HH:mm:ss');
            $scope.filteredDraftItems[vm.currentRowDatePickerIndex].isDirty = true;
            vm.showDatePicker = false;
            vm.currentSelectedDate = moment();
            vm.currentRowDatePickerIndex = -1;
        };

        //ignore this because we are going to replace this menu in angular material 0.10
        /* istanbul ignore next */
        vm.openSchedulerEditMenu = function (item, $event) {
            var rowIndex = vm.scheduleDraftData.indexOf(item);
            if (vm.currentEditMenuIndex !== rowIndex) {
                vm.setSelectedScheduleDraft(vm.scheduleDraftData[rowIndex], true);
                vm.closeDatePickerMenu();
                var rect = $event.currentTarget.getBoundingClientRect();
                var offset = {x: 0, y: 44};
                var overLayCSS = {
                    left: rect.left + offset.x + 'px',
                    top: rect.top + offset.y + 'px'
                };
                angular.element(document.getElementById('schedulerEditMenu')).css(overLayCSS);
                vm.currentEditMenuIndex = vm.scheduleDraftData.indexOf(vm.scheduleDraftData[rowIndex]);
                vm.showEditMenu = true;
            } else {
                //the same row's button was clicked, so close the popup
                vm.closeEditMenu();
            }
            $event.stopPropagation();
        };

        //ignore this because we are going to replace this datepicker in angular material 0.10
        /* istanbul ignore next */
        vm.openDatePicker = function (item, $event) {
            var rowIndex = $scope.filteredDraftItems.indexOf(item);
            //TODO keyboard shortcut like escape to close datepicker
            if (vm.currentRowDatePickerIndex !== rowIndex) {
                vm.setSelectedScheduleDraft(vm.scheduleDraftData[rowIndex], true);
                var existingVal = vm.scheduleDraftData[rowIndex].desiredTime;
                if (existingVal && existingVal.length > 0) {
                    vm.currentSelectedDate = existingVal;
                }
                var rect = $event.currentTarget.getBoundingClientRect();
                var offset = {x: 0, y: 30};
                var overLayCSS = {
                    left: rect.left + offset.x + 'px',
                    top: rect.top + offset.y + 'px'
                };
                angular.element(document.getElementById('schedulerDatePickerMenu')).css(overLayCSS);
                vm.currentRowDatePickerIndex = $scope.filteredDraftItems.indexOf(vm.scheduleDraftData[rowIndex]);
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

        //ignore this because we are going to replace this menu in angular material 0.10
        /* istanbul ignore next */
        vm.closeEditMenu = function () {
            if (vm.showEditMenu) {
                vm.showEditMenu = false;
                vm.currentEditMenuIndex = -1;
            }
            $scope.$apply();
        };

        //ignore this because we are going to replace this datepicker in angular material 0.10
        /* istanbul ignore next */
        vm.closeDatePickerMenu = function () {
            if (vm.showDatePicker) {
                vm.showDatePicker = false;
                vm.currentRowDatePickerIndex = -1;
            }
            $scope.$apply();
        };

        $timeout(vm.refreshScheduleBlocks, 100);
        $scope.$on('$destroy', function () {
            vm.unbindScroll.unbind('scroll');
            vm.unbindClick.unbind('click');
            vm.unbindShortcuts('keydown');
        });
    }

})();
