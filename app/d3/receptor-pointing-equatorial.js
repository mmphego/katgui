angular.module('katGui.d3')

    .directive('receptorPointingEquatorial', function (d3Service) {
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
                        if (newVal !== oldVal) {
                            drawSvg();
                            drawValues();
                        }
                    });

                    var color = d3.scale.category20();
                    scope.showGridLines = true;
                    var horizonMaskDsv = d3.dsv(" ", "text/plain");

                    scope.data = [];
                    scope.redrawFunction = function (receptors, showNames, showTrails, showGridLines, trailDots, horizonMaskToggled) {

                        scope.showNames = showNames;
                        scope.showTrails = showTrails;
                        scope.trailDots = trailDots;
                        scope.data = receptors;

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

                        if (!svg
                            || scope.showGridLines !== showGridLines
                            || newHorizonData
                            || horizonMaskToggled) {
                            scope.showGridLines = showGridLines;
                            drawSvg();
                        }

                        drawValues();
                    };

                    //create a mouseover tooltip element
                    var tooltip = d3.select(element[0]).append("div")
                        .attr("class", "receptor-pointing-tooltip")
                        .style("opacity", 0);

                    var margin = {top: 10, right: 20, bottom: 10, left: 10},
                        width, height, projection, ticksAzimuth, scale;
                    var svg, x, y, path;

                    drawSvg();

                    function drawSvg() {

                        //remove because we are redrawing the entire svg
                        d3.select('svg').remove();

                        width = element[0].clientWidth - margin.left - margin.right;
                        height = element[0].clientHeight - margin.top - margin.bottom - 5;
                        scale = height * .45;

                        if (height < 0) {
                            height = 0;
                        }

                        //setup d3 projection for stereographic display
                        projection = d3.geo.projection(flippedStereographic)
                            .scale(scale)
                            .clipAngle(130)
                            .rotate([0, -90])
                            .translate([width / 2 + .5, height / 2 + .5])
                            .precision(.01);

                        path = d3.geo.path()
                            .projection(projection);

                        //add the svg canvas
                        svg = d3.select(element[0]).append("svg")
                            .attr("width", width + margin.left + margin.right)
                            .attr("height", height + margin.top + margin.bottom);

                        //draw the horizon circle
                        svg.append("path")
                            .datum(d3.geo.circle().origin([0, 90]).angle(90))
                            .attr("class", "horizon")
                            .attr("d", path);

                        //draw all of the horizon masks that are selected to be shown
                        svg.selectAll("path.horizon-mask")
                            .data(scope.data)
                            .enter().append("path")
                            .attr("class", function (d) {
                                return "horizon-mask " + d.name + "_actual";
                            })
                            .style("fill", "transparent")
                            .style("stroke-width", "2px")
                            .style("stroke-dasharray", "10, 5")
                            .attr("d", function (d) {
                                if (d.horizonMaskData  && d.showHorizonMask) {
                                    return path({type:'LineString', coordinates: d.horizonMaskData});
                                } else {
                                    return null;
                                }
                            });

                        //draw the graticule (grid lines)
                        if (scope.showGridLines) {
                            svg.append("path")
                                .datum(d3.geo.graticule())
                                .attr("class", "graticule")
                                .attr("d", path);
                        }

                        ticksAzimuth = svg.append("g")
                            .attr("class", "ticks ticks--azimuth");

                        //draw the azimuth tick lines
                        ticksAzimuth.selectAll("line")
                            .data(d3.range(360))
                            .enter().append("line")
                            .each(function (d) {
                                var p0 = projection([d, 0]),
                                    p1 = projection([d, d % 10 ? -1 : -2]);

                                d3.select(this)
                                    .attr("x1", p0[0])
                                    .attr("y1", p0[1])
                                    .attr("x2", p1[0])
                                    .attr("y2", p1[1]);
                            });

                        //draw the azimuth tick values
                        ticksAzimuth.selectAll("text")
                            .data(d3.range(0, 360, 10))
                            .enter().append("text")
                            .each(function (d) {
                                var p = projection([d, -4]);
                                d3.select(this)
                                    .attr("x", p[0])
                                    .attr("y", p[1]);
                            })
                            .attr("dy", ".35em")
                            .text(function (d) {
                                return d === 0 ? "N" : d === 90 ? "E" : d === 180 ? "S" : d === 270 ? "W" : d + "°";
                            });

                        //draw the elevation circle text
                        svg.append("g")
                            .attr("class", "ticks ticks--elevation")
                            .selectAll("text")
                            .data(d3.range(10, 91, 10))
                            .enter().append("text")
                            .each(function (d) {
                                var p = projection([0, d]);

                                d3.select(this)
                                    .attr("x", p[0])
                                    .attr("y", p[1]);
                            })
                            .attr("dy", ".35em")
                            .text(function (d) {
                                return d + "°";
                            });
                    }

                    function drawValues() {

                        //remove old positions before drawing new positions
                        svg.selectAll(".name-pos-text").remove();
                        svg.selectAll(".actual-pos-text").remove();
                        svg.selectAll(".requested-pos-text").remove();
                        if (!scope.showTrails) {
                            svg.selectAll("circle").remove();
                            svg.selectAll("g.requested-pos").remove();
                        } else {
                            svg.selectAll("g.requested-pos").remove();
                        }

                        //calculate and save the projection data to display points in the same position as bigger circles
                        //and to group tooltip values for points in the same position
                        scope.positions = {};
                        scope.positions_requested = {};

                        scope.data.forEach(function (d) {
                            if (d.ap_actual_azim && d.ap_actual_elev) {
                                var proj_actual = projection([d.ap_actual_azim.value, d.ap_actual_elev.value]);
                                d.proj_actual_az_x = Math.floor(proj_actual[0] * pm) / pm;
                                d.proj_actual_el_y = Math.floor(proj_actual[1] * pm) / pm;
                                d.proj_actual = round(proj_actual[0], 5)  + ',' + round(proj_actual[1], 5);
                                if (!scope.positions[d.proj_actual]) {
                                    scope.positions[d.proj_actual] = [];
                                }
                                scope.positions[d.proj_actual].push(d);
                            }

                            if (d.ap_requested_azim && d.ap_requested_elev) {
                                var proj_requested = projection([d.ap_requested_azim.value, d.ap_requested_elev.value]);
                                d.proj_requested_az_x = Math.floor(proj_requested[0] * pm) / pm;
                                d.proj_requested_el_y = Math.floor(proj_requested[1] * pm) / pm;
                                d.proj_requested = d.proj_requested_az_x + ',' + d.proj_requested_el_y;
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
                                    if (items[i].ap_actual_azim && items[i].ap_actual_elev) {
                                        d.tooltipHtml += "<br/>az: " + Math.round(items[i].ap_actual_azim.value * pm) / pm + ", el: " + Math.round(items[i].ap_actual_elev.value * pm) / pm;
                                    }
                                    if (items[i].ap_requested_azim && items[i].ap_requested_elev) {
                                        d.tooltipHtml += "<br/>az: " + Math.round(items[i].ap_requested_azim.value * pm) / pm + ", el: " + Math.round(items[i].ap_requested_elev.value * pm) / pm + " (requested)";
                                    }
                                    if (items[i].pos_request_base_ra && items[i].pos_request_base_dec) {
                                        d.tooltipHtml += "<br/>ra: " + Math.round(items[i].pos_request_base_ra.value * pm) / pm + ", dec: " + Math.round(items[i].pos_request_base_dec.value * pm) / pm + " (requested)";
                                    }
                                    if (items[i].pos_delta_sky) {
                                        d.tooltipHtml += "<br/>Delta Sky: " + Math.round(items[i].pos_delta_sky.value * pm) / pm;
                                    }
                                    d.tooltipHtml += "<br/>";
                                }
                                d.tooltipHtml += "</div>";
                            }
                        });

                        //draw a crosshair where the requested position is
                        svg.selectAll("g.requested-pos")
                            .data(scope.data)
                            .enter().append('g')
                            .attr("class", "requested-pos")
                            .attr("transform", function (d) {
                                if (d.proj_requested) {
                                    return "translate(" + (d.proj_requested_az_x - 8.3) + "," + (d.proj_requested_el_y + 6.7)  + ")";
                                } else {
                                    return 'translate(-100, -100)';
                                }
                            })
                            .append('text')
                            .attr('font-family', 'FontAwesome')
                            .attr('font-size', '19px')
                            .attr('stroke-width', '0.5px')
                            .text('\uf05b')
                            .on("mouseover", mouseOver)
                            .on("mouseout", mouseOut);

                        //draw a color circle where the actual position is
                        //and setup tooltip behaviour
                        svg.selectAll("g.actual-pos")
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
                            .attr("transform", function (d) {
                                if (d.proj_actual) {
                                    return "translate(" + (d.proj_actual_az_x) + "," + (d.proj_actual_el_y) + ")";
                                } else {
                                    return 'translate(-100, -100)';
                                }
                            })
                            .attr("r", function (d) {
                                //for points in the same position, draw overlapping big circles
                                if (d.proj_actual) {
                                    if (scope.positions[d.proj_actual].length > 1) {
                                        return 10;
                                    } else {
                                        return 4;
                                    }
                                } else {
                                    return 0;
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
                            svg.selectAll("g.name-pos-text")
                                .data(scope.data)
                                .enter().append("g")
                                .attr("class", "name-pos-text")
                                .append("text")
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
                    }

                    function flippedStereographic(λ, φ) {
                        var cosλ = Math.cos(λ),
                            cosφ = Math.cos(φ),
                            k = 1 / (1 + cosλ * cosφ);
                        return [
                            k * cosφ * Math.sin(λ),
                            -k * Math.sin(φ)
                        ];
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
                        tooltip
                            .style("opacity", 0);
                    }

                    function round(i, v) {
                        return Math.round(i/v) * v;
                    }

                    scope.$on('$destroy', function () {
                        unbindResize();
                    });
                });
            }
        };
    });


