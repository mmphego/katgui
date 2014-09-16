function getSampleData() {

    return {
        "data1": [
            // Order is optional. If not specified it will be assigned automatically
            {"id": "2f85dbeb-0845-404e-934e-218bf39750c0", "description": "Sub-Array 1", "order": 0, "tasks": [
                // Dates can be specified as string, timestamp or javascript date object. The data attribute can be used to attach a custom object
                {"id": "f55549b5-e449-4b0c-9f4b-8b33381f7d76", "subject": "scheduleblock1", "color": "#93C47D", "from": "2014-10-07T09:00:00", "to": "2014-10-07T10:00:00", "data": "Can contain any custom data or object"},
            ], "data": "Can contain any custom data or object"},
            {"id": "bffa16c6-c134-4443-8e6e-b09410c37c9f", "description": "Sub-Array 4", "order": 13, "tasks": [
                {"id": "2f4ec0f1-cd7a-441a-8288-e788ec112af9", "subject": "scheduleblock7", "color": "#F1C232", "from": new Date(2014,9,8,12,0,0), "to": new Date(2014,9,8,14,0,0)}
            ]},
            {"id": "ec0c5e31-449f-42d0-9e81-45c66322b640", "description": "Sub-Array 5", "order": 14, "tasks": [
                {"id": "edf2cece-2d17-436f-bead-691edbc7386b", "subject": "scheduleblock18", "color": "#F1C232", "from": new Date(2014,9,9,14,30,0), "to": new Date(2014,9,9,18,0,0)}
            ]},
            {"id": "c65c2672-445d-4297-a7f2-30de241b3145", "description": "Sub-Array 2", "order": 2, "tasks": [
                {"id": "4e197e4d-02a4-490e-b920-4881c3ba8eb7", "subject": "scheduleblock3", "color": "#9FC5F8", "from": new Date(2014,9,7,9,0,0), "to": new Date(2014,9,7,10,0,0)},
                {"id": "451046c0-9b17-4eaf-aee0-4e17fcfce6ae", "subject": "scheduleblock4", "color": "#9FC5F8", "from": new Date(2014,9,7,10,0,0), "to": new Date(2014,9,7,11,0,0)},
                {"id": "fcc568c5-53b0-4046-8f19-265ebab34c0b", "subject": "scheduleblock5", "color": "#9FC5F8", "from": new Date(2014,9,7,11,30,0), "to": new Date(2014,9,7,12,30,0)}
            ]},
            {"id": "33e1af55-52c6-4ccd-b261-1f4484ed5773", "description": "Sub-Array 3", "order": 12, "tasks": [
                {"id": "656b9240-00da-42ff-bfbd-dfe7ba393528", "subject": "scheduleblock6", "color": "#F1C232", "from": new Date(2014,9,8,9,0,0), "to": new Date(2014,9,8,12,0,0)}
            ]}
        ]};
}

angular.module('katGui.widgets.ganttWidget', ['adf.provider'])

    .config(function (dashboardProvider) {
        dashboardProvider
            .widget('GanttWidget', {
                title: 'Schedule Blocks Widget',
                description: 'Container for displaying schedule blocks',
                templateUrl: 'widgets/gantt/gantt-widget.html',
                controller: 'GanttWidgetCtrl'
            });
    })

    .controller('GanttWidgetCtrl', function ($scope) {

        $scope.mode = "name";
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