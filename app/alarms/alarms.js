angular.module('katGui.alarms', [])

    .controller('AlarmsCtrl', function ($rootScope, $scope) {

        if (!$rootScope.showLargeAlarms) {
            $rootScope.showLargeAlarms = false;
            $scope.showLargeAlarms = false;
        }

        $scope.$watch('showLargeAlarms', function (newVal, oldVal) {
            if (newVal !== oldVal) {
                $rootScope.showLargeAlarms = newVal;
            }
        });

        $scope.selectAll = false;
        $scope.alarmsData = [];
        $scope.selectedAlarms = [];
        $scope.orderByField = 'date';
        $scope.reverseSort = true;
        var checkboxHeaderTemplate = '<input class="ngSelectionHeader" type="checkbox" ng-model="allSelected" ng-change="toggleSelectAll(allSelected)"/>';

        $scope.gridOptionsAlarms = {
            data: 'alarmsData',
            columnDefs: [
                {field: 'date', displayName: 'Date', width: 150},
                {field: 'severity', displayName: 'Severity', width: 120 },
                {field: 'priority', displayName: 'Priority', width: 120},
                {field: 'name', displayName: 'Alarm Name', width: 120},
                {field: 'message', displayName: 'Message', width: 120}
            ],
            selectedItems: $scope.selectedAlarms,
            enableRowSelection: false,
            checkboxHeaderTemplate: checkboxHeaderTemplate,
            showSelectionCheckbox: true
        };

        $rootScope.$on('alarmMessage', function (event, message) {

            $scope.alarmsData.push(message);
        });

    });