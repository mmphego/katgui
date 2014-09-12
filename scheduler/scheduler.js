function getSampleData() {

    return {
        "data1": [
            // Order is optional. If not specified it will be assigned automatically
            {"id": "2f85dbeb-0845-404e-934e-218bf39750c0", "description": "Sub-Array 1", "order": 0, "tasks": [
                // Dates can be specified as string, timestamp or javascript date object. The data attribute can be used to attach a custom object
                {"id": "f55549b5-e449-4b0c-9f4b-8b33381f7d76", "subject": "scheduleblock1", "color": "#93C47D", "from": "2014-10-07T09:00:00", "to": "2014-10-07T10:00:00", "data": "Can contain any custom data or object"},
            ], "data": "Can contain any custom data or object"},
            {"id": "c65c2672-445d-4297-a7f2-30de241b3145", "description": "Sub-Array 2", "order": 2, "tasks": [
                {"id": "4e197e4d-02a4-490e-b920-4881c3ba8eb7", "subject": "scheduleblock3", "color": "#9FC5F8", "from": new Date(2014,9,7,9,0,0), "to": new Date(2014,9,7,10,0,0)},
                {"id": "451046c0-9b17-4eaf-aee0-4e17fcfce6ae", "subject": "scheduleblock4", "color": "#9FC5F8", "from": new Date(2014,9,7,10,0,0), "to": new Date(2014,9,7,11,0,0)},
                {"id": "fcc568c5-53b0-4046-8f19-265ebab34c0b", "subject": "scheduleblock5", "color": "#9FC5F8", "from": new Date(2014,9,7,11,30,0), "to": new Date(2014,9,7,12,30,0)}
            ]},
            {"id": "33e1af55-52c6-4ccd-b261-1f4484ed5773", "description": "Sub-Array 3", "order": 12, "tasks": [
                {"id": "656b9240-00da-42ff-bfbd-dfe7ba393528", "subject": "scheduleblock6", "color": "#F1C232", "from": new Date(2014,9,8,9,0,0), "to": new Date(2014,9,8,12,0,0)}
            ]},
            {"id": "bffa16c6-c134-4443-8e6e-b09410c37c9f", "description": "Sub-Array 4", "order": 13, "tasks": [
                {"id": "2f4ec0f1-cd7a-441a-8288-e788ec112af9", "subject": "scheduleblock7", "color": "#F1C232", "from": new Date(2014,9,8,12,0,0), "to": new Date(2014,9,8,14,0,0)}
            ]},
            {"id": "ec0c5e31-449f-42d0-9e81-45c66322b640", "description": "Sub-Array 5", "order": 14, "tasks": [
                {"id": "edf2cece-2d17-436f-bead-691edbc7386b", "subject": "scheduleblock18", "color": "#F1C232", "from": new Date(2014,9,9,14,30,0), "to": new Date(2014,9,9,18,0,0)}
            ]}
        ]};
}


angular.module('katGui.scheduler', ['gantt'])

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

                $scope.currentRowDatePickerIndex = $scope.scheduleDraftData.indexOf(row.entity);
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




        //gantt chart functions
        $scope.mode = "custom";
        $scope.scale = "hour";
        $scope.maxHeight = 0;
        $scope.showWeekends = true;
        $scope.showNonWorkHours = true;

        $scope.addSamples = function () {
            $scope.loadData(getSampleData().data1);
        };

        $scope.labelEvent = function(event) {
            // A label has been clicked.
            console.log('Label event (by user: ' + event.userTriggered + '): ' + event.row.description + ' (Custom data: ' + event.row.data + ')');
        };

        $scope.labelHeaderEvent = function(event) {
            // The label header has been clicked.
            console.log('Label header event. Mouse: ' + event.evt.clientX + '/' + event.evt.clientY);
        };

        $scope.rowEvent = function(event) {
            // A row has been added, updated or clicked. Use this event to save back the updated row e.g. after a user re-ordered it.
            console.log('Row event (by user: ' + event.userTriggered + '): ' + event.date + ' '  + event.row.description + ' (Custom data: ' + event.row.data + ')');
        };

        $scope.scrollEvent = function(event) {
            if (angular.equals(event.direction, "left")) {
                // Raised if the user scrolled to the left side of the Gantt. Use this event to load more data.
                console.log('Scroll event: Left');
            } else if (angular.equals(event.direction, "right")) {
                // Raised if the user scrolled to the right side of the Gantt. Use this event to load more data.
                console.log('Scroll event: Right');
            }
        };

        $scope.taskEvent = function(event) {
            // A task has been updated or clicked.
            console.log('Task event (by user: ' + event.userTriggered + '): ' + event.task.subject + ' (Custom data: ' + event.task.data + ')');
        };
    });