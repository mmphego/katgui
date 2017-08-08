angular.module('katGui.d3')

    .directive('multiLineTwoYAxisChart', function (MOMENT_DATETIME_FORMAT, $timeout, $log) {
        return {
            restrict: 'EA',
            scope: {
                redrawFunction: '=',
                clearFunction: '=',
                removeSensorFunction: '=',
                yLeftMin: '=yLeftMin',
                yLeftMax: '=yLeftMax',
                yRightMin: '=yRightMin',
                yRightMax: '=yRightMax',
                mouseOverTooltip: '='
            },
            replace: false,
            link: function (scope, element) {

                scope.lockShowTooltip = false;
                var bgColor = angular.element(document.querySelector("md-content")).css('background-color');
                element.css({'background-color': bgColor});
                var contextBrushColor = '#333';
                if (bgColor !== 'rgb(255, 255, 255)') {
                    contextBrushColor = '#fff';
                }

                var unbindResize = scope.$watch(function () {
                    return element[0].clientHeight + ', ' + element[0].clientWidth;
                }, function (newVal, oldVal) {
                    if (newVal !== oldVal) {
                        //allow for some time for the dom elements to complete resizing
                        if (scope.resizeTimeout) {
                            $timeout.cancel(scope.resizeTimeout);
                            scope.resizeTimeout = null;
                        }
                        //allow for some time for the dom elements to complete resizing
                        scope.resizeTimeout = $timeout(function () {
                            drawSvg();
                            drawValues();
                        }, 750);
                    }
                });

                var color = d3.scale.category10();
                var bisectDate = d3.bisector(function (d) {
                    return d.date;
                }).left;
                scope.showGridLines = false;
                scope.currentBrush = {};
                scope.nestedData = [];
                scope.redrawFunction = function (newData, showGridLines, dataWindowDuration, forceRedraw) {

                    var doSort = false;
                    var redrawSVG = scope.nestedData.length === 0 || forceRedraw;
                    if (newData) {
                        newData.forEach(function (d) {
                            d.date = new Date(parseFloat(d.sample_ts));
                            d.value = parseFloat(d.value);

                            var existingDataLine = _.findWhere(scope.nestedData, {key: d.sensor});
                            if (existingDataLine) {
                                if (existingDataLine.values[existingDataLine.values.length - 1].sample_ts < existingDataLine.values[0].sample_ts) {
                                    doSort = true;
                                }
                                while (existingDataLine.values.length > 0 &&
                                new Date().getTime() - existingDataLine.values[0].date.getTime() > dataWindowDuration) {
                                    existingDataLine.values.splice(0, 1);
                                }
                                existingDataLine.values.push(d);
                                if (existingDataLine.values.length > 1 &&
                                    existingDataLine.values[0].sample_ts === existingDataLine.values[existingDataLine.values.length - 1].sample_ts) {
                                    existingDataLine.values.splice(existingDataLine.values.length - 1, 1);
                                }
                            } else {
                                scope.nestedData.push({key: d.sensor, values: [d], rightAxis: d.rightAxis, color: d.color});
                            }
                        });
                    }

                    if (doSort) {
                        scope.nestedData.forEach(function (d) {
                            d.values = _.sortBy(d.values, function (item) {
                                return item.sample_ts;
                            });
                        });
                        $log.info('Sorting all two-axis data sets.');
                    }

                    if (showGridLines !== scope.showGridLines || redrawSVG) {
                        scope.showGridLines = showGridLines;
                        drawSvg();
                    }

                    drawValues();
                };

                scope.clearFunction = function () {
                    scope.nestedData.splice(0, scope.nestedData.length);
                    drawSvg();
                    drawValues();
                };

                scope.removeSensorFunction = function (sensorName) {
                    var existingDataLine = _.findWhere(scope.nestedData, {key: sensorName.replace(/\./g, '_')});
                    if (existingDataLine) {
                        scope.nestedData.splice(scope.nestedData.indexOf(existingDataLine), 1);
                        d3.select("." + existingDataLine.key + "-tooltip").remove();
                        drawValues();
                    }
                };

                var tooltip = d3.select(element[0]).append("div")
                    .attr("class", "multi-line-tooltip")
                    .style('display', 'none');

                var margin = {top: 10, right: 60, bottom: 35, left: 60},
                    width, height;
                var svg, x, y, yRight, xAxis, yAxis, yAxisRight, line, lineRight,
                    xAxisElement, yAxisElement, yAxisRightElement, focus;

                var formatTwoDecimals = d3.format(",.2f");

                drawSvg();
                drawValues();

                function drawSvg() {

                    width = element[0].clientWidth - margin.left - margin.right;
                    height = element[0].clientHeight - margin.top - margin.bottom - 10;
                    if (height < 0) {
                        height = 0;
                    }

                    d3.select(element[0]).select('svg').remove();
                    svg = d3.select(element[0]).append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom);

                    focus = svg.append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                    if (scope.mouseOverTooltip && width > 0 && height > 0) {
                        scope.overlay = svg.append("rect")
                            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                            .attr("width", width)
                            .attr("height", height)
                            .attr("class", "overlay")
                            .on("mouseout", function () {
                                if (!scope.lockShowTooltip) {
                                    d3.select(element[0]).selectAll(".focus-tooltip").style("display", "none");
                                    tooltip.style('display', 'none');
                                }
                            })
                            .on("mouseover", function () {
                                if (!scope.lockShowTooltip) {
                                    d3.select(element[0]).selectAll(".focus-tooltip").style("display", "initial");
                                    tooltip.style('display', 'initial');
                                }
                            })
                            .on("mousemove", function () {
                                mousemove(scope.lockShowTooltip);
                            })
                            .on("mousedown", function () {
                                scope.lockShowTooltip = !scope.lockShowTooltip;
                            });
                    }

                    // set the ranges
                    x = d3.time.scale.utc().range([0, width]);
                    y = d3.scale.linear().range([height, 0]);
                    yRight = d3.scale.linear().range([height, 0]);

                    // define the axes
                    xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(10);
                    yAxis = d3.svg.axis().scale(y).orient("left").ticks(10);
                    yAxisRight = d3.svg.axis().scale(yRight).orient("right").ticks(10);

                    if (scope.showGridLines) {
                        xAxis.tickSize(-height);
                        yAxis.tickSize(-width);
                    }

                    // define the line
                    line = d3.svg.line()
                        .interpolate("cubic")
                        .x(function (d) {
                            return x(d.date);
                        })
                        .y(function (d) {
                            return y(d.value);
                        });

                    lineRight = d3.svg.line()
                        .interpolate("cubic")
                        .x(function (d) {
                            return x(d.date);
                        })
                        .y(function (d) {
                            return yRight(d.value);
                        });

                    xAxisElement = focus.append("g")
                        .attr("class", "x axis")
                        .attr("transform", "translate(0," + height + ")");

                    yAxisElement = focus.append("g")
                        .attr("class", "y axis y-axis");

                    yAxisRightElement = focus.append("g")
                        .attr("class", "y y-axis y-axis-opacity right-y-axis")
                        .attr("transform", "translate(" + width + ", 0)");
                }

                function drawValues() {

                    // scale the range of the data
                    x.domain([
                        d3.min(scope.nestedData, function (sensors) {
                            return sensors.values[0].date;
                        }),
                        d3.max(scope.nestedData, function (sensors) {
                            return sensors.values[sensors.values.length - 1].date;
                        })
                    ]);

                    y.domain([scope.yLeftMin, scope.yLeftMax]);
                    yRight.domain([scope.yRightMin, scope.yRightMax]);

                    focus.selectAll(".path-container").remove();
                    var focuslineGroups = focus.selectAll("svg")
                        .data(scope.nestedData)
                        .enter()
                        .append("g")
                        .attr("class", "path-container");

                    var focuslines = focuslineGroups.append("path")
                        .attr("id", function (d) {
                            var c = d.color;
                            if (!c) {
                                c = color(d.key);
                            }
                            var style = document.getElementById(d.key + '_style_tag');
                            if (style && style.parentNode) {
                                style.parentNode.removeChild(style);
                            }
                            style = document.createElement('style');
                            style.type = 'text/css';
                            style.id = d.key + '_style_tag';
                            style.innerHTML = '.' + d.key + ' {color:' + c + '; stroke:' + c + '; fill:' + c + '}';
                            document.getElementsByTagName('head')[0].appendChild(style);
                            if (d.rightAxis) {
                                var axisStyle = document.getElementById('right-y-axis');
                                if (axisStyle && axisStyle.parentNode) {
                                    axisStyle.parentNode.removeChild(axisStyle);
                                }
                                axisStyle = document.createElement('style');
                                axisStyle.type = 'text/css';
                                axisStyle.id = 'right-y-axis';
                                axisStyle.innerHTML = '.right-y-axis {color:' + c + '; fill:' + c + '}';
                                document.getElementsByTagName('head')[0].appendChild(axisStyle);
                            }
                            return d.key;
                        })
                        .attr("class", function (d) {
                            return "line " + d.key + " path-line";
                        })
                        .attr("d", function (d) {
                            if (d.rightAxis) {
                                return lineRight(d.values);
                            } else {
                                return line(d.values);
                            }
                        });

                    if (scope.mouseOverTooltip) {
                        scope.nestedData.forEach(function (data) {
                            if (!d3.select("." + data.key + "-tooltip")[0][0]) {
                                var focusTooltip = svg.append("g")
                                    .attr("class", "focus-tooltip " + data.key + "-tooltip " + data.key)
                                    .style("display", "none");
                                focusTooltip.append("circle")
                                    .attr("class", "focus-tooltip-circle")
                                    .attr("r", 4.5);
                            }
                        });
                        mousemove(true);
                    }

                    xAxisElement.call(xAxis);
                    yAxisElement.call(yAxis);
                    yAxisRightElement.call(yAxisRight);

                    yAxisElement.selectAll(".y-axis text")
                        .each(function (d) {
                            wrapText(this, d.toString(), margin.left);
                        });
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

                function mousemove(calledWithoutEvent) {
                    if (scope.nestedData.length === 0) {
                        return;
                    }
                    var mouse = null;
                    var tooltipValues = [];
                    scope.nestedData.forEach(function (data) {
                        if (!calledWithoutEvent) {
                            mouse = d3.mouse(scope.overlay[0][0]);
                        } else {
                            //this method was called from somewhere else
                            //not by an actual mouse move event
                            //to update the tooltip position for moving data
                            mouse = scope.lastMouse;
                        }
                        if (!mouse) {
                            return;
                        }

                        var x0 = x.invert(mouse[0]),
                            i = bisectDate(data.values, x0, 1);
                        var d0 = data.values[i - 1],
                            d1 = data.values[i];

                        var d;

                        if (d0 && d0.date && d1 && d1.date) {
                            d = x0 - d0.date > d1.date - x0 ? d1 : d0;

                            var xTranslate = (x(d.date) + margin.left);
                            var yTranslate = 0;
                            if (d.rightAxis) {
                                yTranslate = (yRight(d.value) + margin.top);
                            } else {
                                yTranslate = (y(d.value) + margin.top);
                            }

                            var focusToolTip = d3.selectAll("." + data.key + "-tooltip");
                            focusToolTip.attr("transform", "translate(" + xTranslate + "," + yTranslate + ")");
                            d.TooltipValue = formatTwoDecimals(d.value);
                            tooltipValues.push(d);
                        }
                    });
                    if (tooltipValues.length > 0) {
                        var html = "";
                        for (var i in tooltipValues) {
                            html += "<div class='" + tooltipValues[i].sensor + "' style='display: flex'>";
                            html += "<i style='flex: 1 100%'>" + (tooltipValues[i].sensor ? tooltipValues[i].sensor : tooltipValues[i].name) + "</i>";
                            html += "<div><b style='margin-left: 8px;'> " + tooltipValues[i].TooltipValue + "</b></div>";
                            html += "<div style='min-width: 120px'><span style='margin-left: 6px'>" + moment.utc(tooltipValues[i].date).format(MOMENT_DATETIME_FORMAT) + "</span></div>";
                            html += "</div>";
                        }
                        html += "";
                        tooltip.html(html);
                        var xTranslate = (x(tooltipValues[0].date) + margin.left + 15);

                        if (xTranslate + tooltip[0][0].clientWidth > width) {
                            xTranslate -= tooltip[0][0].clientWidth + 20;
                        }

                        tooltip.style("transform", "translate(" + (xTranslate ) + "px,  0)");
                    }

                    if (!calledWithoutEvent) {
                        scope.lastMouse = mouse;
                    }
                }

                scope.$on('$destroy', function () {
                    unbindResize();
                });
            }
        };
    });
