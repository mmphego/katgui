(function () {

    angular.module('katGui.widgets')
        .controller('ActivityWidgetCtrl', ActivityWidgetCtrl);

    function ActivityWidgetCtrl($scope, $rootScope, $timeout, ObsSchedService, MonitorService) {

        var vm = this;
        vm.timelineData = [];

        //TODO this needs a promise
        ObsSchedService.getScheduledScheduleBlocks();
        MonitorService.subscribe('sched');

        $timeout(function () {
            vm.addSbsToTimeline(ObsSchedService.scheduleData);
        }, 1500);

        vm.addSbsToTimeline = function (scheduleBlocks) {
            scheduleBlocks.forEach(function (sb) {
                sb.start = sb.actual_start_time? sb.actual_start_time : sb.desired_start_time;
                if (sb.start) {
                    sb.start = new Date(sb.start);
                }

                if (sb.actual_end_time) {
                    sb.end = new Date(sb.actual_end_time);
                } else if (sb.start && sb.expected_duration_seconds) {
                    sb.end = moment(sb.start).add(sb.expected_duration_seconds, 's').toDate();
                } else if (sb.start) {
                    sb.end = moment(sb.start).add(2, 'm').toDate();
                }

                sb.lane = sb.sub_nr;
                sb.strokeColor = sb.state === "ACTIVE"? "#4CAF50" : "#000";
                sb.fillColor = sb.state === "ACTIVE"? "rgba(76, 175, 80, 0.5)" : "rgba(255, 255, 255, 0.5)";
                sb.title = sb.id_code;
                if (sb.start && sb.end && sb.lane) {
                    vm.timelineData.push(sb);
                }
            });
            vm.redrawTimeline(vm.timelineData);
        };

        var unbindOrderChangeAdd = $rootScope.$on('sb_order_change', function (event, sb) {
            //TODO this needs a promise
            vm.timelineData = [];
            vm.redrawTimeline(vm.timelineData);
            ObsSchedService.getScheduledScheduleBlocks();
            $timeout(function () {
                vm.addSbsToTimeline(ObsSchedService.scheduleData);
            }, 1500);
        });

        var unbindScheduleUpdate = $rootScope.$on('sb_schedule_update', function (event, sb) {
            var sbIndex = _.findIndex(vm.timelineData, function (item) {
                return sb.id_code === item.id_code;
            });
            if (sbIndex > -1) {
                vm.timelineData.splice(sbIndex, 1);
            }
            vm.addSbsToTimeline([sb]);
        });

        $scope.$on('$destroy', function () {
            unbindScheduleUpdate();
            unbindOrderChangeAdd();
            MonitorService.unsubscribe('sched', '*');
        });
    }
})();
