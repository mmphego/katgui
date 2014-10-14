angular.module('katGui.scheduler', ['ui.bootstrap.datetimepicker'])

    .constant('SCHEDULE_BLOCK_TYPES', [
        'MAINTENANCE',
        'OBSERVATION',
        'MANUAL'])

    .controller('SchedulerCtrl', function ($scope, SCHEDULE_BLOCK_TYPES) {

        $scope.types = SCHEDULE_BLOCK_TYPES;

        var lastId = 0;

        $scope.idSelectedScheduleDraft = null;
        $scope.setSelectedScheduleDraft = function (idSelectedDraft, dontDeselectOnSame) {
            if ($scope.idSelectedScheduleDraft === idSelectedDraft && !dontDeselectOnSame) {
                $scope.idSelectedScheduleDraft = null;
            } else {
                $scope.idSelectedScheduleDraft = idSelectedDraft;
            }
        };

        $scope.draftSelections = [];
        $scope.scheduleSelections = [];
        $scope.scheduleData = [];
        $scope.scheduleDraftData = [];

        $scope.showDatePicker = false;
        $scope.currentSelectedDate = new Date();

        $scope.selectedScheduleBlockDetails = "line1: something\nline2: something else\nhello: world\nline1: something\nline2: something else\nhello: world\nline1: something\nline2: something else\nhello: world";

        $scope.openTypePicker = function (rowIndex, $event) {

            if ($scope.currentRowTypePickerIndex !== rowIndex) {
                $scope.setSelectedScheduleDraft($scope.scheduleDraftData[rowIndex].id, true);
                closeDatePickerMenu();
                var rect = $event.currentTarget.getBoundingClientRect();
                var offset = { x: 0, y: 30 };
                var overLayCSS = {
                    left: rect.left + offset.x + 'px',
                    top: rect.top + offset.y + 'px'
                };
                angular.element(document.getElementById('schedulerTypePickerMenu')).css(overLayCSS);
                $scope.currentRowTypePickerIndex = $scope.scheduleDraftData.indexOf($scope.scheduleDraftData[rowIndex]);
                $scope.showTypePicker = true;
            } else {
                //the same row's button was clicked, so close the popup
                closeTypeMenu();
            }

            $event.stopPropagation();
        };

        $scope.openDatePicker = function (rowIndex, $event) {

            //TODO keyboard shortcut like escape to close datepicker
            if ($scope.currentRowDatePickerIndex !== rowIndex) {
                $scope.setSelectedScheduleDraft($scope.scheduleDraftData[rowIndex].id, true);
                closeTypeMenu();
                var existingVal = $scope.scheduleDraftData[rowIndex].desiredTime;
                if (existingVal.length > 0) {
                    $scope.currentSelectedDate = existingVal;
                }
                var rect = $event.currentTarget.getBoundingClientRect();
                var offset = { x: 0, y: 30 };
                var overLayCSS = {
                    left: rect.left + offset.x + 'px',
                    top: rect.top + offset.y + 'px'
                };
                angular.element(document.getElementById('schedulerDatePickerMenu')).css(overLayCSS);
                $scope.currentRowDatePickerIndex = $scope.scheduleDraftData.indexOf($scope.scheduleDraftData[rowIndex]);
                $scope.showDatePicker = true;
            } else {
                //the same row's button was clicked, so close the popup
                closeDatePickerMenu();
            }

            $event.stopPropagation();
        };

        angular.element('#schedule-draft-data-list').bind("scroll", function() {
            closeTypeMenu();
        });

        angular.element('body').bind("click", function(e) {
            if (!e.target.parentNode.classList.contains('schedule-item-input') &&
                !e.target.parentNode.parentNode.classList.contains('schedule-item-input')) {

                closeTypeMenu();
                closeDatePickerMenu();
            }
        });

        $scope.onTimeSet = function (newDate, oldDate) {

            $scope.scheduleDraftData[$scope.currentRowDatePickerIndex].desiredTime = moment(newDate).format('DD/MM/YYYY, HH:mm');
            $scope.showDatePicker = false;
            $scope.currentSelectedDate = new Date();
            $scope.currentRowDatePickerIndex = -1;
        };

        $scope.setScheduleDraftType = function (type) {
            var item = _.find($scope.scheduleDraftData, function (obj) {
                return obj.id === $scope.idSelectedScheduleDraft;
            });
            item.type = type;
        };

        $scope.removeDraftRow = function (rowIndex) {
            if ($scope.idSelectedScheduleDraft === $scope.scheduleDraftData[rowIndex].id) {
                if ($scope.scheduleDraftData.length > rowIndex + 1) {
                    $scope.idSelectedScheduleDraft = $scope.scheduleDraftData[rowIndex + 1].id;
                } else if ($scope.scheduleDraftData.length === rowIndex + 1 && rowIndex > 0) {
                    $scope.idSelectedScheduleDraft = $scope.scheduleDraftData[rowIndex - 1].id;
                }
            }
            $scope.scheduleDraftData.splice(rowIndex, 1);
        };

        $scope.moveDraftRowToSchedule = function (rowIndex) {
            $scope.scheduleData = _.union($scope.scheduleData, $scope.scheduleDraftData[rowIndex]);
            $scope.scheduleDraftData.splice(rowIndex, 1);
        };

        $scope.addDraftSchedule = function () {

            var newDraft = {
                id: 'scheduleblock' + lastId++,
                desiredTime: '',
                state: 'DRAFT',
                owner: 'userName',
                type: 'MANUAL',
                description: 'some description some description some description some description some description some description some description some description some description some description some description',
                script: 'some random scripty goodness'
            };
            $scope.scheduleDraftData.push(newDraft);
        };

        $scope.moveDraftsToSchedule = function () {

            $scope.scheduleData = _.union($scope.scheduleData, $scope.draftSelections);
            $scope.scheduleDraftData = _.reject($scope.scheduleDraftData, function (el) {
                return _.indexOf($scope.draftSelections, el) !== -1;
            });

            $scope.draftSelections.length = 0;
        };

        $scope.moveSchedulesToDraft = function () {

            $scope.scheduleDraftData = _.union($scope.scheduleDraftData, $scope.scheduleSelections);
            $scope.scheduleData = _.reject($scope.scheduleData, function (el) {
                return _.indexOf($scope.scheduleSelections, el) !== -1;
            });

            $scope.scheduleSelections.length = 0;
        };

        function closeTypeMenu () {
            if ($scope.showTypePicker) {
                $scope.showTypePicker = false;
                $scope.currentRowTypePickerIndex = -1;
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            }
        }

        function closeDatePickerMenu () {
            if ($scope.showDatePicker) {
                $scope.showDatePicker = false;
                $scope.currentRowDatePickerIndex = -1;
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            }
        }

    });