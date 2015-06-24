angular.module('katGui.d3')

    .directive('multiLineTwoYAxisChart', function ($window, d3Service, d3Util) {
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

                    var color = d3.scale.category10();
                    var bisectDate = d3.bisector(function(d) { return d.date; }).left;
                    scope.showGridLines = false;
                    scope.currentBrush = {};
                    scope.nestedData = [];
                    scope.redrawFunction = function (newData, showGridLines, dataLimit) {

                        if (newData) {
                            newData.forEach(function (d) {
                                d.date = new Date(parseFloat(d.Timestamp) * 1000);
                                d.value = parseFloat(d.Value);

                                var existingDataLine = _.findWhere(scope.nestedData, {key: d.Sensor});
                                if (existingDataLine) {
                                    if (existingDataLine.values.length > dataLimit) {
                                        existingDataLine.values.splice(0, 1);
                                    }
                                    existingDataLine.values.push(d);
                                } else {
                                    scope.nestedData.push({key: d.Sensor, values: [d], rightAxis: d.rightAxis});
                                }
                            });
                        }

                        if (showGridLines !== scope.showGridLines) {
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
                            drawValues();
                        }
                    };

                    var tooltip = d3.select(element[0]).append("div")
                        .attr("class", "multi-line-tooltip")
                        .style("opacity", 0);

                    var margin = {top: 10, right: 60, bottom: 35, left: 60},
                        width, height;
                    var svg, x, y, yRight, xAxis, yAxis, yAxisRight, line, lineRight,
                        xAxisElement, yAxisElement, yAxisRightElement, focus;

                    var formatTwoDecimals = d3.format(",.2f");

                    drawSvg();
                    drawValues();

                    function drawSvg() {

                        width = element[0].clientWidth - margin.left - margin.right;
                        height = element[0].clientHeight - margin.top - margin.bottom - 5;
                        if (height < 0) {
                            height = 0;
                        }

                        d3.select(element[0]).select('svg').remove();
                        svg = d3.select(element[0]).append("svg")
                            .attr("width", width + margin.left + margin.right)
                            .attr("height", height + margin.top + margin.bottom);

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
                        y = d3.scale.linear().range([height, 0]);
                        yRight = d3.scale.linear().range([height, 0]);

                        // define the axes
                        xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(10);
                        yAxis = d3.svg.axis().scale(y).orient("left").ticks(10);
                        yAxisRight = d3.svg.axis().scale(yRight).orient("right").ticks(10);

                        if (scope.showGridLines) {
                            xAxis.tickSize(-height);
                            yAxis.tickSize(-width);
                            yAxisRight.tickSize(-width);
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
                            d3.selectAll('.focus-tooltip').remove();
                            scope.nestedData.forEach(function (data) {
                                var focusTooltip = svg.append("g")
                                    .attr("class", "focus-tooltip " + data.key + "-tooltip " + data.key)
                                    .style("display", "none");
                                focusTooltip.append("circle")
                                    .attr("class", "focus-tooltip-circle " + data.key)
                                    .style("fill", "none")
                                    .attr("r", 4.5);
                                focusTooltip.append('foreignObject')
                                    .attr("x", 0)
                                    .attr("width", "185")
                                    .attr("height", "65");
                            });
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
                                var yTranslate;
                                if (d.rightAxis) {
                                    yTranslate = (yRight(d.value) + margin.top);
                                } else {
                                    yTranslate = (y(d.value) + margin.top);
                                }

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
