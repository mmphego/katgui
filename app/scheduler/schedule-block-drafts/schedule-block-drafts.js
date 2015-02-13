(function(){

    angular.module('katGui.scheduler')
        .controller('SbDraftsCtrl', SbDraftsCtrl);

    function SbDraftsCtrl($scope, ObservationScheduleService, $timeout, $mdDialog, SCHEDULE_BLOCK_TYPES, $document, $rootScope) {

        var vm = this;
        //vm.draftListProcessingServerCall = false;
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

        vm.setDraftsOrderBy = function (column, reverse) {
            var newOrderBy = _.findWhere(vm.draftsOrderByFields, {value: column});
            if (newOrderBy.reverse === undefined) {
                newOrderBy.reverse = reverse || false;
            } else {
                newOrderBy.reverse = !newOrderBy.reverse;
            }
            vm.draftsOrderBy = newOrderBy;
        };

        vm.setDraftsOrderBy('id_code', true);

        var unbindShortcuts = $document.bind("keydown", function (e) {

            if (e.keyCode === 40) {
                //down arrow
                var index = $scope.filteredDraftItems.indexOf(vm.selectedScheduleDraft);
                if (index > -1 && index + 1 < $scope.filteredDraftItems.length) {
                    //filteredDraftItems
                    vm.setSelectedScheduleDraft($scope.filteredDraftItems[index + 1]);
                } else if ($scope.filteredDraftItems.length > 0) {
                    vm.setSelectedScheduleDraft($scope.filteredDraftItems[0]);
                }

            } else if (e.keyCode === 38) {
                //up arrow
                var indexUp = $scope.filteredDraftItems.indexOf(vm.selectedScheduleDraft);
                if (indexUp > -1 && indexUp - 1 > -1) {
                    //filteredDraftItems
                    vm.setSelectedScheduleDraft($scope.filteredDraftItems[indexUp - 1]);
                } else if ($scope.filteredDraftItems.length > 0) {
                    vm.setSelectedScheduleDraft($scope.filteredDraftItems[$scope.filteredDraftItems.length - 1]);
                }
            } else if (e.keyCode === 27) {
                //escape
                vm.selectedScheduleDraft = null;
                closeTypeMenu();
                closeDatePickerMenu();
                closeEditMenu();
            }

            if (!$scope.$$phase) {
                $scope.$digest();
            }
        });

        var unbindScroll = angular.element('#schedule-draft-data-list-id').bind("scroll", function () {
            closeTypeMenu();
            closeDatePickerMenu();
            closeEditMenu();
        });

        var unbindClick = angular.element('body').bind("click", function (e) {
            if (!e.target.parentNode.classList.contains('schedule-item-input')) {// &&
                //!e.target.parentNode.parentNode.classList.contains('schedule-item-input')) {
                closeEditMenu();
                closeTypeMenu();
                closeDatePickerMenu();
            }
        });

        vm.saveDraft = function (item) {
            //vm.draftListProcessingServerCall = true;
            ObservationScheduleService.updateScheduleDraft(item)
                .then(draftListProcessingComplete, draftListProcessingError);
        };

        vm.saveAllDirtyDrafts = function () {
            //vm.draftListProcessingServerCall = true;
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

            //vm.draftListProcessingServerCall = true;
            ObservationScheduleService.verifyScheduleBlock(item.sub_nr, item.id_code)
                .then(displayPromiseResult);

            vm.selectedScheduleDraft = null;
        };

        vm.removeSelectedDraftRow = function () {
            if (vm.selectedScheduleDraft) {
                vm.removeDraftRow(vm.selectedScheduleDraft);
                vm.showEditMenu = false;
            }
        };

        vm.removeDraftRow = function (item) {

            //vm.draftListProcessingServerCall = true;
            ObservationScheduleService.deleteScheduleDraft(item.id_code)
                .then(draftListProcessingComplete, draftListProcessingError);

            vm.selectedScheduleDraft = null;
        };

        vm.addDraftSchedule = function () {
            //vm.draftListProcessingServerCall = true;
            ObservationScheduleService.createScheduleBlock()
                .then(draftListProcessingComplete, draftListProcessingError);
        };

        vm.refreshScheduleBlocks = function () {
            //vm.draftListProcessingServerCall = true;
            ObservationScheduleService.getScheduleBlocks()
                .then(draftListProcessingComplete, draftListProcessingError);
        };

        vm.setSelectedScheduleDraft = function (selectedDraft, dontDeselectOnSame) {
            if (vm.selectedScheduleDraft === selectedDraft && !dontDeselectOnSame) {
                vm.selectedScheduleDraft = null;
            } else {
                vm.selectedScheduleDraft = selectedDraft;
            }
        };

        vm.setScheduleDraftType = function (type) {
            if (vm.currentRowTypePickerIndex > -1) {
                vm.scheduleDraftData[vm.currentRowTypePickerIndex].type = type;
                vm.scheduleDraftData[vm.currentRowTypePickerIndex].isDirty = true;
            }
        };

        vm.onTimeSet = function (newDate, oldDate) {

            vm.scheduleDraftData[vm.currentRowDatePickerIndex].desired_start_time = moment(newDate).format('YYYY-MM-DD HH:mm:ss');
            vm.scheduleDraftData[vm.currentRowDatePickerIndex].isDirty = true;
            vm.showDatePicker = false;
            vm.currentSelectedDate = moment();
            vm.currentRowDatePickerIndex = -1;
        };

        vm.openTypePicker = function (item, $event) {

            var rowIndex = vm.scheduleDraftData.indexOf(item);

            if (vm.currentRowTypePickerIndex !== rowIndex) {
                vm.setSelectedScheduleDraft(vm.scheduleDraftData[rowIndex], true);
                closeDatePickerMenu();
                var rect = $event.currentTarget.getBoundingClientRect();
                var offset = {x: 0, y: 30};
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
                var offset = {x: 0, y: 30};
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

        vm.validateInputDate = function (item) {
            var d = moment(item.desired_start_time, 'YYYY-MM-DD HH:mm:ss');
            item.hasValidInput = d.isValid();
            return d.isValid();
        };

        function showSimpleErrorDialog(title, message) {
            var alert = $mdDialog.alert()
                .title(title)
                .content(message)
                .ok('Close');
            $mdDialog
                .show(alert)
                .finally(function () {
                    alert = undefined;
                });
        }

        function displayPromiseResult(result) {
            if (result.result === 'ok') {
                $rootScope.showSimpleToast(result.message);
            } else {
                showSimpleErrorDialog(result.result, result.message);
            }
        }

        function closeTypeMenu() {
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

        function closeDatePickerMenu() {
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
                //vm.draftListProcessingServerCall = false;
            }, 100);
        }

        function draftListProcessingError(result) {
            $timeout(function () {
                //vm.draftListProcessingServerCall = false;

                var alert = $mdDialog.alert()
                    .title('Server Request Failed!')
                    .content(result)
                    .ok('Close');
                $mdDialog
                    .show(alert)
                    .finally(function () {
                        alert = undefined;
                    });
            }, 100);
        }

        $timeout(vm.refreshScheduleBlocks, 100);
        $scope.$on('$destroy', function () {
            unbindScroll.unbind('scroll');
            unbindClick.unbind('click');
            unbindShortcuts.unbind('keydown');
        });
    }

})();
