(function() {

    angular.module('katGui')
        .controller('ActivityCtrl', ActivityCtrl);

    function ActivityCtrl($scope, $rootScope, $timeout, $log, $interval, ObsSchedService, MonitorService, UserLogService, SensorsService, NotifyService, DataService) {

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

        vm.sensorTimelines = [];
        vm.sensorData = {};
        vm.redrawFunctions = {};
        vm.clearFunctions = {};
        vm.removeFunctions = {};

        MonitorService.subscribe('sched');
        MonitorService.subscribe('userlogs');
        //TODO we need some reconnect logic here to subscribe again

        vm.connectListeners = function () {
            SensorsService.connectListener()
                .then(function () {
                    vm.initSensors();
                    if (vm.connectInterval) {
                        $interval.cancel(vm.connectInterval);
                        vm.connectInterval = null;
                        NotifyService.showSimpleToast('Reconnected :)');
                    }
                }, function () {
                    $log.error('Could not establish sensor connection. Retrying every 10 seconds.');
                    if (!vm.connectInterval) {
                        vm.connectInterval = $interval(vm.connectListeners, 10000);
                    }
                });
            vm.handleSocketTimeout();
        };

        vm.handleSocketTimeout = function () {
            SensorsService.getTimeoutPromise()
                .then(function () {
                    NotifyService.showSimpleToast('Connection timeout! Attempting to reconnect...');
                    if (!vm.connectInterval) {
                        vm.connectInterval = $interval(vm.connectListeners, 10000);
                        vm.connectListeners();
                    }
                });
        };

        if ($rootScope.loggedIn) {
            vm.connectListeners();
        } else {
            vm.unbindLoginSuccess = $rootScope.$on('loginSuccess', function () {
                vm.connectListeners();
            });
        }

        vm.initSensors = function () {
            //TODO reconnect to existing sensors
        };

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
                userlog.start = moment.utc(userlog.start_time, "YYYY-MM-DD HH:mm:ss").toDate();
                if (userlog.end_time) {
                    userlog.end = moment.utc(userlog.end_time, "YYYY-MM-DD HH:mm:ss").toDate();
                } else {
                    userlog.end = moment.utc(userlog.start_time, "YYYY-MM-DD HH:mm:ss").add(4, 'm').add(30, 's').toDate();
                }
                if (userlog.start > userlog.end) {
                    var newEnd = userlog.start;
                    userlog.start = userlog.end;
                    userlog.end = newEnd;
                }
                userlog.lane = 5;
                userlog.strokeColor = "#AB47BC";
                userlog.fillColor = "rgba(171, 71, 187, 0.5)";
                userlog.title = userlog.content.substring(0, 15) + '...';
                userlog.clickFunction = function() {
                    UserLogService.editUserLog(this, false);
                };
                userlog.tooltipContentFunction = function() {
                    return "<i>Content:</i> <b>" + this.content + "</b><br/>" + "<i>Start:</i> " + this.start_time + "<br/><i>End:</i> " + this.end_time + "<br/><i>Tags:</i> " + this.tagsListText + "<br/><i>Attachments:</i> " + this.attachment_count;
                };
                if (userlog.start && userlog.end && userlog.lane) {
                    var existingULIndex = _.findIndex(vm.timelineData, function(item) {
                        return !item.id_code && item.id === userlog.id;
                    });
                    if (existingULIndex !== -1) {
                        vm.timelineData.splice(existingULIndex, 1);
                    }
                    vm.timelineData.push(userlog);
                }
            });
            vm.updateTimeline(vm.timelineData);
        };

        var unbindOrderChangeAdd = $rootScope.$on('sb_order_change', function(event, sb) {
            ObsSchedService.getScheduledScheduleBlocks().then(function (scheduleData) {
                vm.addSbsToTimeline(scheduleData);
            });
        });

        //This needs to run on the next digest because the timeline is not rendered yet
        $timeout(function() {
            vm.loadTimelineOptions({
                lanes: vm.timelineLanes
            });
            vm.redrawTimeline();
            ObsSchedService.getScheduledScheduleBlocks().then(function (scheduleData) {
                vm.addSbsToTimeline(scheduleData);
            });
            var startDate = moment().utc().subtract(30, 'm').format('YYYY-MM-DD HH:mm:ss'),
                endDate = moment().utc().add(30, 'm').format('YYYY-MM-DD HH:mm:ss');
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

        var unbindUserlogAdd = $rootScope.$on('userlogs_add', function(event, userlog) {
            vm.addUserLogsToTimeline([userlog]);
        });

        var unbindUserlogModify = $rootScope.$on('userlogs_modify', function(event, userlog) {
            vm.addUserLogsToTimeline([userlog]);
        });

        vm.initSensorTimeline = function (sensor) {
            vm.findSensorData(sensor, true);
        };

        //TODO add a way to show any sensor timeline
        vm.addSensorTimeline = function () {
            var sensor = {name: 'anc_weather_wind_speed'};
            vm.sensorTimelines.push(sensor);
            vm.initSensorTimeline(sensor);
        };

        vm.findSensorData = function (sensor, suppressToast) {
            var startDate = moment().utc().subtract(30, 'm').toDate().getTime(),
                endDate = moment().utc().toDate().getTime();

            // var interval = null;
            // if (vm.sensorType === 'numeric') {
            //     interval = vm.relativeTimeToSeconds(vm.intervalNum, vm.intervalType);
            // }

            var requestParams;
            if (sensor.type === 'discrete') {
                requestParams = [SensorsService.guid, sensor.name, startDate, endDate, 10000];
            } else {
                requestParams = [SensorsService.guid, sensor.name, startDate, endDate, 10000];
            }

            DataService.sensorData.apply(this, requestParams)
                .then(function (result) {
                    if (result.data.result === "success") {
                        vm.connectLiveSensorFeed(sensor.name);
                    }
                }, function (error) {
                    $log.error(error);
                });
        };

        vm.sensorDataReceived = function (event, sensor) {

            if (sensor.value && sensor.value instanceof Array) {
                var newData = [];
                var newSensorNames = {};
                for (var attr in sensor.value) {
                    var sensorName = sensor.value[attr][4];

                    newData.push({
                        status: sensor.value[attr][5],
                        sensor: sensorName,
                        value: sensor.value[attr][3],
                        value_ts: sensor.value[attr][1],
                        sample_ts: sensor.value[attr][0],
                        minValue: sensor.value[attr][6],
                        maxValue: sensor.value[attr][7]
                    });
                    newSensorNames[sensorName] = {};
                }

                if (newData && newData.length > 0) {
                    vm.redrawFunctions[Object.keys(newSensorNames)[0]](newData, false, true, false, null);
                }
            }
            else if (sensor.value) {
                var realSensorName = sensor.name.split(':')[1].replace(/\./g, '_').replace(/-/g, '_');
                if (angular.isDefined(_.findWhere(vm.sensorNames, {name: realSensorName}))) {
                    vm.redrawChart([{
                        sensor: realSensorName,
                        value_ts: sensor.value.timestamp * 1000,
                        sample_ts: sensor.value.received_timestamp * 1000,
                        value: sensor.value.value
                    }], vm.showGridLines, !vm.showContextZoom, vm.useFixedYAxis, null, 1000);
                }
            }
        };

        vm.connectLiveSensorFeed = function (sensorRegex) {
            if (sensorRegex.length > 0) {
                SensorsService.setSensorStrategies(
                    sensorRegex,
                    'event-rate',
                    1,
                    10);
            }
        };

        vm.disconnectLiveSensorFeed = function (sensorRegex) {
            SensorsService.removeSensorStrategies(sensorRegex);
        };

        var unbindSensorUpdate = $rootScope.$on('sensorsServerUpdateMessage', vm.sensorDataReceived);

        vm.downloadCSVDummy = function () {

        };

        $scope.$on('$destroy', function() {
            unbindScheduleUpdate();
            unbindOrderChangeAdd();
            unbindUserlogModify();
            unbindUserlogAdd();
            unbindSensorUpdate();
            MonitorService.unsubscribe('sched', '*');
            MonitorService.unsubscribe('userlogs', '*');
        });
    }
})();
