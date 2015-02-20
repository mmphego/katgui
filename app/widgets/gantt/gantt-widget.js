(function () {

angular.module('katGui.widgets.ganttWidget', ['adf.provider'])
    .config(configureGanttWidget)
    .controller('GanttWidgetCtrl', GanttWidgetCtrl);

    function configureGanttWidget(dashboardProvider) {
        dashboardProvider
            .widget('GanttWidget', {
                title: 'Observation Schedule Widget',
                description: 'Container for displaying the observation schedule',
                templateUrl: 'app/widgets/gantt/gantt-widget.html',
                controllerAs: 'vm',
                controller: 'GanttWidgetCtrl'
            });
    }

    function GanttWidgetCtrl($scope) {

        var vm = this;
    }

})();
