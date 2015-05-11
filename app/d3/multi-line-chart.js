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

                    var color = d3.scale.category20();
                    scope.data = [];
                    scope.redrawFunction = function (newData, showGridLines, yAxisValues) {

                        if (yAxisValues) {
                            yAxisValues = yAxisValues.replace(/\'/g, '"');
                            scope.yAxisValues = JSON.parse(yAxisValues);
                            scope.yAxisValues = _.sortBy(scope.yAxisValues, function (d) {
                                return d.toUpperCase();
                            });
                        }

                        if (newData) {
                            newData.forEach(function (d) {
                                d.date = new Date(parseFloat(d.Timestamp) * 1000);
                                if (yAxisValues) {
                                    d.value = d.Value;
                                } else {
                                    d.value = parseFloat(d.Value);
                                }
                                if (newData.length === 1 && scope.data.length > 100) {
                                    scope.data.splice(0, 1);
                                }
                                scope.data.push(d);
                            });

                            scope.data = _.sortBy(scope.data, function (d) {
                                return d.Timestamp;
                            });
                            scope.data = _.uniq(scope.data);
                        }

                        scope.showGridLines = showGridLines;
                        d3.selectAll('svg').remove();
                        drawChart();
                    };

                    scope.clearFunction = function () {
                        scope.yAxisValues = null;
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

                    var tooltip = d3.select(element[0]).append("div")
                        .attr("class", "multi-line-tooltip")
                        .style("opacity", 0);

                    drawChart();

                    function drawChart() {

                        var margin = {top: 10, right: 10, bottom: 100, left: 40},
                            margin2 = {top: element[0].clientHeight - 70, right: 10, bottom: 20, left: 40},
                            width = element[0].clientWidth - margin.left - margin.right,
                            height = element[0].clientHeight - margin.top - margin.bottom,
                            height2 = element[0].clientHeight - margin2.top - margin2.bottom;

                        if (scope.yAxisValues) {
                            margin = {top: 10, right: 10, bottom: 100, left: 120};
                            margin2 = {top: element[0].clientHeight - 70, right: 10, bottom: 20, left: 120};
                            width = element[0].clientWidth - margin.left - margin.right;
                            height = element[0].clientHeight - margin.top - margin.bottom;
                            height2 = element[0].clientHeight - margin2.top - margin2.bottom;
                        }

                        // set the ranges
                        var x = d3.time.scale().range([0, width]),
                            x2 = d3.time.scale().range([0, width]);

                        var y = null;
                        var y2 = null;
                        if (scope.yAxisValues) {
                            y = d3.scale.ordinal().rangePoints([height, 0]);
                            y2 = d3.scale.ordinal().rangePoints([height2, 0]);
                        } else {
                            y = d3.scale.linear().range([height, 0]);
                            y2 = d3.scale.linear().range([height2, 0]);
                        }

                        // define the axes
                        var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(10),
                            xAxis2 = d3.svg.axis().scale(x2).orient("bottom");

                        var yAxis = null;
                        if (scope.yAxisValues) {
                            yAxis = d3.svg.axis()
                                .scale(y).orient("left")
                                .ticks(scope.yAxisValues.length)
                                .tickFormat(function (d, i) {
                                    return scope.yAxisValues[i];
                                });
                        } else {
                            yAxis = d3.svg.axis().scale(y).orient("left").ticks(10);
                        }

                        var brush = d3.svg.brush()
                            .x(x2)
                            .on("brush", function () {
                                x.domain(brush.empty() ? x2.domain() : brush.extent());
                                focus.selectAll("path.line").attr("d", function (d) {
                                    return line(d.values);
                                });
                                focus.select(".x.axis").call(xAxis);
                                focus.select(".y.axis").call(yAxis);
                                d3.selectAll("circle")
                                    .attr("cx", function (d) {
                                        return x(d.date);
                                    })
                                    .attr("cy", function (d) {
                                        return y(d.value);
                                    });
                            });

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

                        //if (scope.data.length > 0) {

                        // scale the range of the data
                        x.domain(d3.extent(scope.data, function (d) {
                            return d.date;
                        }));

                        if (!scope.yAxisValues) {
                            y.domain([
                                d3.min(scope.data, function (d) {
                                    return d.value;
                                }) - 1,
                                d3.max(scope.data, function (d) {
                                    return d.value;
                                }) + 1
                            ]);
                        } else {
                            y.domain(scope.yAxisValues);
                        }

                        x2.domain(x.domain());
                        y2.domain(y.domain());

                        var dataNest = d3.nest()
                            .key(function (d) {
                                return d.Sensor;
                            })
                            .entries(scope.data);

                        var focuslineGroups = focus.selectAll("g")
                            .data(dataNest)
                            .enter().append("g");

                        var focuslines = focuslineGroups.append("path")
                            .attr("id", function (d) {
                                var c = color(d.key);
                                var style = document.getElementById(d.key + '_style_tag');
                                if (style && style.parentNode) {
                                    style.parentNode.removeChild(style);
                                }
                                style = document.createElement('style');
                                style.type = 'text/css';
                                style.id = d.key + '_style_tag';
                                style.innerHTML = '.' + d.key + ' {color:' + c + '; stroke:' + c + '; fill:' + c + '}';
                                document.getElementsByTagName('head')[0].appendChild(style);
                                return d.key;
                            })
                            .attr("class", function (d) {
                                return "line " + d.key;
                            })
                            .attr("d", function (d) {
                                return line(d.values);
                            })
                            .attr("clip-path", "url(#clip)");

                        focus.append("g")
                            .attr("class", "x axis")
                            .attr("transform", "translate(0," + height + ")")
                            .call(xAxis);

                        var yAxisElement = focus.append("g")
                            .attr("class", "y axis y-axis")
                            .call(yAxis);
                        if (scope.yAxisValues) {
                            yAxisElement.selectAll(".y-axis text")
                                .each(function (d, i) {
                                    wrapText(this, scope.yAxisValues[i], margin.left);
                                });
                        }

                        focus.selectAll("g.dot")
                            .data(dataNest)
                            .enter().append("g")
                            .attr("class", function (d) {
                                return "dot " + d.key;
                            })
                            .selectAll("circle")
                            .data(function (d) {
                                return d.values;
                            })
                            .enter().append("circle")
                            .attr("r", 3)
                            .attr("cx", function (d) {
                                return x(d.date);
                            })
                            .attr("cy", function (d) {
                                return y(d.value);
                            })
                            .attr("clip-path", "url(#clip)")
                            .on("mouseover", function (d) {
                                tooltip.transition().duration(1).style("opacity", 0.9);
                                tooltip.html(
                                    "<div><b>" + d.Sensor + "</b>" +
                                    "<br/><i>value:</i> " + d.value +
                                    "<br/>" + moment.utc(d.Timestamp, 'X').format('HH:mm:ss DD-MM-YYYY') +
                                    "</div>"
                                );

                                var x = d3.event.layerX;
                                var y = d3.event.layerY;
                                //move the tooltip to 36,36 when we hover over the hide button
                                if (window.innerWidth - x < 240) {
                                    x = window.innerWidth - 240;
                                }
                                if (window.innerHeight - y < 240) {
                                    y = window.innerHeight - 240;
                                }
                                tooltip
                                    .style("top", (y + 15 + angular.element('#ui-view-container-div').scrollTop()) + "px")
                                    .style("left", (x + 15 + angular.element('#ui-view-container-div').scrollLeft()) + "px");
                            })
                            .on("mouseout", function () {
                                tooltip.transition()
                                    .duration(1)
                                    .style("opacity", 0);
                            });

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
                    }

                    function wrapText(text, d, width) {

                        var el = d3.select(text);
                        var p = d3.select(text.parentNode);
                        p.append("foreignObject")
                            .attr('x', -width)
                            .attr('y', -10)
                            .attr("width", width)
                            .attr("height", 200)
                            .append("xhtml:p")
                            .attr('style', 'word-wrap: break-word; text-align:center;')

                            .html(d);

                        el.remove();
                    }

                    scope.$on('$destroy', function () {
                        unbindResize();
                    });
                });
            }
        };
    });
