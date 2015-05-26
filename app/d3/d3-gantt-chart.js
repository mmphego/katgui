angular.module('katGui.d3', [])

    .directive('observationScheduleGantt', function (d3Service) {
        /* istanbul ignore next */
        //experimental
        return {
            restrict: 'EA',
            scope: {
            },
            replace: false,
            link: function (scope, element) {

                d3Service.d3().then(function (d3) {

                    d3.gantt = function() {
                        var FIT_TIME_DOMAIN_MODE = "fit";
                        var FIXED_TIME_DOMAIN_MODE = "fixed";

                        var margin = {
                            top : 16,
                            right : 16 + 40,
                            bottom : 16,
                            left : 16 + 60
                        };
                        var timeDomainStart = d3.time.day.offset(new Date(),-3);
                        var timeDomainEnd = d3.time.hour.offset(new Date(),+3);
                        var timeDomainMode = FIT_TIME_DOMAIN_MODE;// fixed or fit
                        var taskTypes = [];
                        var taskStatus = [];
                        //var height = document.body.clientHeight - margin.top - margin.bottom-5;
                        //var width = document.body.clientWidth - margin.right - margin.left-5;

                        var height = 500 - margin.top - margin.bottom-5;
                        var width = document.body.clientWidth - 43 - margin.right - margin.left-5;

                        var tickFormat = "%H:%M";

                        var keyFunction = function(d) {
                            return d.startDate + d.taskName + d.endDate;
                        };

                        var rectTransform = function(d) {
                            return "translate(" + x(d.startDate) + "," + y(d.taskName) + ")";
                        };

                        var x = d3.time.scale().domain([ timeDomainStart, timeDomainEnd ]).range([ 0, width ]).clamp(true);

                        var y = d3.scale.ordinal().domain(taskTypes).rangeRoundBands([ 0, height - margin.top - margin.bottom ], 0.1);

                        var xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(d3.time.format(tickFormat)).tickSubdivide(true)
                            .tickSize(8).tickPadding(8);

                        var yAxis = d3.svg.axis().scale(y).orient("left").tickSize(0);

                        var initTimeDomain = function() {
                            if (timeDomainMode === FIT_TIME_DOMAIN_MODE) {
                                if (tasks === undefined || tasks.length < 1) {
                                    timeDomainStart = d3.time.day.offset(new Date(), -3);
                                    timeDomainEnd = d3.time.hour.offset(new Date(), +3);
                                    return;
                                }
                                tasks.sort(function(a, b) {
                                    return a.endDate - b.endDate;
                                });
                                timeDomainEnd = tasks[tasks.length - 1].endDate;
                                tasks.sort(function(a, b) {
                                    return a.startDate - b.startDate;
                                });
                                timeDomainStart = tasks[0].startDate;
                            }
                        };

                        var initAxis = function() {
                            x = d3.time.scale().domain([ timeDomainStart, timeDomainEnd ]).range([ 0, width ]).clamp(true);
                            y = d3.scale.ordinal().domain(taskTypes).rangeRoundBands([ 0, height - margin.top - margin.bottom ], 0.1);
                            xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(d3.time.format(tickFormat)).tickSubdivide(true)
                                .tickSize(8).tickPadding(8);

                            yAxis = d3.svg.axis().scale(y).orient("left").tickSize(0);
                        };

                        function gantt(tasks) {

                            initTimeDomain();
                            initAxis();

                            var svg = d3.select(element[0])
                                .append("svg")
                                .attr("class", "chart")
                                .attr("width", width + margin.left + margin.right)
                                .attr("height", height + margin.top + margin.bottom)
                                .append("g")
                                .attr("class", "gantt-chart")
                                .attr("width", width + margin.left + margin.right)
                                .attr("height", height + margin.top + margin.bottom)
                                .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

                            svg.selectAll(".chart")
                                .data(tasks, keyFunction).enter()
                                .append("rect")
                                .attr("rx", 5)
                                .attr("ry", 5)
                                .attr("class", function(d){
                                    if(taskStatus[d.status] == null){ return "bar";}
                                    return taskStatus[d.status];
                                })
                                .attr("y", 0)
                                .attr("transform", rectTransform)
                                .attr("height", function(d) { return y.rangeBand(); })
                                .attr("width", function(d) {
                                    return (x(d.endDate) - x(d.startDate));
                                });


                            svg.append("g")
                                .attr("class", "x axis")
                                .attr("transform", "translate(0, " + (height - margin.top - margin.bottom) + ")")
                                .transition()
                                .call(xAxis);

                            svg.append("g").attr("class", "y axis").transition().call(yAxis);

                            return gantt;
                        }

                        gantt.redraw = function(tasks) {

                            initTimeDomain();
                            initAxis();

                            var svg = d3.select("svg");

                            var ganttChartGroup = svg.select(".gantt-chart");
                            var rect = ganttChartGroup.selectAll("rect").data(tasks, keyFunction);

                            rect.enter()
                                .insert("rect",":first-child")
                                .attr("rx", 5)
                                .attr("ry", 5)
                                .attr("class", function(d){
                                    if(taskStatus[d.status] == null){ return "bar";}
                                    return taskStatus[d.status];
                                })
                                .transition()
                                .attr("y", 0)
                                .attr("transform", rectTransform)
                                .attr("height", function(d) { return y.rangeBand(); })
                                .attr("width", function(d) {
                                    return (x(d.endDate) - x(d.startDate));
                                });

                            rect.transition()
                                .attr("transform", rectTransform)
                                .attr("height", function(d) { return y.rangeBand(); })
                                .attr("width", function(d) {
                                    return (x(d.endDate) - x(d.startDate));
                                });

                            rect.exit().remove();

                            svg.select(".x").transition().call(xAxis);
                            svg.select(".y").transition().call(yAxis);

                            return gantt;
                        };

                        gantt.margin = function(value) {
                            if (!arguments.length) {
                                return margin;
                            }
                            margin = value;
                            return gantt;
                        };

                        gantt.timeDomain = function(value) {
                            if (!arguments.length) {
                                return [ timeDomainStart, timeDomainEnd ];
                            }
                            timeDomainStart = +value[0];
                            timeDomainEnd = +value[1];
                            return gantt;
                        };

                        /**
                         * @param {string}
                         *                vale The value can be "fit" - the domain fits the data or
                         *                "fixed" - fixed domain.
                         */
                        gantt.timeDomainMode = function(value) {
                            if (!arguments.length) {
                                return timeDomainMode;
                            }

                            timeDomainMode = value;
                            return gantt;
                        };

                        gantt.taskTypes = function(value) {
                            if (!arguments.length) {
                                return taskTypes;
                            }
                            taskTypes = value;
                            return gantt;
                        };

                        gantt.taskStatus = function(value) {
                            if (!arguments.length) {
                                return taskStatus;
                            }
                            taskStatus = value;
                            return gantt;
                        };

                        gantt.width = function(value) {
                            if (!arguments.length) {
                                return width;
                            }
                            width = +value;
                            return gantt;
                        };

                        gantt.height = function(value) {
                            if (!arguments.length) {
                                return height;
                            }
                            height = +value;
                            return gantt;
                        };

                        gantt.tickFormat = function(value) {
                            if (!arguments.length) {
                                return tickFormat;
                            }
                            tickFormat = value;
                            return gantt;
                        };

                        return gantt;
                    };

                    var tasks = [
                        {"startDate":new Date("Sun Dec 09 01:36:45 EST 2012"),"endDate":new Date("Sun Dec 09 02:36:45 EST 2012"),"taskName":"Sub-Array 1","status":"RUNNING"},
                        {"startDate":new Date("Sun Dec 09 04:56:32 EST 2012"),"endDate":new Date("Sun Dec 09 06:35:47 EST 2012"),"taskName":"Sub-Array 2","status":"RUNNING"},
                        {"startDate":new Date("Sun Dec 09 06:29:53 EST 2012"),"endDate":new Date("Sun Dec 09 06:34:04 EST 2012"),"taskName":"Sub-Array 3","status":"RUNNING"},
                        {"startDate":new Date("Sun Dec 09 05:35:21 EST 2012"),"endDate":new Date("Sun Dec 09 06:21:22 EST 2012"),"taskName":"Sub-Array 4","status":"RUNNING"},
                        {"startDate":new Date("Sun Dec 09 05:00:06 EST 2012"),"endDate":new Date("Sun Dec 09 05:05:07 EST 2012"),"taskName":"Sub-Array 3","status":"RUNNING"},
                        {"startDate":new Date("Sun Dec 09 03:46:59 EST 2012"),"endDate":new Date("Sun Dec 09 04:54:19 EST 2012"),"taskName":"Sub-Array 4","status":"RUNNING"},
                        {"startDate":new Date("Sun Dec 09 04:02:45 EST 2012"),"endDate":new Date("Sun Dec 09 04:48:56 EST 2012"),"taskName":"Sub-Array 1","status":"RUNNING"},
                        {"startDate":new Date("Sun Dec 09 03:27:35 EST 2012"),"endDate":new Date("Sun Dec 09 03:58:43 EST 2012"),"taskName":"Sub-Array 1","status":"SUCCEEDED"},
                        {"startDate":new Date("Sun Dec 09 01:40:11 EST 2012"),"endDate":new Date("Sun Dec 09 03:26:35 EST 2012"),"taskName":"Sub-Array 2","status":"SUCCEEDED"},
                        {"startDate":new Date("Sun Dec 09 03:00:03 EST 2012"),"endDate":new Date("Sun Dec 09 03:09:51 EST 2012"),"taskName":"Sub-Array 3","status":"SUCCEEDED"},
                        {"startDate":new Date("Sun Dec 09 01:21:00 EST 2012"),"endDate":new Date("Sun Dec 09 02:51:42 EST 2012"),"taskName":"Sub-Array 4","status":"SUCCEEDED"},
                        {"startDate":new Date("Sun Dec 09 01:08:42 EST 2012"),"endDate":new Date("Sun Dec 09 01:33:42 EST 2012"),"taskName":"Sub-Array 2","status":"FAILED"},
                        {"startDate":new Date("Sun Dec 09 00:27:15 EST 2012"),"endDate":new Date("Sun Dec 09 00:54:56 EST 2012"),"taskName":"Sub-Array 1","status":"SUCCEEDED"},
                        {"startDate":new Date("Sun Dec 09 00:29:48 EST 2012"),"endDate":new Date("Sun Dec 09 00:44:50 EST 2012"),"taskName":"Sub-Array 3","status":"SUCCEEDED"},
                        {"startDate":new Date("Sun Dec 09 07:39:21 EST 2012"),"endDate":new Date("Sun Dec 09 07:43:22 EST 2012"),"taskName":"Sub-Array 4","status":"RUNNING"},
                        {"startDate":new Date("Sun Dec 09 07:00:06 EST 2012"),"endDate":new Date("Sun Dec 09 07:05:07 EST 2012"),"taskName":"Sub-Array 3","status":"RUNNING"},
                        {"startDate":new Date("Sun Dec 09 08:46:59 EST 2012"),"endDate":new Date("Sun Dec 09 09:54:19 EST 2012"),"taskName":"Sub-Array 4","status":"RUNNING"},
                        {"startDate":new Date("Sun Dec 09 09:02:45 EST 2012"),"endDate":new Date("Sun Dec 09 09:48:56 EST 2012"),"taskName":"Sub-Array 3","status":"RUNNING"},
                        {"startDate":new Date("Sun Dec 09 08:27:35 EST 2012"),"endDate":new Date("Sun Dec 09 08:58:43 EST 2012"),"taskName":"Sub-Array 1","status":"SUCCEEDED"},
                        {"startDate":new Date("Sun Dec 09 08:40:11 EST 2012"),"endDate":new Date("Sun Dec 09 08:46:35 EST 2012"),"taskName":"Sub-Array 2","status":"SUCCEEDED"},
                        {"startDate":new Date("Sun Dec 09 08:00:03 EST 2012"),"endDate":new Date("Sun Dec 09 08:09:51 EST 2012"),"taskName":"Sub-Array 3","status":"SUCCEEDED"},
                        {"startDate":new Date("Sun Dec 09 10:21:00 EST 2012"),"endDate":new Date("Sun Dec 09 10:51:42 EST 2012"),"taskName":"Sub-Array 4","status":"SUCCEEDED"},
                        {"startDate":new Date("Sun Dec 09 11:08:42 EST 2012"),"endDate":new Date("Sun Dec 09 11:33:42 EST 2012"),"taskName":"Sub-Array 4","status":"FAILED"},
                        {"startDate":new Date("Sun Dec 09 12:27:15 EST 2012"),"endDate":new Date("Sun Dec 09 12:54:56 EST 2012"),"taskName":"Sub-Array 1","status":"SUCCEEDED"},
                        {"startDate":new Date("Sat Dec 08 23:12:24 EST 2012"),"endDate":new Date("Sun Dec 09 00:26:13 EST 2012"),"taskName":"Sub-Array 2","status":"KILLED"}];

                    var taskStatus = {
                        "SUCCEEDED" : "bar",
                        "FAILED" : "bar-failed",
                        "RUNNING" : "bar-running",
                        "KILLED" : "bar-killed"
                    };

                    var taskNames = [ "Sub-Array 1", "Sub-Array 2", "Sub-Array 3", "Sub-Array 4" ];

                    tasks.sort(function(a, b) {
                        return a.endDate - b.endDate;
                    });
                    var maxDate = tasks[tasks.length - 1].endDate;
                    tasks.sort(function(a, b) {
                        return a.startDate - b.startDate;
                    });
                    var minDate = tasks[0].startDate;

                    var format = "%H:%M";

                    var gantt = d3.gantt().taskTypes(taskNames).taskStatus(taskStatus).tickFormat(format);
                    gantt(tasks);
                });
            }
        };
    });
