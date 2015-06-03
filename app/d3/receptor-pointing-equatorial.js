angular.module('katGui.d3')

    .directive('receptorPointingEquatorial', function (d3Service, $rootScope, KatGuiUtil) {
        return {
            restrict: 'EA',
            scope: {
                redrawFunction: '='
            },
            link: function (scope, element) {

                d3Service.d3().then(function (d3) {

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

                    var tooltip = d3.select(element[0]).append("div")
                        .attr("class", "receptor-pointing-tooltip")
                        .style("opacity", 0);

                    var margin = {top: 10, right: 20, bottom: 10, left: 10},
                        width, height, projection, ticksAzimuth, scale;
                    var svg, x, y, path;

                    drawSvg();

                    function drawSvg() {

                        d3.select('svg').remove();

                        width = element[0].clientWidth - margin.left - margin.right;
                        height = element[0].clientHeight - margin.top - margin.bottom - 5;
                        scale = height * .45;

                        if (height < 0) {
                            height = 0;
                        }

                        projection = d3.geo.projection(flippedStereographic)
                            .scale(scale)
                            .clipAngle(130)
                            .rotate([0, -90])
                            .translate([width / 2 + .5, height / 2 + .5])
                            .precision(.1);

                        path = d3.geo.path()
                            .projection(projection);

                        svg = d3.select(element[0]).append("svg")
                            .attr("width", width + margin.left + margin.right)
                            .attr("height", height + margin.top + margin.bottom);

                        svg.append("path")
                            .datum(d3.geo.circle().origin([0, 90]).angle(90))
                            .attr("class", "horizon")
                            .attr("d", path);

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

                        if (scope.showGridLines) {
                            svg.append("path")
                                .datum(d3.geo.graticule())
                                .attr("class", "graticule")
                                .attr("d", path);
                        }

                        ticksAzimuth = svg.append("g")
                            .attr("class", "ticks ticks--azimuth");

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

                        scope.positions = {};
                        scope.positions_requested = {};
                        svg.selectAll(".name-pos-text").remove();
                        svg.selectAll(".actual-pos-text").remove();
                        svg.selectAll(".requested-pos-text").remove();
                        if (!scope.showTrails) {
                            svg.selectAll("circle").remove();
                        } else {
                            //svg.selectAll("circle").remove();
                            svg.selectAll("circle.requested-pos").remove();
                        }

                        scope.data.forEach(function (d) {
                            if (d.ap_actual_azim && d.ap_actual_elev) {
                                var proj_actual = projection([d.ap_actual_azim.value, d.ap_actual_elev.value]);
                                d.proj_actual = Math.floor(proj_actual[0] * 100) / 100  + ',' + Math.floor(proj_actual[1] * 100) / 100 ;
                                if (!scope.positions[d.proj_actual]) {
                                    scope.positions[d.proj_actual] = [];
                                }
                                scope.positions[d.proj_actual].push(d);
                            }

                            if (d.ap_requested_azim && d.ap_requested_elev) {
                                var proj_requested = projection([d.ap_requested_azim.value, d.ap_requested_elev.value]);
                                d.proj_requested = Math.floor(proj_requested[0] * 100) / 100  + ',' + Math.floor(proj_requested[1] * 100) / 100 ;
                                if (!scope.positions_requested[d.proj_requested]) {
                                    scope.positions_requested[d.proj_requested] = [];
                                }
                                scope.positions_requested[d.proj_requested].push(d);
                            }
                            d.tooltipHtml = null;
                        });

                        scope.data.forEach(function (d) {
                            if (!d.tooltipHtml) {
                                var items = scope.positions[d.proj_actual];
                                d.tooltipHtml = "<div>";
                                for (var i in items) {

                                    d.tooltipHtml += "<b>" + items[i].name + " </b>";
                                    if (items[i].ap_actual_azim) {
                                        d.tooltipHtml += "<br/>az: " + Math.round(items[i].ap_actual_azim.value * 100) / 100 + ", el: " + Math.round(items[i].ap_actual_elev.value * 100) / 100;
                                    }
                                    if (items[i].ap_requested_azim) {
                                        d.tooltipHtml += "<br/>az: " + Math.round(items[i].ap_requested_azim.value * 100) / 100 + ", el: " + Math.round(items[i].ap_requested_elev.value * 100) / 100 + " (requested)";
                                    }
                                    d.tooltipHtml += "<br/>";
                                }
                                d.tooltipHtml += "</div>";
                            }
                        });

                        svg.selectAll("g.requested-pos")
                            .data(scope.data)
                            .enter().append("circle")
                            .attr("class", "requested-pos")
                            .attr("r", 5)
                            .attr("transform", function (d) {
                                if (d.proj_requested) {
                                    return "translate(" + d.proj_requested + ")";
                                } else {
                                    return 'translate(-100, -100)';
                                }
                            })
                            .on("mouseover", mouseOver)
                            .on("mouseout", mouseOut);

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
                                    return "translate(" + d.proj_actual + ")";
                                } else {
                                    return 'translate(-100, -100)';
                                }
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
                            .on("mouseover", mouseOver)
                            .on("mouseout", mouseOut);

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

                        //.text(function (d) {
                        //        if (d.ap_requested_azim && d.ap_requested_elev) {
                        //            return radecRadiansToString(KatGuiUtil.ra_dec(
                        //                $rootScope.julianDay,
                        //                $rootScope.longitude,
                        //                $rootScope.latitude,
                        //                d.ap_requested_azim.value,
                        //                d.ap_requested_elev.value
                        //            ));
                        //        } else {
                        //            return '';
                        //        }
                        //    });
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

                    function radecRadiansToString(radec) {
                        return "RA: " +
                            Math.round(((radec[0] * (180/Math.PI)) / Math.PI) * 100) / 100 +
                            "h, D: " +
                            Math.round(radec[1]*(180/Math.PI) * 100) / 100 + "d";
                    }

                    function mouseOver (d) {
                        tooltip.style("opacity", 0.9);
                        tooltip.html(d.tooltipHtml);

                        var x = d3.event.layerX;
                        var y = d3.event.layerY;
                        //move the tooltip to 36,36 when we hover over the hide button
                        if (window.innerWidth - x < 300) {
                            x = window.innerWidth - 300;
                        }
                        if (window.innerHeight - y < 240) {
                            y = window.innerHeight - 240;
                        }
                        tooltip
                            .style("top", (y + 15) + "px")
                            .style("left", (x + 15) + "px");
                    }

                    function mouseOut (d) {
                        tooltip
                            .style("opacity", 0);
                    }

                    scope.$on('$destroy', function () {
                        unbindResize();
                    });
                });
            }
        };
    });


