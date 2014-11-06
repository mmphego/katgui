(function(){

angular.module('katGui.scheduler', ['ui.bootstrap.datetimepicker'])
    .constant('SCHEDULE_BLOCK_TYPES', [
        'MAINTENANCE',
        'OBSERVATION',
        'MANUAL'])
    .controller('SchedulerCtrl', SchedulerCtrl);

    function SchedulerCtrl($scope, SCHEDULE_BLOCK_TYPES) {

        var vm = this;
        vm.types = SCHEDULE_BLOCK_TYPES;
        var lastId = 0;

        vm.selectedItemScript = "";
        vm.selectedDraft = null;

        vm.draftSelections = [];
        vm.scheduleSelections = [];
        vm.scheduleData = [];
        vm.scheduleDraftData = [];

        vm.showDatePicker = false;
        vm.currentSelectedDate = new Date();

        vm.selectedScheduleDraft = null;
        vm.setSelectedScheduleDraft = function (selectedDraft, dontDeselectOnSame) {
            if (vm.selectedScheduleDraft === selectedDraft && !dontDeselectOnSame) {
                vm.selectedScheduleDraft = null;
            } else {
                vm.selectedScheduleDraft = selectedDraft;
            }
        };

        vm.selectedSchedule = null;
        vm.setSelectedSchedule = function (selectedSchedule, dontDeselectOnSame) {
            if (vm.selectedSchedule === selectedSchedule && !dontDeselectOnSame) {
                vm.selectedSchedule = null;
            } else {
                vm.selectedSchedule = selectedSchedule;
            }
        };

        vm.openTypePicker = function (rowIndex, $event) {

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

        vm.openDatePicker = function (rowIndex, $event) {

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

        angular.element('#schedule-draft-data-list-id').bind("scroll", function() {
            closeTypeMenu();
            closeDatePickerMenu();
        });

        angular.element('body').bind("click", function(e) {
            if (!e.target.parentNode.classList.contains('schedule-item-input') &&
                !e.target.parentNode.parentNode.classList.contains('schedule-item-input')) {

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

        vm.removeDraftRow = function (rowIndex) {
            if (vm.selectedScheduleDraft === vm.scheduleDraftData[rowIndex]) {
                if (vm.scheduleDraftData.length > rowIndex + 1) {
                    vm.selectedScheduleDraft = vm.scheduleDraftData[rowIndex + 1];
                } else if (vm.scheduleDraftData.length === rowIndex + 1 && rowIndex > 0) {
                    vm.selectedScheduleDraft = vm.scheduleDraftData[rowIndex - 1];
                }
            }
            vm.scheduleDraftData.splice(rowIndex, 1);
        };

        vm.moveDraftRowToSchedule = function (rowIndex) {

            if (vm.selectedScheduleDraft === vm.scheduleDraftData[rowIndex]) {
                vm.selectedScheduleDraft = null;
            }

            vm.scheduleData = _.union(vm.scheduleData, vm.scheduleDraftData[rowIndex]);
            vm.scheduleDraftData.splice(rowIndex, 1);
        };

        vm.addDraftSchedule = function () {

            var newDraft = {
                id: 'scheduleblock' + lastId,
                desiredTime: '',
                state: 'DRAFT',
                owner: 'userName',
                type: 'MANUAL',
                //description: 'Click here to change the description',
                script: 'some script content ' + lastId
            };
            lastId++;
            vm.scheduleDraftData.push(newDraft);
        };

        vm.moveDraftsToSchedule = function () {

            vm.scheduleData = _.union(vm.scheduleData, vm.draftSelections);
            vm.scheduleDraftData = _.reject(vm.scheduleDraftData, function (el) {
                return _.indexOf(vm.draftSelections, el) !== -1;
            });

            vm.draftSelections.length = 0;
        };

        vm.moveSchedulesToDraft = function () {

            vm.scheduleDraftData = _.union(vm.scheduleDraftData, vm.scheduleSelections);
            vm.scheduleData = _.reject(vm.scheduleData, function (el) {
                return _.indexOf(vm.scheduleSelections, el) !== -1;
            });

            vm.scheduleSelections.length = 0;
        };

        function closeTypeMenu () {
            if (vm.showTypePicker) {
                vm.showTypePicker = false;
                vm.currentRowTypePickerIndex = -1;
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            }
        }

        function closeDatePickerMenu () {
            if (vm.showDatePicker) {
                vm.showDatePicker = false;
                vm.currentRowDatePickerIndex = -1;
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            }
        }

    }
})();
