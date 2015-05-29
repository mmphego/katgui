angular.module('katGui.d3')

    .directive('receptorPointing', function (d3Service) {
        return {
            restrict: 'EA',
            scope: {
                redrawFunction: '='
            },
            link: function (scope, element) {

                d3Service.d3().then(function (d3) {

                    scope.data = [];
                    scope.redrawFunction = function (receptors) {

                        scope.data = receptors;
                        drawValues();
                    };

                    var margin = {top: 10, right: 20, bottom: 60, left: 60},
                        width, height, chart, focus;
                    var svg, x, y, xAxis, yAxis, xAxisElement, yAxisElement;

                    drawSvg();

                    function drawSvg() {

                        width = element[0].clientWidth - margin.left - margin.right;
                        height = element[0].clientHeight - margin.top - margin.bottom - 10;

                        d3.select('svg').remove();
                        svg = d3.select(element[0]).append("svg")
                            .attr("width", width + margin.left + margin.right)
                            .attr("height", height + margin.top + margin.bottom);

                        chart = svg.append("g")
                            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                        // set the ranges
                        x = d3.scale.linear().range([0, width]);
                        y = d3.scale.linear().range([height, 0]);

                        // define the axes
                        xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(10);
                        yAxis = d3.svg.axis().scale(y).orient("left").ticks(10);

                        if (scope.showGridLines) {
                            xAxis.tickSize(-height);
                            yAxis.tickSize(-width);
                        }

                        xAxisElement = chart.append("g")
                            .attr("class", "x axis")
                            .attr("transform", "translate(0," + height + ")");

                        yAxisElement = chart.append("g")
                            .attr("class", "y axis y-axis");

                        focus = svg.append("g")
                            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                        x.domain([-185, 275]);
                        y.domain([15, 92]);
                        xAxisElement.call(xAxis);
                        yAxisElement.call(yAxis);
                    }

                    function drawValues() {

                        focus.selectAll("circle").remove();
                        focus.selectAll("text").remove();

                        focus.selectAll("g.actual-azel")
                            .data(scope.data)
                            .enter().append("circle")
                            .attr("class", "actual-azel")
                            .attr("r", 6)
                            .attr("cx", function (d) {
                                if (d.ap_actual_azim) {
                                    return x(d.ap_actual_azim.value);
                                } else {
                                    return -1000;
                                }
                            })
                            .attr("cy", function (d) {
                                if (d.ap_actual_elev) {
                                    return y(d.ap_actual_elev.value);
                                } else {
                                    return -1000;
                                }
                            });

                        focus.selectAll("g.requested-azel-text")
                            .data(scope.data)
                            .enter().append("text")
                            .attr("x", function (d) {
                                if (d.ap_actual_azim) {
                                    return x(d.ap_actual_azim.value);
                                } else {
                                    return -1000;
                                }
                            })
                            .attr("y", function (d) {
                                if (d.ap_actual_elev) {
                                    return y(d.ap_actual_elev.value) + 15;
                                } else {
                                    return -1000;
                                }
                            })
                            .text(function (d) {
                                return d.name + ' - actual';
                            });

                        focus.selectAll("g.requested-azel")
                            .data(scope.data)
                            .enter().append("circle")
                            .attr("class", "requested-azel")
                            .attr("r", 2)
                            .attr("cx", function (d) {
                                if (d.ap_requested_azim) {
                                    return x(d.ap_requested_azim.value);
                                } else {
                                    return -1000;
                                }
                            })
                            .attr("cy", function (d) {
                                if (d.ap_requested_elev) {
                                    return y(d.ap_requested_elev.value);
                                } else {
                                    return -1000;
                                }
                            });

                        focus.selectAll("g.requested-azel-text")
                            .data(scope.data)
                            .enter().append("text")
                            .attr("x", function (d) {
                                if (d.ap_actual_azim) {
                                    return x(d.ap_requested_azim.value);
                                } else {
                                    return -1000;
                                }
                            })
                            .attr("y", function (d) {
                                if (d.ap_actual_elev) {
                                    return y(d.ap_requested_elev.value) + 30;
                                } else {
                                    return -1000;
                                }
                            })
                            .text(function (d) {
                                return d.name + ' - requested';
                            });
                    }
                });
            }
        };
    });


