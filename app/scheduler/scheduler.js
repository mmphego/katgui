(function(){

angular.module('katGui.scheduler', ['ui.bootstrap.datetimepicker', 'katGui.services', 'ngAnimate'])
    .constant('SCHEDULE_BLOCK_TYPES', [
        'MAINTENANCE',
        'OBSERVATION',
        'MANUAL'])
    .controller('SchedulerCtrl', SchedulerCtrl);

    function SchedulerCtrl($scope, $timeout, SCHEDULE_BLOCK_TYPES, ObservationScheduleService, $mdDialog) {

        ObservationScheduleService.connectListener();

        $scope.$on('$destroy', ObservationScheduleService.disconnectListener);

        var vm = this;
        vm.types = SCHEDULE_BLOCK_TYPES;
        vm.draftListProcessingServerCall = false;
        vm.scheduleListProcessingServerCall = false;

        vm.selectedItemScript = "";
        vm.selectedSchedule = null;
        vm.selectedScheduleDraft = null;

        vm.scheduleCompletedData = ObservationScheduleService.scheduleCompletedData;
        vm.scheduleDraftData = ObservationScheduleService.scheduleDraftData;
        vm.scheduleData = ObservationScheduleService.scheduleData;
        vm.resourcePool = ObservationScheduleService.resourcePool;

        vm.draftsOrderByFields = [
            {label: 'ID', value: 'id_code'},
            {label: 'Description', value: 'description'},
            {label: 'Date', value: 'desired_start_time'},
            {label: 'State', value: 'state'},
            {label: 'Type', value: 'type'}
        ];

        vm.completedOrderByFields = [
            {label: 'ID', value: 'id_code'},
            {label: 'Description', value: 'description'},
            {label: 'Date', value: 'desired_start_time'},
            {label: 'State', value: 'state'},
            {label: 'Type', value: 'type'}
        ];

        vm.setDraftsOrderBy = function (column, reverse) {
            var newOrderBy = _.findWhere(vm.draftsOrderByFields, {value: column});
            if (newOrderBy.reverse === undefined) {
                newOrderBy.reverse = reverse || false;
            } else {
                newOrderBy.reverse = !newOrderBy.reverse;
            }
            vm.draftsOrderBy = newOrderBy;
        };

        vm.setCompletedOrderBy = function (column, reverse) {
            var newOrderBy = _.findWhere(vm.completedOrderByFields, {value: column});
            if (newOrderBy.reverse === undefined) {
                newOrderBy.reverse = reverse || false;
            } else {
                newOrderBy.reverse = !newOrderBy.reverse;
            }
            vm.completedOrderBy = newOrderBy;
        };

        vm.setDraftsOrderBy('id_code', true);
        vm.setCompletedOrderBy('id_code', true);

        vm.showDatePicker = false;
        vm.currentSelectedDate = moment();

        vm.setSelectedScheduleDraft = function (selectedDraft, dontDeselectOnSame) {
            vm.selectedSchedule = null;
            if (vm.selectedScheduleDraft === selectedDraft && !dontDeselectOnSame) {
                vm.selectedScheduleDraft = null;
            } else {
                vm.selectedScheduleDraft = selectedDraft;
            }
        };

        vm.setSelectedSchedule = function (selectedSchedule, dontDeselectOnSame) {
            vm.selectedScheduleDraft = null;
            if (vm.selectedSchedule === selectedSchedule && !dontDeselectOnSame) {
                vm.selectedSchedule = null;
            } else {
                vm.selectedSchedule = selectedSchedule;
            }
        };

        vm.openTypePicker = function (item, $event) {

            var rowIndex = vm.scheduleDraftData.indexOf(item);

            if (vm.currentRowTypePickerIndex !== rowIndex) {
                vm.setSelectedScheduleDraft(vm.scheduleDraftData[rowIndex], true);
                closeDatePickerMenu();
                var rect = $event.currentTarget.getBoundingClientRect();
                var offset = { x: 0, y: 30 };
                var overLayCSS = {
                    left: rect.left + offset.x + 'px',
                    top: rect.top + offset.y + 'px'
                };
                angular.element(document.getElementById('schedulerTypePickerMenu')).css(overLayCSS);
                vm.currentRowTypePickerIndex = vm.scheduleDraftData.indexOf(vm.scheduleDraftData[rowIndex]);
                vm.showTypePicker = true;
            } else {
                //the same row's button was clicked, so close the popup
                closeTypeMenu();
            }

            $event.stopPropagation();
        };

        //schedulerEditMenu
        vm.openSchedulerEditMenu = function (item, $event) {

            var rowIndex = vm.scheduleDraftData.indexOf(item);

            if (vm.currentEditMenuIndex !== rowIndex) {
                vm.setSelectedScheduleDraft(vm.scheduleDraftData[rowIndex], true);
                closeDatePickerMenu();
                var rect = $event.currentTarget.getBoundingClientRect();
                var offset = { x: 0, y: 44 };
                var overLayCSS = {
                    left: rect.left + offset.x + 'px',
                    top: rect.top + offset.y + 'px'
                };
                angular.element(document.getElementById('schedulerEditMenu')).css(overLayCSS);
                vm.currentEditMenuIndex = vm.scheduleDraftData.indexOf(vm.scheduleDraftData[rowIndex]);
                vm.showEditMenu = true;
            } else {
                //the same row's button was clicked, so close the popup
                closeEditMenu();
            }

            $event.stopPropagation();
        };

        vm.openDatePicker = function (item, $event) {

            var rowIndex = vm.scheduleDraftData.indexOf(item);

            //TODO keyboard shortcut like escape to close datepicker
            if (vm.currentRowDatePickerIndex !== rowIndex) {
                vm.setSelectedScheduleDraft(vm.scheduleDraftData[rowIndex], true);
                closeTypeMenu();
                var existingVal = vm.scheduleDraftData[rowIndex].desiredTime;
                if (existingVal && existingVal.length > 0) {
                    vm.currentSelectedDate = existingVal;
                }
                var rect = $event.currentTarget.getBoundingClientRect();
                var offset = { x: 0, y: 30 };
                var overLayCSS = {
                    left: rect.left + offset.x + 'px',
                    top: rect.top + offset.y + 'px'
                };
                angular.element(document.getElementById('schedulerDatePickerMenu')).css(overLayCSS);
                vm.currentRowDatePickerIndex = vm.scheduleDraftData.indexOf(vm.scheduleDraftData[rowIndex]);
                vm.showDatePicker = true;
            } else {
                //the same row's button was clicked, so close the popup
                closeDatePickerMenu();
            }

            $event.stopPropagation();
        };

        vm.executeSchedule = function (item) {

            vm.scheduleListProcessingServerCall = true;
            ObservationScheduleService.executeSchedule(1, item.id_code)
                .then(scheduleListProcessingComplete, scheduleListProcessingError);
        };

        vm.stopExecuteSchedule = function (item) {

            vm.scheduleListProcessingServerCall = true;
            ObservationScheduleService.stopExecuteSchedule(1, item.id_code)
                .then(scheduleListProcessingComplete, scheduleListProcessingError);
        };

        vm.moveScheduleRowToFinished = function (item) {

            vm.selectedSchedule = null;
            vm.scheduleListProcessingServerCall = true;
            ObservationScheduleService.scheduleToComplete(1, item.id_code)
                .then(scheduleListProcessingComplete, scheduleListProcessingError);
        };

        vm.moveScheduleRowToDraft = function(item) {

            vm.selectedSchedule = null;
            vm.scheduleListProcessingServerCall = true;
            ObservationScheduleService.scheduleToDraft(1, item.id_code)
                .then(scheduleListProcessingComplete, scheduleListProcessingError);
        };

        angular.element('#schedule-draft-data-list-id').bind("scroll", function() {
            closeTypeMenu();
            closeDatePickerMenu();
        });

        angular.element('body').bind("click", function(e) {
            if (!e.target.parentNode.classList.contains('schedule-item-input')) {// &&
                //!e.target.parentNode.parentNode.classList.contains('schedule-item-input')) {

                closeTypeMenu();
                closeDatePickerMenu();
            }
        });

        vm.onTimeSet = function (newDate, oldDate) {

            vm.scheduleDraftData[vm.currentRowDatePickerIndex].desired_start_time = moment(newDate).format('YYYY/MM/DD HH:mm:ss');
            vm.scheduleDraftData[vm.currentRowDatePickerIndex].isDirty = true;
            vm.showDatePicker = false;
            vm.currentSelectedDate = moment();
            vm.currentRowDatePickerIndex = -1;
        };

        vm.setScheduleDraftType = function (type) {
            if (vm.currentRowTypePickerIndex > -1) {
                vm.scheduleDraftData[vm.currentRowTypePickerIndex].type = type;
                vm.scheduleDraftData[vm.currentRowTypePickerIndex].isDirty = true;
            }
        };

        vm.saveDraft = function (item) {
            vm.draftListProcessingServerCall = true;
            ObservationScheduleService.updateScheduleDraft(item)
                .then(draftListProcessingComplete, draftListProcessingError);
        };

        vm.validateDraft = function (item) {

            //TODO replace 1 param with subarray number
            vm.draftListProcessingServerCall = true;
            ObservationScheduleService.verifyScheduleBlock(1, item.id_code)
                .then(draftListProcessingComplete, draftListProcessingError);
        };

        vm.removeSelectedDraftRow = function () {
            if (vm.selectedScheduleDraft) {
                vm.removeDraftRow(vm.selectedScheduleDraft);
                vm.showEditMenu = false;
            }
        };

        vm.removeDraftRow = function (item) {

            vm.draftListProcessingServerCall = true;
            ObservationScheduleService.deleteScheduleDraft(item.id_code)
                .then(draftListProcessingComplete, draftListProcessingError);

            vm.selectedScheduleDraft = null;
        };


        vm.addDraftSchedule = function () {
            vm.draftListProcessingServerCall = true;
            ObservationScheduleService.createScheduleBlock()
                .then(draftListProcessingComplete, draftListProcessingError)
                .then(scrollDraftToBottomAndSelect);
        };

        function scrollDraftToBottomAndSelect() {

            $timeout(function () {
                var el = angular.element("#schedule-draft-data-list-id")[0];
                el.scrollTop = el.scrollTop + 49;
            }, 200);
        }

        vm.refreshScheduleBlocks = function () {
            vm.selectedScheduleDraft = null;
            vm.selectedSchedule = null;
            vm.draftListProcessingServerCall = true;
            vm.scheduleListProcessingServerCall = true;
            vm.completedListProcessingServerCall = true;
            ObservationScheduleService.getScheduleBlocks()
                .then(draftListProcessingComplete, draftListProcessingError)
                .then(scheduleListProcessingComplete, scheduleListProcessingError)
                .then(completedListProcessingComplete, completedListProcessingError);

            ObservationScheduleService.listResources(1);
        };

        vm.validateInputDate = function (item) {
            var d = moment(item.desired_start_time, 'YYYY/MM/DD HH:mm:ss');
            item.hasValidInput = d.isValid();
            return d.isValid();
        };

        vm.scheduleSelectedDraft = function () {
            if (vm.selectedScheduleDraft) {
                vm.scheduleDraft(vm.selectedScheduleDraft);
                vm.showEditMenu = false;
            }
        };

        vm.scheduleDraft = function (item) {
            vm.selectedScheduleDraft = null;
            vm.draftListProcessingServerCall = true;
            ObservationScheduleService.scheduleDraft(1, item.id_code)
                .then(draftListProcessingComplete, draftListProcessingError);
        };

        vm.confirmDelete = function (item) {

            if (item.confirmDelete) {
                vm.removeDraftRow(item);
            } else {
                item.confirmDelete = true;
            }
        };

        vm.cloneSchedule = function (item) {

            vm.completedListProcessingServerCall = true;
            ObservationScheduleService.cloneSchedule(item.id_code)
                .then(completedListProcessingComplete, completedListProcessingError);
        };


        function closeTypeMenu () {
            if (vm.showTypePicker) {
                vm.showTypePicker = false;
                vm.currentRowTypePickerIndex = -1;
            }

            if (!$scope.$$phase) {
                $scope.$digest();
            }
        }

        function closeEditMenu() {
            if (vm.showEditMenu) {
                vm.showEditMenu = false;
                vm.currentEditMenuIndex = -1;
            }

            if (!$scope.$$phase) {
                $scope.$digest();
            }
        }

        function closeDatePickerMenu () {
            if (vm.showDatePicker) {
                vm.showDatePicker = false;
                vm.currentRowDatePickerIndex = -1;
            }
            if (!$scope.$$phase) {
                $scope.$digest();
            }
        }

        function draftListProcessingComplete(result) {
            $timeout(function () {
                vm.draftListProcessingServerCall = false;
            }, 300);
        }

        function draftListProcessingError(result) {
            $timeout(function () {
                vm.draftListProcessingServerCall = false;

                var alert = $mdDialog.alert()
                    .title('Server Request Failed!')
                    .content(result)
                    .ok('Close');
                $mdDialog
                    .show(alert)
                    .finally(function() {
                        alert = undefined;
                    });
            }, 300);
        }

        function scheduleListProcessingComplete(result) {
            $timeout(function () {
                vm.scheduleListProcessingServerCall = false;
            }, 300);
        }

        function scheduleListProcessingError(result) {
            $timeout(function () {
                vm.scheduleListProcessingServerCall = false;

                var alert = $mdDialog.alert()
                    .title('Server Request Failed!')
                    .content(result)
                    .ok('Close');
                $mdDialog
                    .show(alert)
                    .finally(function() {
                        alert = undefined;
                    });
            }, 300);
        }

        function completedListProcessingComplete(result) {
            $timeout(function () {
                vm.completedListProcessingServerCall = false;
            }, 300);
        }

        function completedListProcessingError(result) {
            $timeout(function () {
                vm.completedListProcessingServerCall = false;

                var alert = $mdDialog.alert()
                    .title('Server Request Failed!')
                    .content(result)
                    .ok('Close');
                $mdDialog
                    .show(alert)
                    .finally(function() {
                        alert = undefined;
                    });
            }, 300);
        }

        $timeout(vm.refreshScheduleBlocks, 100);

        $scope.$on('$destroy', function () {
            ObservationScheduleService.disconnectListener();
        });

    }
})();
