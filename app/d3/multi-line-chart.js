angular.module('katGui.d3')

.directive('multiLineChart', function($rootScope, KatGuiUtil, DATETIME_FORMAT, $timeout, $log, $interval) {
    return {
        restrict: 'EA',
        scope: {
            redrawFunction: '=',
            loadOptionsFunction: '=',
            clearFunction: '=',
            removeSensorFunction: '=',
            hideContextZoom: '@hideContextZoom',
            yMin: '=yMin',
            yMax: '=yMax',
            mouseOverTooltip: '@',
            downloadCsv: '='
        },
        replace: false,
        link: function(scope, element) {

            scope.lockShowTooltip = false;
            var bgColor = angular.element(document.querySelector("md-content")).css('background-color');
            element.css({
                'background-color': bgColor
            });
            scope.hideTooltip = true;
            var contextBrushColor = '#333';
            if (bgColor !== 'rgb(255, 255, 255)') {
                contextBrushColor = '#fff';
            }

            var margin = {
                    top: 10,
                    right: 10,
                    bottom: 110,
                    left: 60
                },
                width, height, height2;
            var margin2 = {
                top: 0,
                right: 10,
                bottom: 20,
                left: 60
            };
            var svg, x, y, x2, y2, xAxis, yAxis, xAxis2, line, line2, minline, maxline,
                xAxisElement, yAxisElement, xAxisElement2, context, focus, brush, nowLine, nowText;

            $timeout(function() {
                scope.unbindResize = scope.$watch(function() {
                    return element[0].clientHeight - margin.top - margin.bottom + ', ' + element[0].clientWidth;
                }, function(newVal, oldVal) {
                    if (newVal !== oldVal) {
                        scope.lazyResize();
                    }
                });
                scope.resizeChart();
            }, 750);

            scope.resizeChart = function() {
                drawSvg();
                drawValues();
            };

            scope.lazyResize = _.debounce(scope.resizeChart, 300);

            var color = d3.scale.category20();
            var bisectDate = d3.bisector(function(d) {
                return d.date;
            }).left;
            scope.showGridLines = false;
            scope.hideContextZoom = false;
            scope.currentBrush = {};
            scope.nestedData = [];
            scope.options = {
                showGridLines: false,
                hideContextZoom: false,
                useFixedYAxis: false,
                useFixedXAxis: false,
                yAxisValues: null,
                xAxisValues: null,
                dataLimit: null,
                limitOverlayValues: null,
                forceRedraw: false,
                hasMinMax: true,
                scrollXAxisWindowBy: 0,
                drawNowLine: false,
                removeOutOfTimeWindowData: false,
                discreteSensors: false,
                overrideMargins: null
            };

            scope.loadOptionsFunction = function(options, forceRedraw) {
                var optionsChanged = false;
                Object.keys(scope.options).forEach(function(key) {
                    if (angular.isDefined(options[key])) {
                        scope.options[key] = options[key];
                        optionsChanged = true;
                    }
                });

                if (scope.options.scrollXAxisWindowBy) {
                    if (scope.scrollXAxisInterval) {
                        $interval.cancel(scope.scrollXAxisInterval);
                    }
                    scope.scrollXAxisInterval = $interval(function() {
                        var domain = x.domain();
                        if (domain[0] !== domain[1] && domain[0].getTime() > 0 && domain[1].getTime() > 0) {
                            var newStart = moment(domain[0]).add(scope.options.scrollXAxisWindowBy, 's').toDate();
                            var newEnd = moment(domain[1]).add(scope.options.scrollXAxisWindowBy, 's').toDate();
                            x.domain([newStart, newEnd]);
                            updateAxis();
                        } else if (scope.xAxisValues && scope.xAxisValues.length > 0 && scope.xAxisValues[0].getTime() > 0) {
                            x.domain(scope.xAxisValues);
                            updateAxis();
                        }
                        updateNowLine();
                    }, scope.options.scrollXAxisWindowBy * 1000);
                }

                if (optionsChanged || forceRedraw) {
                    drawSvg();
                    drawValues();
                }
            };

            scope.redrawFunction = function(newData, hasMinMax) {

                if (!newData || newData.length === 0) {
                    return;
                }
                scope.options.hasMinMax = hasMinMax;
                var doSort = false;

                var newYAxisValues = {};
                if (scope.options.yAxisValues && scope.options.yAxisValues.length > 0) {
                    scope.options.yAxisValues.forEach(function(yValue) {
                        newYAxisValues[yValue] = {};
                    });
                }

                newData.forEach(function(d) {
                    d.date = new Date(d.sample_ts);
                    if (typeof(d.value) === 'number' || !isNaN(d.value)) {
                        d.value = d.value;
                    } else {
                        d.value = d.value;
                        if (!scope.options.yAxisValues) {
                            scope.options.yAxisValues = [];
                        }
                        newYAxisValues[d.value.replace(/\'/g, '"')] = {};
                    }

                    var existingDataLine = _.findWhere(scope.nestedData, {
                        key: d.sensor
                    });
                    if (existingDataLine) {
                        if ((scope.options.dataLimit && existingDataLine.values.length > scope.options.dataLimit) ||
                            (scope.options.removeOutOfTimeWindowData && x.domain()[0].getTime() > 0 && existingDataLine.values[0].date < x.domain()[0])) {
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
                        scope.nestedData.push({
                            key: d.sensor,
                            values: [d],
                            color: d.color
                        });
                    }
                });

                if (Object.keys(newYAxisValues).length > 0) {
                    scope.options.yAxisValues = _.sortBy(Object.keys(newYAxisValues), function(d) {
                        return d.toUpperCase();
                    });
                } else {
                    scope.options.yAxisValues = null;
                }

                if (doSort) {
                    scope.nestedData.forEach(function(d) {
                        d.values = _.sortBy(d.values, function(item) {
                            return item.sample_ts;
                        });
                    });
                    $log.info('Sorting all data sets.');
                }

                drawValues();
                if (!scope.options.hideContextZoom) {
                    scope.lazyBrush();
                }
            };

            scope.clearFunction = function() {
                scope.options.yAxisValues = null;
                scope.nestedData = [];
                drawSvg();
                drawValues();
            };

            scope.removeSensorFunction = function(sensorName) {
                var index = _.findIndex(scope.nestedData, {
                    key: sensorName.replace(/\./g, '_')
                });
                if (index > -1) {
                    scope.nestedData.splice(index, 1);
                    d3.select("." + sensorName + "-tooltip").remove();
                    drawValues();
                }
            };

            var tooltip = d3.select(element[0]).append("div")
                .attr("class", "multi-line-tooltip");

            var limitOverlayElements = [];

            function drawSvg() {

                if (scope.options.overrideMargins) {
                    margin = scope.options.overrideMargins;
                } else {
                    if (scope.options.yAxisValues) {
                        margin.left = 120;
                        margin2 = {
                            top: element[0].clientHeight - 80,
                            right: 10,
                            bottom: 20,
                            left: 120
                        };
                    } else {
                        margin.left = 60;
                        margin2 = {
                            top: element[0].clientHeight - 80,
                            right: 10,
                            bottom: 20,
                            left: 60
                        };
                    }

                    if (scope.options.hideContextZoom) {
                        margin.bottom = 35;
                    } else {
                        margin.bottom = 110;
                    }
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
                    .attr("height", height + margin.top + margin.bottom)
                    .style("shape-rendering", "optimiseSpeed");

                if (!scope.options.hideContextZoom) {
                    svg.append("defs").append("clipPath")
                        .attr("id", "clip")
                        .append("rect")
                        .attr("y", -2)
                        .attr("width", width)
                        .attr("height", height + 2);
                }

                focus = svg.append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                if (scope.mouseOverTooltip && width > 0 && height > 0) {
                    scope.overlay = svg.append("rect")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                        .attr("width", width)
                        .attr("height", height)
                        .attr("class", "overlay")
                        .on("mouseout", function() {
                            scope.hideTooltip = true;
                        })
                        .on("mouseover", function() {
                            scope.hideTooltip = false;
                        })
                        .on("mousemove", function() {
                            mousemove(scope.lockShowTooltip);
                        })
                        .on("mousedown", function() {
                            scope.lockShowTooltip = !scope.lockShowTooltip;
                        });

                    scope.mousePosLineVert = svg.append("line")
                        .attr("class", "mouse-pos-line");
                    scope.mousePosLineText = svg.append("text")
                        .attr("class", "mouse-pos-line-text");
                }

                // set the ranges
                x = d3.time.scale.utc().range([0, width]);
                y = null;
                if (scope.options.discreteSensors) {
                    y = d3.scale.ordinal().rangePoints([height, 0]);
                } else {
                    y = d3.scale.linear().range([height, 0]);
                }

                // define the axes
                xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(10);

                yAxis = null;
                if (scope.options.discreteSensors) {
                    yAxis = d3.svg.axis().scale(y).orient("left");
                } else {
                    yAxis = d3.svg.axis().scale(y).orient("left").ticks(10);
                }

                if (scope.options.showGridLines) {
                    xAxis.tickSize(-height);
                    yAxis.tickSize(-width);
                }

                line = d3.svg.line()
                    .interpolate(scope.options.discreteSensors ? "step-after" : "linear")
                    .x(function(d) {
                        return x(d.date);
                    })
                    .y(function(d) {
                        return y(d.value);
                    });

                minline = d3.svg.line()
                    .interpolate(scope.options.discreteSensors ? "step-after" : "linear")
                    .defined(function(d) {
                        return angular.isDefined(d.minValue) && d.minValue !== null;
                    })
                    .x(function(d) {
                        return x(d.date);
                    })
                    .y(function(d) {
                        return y(d.minValue);
                    });

                maxline = d3.svg.line()
                    .interpolate(scope.options.discreteSensors ? "step-after" : "linear")
                    .defined(function(d) {
                        return angular.isDefined(d.maxValue) && d.maxValue !== null;
                    })
                    .x(function(d) {
                        return x(d.date);
                    })
                    .y(function(d) {
                        return y(d.maxValue);
                    });

                xAxisElement = focus.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")");

                yAxisElement = focus.append("g")
                    .attr("class", "y axis y-axis");

                if (!scope.options.hideContextZoom) {

                    y2 = null;
                    x2 = d3.time.scale.utc().range([0, width]);

                    if (scope.options.discreteSensors) {
                        y2 = d3.scale.ordinal().rangePoints([height2, 0]);
                    } else {
                        y2 = d3.scale.linear().range([height2, 0]);
                    }

                    line2 = d3.svg.line()
                        .interpolate(scope.options.discreteSensors ? "step-after" : "linear")
                        .x(function(d) {
                            return x2(d.date);
                        })
                        .y(function(d) {
                            return y2(d.value);
                        });

                    context = svg.append("g")
                        .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

                    xAxis2 = d3.svg.axis().scale(x2).orient("bottom").ticks(0);

                    xAxisElement2 = context.append("g")
                        .attr("class", "x axis")
                        .attr("transform", "translate(0," + height2 + ")");

                    scope.brushFunction = function() {
                        x.domain(brush.empty() ? x2.domain() : brush.extent());
                        focus.selectAll("path.value-line").attr("d", function(d) {
                            return line(d.values);
                        });
                        if (scope.options.hasMinMax) {
                            focus.selectAll("path.minline").attr("d", function(d) {
                                return minline(d.values);
                            });
                            focus.selectAll("path.maxline").attr("d", function(d) {
                                return maxline(d.values);
                            });
                        }
                        xAxisElement.call(xAxis);
                        yAxisElement.call(yAxis);
                        mousemove(true);
                    };

                    scope.lazyBrush = _.debounce(scope.brushFunction, 300);

                    brush = d3.svg.brush()
                        .x(x2)
                        .on("brushend", scope.lazyBrush);

                    context.append("g")
                        .attr("class", "x brush")
                        .style("stroke", contextBrushColor)
                        .call(brush)
                        .selectAll("rect")
                        .attr("y", -6)
                        .attr("height", height2 + 7);
                }

                if (scope.options.limitOverlayValues) {
                    limitOverlayElements.splice(0, limitOverlayElements.length);
                    scope.options.limitOverlayValues.forEach(function(limit) {
                        limitOverlayElements.push(focus.append("line")
                            .style("stroke", "#F44336")
                            .style("stroke-dasharray", "10, 5")
                            .attr("class", "limit-overlay-path"));
                    });
                }

                if (scope.options.drawNowLine) {
                    nowLine = focus.append("line")
                        .style("stroke", "#2196F3")
                        .style("stroke-dasharray", "10 5");

                    nowText = focus.append("text")
                        .style("stroke", "#2196F3")
                        .text("Now UTC");

                    updateNowLine();
                }
            }

            function updateNowLine() {
                if (scope.options.drawNowLine && $rootScope.utcDate) {
                    nowLine.attr("x1", function(d) {
                            return x($rootScope.utcDate);
                        })
                        .attr("x2", function(d) {
                            return x($rootScope.utcDate);
                        })
                        .attr("y1", "0")
                        .attr("y2", height);

                    nowText.attr("x", function(d) {
                            return x($rootScope.utcDate) - 22;
                        })
                        .style("font-size", "10px")
                        .attr("y", margin.top - 2);
                }
            }

            function setupAxis() {

                if (scope.options.useFixedXAxis && scope.options.xAxisValues) {
                    if (!scope.options.scrollXAxisWindowBy || x.domain()[0].getTime() === 0) {
                        x.domain(scope.options.xAxisValues);
                    }
                } else {
                    // scale the range of the data
                    x.domain([
                        d3.min(scope.nestedData, function(sensors) {
                            return sensors.values[0].date;
                        }),
                        d3.max(scope.nestedData, function(sensors) {
                            return sensors.values[sensors.values.length - 1].date;
                        })
                    ]);
                }


                if (scope.options.useFixedYAxis && !scope.options.yAxisValues) {
                    y.domain([scope.yMin, scope.yMax]);
                } else if (!scope.options.yAxisValues) {
                    var yExtent = [0, 0];
                    if (scope.nestedData.length > 0) {
                        yExtent = [
                            d3.min(scope.nestedData, function(sensors) {
                                return d3.min(sensors.values, function(d) {
                                    if (d.minValue) {
                                        return d.minValue;
                                    }
                                    var parsedValue = parseFloat(d.value);
                                    if (isNaN(parsedValue)) {
                                        return d.value;
                                    }
                                    return parsedValue;
                                });
                            }),
                            d3.max(scope.nestedData, function(sensors) {
                                return d3.max(sensors.values, function(d) {
                                    if (d.maxValue) {
                                        return d.maxValue;
                                    }
                                    var parsedValue = parseFloat(d.value);
                                    if (isNaN(parsedValue)) {
                                        return d.value;
                                    }
                                    return parsedValue;
                                });
                            })
                        ];
                    }
                    if (yExtent[0] === yExtent[1] && yExtent[0] >= Math.abs(0.01)) {
                        yExtent[0] -= 1;
                        yExtent[1] += 1;
                    } else {
                        yExtent[0] -= 0.01;
                        yExtent[1] += 0.01;
                    }
                    y.domain(yExtent);
                } else {
                    y.domain(scope.options.yAxisValues);
                }
                updateAxis();
            }

            function drawValues() {

                setupAxis();
                updateNowLine();

                // DATA JOIN
                // Join new data with old elements, if any.
                var focuslineGroups = focus.selectAll(".path-container")
                    .data(scope.nestedData, function(d) {
                        return d.key;
                    });

                // EXIT
                // remove stale elements.
                focuslineGroups.exit().remove();

                // UPDATE
                // update existing elements.
                focuslineGroups.selectAll(".value-line")
                    .attr("d", function(d) {
                        return line(d.values);
                    });
                focuslineGroups.selectAll(".minline")
                    .attr("d", function(d) {
                        return minline(d.values);
                    });
                focuslineGroups.selectAll(".maxline")
                    .attr("d", function(d) {
                        return maxline(d.values);
                    });

                // ENTER
                // Create new elements as needed.
                var pathContainer = focuslineGroups.enter()
                    .append("g")
                    .attr("class", "path-container");

                pathContainer.append("path")
                    .attr("id", function(d) {
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
                    .attr("class", function(d) {
                        return "line value-line " + d.key + " path-line";
                    })
                    .attr("d", function(d) {
                        return line(d.values);
                    })
                    .attr("clip-path", "url(#clip)");

                if (!scope.options.discreteSensors) {
                    // Create new elements as min line paths as needed.
                    pathContainer.append("path")
                        .attr("id", function(d) {
                            return d.key + 'minLine';
                        })
                        .attr("class", function(d) {
                            return "line " + d.key + " path-line minline";
                        })
                        .style("opacity", "0.5")
                        .style("stroke-dasharray", "20, 10")
                        .attr("d", function(d) {
                            return minline(d.values);
                        })
                        .attr("clip-path", "url(#clip)");

                    // Create new elements as max line paths as needed.
                    pathContainer.append("path")
                        .attr("id", function(d) {
                            return d.key + 'maxLine';
                        })
                        .attr("class", function(d) {
                            return "line " + d.key + " path-line maxline";
                        })
                        .style("opacity", "0.5")
                        .style("stroke-dasharray", "20, 10")
                        .attr("d", function(d) {
                            return maxline(d.values);
                        })
                        .attr("clip-path", "url(#clip)");
                }

                if (scope.mouseOverTooltip) {
                    scope.nestedData.forEach(function(data) {
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

                updateAxis();

                //context zoom element start
                if (!scope.options.hideContextZoom) {

                    x2.domain(x.domain());
                    y2.domain(y.domain());

                    var contextlineGroups = context.selectAll(".brush-container")
                        .data(scope.nestedData);

                    // EXIT - remove stale elements
                    contextlineGroups.exit().remove();

                    // UPDATE - update existing items with new values
                    contextlineGroups.selectAll(".context-line")
                        .attr("d", function(d) {
                            return line2(d.values);
                        });

                    // ENTER - create new elements as needed
                    contextlineGroups.enter()
                        .append("g")
                        .attr("class", "brush-container")
                        .append("path")
                        .attr("class", "line context-line")
                        .attr("d", function(d) {
                            return line2(d.values);
                        })
                        .style("stroke", function(d) {
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
                    limitOverlayElements.forEach(function(limitElement, index) {
                        limitElement.attr("x1", "0")
                            .attr("x2", width)
                            .attr("y1", y(scope.options.limitOverlayValues[index]))
                            .attr("y2", y(scope.options.limitOverlayValues[index]));
                    });
                }
            }

            function wrapText(text, d, width) {

                var el = d3.select(text);
                var p = d3.select(text.parentNode);
                var formattedText = d;
                if (!scope.options.discreteSensors) {
                    d = KatGuiUtil.roundToAtMostDecimal(d, 7);
                }
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

            var lazyloadTooltipValues = _.debounce(loadTooltipValues, 150);

            function updateAxis() {

                xAxisElement.call(xAxis);
                yAxisElement.call(yAxis);

                yAxisElement.selectAll(".y-axis text")
                    .each(function(d) {
                        wrapText(this, d.toString(), margin.left);
                    });
            }

            function mousemove(calledWithoutEvent) {
                var mouse = null;
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

                if (scope.lockShowTooltip || !scope.hideTooltip) {
                    var xHor = mouse[0] + margin.left;
                    var yVert = mouse[0] + margin.left;
                    scope.mousePosLineVert
                        .attr("x1", xHor)
                        .attr("x2", xHor)
                        .attr("y1", margin.top)
                        .attr("y2", height + margin.top);
                    if (scope.nestedData.length > 0) {
                        scope.mousePosLineVert.style("display", null);
                    }

                    lazyloadTooltipValues(mouse);
                }

                if (!calledWithoutEvent) {
                    scope.lastMouse = mouse;
                }
            }

            function loadTooltipValues(mouse) {

                if (scope.hideTooltip && !scope.lockShowTooltip) {
                    tooltip.style('display', 'none');
                    scope.mousePosLineVert.style("display", "none");
                }
                if (!scope.hideTooltip && !scope.lockShowTooltip && scope.nestedData.length > 0) {
                    tooltip.style('display', 'initial');
                }

                var tooltipValues = [];
                scope.nestedData.forEach(function(data) {

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
                        d.TooltipValue = d.value;
                        tooltipValues.push(d);
                    }
                });
                if (tooltipValues.length > 0) {
                    var html = "";
                    for (var i in tooltipValues) {
                        html += "<div class='" + tooltipValues[i].sensor + "' style='display: flex'>";
                        html += "<i style='flex: 1 100%'>" + (tooltipValues[i].sensor ? tooltipValues[i].sensor : tooltipValues[i].name) + "</i>";
                        html += "<b style='margin-left: 8px; white-space: pre'> " + tooltipValues[i].TooltipValue + "</b>";
                        html += "<div style='min-width: 120px'><span style='margin-left: 6px'>" + moment.utc(tooltipValues[i].date).format(DATETIME_FORMAT) + "</span></div>";
                        html += "</div>";
                    }
                    html += "";
                    tooltip.html(html);
                    var xTranslate = (x(tooltipValues[0].date) + margin.left + 15);
                    // var yTranslate = mouse[1];

                    if (xTranslate + tooltip[0][0].clientWidth > width) {
                        xTranslate -= tooltip[0][0].clientWidth + 20;
                    }
                    tooltip.style("transform", "translate(" + (xTranslate) + "px,  8px)");
                }
            }

            scope.$on('$destroy', function() {
                scope.unbindResize();
                if (scope.scrollXAxisInterval) {
                    $interval.cancel(scope.scrollXAxisInterval);
                }
            });

            scope.downloadCsv = function(useUnixTimestamps) {
                scope.nestedData.forEach(function(sensorValues, index) {
                    var csvContent = ["timestamp,status,value"];
                    for (var i = 0; i < sensorValues.values.length; i++) {
                        var dataString = '';
                        var sensorInfo = sensorValues.values[i];
                        if (useUnixTimestamps) {
                            dataString += (sensorInfo.sample_ts * 1000) + ',';
                        } else {
                            dataString += moment.utc(sensorInfo.sample_ts).format('YYYY-MM-DD HH:mm:ss.SSS') + ',';
                        }
                        dataString += sensorValues.values[i].status + ',';
                        dataString += sensorValues.values[i].value;
                        csvContent.push(dataString);
                    }
                    var csvData = new Blob([csvContent.join('\r\n')], { type: 'text/csv' });
                    var csvUrl = URL.createObjectURL(csvData);
                    var link = document.createElement("a");
                    link.href =  csvUrl;
                    link.download = sensorValues.key + ".csv";
                    link.click();
                });
            };
        }
    };
});
