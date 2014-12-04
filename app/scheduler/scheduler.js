(function(){

angular.module('katGui.scheduler', ['ui.bootstrap.datetimepicker', 'katGui.services'])
    .constant('SCHEDULE_BLOCK_TYPES', [
        'MAINTENANCE',
        'OBSERVATION',
        'MANUAL'])
    .controller('SchedulerCtrl', SchedulerCtrl);

    function SchedulerCtrl($scope, $timeout, SCHEDULE_BLOCK_TYPES, ObservationScheduleService) {

        ObservationScheduleService.connectListener();

        $scope.$on('$destroy', ObservationScheduleService.disconnectListener);

        var vm = this;
        vm.types = SCHEDULE_BLOCK_TYPES;
        vm.draftListProcessingServerCall = false;

        vm.selectedItemScript = "";
        vm.selectedDraft = null;

        vm.draftSelections = [];
        vm.scheduleSelections = [];
        vm.scheduleData = [];
        vm.scheduleCompletedData = [];
        vm.scheduleDraftData = ObservationScheduleService.scheduleDraftData;
        vm.draftsOrderByFields = [
            {label: 'ID', value: 'id'},
            {label: 'Description', value: 'description'},
            {label: 'Date', value: 'desiredTime'},
            {label: 'Owner', value: 'owner'},
            {label: 'State', value: 'state'},
            {label: 'Type', value: 'type'}
        ];

        vm.showDatePicker = false;
        vm.currentSelectedDate = new Date();

        vm.selectedScheduleDraft = null;
        vm.setSelectedScheduleDraft = function (selectedDraft, dontDeselectOnSame) {
            vm.selectedSchedule = null;
            if (vm.selectedScheduleDraft === selectedDraft && !dontDeselectOnSame) {
                vm.selectedScheduleDraft = null;
            } else {
                vm.selectedScheduleDraft = selectedDraft;
            }
        };

        vm.selectedSchedule = null;
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

        vm.openDatePicker = function (item, $event) {

            var rowIndex = vm.scheduleDraftData.indexOf(item);

            //TODO keyboard shortcut like escape to close datepicker
            if (vm.currentRowDatePickerIndex !== rowIndex) {
                vm.setSelectedScheduleDraft(vm.scheduleDraftData[rowIndex], true);
                closeTypeMenu();
                var existingVal = vm.scheduleDraftData[rowIndex].desiredTime;
                if (existingVal.length > 0) {
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

        vm.executeSchedule = function (item, $event) {

            var rowIndex = vm.scheduleData.indexOf(item);

            vm.setSelectedSchedule(vm.scheduleData[rowIndex], true);
            for (var i = 0; i < vm.scheduleData.length; i++) {
                if (vm.selectedSchedule !== vm.scheduleData[i]) {
                    vm.scheduleData[i].executing = false;
                }
            }
            vm.selectedSchedule.executing = true;
            $event.stopPropagation();
        };

        vm.moveScheduleRowToFinished = function (item, $event) {

            var rowIndex = vm.scheduleData.indexOf(item);

            if (vm.selectedSchedule === vm.scheduleData[rowIndex]) {
                vm.selectedSchedule = null;
            }
            $event.stopPropagation();

            vm.scheduleCompletedData = _.union(vm.scheduleCompletedData, vm.scheduleData[rowIndex]);
            vm.scheduleData.splice(rowIndex, 1);
        };

        vm.moveScheduleRowToDraft = function(item, $event) {
            var rowIndex = vm.scheduleData.indexOf(item);

            if (vm.selectedSchedule === vm.scheduleData[rowIndex]) {
                vm.selectedSchedule = null;
            }
            $event.stopPropagation();

            vm.scheduleDraftData = _.union(vm.scheduleDraftData, vm.scheduleData[rowIndex]);
            vm.scheduleData.splice(rowIndex, 1);
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

            vm.scheduleDraftData[vm.currentRowDatePickerIndex].desiredTime = moment(newDate).format('DD/MM/YYYY HH:mm');
            vm.showDatePicker = false;
            vm.currentSelectedDate = new Date();
            vm.currentRowDatePickerIndex = -1;
        };

        vm.setScheduleDraftType = function (type) {
            vm.scheduleDraftData[vm.scheduleDraftData.indexOf(vm.selectedScheduleDraft)].type = type;
        };

        vm.removeDraftRow = function (item) {

            vm.draftListProcessingServerCall = true;
            ObservationScheduleService.deleteScheduleDraft(item.id_code)
                .then(draftListProcessingComplete, draftListProcessingError);;

            //var rowIndex = vm.scheduleDraftData.indexOf(item);

            //if (vm.selectedScheduleDraft === vm.scheduleDraftData[rowIndex]) {
            //    if (vm.scheduleDraftData.length > rowIndex + 1) {
            //        vm.selectedScheduleDraft = vm.scheduleDraftData[rowIndex + 1];
            //    } else if (vm.scheduleDraftData.length === rowIndex + 1 && rowIndex > 0) {
            //        vm.selectedScheduleDraft = vm.scheduleDraftData[rowIndex - 1];
            //    }
            //}
            //vm.scheduleDraftData.splice(rowIndex, 1);
        };

        vm.moveDraftRowToSchedule = function (item) {
            var rowIndex = vm.scheduleDraftData.indexOf(item);

            if (vm.selectedScheduleDraft === vm.scheduleDraftData[rowIndex]) {
                vm.selectedScheduleDraft = null;
            }

            vm.scheduleData = _.union(vm.scheduleData, vm.scheduleDraftData[rowIndex]);
            vm.scheduleDraftData.splice(rowIndex, 1);
        };

        vm.addDraftSchedule = function () {
            vm.draftListProcessingServerCall = true;
            ObservationScheduleService.createScheduleBlock()
                .then(draftListProcessingComplete, draftListProcessingError);
        };

        vm.refreshScheduleBlocks = function () {
            vm.draftListProcessingServerCall = true;
            ObservationScheduleService.getScheduleBlocks()
                .then(draftListProcessingComplete, draftListProcessingError);
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
            console.log('Promise returning for: ');
            console.log(result);
        }

        function draftListProcessingError(result) {
            $timeout(function () {
                vm.draftListProcessingServerCall = false;
            }, 300);
            console.error('Promise returning an error for: ');
            console.error(result);
        }

        $timeout(vm.refreshScheduleBlocks, 500);

    }
})();
