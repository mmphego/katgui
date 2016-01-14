angular.module('katGui.d3')

    .directive('multiLineChart', function (DATETIME_FORMAT, $timeout, $log) {
        return {
            restrict: 'EA',
            scope: {
                redrawFunction: '=',
                clearFunction: '=',
                removeSensorFunction: '=',
                hideContextZoom: '@hideContextZoom',
                yMin: '=yMin',
                yMax: '=yMax',
                mouseOverTooltip: '@'
            },
            replace: false,
            link: function (scope, element) {

                scope.lockShowTooltip = false;
                var bgColor = angular.element(document.querySelector("md-content")).css('background-color');
                element.css({'background-color': bgColor});
                scope.hideTooltip = true;
                var contextBrushColor = '#333';
                if (bgColor !== 'rgb(255, 255, 255)') {
                    contextBrushColor = '#fff';
                }

                var unbindResize = scope.$watch(function () {
                    return element[0].clientHeight + ', ' + element[0].clientWidth;
                }, function (newVal, oldVal) {
                    if (newVal !== oldVal) {
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

                var color = d3.scale.category20();
                var bisectDate = d3.bisector(function (d) {
                    return d.date;
                }).left;
                scope.showGridLines = false;
                scope.hideContextZoom = false;
                scope.currentBrush = {};
                scope.nestedData = [];
                scope.redrawFunction = function (newData, showGridLines, hideContextZoom, useFixedYAxis, yAxisValues, dataLimit, limitOverlayValues, forceRedraw) {

                    var redrawSVG = false;
                    if (yAxisValues) {
                        yAxisValues = yAxisValues.replace(/\'/g, '"');
                        scope.yAxisValues = JSON.parse(yAxisValues);
                        scope.yAxisValues = _.sortBy(scope.yAxisValues, function (d) {
                            return d.toUpperCase();
                        });
                    }
                    var doSort = false;

                    if (newData) {
                        newData.forEach(function (d) {
                            d.date = new Date(d.sample_ts);
                            if (yAxisValues) {
                                d.value = d.value;
                            } else {
                                if (typeof(d.value) === 'boolean') {
                                    d.value = d.value ? 1 : 0;
                                } else if (typeof(d.value) === 'number' || !isNaN(d.value)) {
                                    d.value = d.value;
                                } else {
                                    d.value = d.value;
                                    if (!scope.yAxisValues) {
                                        scope.yAxisValues = [];
                                    }
                                    var yAxisValue = d.value.replace(/\'/g, '"');
                                    if (scope.yAxisValues.indexOf(yAxisValue) === -1) {
                                        scope.yAxisValues.push(yAxisValue);
                                        scope.yAxisValues = _.sortBy(scope.yAxisValues, function (d) {
                                            return d.toUpperCase();
                                        });
                                        redrawSVG = true;
                                    }
                                }
                            }

                            var existingDataLine = _.findWhere(scope.nestedData, {key: d.sensor});
                            if (existingDataLine) {
                                if (dataLimit && existingDataLine.values.length > dataLimit) {
                                    existingDataLine.values.splice(0, 1);
                                }
                                if (d.sample_ts < existingDataLine.values[0].sample_ts ||
                                    d.sample_ts < existingDataLine.values[existingDataLine.values.length - 1].sample_ts) {
                                    doSort = true;
                                }
                                existingDataLine.values.push(d);
                                if (existingDataLine.values.length > 1 &&
                                    existingDataLine.values[0].sample_ts === existingDataLine.values[existingDataLine.values.length - 1].sample_ts) {
                                    existingDataLine.values.splice(existingDataLine.values.length - 1, 1);
                                }
                            } else {
                                scope.nestedData.push({key: d.sensor, values: [d], color: d.color});
                            }
                        });

                        if (doSort) {
                            scope.nestedData.forEach(function (d) {
                                d.values = _.sortBy(d.values, function (item) {
                                    return item.sample_ts;
                                });
                            });
                            $log.info('Sorting all data sets.');
                        }
                    }

                    if (showGridLines !== scope.showGridLines) {
                        scope.showGridLines = showGridLines;
                        redrawSVG = true;
                    }

                    if (hideContextZoom !== scope.hideContextZoom) {
                        scope.hideContextZoom = hideContextZoom;
                        redrawSVG = true;
                    }

                    scope.limitOverlayValues = limitOverlayValues;
                    scope.useFixedYAxis = useFixedYAxis;

                    if (forceRedraw || redrawSVG) {
                        drawSvg();
                    }

                    drawValues();
                    if (!hideContextZoom) {
                        scope.brushFunction();
                    }
                };

                scope.clearFunction = function () {
                    scope.yAxisValues = null;
                    scope.nestedData = [];
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
                    .attr("class", "multi-line-tooltip");

                var margin = {top: 10, right: 10, bottom: 110, left: 60},
                    width, height, height2;
                var margin2 = {top: 0, right: 10, bottom: 20, left: 60};
                var svg, x, y, x2, y2, xAxis, yAxis, xAxis2, line, line2,
                    xAxisElement, yAxisElement, xAxisElement2, context, focus;

                var formatTwoDecimals = d3.format(",.2f");
                var limitOverlayElements = [];

                drawSvg();
                drawValues();

                function drawSvg() {

                    if (scope.yAxisValues) {
                        margin.left = 120;
                        margin2 = {top: element[0].clientHeight - 80, right: 10, bottom: 20, left: 120};
                    } else {
                        margin.left = 60;
                        margin2 = {top: element[0].clientHeight - 80, right: 10, bottom: 20, left: 60};
                    }

                    if (scope.hideContextZoom) {
                        margin.bottom = 35;
                    } else {
                        margin.bottom = 110;
                    }

                    width = element[0].clientWidth - margin.left - margin.right;
                    height = element[0].clientHeight - margin.top - margin.bottom - 5;

                    height2 = 70;
                    if (height < 0) {
                        height = 0;
                    }

                    if (width < 0) {
                        width = 0;
                    }

                    d3.select(element[0]).select('svg').remove();
                    svg = d3.select(element[0]).append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom);

                    if (!scope.hideContextZoom) {
                        svg.append("defs").append("clipPath")
                            .attr("id", "clip")
                            .append("rect")
                            .attr("width", width)
                            .attr("height", height);
                    }

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
                                if (!scope.lockShowTooltip && scope.nestedData.length > 0) {
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
                    y = null;
                    if (scope.yAxisValues) {
                        y = d3.scale.ordinal().rangePoints([height, 0]);
                    } else {
                        y = d3.scale.linear().range([height, 0]);
                    }

                    // define the axes
                    xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(10);

                    yAxis = null;
                    if (scope.yAxisValues) {
                        yAxis = d3.svg.axis()
                            .scale(y).orient("left")
                            .ticks(scope.yAxisValues.length)
                            .tickFormat(function (d, i) {
                                return scope.yAxisValues[i];
                            });
                    } else {
                        yAxis = d3.svg.axis().scale(y).orient("left").ticks(10).tickFormat(d3.format(".00f"));
                    }

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

                    xAxisElement = focus.append("g")
                        .attr("class", "x axis")
                        .attr("transform", "translate(0," + height + ")");

                    yAxisElement = focus.append("g")
                        .attr("class", "y axis y-axis");

                    if (!scope.hideContextZoom) {

                        y2 = null;
                        x2 = d3.time.scale.utc().range([0, width]);

                        if (scope.yAxisValues) {
                            y2 = d3.scale.ordinal().rangePoints([height2, 0]);
                        } else {
                            y2 = d3.scale.linear().range([height2, 0]);
                        }

                        line2 = d3.svg.line()
                            .interpolate("cubic")
                            .x(function (d) {
                                return x2(d.date);
                            })
                            .y(function (d) {
                                return y2(d.value);
                            });

                        context = svg.append("g")
                            .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

                        xAxis2 = d3.svg.axis().scale(x2).orient("bottom").ticks(0);

                        xAxisElement2 = context.append("g")
                            .attr("class", "x axis")
                            .attr("transform", "translate(0," + height2 + ")");

                        scope.brushFunction = function () {
                            x.domain(brush.empty() ? x2.domain() : brush.extent());
                            focus.selectAll("path.line").attr("d", function (d) {
                                return line(d.values);
                            });
                            focus.select(".x.axis").call(xAxis);
                            focus.select(".y.axis").call(yAxis);
                        };

                        var brush = d3.svg.brush()
                            .x(x2)
                            .on("brush", scope.brushFunction);

                        context.append("g")
                            .attr("class", "x brush")
                            .style("stroke", contextBrushColor)
                            .call(brush)
                            .selectAll("rect")
                            .attr("y", -6)
                            .attr("height", height2 + 7);
                    }

                    if (scope.limitOverlayValues) {
                        limitOverlayElements.splice(0, limitOverlayElements.length);
                        scope.limitOverlayValues.forEach(function (limit) {
                            limitOverlayElements.push(focus.append("line")
                                .style("stroke", "#F44336")
                                .style("stroke-dasharray", "10, 5")
                                .attr("class", "limit-overlay-path"));
                        });
                    }
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

                    if (scope.useFixedYAxis && !scope.yAxisValues) {
                        y.domain([scope.yMin, scope.yMax]);
                    } else if (!scope.yAxisValues) {
                        var yExtent = [
                            d3.min(scope.nestedData, function (sensors) {
                                return d3.min(sensors.values, function (d) {
                                    return d.value;
                                });
                            }),
                            d3.max(scope.nestedData, function (sensors) {
                                return d3.max(sensors.values, function (d) {
                                    return d.value;
                                });
                            })
                        ];
                        if (yExtent[0] === yExtent[1]) {
                            yExtent[0] = yExtent[0] - 1;
                            yExtent[1] = yExtent[1] + 1;
                        }
                        y.domain(yExtent);
                    } else {
                        y.domain(scope.yAxisValues);
                    }

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
                            return d.key;
                        })
                        .attr("class", function (d) {
                            return "line " + d.key + " path-line";
                        })
                        .attr("d", function (d) {
                            return line(d.values);
                        }).attr("clip-path", "url(#clip)");

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

                    if (scope.yAxisValues) {
                        yAxisElement.selectAll(".y-axis text")
                            .each(function (d, i) {
                                wrapText(this, scope.yAxisValues[i], margin.left);
                            });
                    } else {
                        yAxisElement.selectAll(".y-axis text")
                            .each(function (d) {
                                wrapText(this, formatTwoDecimals(d).toString(), margin.left);
                            });
                    }

                    //context zoom element start
                    if (!scope.hideContextZoom) {

                        x2.domain(x.domain());
                        y2.domain(y.domain());

                        context.selectAll(".brush-container").remove();

                        var contextlineGroups = context.selectAll("svg")
                            .data(scope.nestedData)
                            .enter()
                            .append("g")
                            .attr("class", "brush-container");

                        var contextLines = contextlineGroups.append("path")
                            .attr("class", "line context-line")
                            .attr("d", function (d) {
                                return line2(d.values);
                            })
                            .style("stroke", function (d) {
                                var c = d.color;
                                if (!c) {
                                    c = color(d.key);
                                }
                                return c;
                            })
                            .attr("clip-path", "url(#clip)");

                        xAxisElement2.call(xAxis2);

                    }
                    //context zoom element stop

                    if (limitOverlayElements) {
                        limitOverlayElements.forEach(function (limitElement, index) {
                            limitElement.attr("x1", "0")
                                .attr("x2", width)
                                .attr("y1", y(scope.limitOverlayValues[index]))
                                .attr("y2", y(scope.limitOverlayValues[index]));
                        });

                    }
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
                            var yTranslate = (y(d.value) + margin.top);

                            var focusToolTip = d3.selectAll("." + data.key + "-tooltip");
                            focusToolTip.attr("transform", "translate(" + xTranslate + "," + yTranslate + ")");
                            if (typeof(d.value) === 'number') {
                                d.TooltipValue = formatTwoDecimals(d.value);
                            } else {
                                d.TooltipValue = d.value;
                            }
                            tooltipValues.push(d);
                        }
                    });
                    if (tooltipValues.length > 0) {
                        var html = "";
                        for (var i in tooltipValues) {
                            html += "<div class='" + tooltipValues[i].sensor + "' layout='column'>";
                            html += "<span layout='row'><i flex>" + (tooltipValues[i].sensor ? tooltipValues[i].sensor : tooltipValues[i].name) + ": </i><b style='margin-left: 8px;'> " + tooltipValues[i].TooltipValue + "</b></span>";
                            html += "<span style='margin-left: 6px'>" + moment.utc(tooltipValues[i].date).format(DATETIME_FORMAT) + "</span>";
                            html += "</div>";
                        }
                        html += "";
                        tooltip.html(html);
                        var xTranslate = (x(tooltipValues[0].date) + margin.left + 15);

                        if (xTranslate + 350 > width) {
                            xTranslate -= 350;
                        }
                        tooltip.style("transform", "translate(" + (xTranslate ) + "px,  8px)");
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
