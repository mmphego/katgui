angular.module('katGui.d3')

    .directive('receptorPointingHorizontal', function (d3Service) {
        return {
            restrict: 'EA',
            scope: {
                redrawFunction: '='
            },
            link: function (scope, element) {

                d3Service.d3().then(function (d3) {

                    //precisionMultiplicative
                    var pm = 10000;
                    //handle resizing
                    var unbindResize = scope.$watch(function () {
                        return element[0].clientHeight + ', ' + element[0].clientWidth;
                    }, function (newVal, oldVal) {
                        if (newVal !== oldVal && !scope.drawingSvg) {
                            drawSvg();
                            drawValues();
                        }
                    });

                    var color = d3.scale.category20();
                    //create a mouseover tooltip element
                    var tooltip = d3.select(element[0]).append("div")
                        .attr("class", "receptor-pointing-tooltip")
                        .style("opacity", 0);
                    var horizonMaskDsv = d3.dsv(" ", "text/plain");

                    var margin = {top: 10, right: 20, bottom: 60, left: 60},
                        width, height, chart, focus;
                    var svg, x, y, xAxis, yAxis, xAxisElement, yAxisElement;

                    scope.data = [];
                    scope.redrawFunction = function (receptors,
                                                     showNames,
                                                     showTrails,
                                                     showGridLines,
                                                     trailDots,
                                                     horizonMaskToggled) {

                        scope.trailDots = trailDots;
                        scope.showNames = showNames;
                        scope.showTrails = showTrails;

                        //parse the horizon mask data and sort it
                        var newHorizonData = false;
                        receptors.forEach(function (receptor) {
                            if (receptor.horizonMask && !receptor.horizonMaskData) {
                                receptor.horizonMaskData = [];
                                horizonMaskDsv.parse(receptor.horizonMask, function (d) {
                                    receptor.horizonMaskData.push([parseFloat(d.az), parseFloat(d.el)]);
                                });
                                receptor.horizonMaskData = _.sortBy(receptor.horizonMaskData, function (d) {
                                    return d[0];
                                });
                                newHorizonData = true;
                            }
                        });

                        scope.data = receptors;

                        if (!svg
                            || scope.showGridLines !== showGridLines
                            || newHorizonData
                            || horizonMaskToggled) {
                            scope.showGridLines = showGridLines;
                            drawSvg();
                        }

                        drawValues();
                    };

                    function drawSvg() {
                        scope.drawingSvg = true;

                        width = element[0].clientWidth - margin.left - margin.right;
                        height = element[0].clientHeight - margin.top - margin.bottom - 10;

                        if (height < 0) {
                            height = 0;
                        }

                        //remove because we are redrawing the entire svg
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

                        x.domain([-180, 180]);
                        y.domain([0, 92]);

                        //create the axis
                        xAxisElement.call(xAxis);
                        yAxisElement.call(yAxis);

                        focus = svg.append("g")
                            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                        //define the line for horizon masks
                        var line = d3.svg.line()
                            .interpolate("cubic")
                            .x(function (d) {
                                return x(d[0]);
                            })
                            .y(function (d) {
                                return y(d[1]);
                            });

                        //draw the horizon masks
                        chart.selectAll(".horizon-mask")
                            .data(scope.data)
                            .enter().append("path")
                            .attr("class", function (d) {
                                return d.name + "-horizon-mask horizon-mask " + d.name + "_actual";
                            })
                            .style("fill", "transparent")
                            .style("stroke-width", "2px")
                            .style("stroke-dasharray", "10, 5")
                            .attr("d", function (d) {
                                if (d.horizonMaskData && d.showHorizonMask) {
                                    return line(d.horizonMaskData);
                                } else {
                                    return null;
                                }
                            });

                        scope.drawingSvg = false;
                    }

                    function drawValues() {

                        scope.positions = {};
                        scope.positions_requested = {};

                        //calculate and save the projection data to display points in the same position as bigger circles
                        //and to group tooltip values for points in the same position
                        scope.data.forEach(function (d) {
                            if (d.ap_actual_azim && d.ap_actual_elev) {
                                d.proj_requested_az_x = Math.floor(x(d.ap_actual_azim.value) * pm) / pm;
                                d.proj_requested_el_y = Math.floor(y(d.ap_actual_elev.value) * pm) / pm;
                                d.proj_actual = Math.floor(d.proj_requested_az_x) + ',' + Math.floor(d.proj_requested_el_y);
                                if (!scope.positions[d.proj_actual]) {
                                    scope.positions[d.proj_actual] = [];
                                }
                                scope.positions[d.proj_actual].push(d);
                            }

                            if (d.ap_requested_azim && d.ap_requested_elev) {
                                d.proj_requested = Math.floor(x(d.ap_requested_azim.value)) + ',' + Math.floor(y(d.ap_requested_elev.value));
                                if (!scope.positions_requested[d.proj_requested]) {
                                    scope.positions_requested[d.proj_requested] = [];
                                }
                                scope.positions_requested[d.proj_requested].push(d);
                            }
                            d.tooltipHtml = null;
                        });

                        //compute tooltip values for points in the same position
                        scope.data.forEach(function (d) {
                            if (!d.tooltipHtml) {
                                var items = scope.positions[d.proj_actual];
                                d.tooltipHtml = "<div>";
                                for (var i in items) {

                                    d.tooltipHtml += "<b>" + items[i].name + " </b>";
                                    if (items[i].ap_actual_azim) {
                                        d.tooltipHtml += "<br/>az: " + Math.round(items[i].ap_actual_azim.value * pm) / pm + ", el: " + Math.round(items[i].ap_actual_elev.value * pm) / pm;
                                    }
                                    if (items[i].ap_requested_azim) {
                                        d.tooltipHtml += "<br/>az: " + Math.round(items[i].ap_requested_azim.value * pm) / pm + ", el: " + Math.round(items[i].ap_requested_elev.value * pm) / pm + " (requested)";
                                    }
                                    if (items[i].pos_request_base_ra) {
                                        d.tooltipHtml += "<br/>ra: " + Math.round(items[i].pos_request_base_ra.value * pm) / pm + ", dec: " + Math.round(items[i].pos_request_base_dec.value * pm) / pm + " (requested)";
                                    }
                                    if (items[i].pos_delta_sky) {
                                        d.tooltipHtml += "<br/>Error: " + Math.round(items[i].pos_delta_sky.value * pm) / pm;
                                    }
                                    d.tooltipHtml += "<br/>";
                                }
                                d.tooltipHtml += "</div>";
                            }
                        });

                        if (!scope.showTrails) {
                            focus.selectAll("circle").remove();
                        }
                        focus.selectAll("text").remove();
                        focus.selectAll("g.requested-pos").remove();

                        //draw a crosshair where the requested position is
                        focus.selectAll("g.requested-pos")
                            .data(scope.data)
                            .enter().append('g')
                            .attr("class", "requested-pos")
                            .attr("transform", function (d) {
                                if (d.proj_requested) {
                                    return "translate(" + (x(d.ap_requested_azim.value) - 8.3) + "," + (y(d.ap_requested_elev.value) + 6.7)  + ")";
                                } else {
                                    return 'translate(-100, -100)';
                                }
                            })
                            .append('text')
                            .attr('font-family', 'FontAwesome')
                            .attr('font-size', '19px')
                            .attr('stroke-width', '0.5px')
                            .on("mouseover", mouseOver)
                            .on("mouseout", mouseOut)
                            .text('\uf05b');

                        //draw a color circle where the actual position is
                        //and setup tooltip behaviour
                        focus.selectAll("g.actual-pos")
                            .data(scope.data)
                            .enter().append("circle")
                            .attr("class", function (d) {
                                var c = color(d.name + '_actual');
                                var style = document.getElementById(d.name + '_actual_style_tag');
                                if (style && style.parentNode) {
                                    style.parentNode.removeChild(style);
                                }
                                style = document.createElement('style');
                                style.type = 'text/css';
                                style.id = d.name + '_actual_style_tag';
                                style.innerHTML = '.' + d.name + '_actual {color:' + c + '; stroke:' + c + '; fill:' + c + '}';
                                document.getElementsByTagName('head')[0].appendChild(style);

                                var classStr = "actual-pos " + d.name + "_actual";
                                if (d.proj_actual && scope.positions[d.proj_actual].length > 1) {
                                    classStr += " actual-pos-border";
                                }
                                return classStr;
                            })
                            .attr("r", function (d) {
                                if (d.proj_actual) {
                                    if (scope.positions[d.proj_actual].length > 1) {
                                        return 8;
                                    } else {
                                        return 4;
                                    }
                                } else {
                                    return 0;
                                }
                            })
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
                            })
                            .on("mouseover", mouseOver)
                            .on("mouseout", mouseOut);

                        //reduce the radius of the trail circles
                        if (scope.showTrails) {
                            scope.data.forEach(function (d) {
                                var itemsList = svg.selectAll("." + d.name + "_actual")[0];

                                for (var i = itemsList.length - 1; i >= 0 ; i--) {
                                    if (i != itemsList.length - 1 && itemsList.length - 1 - i >= scope.trailDots) {
                                        itemsList[i].remove();
                                    } else if (i != itemsList.length - 1) {
                                        angular.element(itemsList[i]).attr("r", 2);
                                    }
                                }
                            });
                        }

                        //draw the names of the receptor name
                        if (scope.showNames) {
                            focus.selectAll("g.actual-pos-text")
                                .data(scope.data)
                                .enter().append("text")
                                .attr("transform", function (d) {
                                    if (d.proj_actual) {
                                        var proj = d.proj_actual.split(',');
                                        proj[0] = parseInt(proj[0]);
                                        proj[1] = parseInt(proj[1]);
                                        var i;
                                        for (i = 0; i < scope.positions[d.proj_actual].length; i++) {
                                            if (scope.positions[d.proj_actual][i].name === d.name) {
                                                break;
                                            }
                                        }
                                        proj[0] += 8;
                                        proj[1] += 12 * i;
                                        return "translate(" + proj + ")";
                                    } else {
                                        return 'translate(-100, -100)';
                                    }
                                })
                                .text(function (d) {
                                    return d.name;
                                });
                        }

                        function mouseOver (d) {
                            tooltip.style("opacity", 0.9);
                            tooltip.html(d.tooltipHtml);

                            var tooltipWidth = tooltip[0][0].offsetWidth;
                            var tooltipHeight = tooltip[0][0].offsetHeight;

                            var x = d3.event.layerX;
                            var y = d3.event.layerY;
                            if (window.innerWidth - x < tooltipWidth + 50) {
                                x = window.innerWidth - tooltipWidth - 50;
                            }
                            if (window.innerHeight - y < tooltipHeight + 50) {
                                y = window.innerHeight - tooltipHeight - 50;
                            }
                            tooltip
                                .style("top", (y + 15) + "px")
                                .style("left", (x + 15) + "px");
                        }

                        function mouseOut (d) {
                            tooltip.style("opacity", 0);
                        }
                    }

                    scope.$on('$destroy', function () {
                        unbindResize();
                    });
                });
            }
        };
    });

