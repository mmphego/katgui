// *******************************************************************
// TODO: WARNING THIS DISPLAY WAS EXPERIMENTAL AND IS NOT USED ANYMORE
// *******************************************************************
(function() {

    angular.module('katGui.widgets')
        .controller('ActivityWidgetCtrl', ActivityWidgetCtrl);

    function ActivityWidgetCtrl($scope, $rootScope, $timeout, $log, ObsSchedService, MonitorService, UserLogService, MOMENT_DATETIME_FORMAT) {

        var vm = this;
        vm.timelineData = [];
        vm.timelineLanes = [{
            title: 'Subarray 1',
            lane: 1
        }, {
            title: 'Subarray 2',
            lane: 2
        }, {
            title: 'Subarray 3',
            lane: 3
        }, {
            title: 'Subarray 4',
            lane: 4
        }, {
            title: 'Userlogs',
            lane: 5
        }];

        //TODO this needs a promise
        ObsSchedService.getScheduledScheduleBlocks();
        //TODO program blocks
        // ObsSchedService.getProgramBlocksObservationSchedule();
        MonitorService.subscribe('sched');
        MonitorService.subscribe('userlogs');

        vm.addSbsToTimeline = function(scheduleBlocks) {
            scheduleBlocks.forEach(function(sb) {
                sb.start = sb.actual_start_time ? sb.actual_start_time : sb.desired_start_time;
                if (sb.start) {
                    sb.start = new Date(sb.start);
                }

                if (sb.actual_end_time) {
                    sb.end = new Date(sb.actual_end_time);
                } else if (sb.start && sb.expected_duration_seconds) {
                    sb.end = moment(sb.start).add(sb.expected_duration_seconds, 's').toDate();
                } else if (sb.start) {
                    sb.end = moment(sb.start).add(4, 'm').add(30, 's').toDate();
                }

                sb.lane = sb.sub_nr;
                sb.strokeColor = sb.state === "ACTIVE" ? "#4CAF50" : "#000";
                sb.fillColor = sb.state === "ACTIVE" ? "rgba(76, 175, 80, 0.5)" : "rgba(255, 255, 255, 0.5)";
                sb.title = sb.id_code;
                sb.clickFunction = function() {
                    $rootScope.showSBDetails(this);
                };
                sb.tooltipContentFunction = function() {
                    return "<i>ID:</i> <b>" + this.id_code + "</b><br/>" + "<i>Description:</i> " + this.description + "<br/><i>State:</i> " + this.state + "<br/><i>Type:</i> " + this.type;
                };

                if (sb.start && sb.end && sb.lane) {
                    var existingSbIndex = _.findIndex(vm.timelineData, function(item) {
                        return item.id_code === sb.id_code;
                    });
                    if (existingSbIndex !== -1) {
                        vm.timelineData.splice(existingSbIndex, 1);
                    }
                    vm.timelineData.push(sb);
                }
            });
            vm.updateTimeline(vm.timelineData);
        };

        vm.addUserLogsToTimeline = function(userlogs) {
            userlogs.forEach(function(userlog) {
                userlog.start = moment.utc(userlog.start_time, MOMENT_DATETIME_FORMAT).toDate();
                if (userlog.end_time) {
                    userlog.end = moment.utc(userlog.end_time, MOMENT_DATETIME_FORMAT).toDate();
                } else {
                    userlog.end = moment.utc(userlog.start_time, MOMENT_DATETIME_FORMAT).add(4, 'm').add(30, 's').toDate();
                }
                if (userlog.start > userlog.end) {
                    var newEnd = userlog.start;
                    userlog.start = userlog.end;
                    userlog.end = newEnd;
                }
                //TODO should we put this at lane 1?
                userlog.lane = 5; //subarrays takes lanes 1-4
                userlog.strokeColor = "#AB47BC";
                userlog.fillColor = "rgba(171, 71, 187, 0.5)";
                userlog.title = userlog.content.substring(0, 10) + '...';
                userlog.clickFunction = function() {
                    UserLogService.editUserLog(this, false);
                };
                userlog.tooltipContentFunction = function() {
                    return "<i>Content:</i> <b>" + this.content + "</b><br/>" + "<i>Start:</i> " + this.start_time + "<br/><i>End:</i> " + this.end_time + "<br/><i>Tags:</i> " + this.tagsListText + "<br/><i>Attachments:</i> " + this.attachment_count;
                };
                if (userlog.start && userlog.end && userlog.lane) {
                    vm.timelineData.push(userlog);
                }
            });
            vm.updateTimeline(vm.timelineData);
        };

        var unbindOrderChangeAdd = $rootScope.$on('sb_order_change', function(event, sb) {
            //TODO this needs a promise
            // TODO program blocks
            ObsSchedService.getScheduledScheduleBlocks();
            $timeout(function() {
                vm.addSbsToTimeline(ObsSchedService.scheduleData);
            }, 1500);
        });

        //This needs to run on the next digest because the timeline is not rendered yet
        $timeout(function() {
            vm.loadTimelineOptions({
                lanes: vm.timelineLanes
            });
            vm.redrawTimeline();
            vm.addSbsToTimeline(ObsSchedService.scheduleData);
            var startDate = moment().utc().subtract(30, 'm').format(MOMENT_DATETIME_FORMAT),
                endDate = moment().utc().add(30, 'm').format(MOMENT_DATETIME_FORMAT);
            UserLogService.listTags().then(function() {
                UserLogService.listUserLogsForTimeRange(startDate, endDate).then(function(result) {
                    if (result) {
                        vm.addUserLogsToTimeline(result);
                    }
                }, function(error) {
                    $log.error(error);
                });
            });
        });

        var unbindScheduleUpdate = $rootScope.$on('sb_schedule_update', function(event, sb) {
            var sbIndex = _.findIndex(vm.timelineData, function(item) {
                return sb.id_code === item.id_code;
            });
            if (sbIndex > -1) {
                vm.timelineData.splice(sbIndex, 1);
            }
            vm.addSbsToTimeline([sb]);
        });

        //TODO listen for other userlog messages
        var unbindUserlogAdd = $rootScope.$on('userlogs_add', function(event, userlog) {
            vm.addUserLogsToTimeline([userlog]);
        });

        $scope.$on('$destroy', function() {
            unbindScheduleUpdate();
            unbindOrderChangeAdd();
            MonitorService.unsubscribe('sched', '*');
        });
    }
})();
