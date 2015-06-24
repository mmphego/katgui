angular.module('katGui.d3')

    .directive('multiLineChart', function ($window, d3Service, d3Util) {
        return {
            restrict: 'EA',
            scope: {
                redrawFunction: '=',
                clearFunction: '=',
                removeSensorFunction: '=',
                hideContextZoom: '=hideContextZoom',
                yMin: '=yMin',
                yMax: '=yMax',
                mouseOverTooltip: '='
            },
            replace: false,
            link: function (scope, element) {

                d3Service.d3().then(function (d3) {

                    var bgColor = angular.element(document.querySelector("md-content")).css('background-color');
                    element.css({'background-color': bgColor});
                    var contextBrushColor = '#333';
                    if (bgColor !== 'rgb(255, 255, 255)') {
                        contextBrushColor = '#fff'
                    }

                    var unbindResize = scope.$watch(function () {
                        return element[0].clientHeight + ', ' + element[0].clientWidth;
                    }, function (newVal, oldVal) {
                        if (newVal !== oldVal) {
                            drawSvg();
                            drawValues();
                        }
                    });

                    var color = d3.scale.category20();
                    var bisectDate = d3.bisector(function(d) { return d.date; }).left;
                    scope.showGridLines = false;
                    scope.currentBrush = {};
                    scope.nestedData = [];
                    scope.redrawFunction = function (newData, showGridLines, showDots, hideContextZoom, useFixedYAxis, yAxisValues, dataLimit) {

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
                                    if (typeof(d.Value) === 'boolean') {
                                        d.value = d.Value? 1 : 0;
                                    } else if (typeof(d.Value) === 'number' || !isNaN(parseFloat(d.Value))) {
                                        d.value = parseFloat(d.Value);
                                    } else {
                                        d.value = d.Value;
                                        if (!scope.yAxisValues) {
                                            scope.yAxisValues = [];
                                        }
                                        var yAxisValue = d.Value.replace(/\'/g, '"');
                                        if (scope.yAxisValues.indexOf(yAxisValue) === -1) {
                                            scope.yAxisValues.push(yAxisValue);
                                            scope.yAxisValues = _.sortBy(scope.yAxisValues, function (d) {
                                                return d.toUpperCase();
                                            });
                                            drawSvg();
                                        }
                                    }
                                }

                                var existingDataLine = _.findWhere(scope.nestedData, {key: d.Sensor});
                                if (existingDataLine) {
                                    if (existingDataLine.values.length > dataLimit) {
                                        existingDataLine.values.splice(0, 1);
                                    }
                                    existingDataLine.values.push(d);
                                } else {
                                    scope.nestedData.push({key: d.Sensor, values: [d]});
                                }
                            });
                        }

                        if (showGridLines !== scope.showGridLines) {
                            scope.showGridLines = showGridLines;
                            drawSvg();
                        }

                        if (showDots !== scope.showDots) {
                            scope.showDots = showDots;
                            drawSvg();
                        }

                        if (hideContextZoom !== scope.hideContextZoom) {
                            scope.hideContextZoom = hideContextZoom;
                            drawSvg();
                        }

                        scope.useFixedYAxis = useFixedYAxis;

                        drawValues();
                        if (!hideContextZoom) {
                            scope.brushFunction();
                        }
                    };

                    scope.clearFunction = function () {
                        scope.yAxisValues = null;
                        scope.nestedData.splice(0, scope.nestedData.length);
                        drawSvg();
                        drawValues();
                    };

                    scope.removeSensorFunction = function (sensorName) {
                        var existingDataLine = _.findWhere(scope.nestedData, {key: sensorName.replace(/\./g, '_')});
                        if (existingDataLine) {
                            scope.nestedData.splice(scope.nestedData.indexOf(existingDataLine), 1);
                            drawValues();
                        }
                    };

                    var tooltip = d3.select(element[0]).append("div")
                        .attr("class", "multi-line-tooltip")
                        .style("opacity", 0);

                    var margin = {top: 10, right: 10, bottom: 100, left: 60},
                        width, height, height2;
                    var margin2 = {top: 0, right: 10, bottom: 20, left: 60};
                    var svg, x, y, x2, y2, xAxis, yAxis, xAxis2, line, line2,
                        xAxisElement, yAxisElement, xAxisElement2, context, focus;

                    var formatTwoDecimals = d3.format(",.2f");

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
                            margin.bottom = 100;
                        }

                        width = element[0].clientWidth - margin.left - margin.right;
                        height = element[0].clientHeight - margin.top - margin.bottom - 5;
                        height2 = 70;
                        if (height < 0) {
                            height = 0;
                        }

                        if (scope.yAxisValues) {
                            margin.left = 120;
                            margin2 = {top: height, right: 10, bottom: 20, left: 120};
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

                        if (scope.mouseOverTooltip) {
                            scope.overlay = svg.append("rect")
                                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                                .attr("width", width)
                                .attr("height", height)
                                .attr("class", "overlay")
                                //.on("mouseover", function() {
                                //})
                                .on("mouseout", function() {
                                    d3.selectAll(".focus-tooltip").style("display", "none");
                                })
                                .on("mousemove", mousemove);
                        }

                        // set the ranges
                        x = d3.time.scale().range([0, width]);
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
                            yAxis = d3.svg.axis().scale(y).orient("left").ticks(10);
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
                            x2 = d3.time.scale().range([0, width]);

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
                                d3.selectAll("g.dot circle")
                                    .attr("cx", function (d) {
                                        return x(d.date);
                                    })
                                    .attr("cy", function (d) {
                                        return y(d.value);
                                    });
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
                                return "line " + d.key + " path-line";
                            })
                            .attr("d", function (d) {
                                return line(d.values);
                            }).attr("clip-path", "url(#clip)");

                        if (scope.mouseOverTooltip) {
                            d3.selectAll('.focus-tooltip').remove();
                            scope.nestedData.forEach(function (data) {
                                var focusTooltip = svg.append("g")
                                    .attr("class", "focus-tooltip " + data.key + "-tooltip " + data.key)
                                    .style("display", "none");
                                focusTooltip.append("circle")
                                    .attr("class", "focus-tooltip-circle")
                                    .attr("r", 4.5);
                                focusTooltip.append('foreignObject')
                                    .attr("x", 0)
                                    .attr("width", "185")
                                    .attr("height", "65");
                            });
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
                                    wrapText(this, d.toString(), margin.left);
                                });
                        }

                        if (scope.showDots) {
                            focus.selectAll("g.dot").remove();
                            focus.selectAll("g.dot")
                                .data(scope.nestedData)
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
                                        .style("top", (y + 15 + angular.element(document.querySelector('#ui-view-container-div')).scrollTop()) + "px")
                                        .style("left", (x + 15 + angular.element(document.querySelector('#ui-view-container-div')).scrollLeft()) + "px");
                                })
                                .on("mouseout", function () {
                                    tooltip.transition()
                                        .duration(1)
                                        .style("opacity", 0);
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
                                    return color(d.key);
                                })
                                .attr("clip-path", "url(#clip)");

                            xAxisElement2.call(xAxis2);

                        }
                        //context zoom element stop
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

                    function mousemove () {
                        d3.selectAll(".focus-tooltip").style("display", null);
                        scope.nestedData.forEach(function (data) {

                            var mouse = d3.mouse(scope.overlay[0][0]);
                            var x0 = x.invert(mouse[0]);

                            var i = bisectDate(data.values, x0, 1),
                                d0 = data.values[i - 1],
                                d1 = data.values[i];
                            var d;
                            if (d0 && d0.date && d1 && d1.date) {
                                d = x0 - d0.date > d1.date - x0 ? d1 : d0;

                                var xTranslate = (x(d.date) + margin.left);
                                var yTranslate = (y(d.value) + margin.top);
                                var focusToolTip = d3.selectAll("." + data.key + "-tooltip");
                                focusToolTip.attr("transform", "translate(" + xTranslate + "," + yTranslate + ")");
                                if (xTranslate + 185 > width) {
                                    xTranslate = -194;
                                } else {
                                    xTranslate = 9;
                                }
                                if (yTranslate + 65 > height) {
                                    yTranslate = -65;
                                } else {
                                    yTranslate = 0;
                                }
                                var focusToolTipDiv = d3.select(focusToolTip[0][0].children[1]);
                                focusToolTipDiv.attr("transform", "translate(" + xTranslate + "," + yTranslate + ")");
                                d.TooltipValue = formatTwoDecimals(d.value);
                                d3Util.updateGraphTooltipValues(d, focusToolTipDiv);
                            }
                        });
                    }

                    scope.$on('$destroy', function () {
                        unbindResize();
                    });
                });
            }
        };
    });
