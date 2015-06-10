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

        vm.limitTo = 5;
        $scope.loadMore = function() {
            vm.limitTo += 10;
        };

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
            ObservationScheduleService.updateScheduleDraft(item)
                .then(function(result) {
                    item.editing = false;
                    $rootScope.displayPromiseResult(result);
                });
        };

        vm.saveAllDirtyDrafts = function () {
            vm.scheduleDraftData.forEach(function (item) {
                item.editing = false;
                if (item.isDirty) {
                    ObservationScheduleService.updateScheduleDraft(item);
                }
            });
        };

        vm.verifyDraft = function (item) {
            ObservationScheduleService.verifyScheduleBlock(item.sub_nr, item.id_code)
                .then($rootScope.displayPromiseResult);
        };

        vm.removeDraft = function (item) {
            ObservationScheduleService.deleteScheduleDraft(item.id_code)
                .then($rootScope.displayPromiseResult);
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

        vm.viewSBTasklog = function (item) {
            ObservationScheduleService.viewTaskLogForSBIdCode(item.id_code);
        };

        vm.onTimeSet = function (newDate) {
            $scope.filteredDraftItems[vm.currentRowDatePickerIndex].desired_start_time = moment(newDate).format('YYYY-MM-DD HH:mm:ss');
            $scope.filteredDraftItems[vm.currentRowDatePickerIndex].isDirty = true;
            vm.showDatePicker = false;
            vm.currentSelectedDate = moment.utc(newDate);
            vm.currentRowDatePickerIndex = -1;
        };

        vm.openDatePicker = function (item, $event) {
            var rowIndex = $scope.filteredDraftItems.indexOf(item);
            //TODO keyboard shortcut like escape to close datepicker
            if (vm.currentRowDatePickerIndex !== rowIndex) {
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

        vm.closeDatePickerMenu = function () {
            if (vm.showDatePicker) {
                vm.showDatePicker = false;
                vm.currentRowDatePickerIndex = -1;
            }
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        };

        $timeout(vm.refreshScheduleBlocks, 100);
    }

})();
