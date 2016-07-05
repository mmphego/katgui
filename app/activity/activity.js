(function() {

    angular.module('katGui')
        .controller('ActivityCtrl', ActivityCtrl);

    function ActivityCtrl($scope, $rootScope, $timeout, $log, $interval, $mdDialog, ObsSchedService, MonitorService,
        UserLogService, SensorsService, NotifyService, DataService, $localStorage) {

        //TODO refactor so that the x-axis is adjusted at the same time for all timelines
        //TODO include sensor names in url

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
        vm.loadOptionsFunctions = {};

        if ($localStorage.activityDisplaySensorNames) {
            vm.sensorTimelines = $localStorage.activityDisplaySensorNames;
        }

        vm.connectListeners = function() {
            SensorsService.connectListener()
                .then(function() {
                    vm.initSensors();
                    if (vm.connectInterval) {
                        $interval.cancel(vm.connectInterval);
                        vm.connectInterval = null;
                        NotifyService.showSimpleToast('Reconnected :)');
                    }
                }, function() {
                    $log.error('Could not establish sensor connection. Retrying every 10 seconds.');
                    if (!vm.connectInterval) {
                        vm.connectInterval = $interval(vm.connectListeners, 10000);
                    }
                });
            vm.handleSocketTimeout();
        };

        vm.handleSocketTimeout = function() {
            SensorsService.getTimeoutPromise()
                .then(function() {
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
            vm.unbindLoginSuccess = $rootScope.$on('loginSuccess', function() {
                vm.connectListeners();
            });
        }

        vm.initSensors = function() {
            //Stagger the inits because too many calls over the websocket breaks some of them

            $timeout(function() {
                MonitorService.subscribe('sched');
                $timeout(function() {
                    MonitorService.subscribe('userlogs');

                    if (vm.sensorTimelines.length > 0) {
                        var timeoutIncrement = 0;
                        vm.sensorTimelines.forEach(function(sensor) {
                            $timeout(function() {
                                vm.addSensorTimeline(sensor, true);
                            }, 500 + timeoutIncrement);
                            timeoutIncrement += 500;
                        });
                    }
                    // vm.updateTimeline(vm.timelineData);
                }, 300);
            }, 300);
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
            ObsSchedService.getScheduledScheduleBlocks().then(function(scheduleData) {
                vm.addSbsToTimeline(scheduleData);
            });
        });

        //This needs to run on the next digest because the timeline is not rendered yet
        $timeout(function() {
            vm.loadTimelineOptions({
                lanes: vm.timelineLanes
            });
            vm.redrawTimeline();
            ObsSchedService.getScheduledScheduleBlocks().then(function(scheduleData) {
                vm.addSbsToTimeline(scheduleData);
            });
            var startDate = moment.utc($rootScope.utcDate).subtract(45, 'm').format('YYYY-MM-DD HH:mm:ss'),
                endDate = moment.utc($rootScope.utcDate).add(15, 'm').format('YYYY-MM-DD HH:mm:ss');
            UserLogService.listTags().then(function() {
                UserLogService.listUserLogsForTimeRange(startDate, endDate).then(function(result) {
                    if (result) {
                        vm.addUserLogsToTimeline(result);
                    }
                    vm.updateTimeline(vm.timelineData);
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

        vm.addSensorTimeline = function(sensor, replace) {
            var existingSensorIndex = _.findIndex(vm.sensorTimelines, function(item) {
                return item.name === sensor.name;
            });
            if (existingSensorIndex > -1 && replace) {
                vm.sensorTimelines.splice(existingSensorIndex, 1);
                existingSensorIndex = -1;
            }
            if (existingSensorIndex === -1) {
                vm.sensorTimelines.push(sensor);
                //on next digest so that loadOptionsFunctions can be populated by angular
                $timeout(function () {
                    var startDate = moment.utc($rootScope.utcDate).subtract(45, 'm').toDate(),
                        endDate = moment.utc($rootScope.utcDate).add(15, 'm').toDate();
                    vm.loadOptionsFunctions[sensor.name]({
                        showGridLines: true,
                        hideContextZoom: true,
                        useFixedYAxis: false,
                        useFixedXAxis: true,
                        xAxisValues: [startDate, endDate],
                        scrollXAxisWindowBy: 10,
                        drawNowLine: true,
                        removeOutOfTimeWindowData: true,
                        discreteSensors: sensor.type === 'discrete',
                        overrideMargins: {left: 60, top: 10, bottom: 20, right: 10}
                    });
                    vm.findSensorData(sensor);
                });
            }
        };

        vm.findSensorNames = function(event) {
            $mdDialog
                .show({
                    controller: function($rootScope, $scope, $mdDialog) {
                        $scope.title = 'Find sensor names';
                        $scope.sensorNames = [];
                        $scope.searchDiscrete = false;

                        $scope.hide = function() {
                            $mdDialog.hide();
                        };

                        $scope.findSensorData = function(sensor) {
                            vm.addSensorTimeline(sensor);
                        };

                        $scope.findSensorNames = function(searchStr) {
                            if (searchStr && searchStr.length > 2) {
                                var sensorType = $scope.searchDiscrete ? 'discrete' : 'numeric';
                                DataService.sensorsInfo(searchStr.replace(/ /g, '.'), sensorType, 10000)
                                    .then(function(result) {
                                        if (result.data.error) {
                                            NotifyService.showPreDialog('Error retrieving sensors', result.data.error);
                                        } else if (result.data) {
                                            $scope.sensorNames = [];
                                            result.data.forEach(function(sensor) {
                                                $scope.sensorNames.push({
                                                    name: sensor[0],
                                                    component: sensor[1],
                                                    attributes: sensor[2],
                                                    type: sensorType
                                                });
                                            });
                                        }
                                    }, function(error) {
                                        $log.error(error);
                                        NotifyService.showPreDialog('Error Finding Sensors', error);
                                    });
                            }
                        };
                    },
                    templateUrl: "app/activity/find-sensor-name.tmpl.html",
                    targetEvent: event
                });

        };

        vm.findSensorData = function(sensor) {
            var startDate = moment.utc($rootScope.utcDate).subtract(45, 'm').toDate().getTime(),
                endDate = moment.utc($rootScope.utcDate).toDate().getTime();

            var requestParams;
            if (sensor.type === 'discrete') {
                requestParams = [SensorsService.guid, sensor.name, startDate, endDate, 10000];
            } else {
                requestParams = [SensorsService.guid, sensor.name, startDate, endDate, 10000];
            }

            DataService.sensorData.apply(this, requestParams)
                .then(function(result) {
                    vm.connectLiveSensorFeed(sensor.name);
                }, function(error) {
                    $log.error(error);
                });
        };

        vm.sensorDataReceived = function(event, sensor) {

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
                    vm.redrawFunctions[Object.keys(newSensorNames)[0]](newData);
                }
            } else if (sensor.value) {
                var realSensorName = sensor.name.split(':')[1].replace(/\./g, '_').replace(/-/g, '_');
                if (vm.redrawFunctions[realSensorName]) {
                    var sensorValue = {
                        sensor: realSensorName,
                        value_ts: sensor.value.timestamp * 1000,
                        sample_ts: sensor.value.received_timestamp * 1000
                    };
                    if (typeof(sensor.value.value) === "boolean") {
                        sensorValue.value = sensor.value.value ? "True" : "False";
                    } else {
                        sensorValue.value = sensor.value.value;
                    }
                    vm.redrawFunctions[realSensorName]([sensorValue]);
                }
            }
        };

        vm.connectLiveSensorFeed = function(sensorRegex) {
            if (sensorRegex.length > 0) {
                SensorsService.setSensorStrategies(
                    sensorRegex,
                    'event-rate',
                    1,
                    10);
            }
        };

        var unbindSensorUpdate = $rootScope.$on('sensorsServerUpdateMessage', vm.sensorDataReceived);

        vm.downloadCSVDummy = function() {

        };

        vm.removeSensorTimeline = function(sensor) {
            SensorsService.removeSensorStrategies(sensor.name);
            var sensorIndex = _.findIndex(vm.sensorTimelines, function(item) {
                return item.name === sensor.name;
            });
            if (sensorIndex > -1) {
                vm.sensorTimelines.splice(sensorIndex, 1);
                vm.sensorData[sensor.name] = {};
                vm.redrawFunctions[sensor.name] = {};
                vm.clearFunctions[sensor.name] = {};
                vm.removeFunctions[sensor.name] = {};
                vm.loadOptionsFunctions[sensor.name] = {};
            }
        };

        var unwatchSensorTimelines = $scope.$watchCollection('vm.sensorTimelines', function(newVal, oldVal) {
            if (newVal !== oldVal) {
                $localStorage.activityDisplaySensorNames = vm.sensorTimelines;
            }
        });

        $scope.$on('$destroy', function() {
            unbindScheduleUpdate();
            unbindOrderChangeAdd();
            unbindUserlogModify();
            unbindUserlogAdd();
            unbindSensorUpdate();
            unwatchSensorTimelines();
            MonitorService.unsubscribe('sched', '*');
            MonitorService.unsubscribe('userlogs', '*');
            SensorsService.disconnectListener();
        });
    }
})();
