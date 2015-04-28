angular.module('katGui.d3', [])

    .directive('multiLineChart', function ($window, d3Service) {
        return {
            restrict: 'EA',
            scope: {
                redrawFunction: '=',
                clearFunction: '=',
                removeSensorFunction: '='
            },
            replace: false,
            link: function (scope, element) {

                d3Service.d3().then(function (d3) {

                    var unbindResize = scope.$watch(function () {
                        return element[0].clientHeight + ', ' + element[0].clientWidth;
                    }, function (newVal, oldVal) {
                        if (newVal !== oldVal) {
                            scope.redrawFunction(null, scope.showGridLines);
                        }
                    });

                    var color = d3.scale.category10();
                    scope.data = [];
                    scope.redrawFunction = function (newData, showGridLines) {
                        if (newData) {
                            newData.forEach(function (d) {
                                d.date = new Date(parseFloat(d.Timestamp) * 1000);
                                d.value = parseFloat(d.Value);
                                scope.data.push(d);
                            });
                        }
                        scope.showGridLines = showGridLines;
                        d3.selectAll('svg').remove();
                        drawChart();
                    };

                    scope.clearFunction = function () {
                        scope.data.splice(0, scope.data.length);
                        d3.select('svg').remove();
                        drawChart();
                    };

                    scope.removeSensorFunction = function (sensorName) {
                        console.log('remove ' + sensorName);
                        scope.data = _.reject(scope.data, function (item) {
                            return item.Sensor === sensorName;
                        });
                        d3.select('svg').remove();
                        drawChart();
                    };

                    drawChart();

                    function drawChart() {

                        var margin = {top: 10, right: 10, bottom: 100, left: 40},
                            margin2 = {top: element[0].clientHeight - 70, right: 10, bottom: 20, left: 40},
                            width = element[0].clientWidth - margin.left - margin.right,
                            height = element[0].clientHeight - margin.top - margin.bottom,
                            height2 = element[0].clientHeight - margin2.top - margin2.bottom;

                        // set the ranges
                        var x = d3.time.scale().range([0, width]),
                            x2 = d3.time.scale().range([0, width]),
                            y = d3.scale.linear().range([height, 0]),
                            y2 = d3.scale.linear().range([height2, 0]);

                        // define the axes
                        var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(10),
                            xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
                            yAxis = d3.svg.axis().scale(y).orient("left").ticks(10);

                        var brush = d3.svg.brush()
                            .x(x2)
                            .on("brush", brushed);

                        //var zoom = d3.behavior.zoom()
                        //    .x(x)
                        //    .y(y)
                        //    .scaleExtent([1, 10])
                        //    .on("zoom", zoomed);

                        if (scope.showGridLines) {
                            xAxis.tickSize(-height);//.tickSubdivide(true);
                            yAxis.tickSize(-width);//.tickSubdivide(true);
                        }

                        // define the line
                        var line = d3.svg.line()
                            .interpolate("cubic")
                            .x(function (d) {
                                return x(d.date);
                            })
                            .y(function (d) {
                                return y(d.value);
                            });

                        var line2 = d3.svg.line()
                            .interpolate("cubic")
                            .x(function (d) {
                                return x2(d.date);
                            })
                            .y(function (d) {
                                return y2(d.value);
                            });

                        //element.parent().css("max-height", element.parent().css("height"));
                        //element.parent().css("max-width", element.parent().css("width"));

                        var svg = d3.select(element[0]).append("svg")
                            .attr("width", width + margin.left + margin.right)
                            .attr("height", height + margin.top + margin.bottom);

                        svg.append("defs").append("clipPath")
                            .attr("id", "clip")
                            .append("rect")
                            .attr("width", width)
                            .attr("height", height);

                        var focus = svg.append("g")
                            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                        var context = svg.append("g")
                            .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

                        if (scope.data.length > 0) {

                            // scale the range of the data
                            x.domain(d3.extent(scope.data, function (d) {
                                return d.date;
                            }));
                            y.domain([
                                d3.min(scope.data, function (d) {
                                    return d.value;
                                }),
                                d3.max(scope.data, function (d) {
                                    return d.value;
                                })
                            ]);

                            x2.domain(x.domain());
                            y2.domain(y.domain());

                            // nest the entries by symbol
                            var dataNest = d3.nest()
                                .key(function (d) {
                                    return d.Sensor;
                                })
                                .entries(scope.data);

                            // nest the entries by symbol
                            //color.domain(d3.keys(scope.data[0]).filter(function(key) { return key !== "date"; }));
                            //
                            //var sources = color.domain().map(function(name) {
                            //    return {
                            //        name: name,
                            //        values: scope.data.map(function(d) {
                            //            return {date: d.date, value: +d[name]};
                            //        })
                            //    };
                            //});

                            var focuslineGroups = focus.selectAll("g")
                                .data(dataNest)
                                .enter().append("g");

                            var focuslines = focuslineGroups.append("path")
                                .attr("class", "line")
                                .attr("d", function (d) {
                                    return line(d.values);
                                })
                                .style("stroke", function (d) {
                                    return color(d.key);
                                })
                                .attr("clip-path", "url(#clip)");

                            focus.append("g")
                                .attr("class", "x axis")
                                .attr("transform", "translate(0," + height + ")")
                                .call(xAxis);

                            focus.append("g")
                                .attr("class", "y axis")
                                .call(yAxis);

                            var contextlineGroups = context.selectAll("g")
                                .data(dataNest)
                                .enter().append("g");

                            var contextLines = contextlineGroups.append("path")
                                .attr("class", "line")
                                .attr("d", function (d) {
                                    return line2(d.values);
                                })
                                .style("stroke", function (d) {
                                    return color(d.key);
                                })
                                .attr("clip-path", "url(#clip)");

                            context.append("g")
                                .attr("class", "x axis")
                                .attr("transform", "translate(0," + height2 + ")")
                                .call(xAxis2);

                            context.append("g")
                                .attr("class", "x brush")
                                .call(brush)
                                .selectAll("rect")
                                .attr("y", -6)
                                .attr("height", height2 + 7);

                            function brushed() {
                                x.domain(brush.empty() ? x2.domain() : brush.extent());
                                focus.selectAll("path.line").attr("d", function (d) {
                                    return line(d.values);
                                });
                                focus.select(".x.axis").call(xAxis);
                                focus.select(".y.axis").call(yAxis);
                            }
                        }
                    }

                    scope.$on('$destroy', function () {
                        unbindResize();
                    });
                });
            }
        };
    });
