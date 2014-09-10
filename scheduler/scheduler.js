angular.module('katGui.scheduler')

    .constant('SCHEDULE_BLOCK_TYPES', [
        'MAINTENANCE',
        'OBSERVATION',
        'MANUAL'])

    .controller('SchedulerCtrl', function ($scope, SCHEDULE_BLOCK_TYPES) {

        $scope.types = SCHEDULE_BLOCK_TYPES;

        var draftActionsTemplate = '<button value="remove" class="btn btn-default btn-trash" ng-click="removeDraftRow()"><span class="glyphicon glyphicon-trash"></span></button>' +
            '<button value="moveToSchedule" class="btn btn-default btn-trash" ng-click="moveDraftRowToSchedule()"><span class="glyphicon glyphicon-chevron-down"></span></button>';
        var checkboxHeaderTemplate = '<input class="ngSelectionHeader" type="checkbox" ng-model="allSelected" ng-change="toggleSelectAll(allSelected)"/>';
        var dropdownTemplate = '<select class="grid-dropdown" ng-model="COL_FIELD" ng-options="type for type in types"></select>';
        var datetimepickerTemplate = '<button class="btn-custom-datetimepicker" ng-click="openDatePicker(row, $event)">' +
            '<span ng-if="!COL_FIELD">Select Date</span><span ng-if="COL_FIELD">{{COL_FIELD | date:\'dd/MM/yyyy HH:mm\'}}</span><span class="glyphicon glyphicon-chevron-down"></span></button>';
        var lastId = 0;

        $scope.draftSelections = [];
        $scope.scheduleSelections = [];
        $scope.scheduleData = [];
        $scope.scheduleDraftData = [];

        $scope.showDatePicker = false;
        $scope.currentSelectedDate = new Date();

        $scope.selectedScheduleBlockDetails = "line1: something\nline2: something else\nhello: world\nline1: something\nline2: something else\nhello: world\nline1: something\nline2: something else\nhello: world";

        $scope.openDatePicker = function (row, $event) {

            if ($scope.currentRowDatePickerIndex !== row.rowIndex) {

                var existingVal = row.entity.desiredTime;
                if (existingVal.length > 0) {
                    $scope.currentSelectedDate = existingVal;
                }

                var left = $event.target.parentNode.offsetParent.offsetLeft + $event.target.parentNode.offsetLeft;
                var top = $event.target.parentNode.offsetParent.offsetParent.offsetTop;

                var offset = { x: 85, y: 185 };

                var overLayCSS = {
                    left: left + offset.x + 'px',
                    top: top + offset.y + 'px'
                };

                angular.element(document.getElementById('schedulerDatePickerMenu')).css(overLayCSS);

                $scope.currentRowDatePickerIndex = row.rowIndex;
                $scope.showDatePicker = true;
            } else {
                //the same row's button was clicked, so close the popup
                $scope.showDatePicker = false;
                $scope.currentRowDatePickerIndex = -1;
            }
        };

        $scope.onTimeSet = function (newDate) {

            if ($scope.currentRowDatePickerIndex < $scope.scheduleDraftData.length) {
                $scope.scheduleDraftData[$scope.currentRowDatePickerIndex].desiredTime = newDate;
            }

            $scope.showDatePicker = false;
            $scope.currentSelectedDate = new Date();
            $scope.currentRowDatePickerIndex = -1;
        };

        $scope.gridOptionsDrafts = {
            data: 'scheduleDraftData',
            columnDefs: [
                {field: 'id', displayName: 'ID', width: 120},
                {field: 'desiredTime', displayName: 'Desired Time', width: 160, cellTemplate: datetimepickerTemplate },
                {field: 'state', displayName: 'State', width: 80},
                {field: 'owner', displayName: 'Owner', width: 120},
                {field: 'type', displayName: 'Type', width: 140, cellTemplate: dropdownTemplate},
                {field: 'description', displayName: 'Description', enableCellEdit: true},
                {field: 'remove', displayName: '', cellTemplate: draftActionsTemplate, width: 50, maxWidth: 50 }
            ],
            selectedItems: $scope.draftSelections,
            checkboxHeaderTemplate: checkboxHeaderTemplate,
            showSelectionCheckbox: true,
            selectWithCheckboxOnly: true,
            enableColumnResize: true
        };

        $scope.gridOptionsSchedules = {
            data: 'scheduleData',
            columnDefs: [
                {field: 'id', displayName: 'ID', width: 120},
                {field: 'desiredTime', displayName: 'Desired Time', width: 120 },
                {field: 'state', displayName: 'State', width: 80},
                {field: 'owner', displayName: 'Owner', width: 120},
                {field: 'ready', displayName: 'Ready', width: 80},
                {field: 'type', displayName: 'Type', width: 120},
                {field: 'description', displayName: 'Description' }
            ],
            selectedItems: $scope.scheduleSelections,
            checkboxHeaderTemplate: checkboxHeaderTemplate,
            showSelectionCheckbox: true,
            selectWithCheckboxOnly: false,
            enableColumnResize: true
        };


        $scope.removeDraftRow = function () {
            var index = this.row.rowIndex;
            $scope.gridOptionsDrafts.selectItem(index, false);
            $scope.scheduleDraftData.splice(index, 1);
        };

        $scope.moveDraftRowToSchedule = function () {
            $scope.scheduleData = _.union($scope.scheduleData, this.row.entity);
            $scope.scheduleDraftData.splice(this.row.rowIndex, 1);
        };

        $scope.addDraftSchedule = function () {

            var newDraft = { id: 'scheduleblock' + lastId++, desiredTime: '', state: 'DRAFT', owner: 'userName', type: 'MANUAL', description: 'some description' };
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

    });