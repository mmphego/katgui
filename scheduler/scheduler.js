angular.module('katGui.scheduler')

    .constant('SCHEDULE_BLOCK_TYPES', [
        'MAINTENANCE',
        'OBSERVATION',
        'MANUAL'])

    .controller('SchedulerCtrl', function ($scope, SCHEDULE_BLOCK_TYPES) {

        $scope.types = SCHEDULE_BLOCK_TYPES;

        var draftActionsTemplate = '<button value="remove" class="btn btn-default btn-trash" ng-click="removeDraftRow($index)"><span class="glyphicon glyphicon-trash"></span></button>';
        var checkboxHeaderTemplate = '<input class="ngSelectionHeader" type="checkbox" ng-model="allSelected" ng-change="toggleSelectAll(allSelected)"/>';
        var dropdownTemplate = '<select class="grid-dropdown" ng-model="COL_FIELD" ng-options="type for type in types"></select>';
        var datetimepickerTemplate = '<div class="dropdown">' +
            '<a class="dropdown-toggle" id="dLabel" role="button" data-toggle="dropdown" data-target="#" href="">Click here</a>' +
            '<ul class="dropdown-menu" role="menu" aria-labelledby="dLabel">' +
                '<datetimepicker data-ng-model="data.date"' +
                'data-datetimepicker-config="{ dropdownSelector: \'.dropdown-toggle\' }"></datetimepicker>' +
            '</ul>' +
        '</div>';

        var lastId = 0;

        $scope.draftSelections = [];
        $scope.scheduleSelections = [];
        $scope.scheduleData = [];
        $scope.scheduleDraftData = [];

        $scope.gridOptionsDrafts = {
            data: 'scheduleDraftData',
            columnDefs: [
                {field: 'id', displayName: 'ID', width: 120},
                {field: 'desiredTime', displayName: 'Desired Time', width: 120, cellTemplate: datetimepickerTemplate },
                {field: 'state', displayName: 'State', width: 80},
                {field: 'owner', displayName: 'Owner', width: 120},
                {field: 'type', displayName: 'Type', enableCellEdit: true, width: 140, cellTemplate: dropdownTemplate},
                {field: 'description', displayName: 'Description', enableCellEdit: true},
                {field: 'remove', displayName: '', cellTemplate: draftActionsTemplate, width: 30, maxWidth: 30 }
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