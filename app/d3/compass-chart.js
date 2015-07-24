angular.module('katGui.d3', ['katGui.util'])

    .directive('compassChart', function () {
        return {
            restrict: 'EA',
            scope: {
                redrawFunction: '='
            },
            link: function (scope, element) {

                scope.data = [];
                scope.redrawFunction = function (windDirection) {

                    if (!svg) {
                        drawSvg();
                    }
                    if (windDirection) {
                        scope.data.windDirection = windDirection;
                    }

                    drawValues();
                };

                var width, height, projection, ticksAzimuth, scale;
                var svg, x, y, path;
                var line = d3.svg.line()
                    .interpolate("basic")
                    .x(function (d) {
                        return d[0];
                    })
                    .y(function (d) {
                        return d[1];
                    });

                drawSvg();

                function drawSvg() {

                    //remove because we are redrawing the entire svg
                    d3.select('svg').remove();

                    width = element[0].clientWidth;
                    height = element[0].clientHeight;
                    scale = height * .4;

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
                        .attr("width", width)
                        .attr("height", height);

                    //draw the horizon circle
                    svg.append("path")
                        .datum(d3.geo.circle().origin([0, 90]).angle(90))
                        .attr("class", "horizon")
                        .attr("d", path);

                    ticksAzimuth = svg.append("g")
                        .attr("class", "ticks ticks--azimuth");

                    //draw the azimuth tick lines
                    ticksAzimuth.selectAll("line")
                        .data(d3.range(360))
                        .enter().append("line")
                        .each(function (d) {
                            var p0 = projection([d, 0]),
                                p1 = projection([d, d % 10 ? 0 : 5]);

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
                            var p = projection([d, -6]);
                            d3.select(this)
                                .attr("x", p[0])
                                .attr("y", p[1]);
                        })
                        .attr("dy", ".35em")
                        .text(function (d) {
                            //return d === 0 ? "N" : d === 90 ? "E" : d === 180 ? "S" : d === 270 ? "W" : d + "°";
                            return d === 0 ? "N" : d === 90 ? "E" : d === 180 ? "S" : d === 270 ? "W" : "";
                        });
                }

                function drawValues() {
                    svg.selectAll('.wind-direction').remove();
                    svg.selectAll('.wind-direction-path').remove();
                    svg.append("circle")
                        .attr("class", "wind-direction")
                        .attr("transform", function () {
                            if (scope.data.windDirection) {
                                var proj = projection([scope.data.windDirection, 0]);
                                return "translate(" + proj[0] + "," + proj[1] + ")";
                            } else {
                                return null;
                            }
                        })
                        .attr("r", 3);

                    svg.append("path")
                        .attr("class", "wind-direction-path")
                        .attr("d", function () {
                            if (scope.data.windDirection) {
                                return line([projection([scope.data.windDirection, 0]), projection([0, 90])]);
                            } else {
                                return null;
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
            }
        };
    });
