angular.module('katGui.d3')

    .directive('receptorPointing', function (d3Service, $rootScope, KatGuiUtil) {
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
                        width, height, chart, focus, projection, ticksAzimuth, scale;
                    var svg, x, y, xAxis, yAxis, xAxisElement, yAxisElement, path;

                    var formatNumber = d3.format(".1f"),
                        formatAngle = function (d) {
                            return formatNumber(d) + "°";
                        };

                    drawSvg();

                    function drawSvg() {
                        d3.select('svg').remove();

                        width = element[0].clientWidth - margin.left - margin.right;
                        height = element[0].clientHeight - margin.top - margin.bottom - 10;
                        scale = width * .45;

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

                        svg.append("path")
                            .datum(d3.geo.graticule())
                            .attr("class", "graticule")
                            .attr("d", path);

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

                        svg.selectAll(".actual-pos-text").remove();
                        svg.selectAll(".requested-pos-text").remove();
                        svg.selectAll("circle").remove();

                        svg.selectAll("g.actual-pos")
                            .data(scope.data)
                            .enter().append("circle")
                            .attr("class", "actual-pos")
                            .attr("r", 6)
                            .attr("transform", function (d) {
                                if (d.ap_actual_azim && d.ap_actual_elev) {
                                    return "translate(" + projection([d.ap_actual_azim.value, d.ap_actual_elev.value]) + ")";
                                } else {
                                    return 'translate(-100, -100)';
                                }
                            });

                        svg.selectAll("g.requested-pos")
                            .data(scope.data)
                            .enter().append("circle")
                            .attr("class", "requested-pos")
                            .attr("r", 2)
                            .attr("transform", function (d) {
                                if (d.ap_requested_azim && d.ap_requested_elev) {
                                    return "translate(" + projection([d.ap_requested_azim.value, d.ap_requested_elev.value]) + ")";
                                } else {
                                    return 'translate(-100, -100)';
                                }
                            });

                        svg.selectAll("g.requested-pos-text")
                            .data(scope.data)
                            .enter().append("g")
                            .attr("class", "requested-pos-text")
                            .append("text")
                            .attr("transform", function (d) {
                                if (d.ap_requested_azim && d.ap_requested_elev) {
                                    var proj = projection([d.ap_requested_azim.value, d.ap_requested_elev.value]);
                                    proj[0] += 10;
                                    proj[1] += 15;
                                    return "translate(" + proj + ")";
                                } else {
                                    return 'translate(-100, -100)';
                                }
                            })
                            .text(function (d) {
                                if (d.ap_requested_azim && d.ap_requested_elev) {
                                    return radecRadiansToString(KatGuiUtil.ra_dec(
                                        $rootScope.julianDay,
                                        $rootScope.longitude,
                                        $rootScope.latitude,
                                        d.ap_requested_azim.value,
                                        d.ap_requested_elev.value
                                    ));
                                } else {
                                    return '';
                                }
                            });

                        svg.selectAll("g.actual-pos-text")
                            .data(scope.data)
                            .enter().append("g")
                            .attr("class", "actual-pos-text")
                            .append("text")
                            .attr("transform", function (d) {
                                if (d.ap_actual_azim && d.ap_actual_elev) {
                                    var proj = projection([d.ap_actual_azim.value, d.ap_actual_elev.value]);
                                    proj[0] += 10;
                                    return "translate(" + proj + ")";
                                } else {
                                    return 'translate(-100, -100)';
                                }
                            })
                            .text(function (d) {
                                if (d.ap_actual_azim && d.ap_actual_elev) {
                                    return radecRadiansToString(KatGuiUtil.ra_dec(
                                        $rootScope.julianDay,
                                        $rootScope.longitude,
                                        $rootScope.latitude,
                                        d.ap_actual_azim.value,
                                        d.ap_actual_elev.value
                                    )) + " (actual)";
                                } else {
                                    return '';
                                }
                            });
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
                });
            }
        };
    });


