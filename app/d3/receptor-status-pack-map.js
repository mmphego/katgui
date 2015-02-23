angular.module('katGui.d3')

    .directive('receptorStatusPackMap', function (d3Service, StatusService, $timeout, $rootScope, d3Util) {
        return {
            restrict: 'E',
            scope: {
                dataMapName: '=receptor',
                chartSize: '='
            },
            link: function (scope, element) {

                d3Service.d3().then(function (d3) {

                    var data = StatusService.statusData[scope.dataMapName];
                    var r = 640, node, root, transitionDuration = 250;
                    var margin = {top: 8, right: 8, left: 8, bottom: 8};
                    var tooltip = d3Util.createTooltip(element[0]);

                    d3Util.waitUntilDataExists(data)
                        .then(function () {
                            drawPackMap(data);
                        }, function () {
                            d3Util.displayInitErrorMessage(scope.dataMapName);
                        });

                    function drawPackMap() {
                        var width = scope.chartSize.width;
                        var height = scope.chartSize.height;
                        node = root = data;

                        r = height - 10;
                        //create our x,y axis linear scales
                        var x = d3.scale.linear().range([0, r]);
                        var y = d3.scale.linear().range([0, r]);

                        //create our maplayout for the data and sort it alphabetically
                        //the bockvalue is the relative size of each child element, it is
                        //set to a static 100 when we get our monitor data in the StatusService
                        var mapLayout = d3.layout.pack()
                            .size([r, r])
                            .value(function (d) {
                                return d.blockValue;
                            });

                        //create the main svg element
                        var svg = d3.select(element[0]).append("svg")
                                .attr("width", width)
                                .attr("height", height)
                                .attr("class", "health-chart md-whiteframe-z2 treemapHealthChart" + scope.dataMapName)
                                .style("margin-left", margin.left + "px")
                                .style("margin-right", margin.right + "px")
                                .append("g");
                            svg.attr("transform", "translate(" + (width - r) / 2 + "," + (height - r) / 2 + ")");

                        var nodes = mapLayout.nodes(data);

                        //create a svg:circle element for each child node
                        svg.selectAll("circle")
                            .data(nodes)
                            .enter().append("svg:circle")
                            .attr("class", function (d) {
                                if (d.depth > 0) {
                                    return d3Util.statusClassFromNumber(d.sensorValue.status) + '-child';
                                } else if (d.depth === 0) {
                                    return d3Util.statusClassFromNumber(d.sensorValue.status) + '-child parent';
                                }
                            })
                            .attr("cx", function (d) {
                                return d.x;
                            })
                            .attr("cy", function (d) {
                                return d.y;
                            })
                            .attr("r", function (d) {
                                return d.r;
                            })
                            .on("click", function (d) {
                                return zoomPack(node === d ? root : d);
                            })
                            .attr("id", d3Util.createSensorId)
                            .call(function (d) {
                                d3Util.applyTooltipValues(d, tooltip);
                            });

                        //create a svg:text element for each child node
                        svg.selectAll("text")
                            .data(nodes)
                            .enter().append("svg:text")
                            .attr("class", function (d) {
                                if (d.depth > 0) {
                                    return d3Util.statusClassFromNumber(d.sensorValue.status) + '-child-text child';
                                } else if (d.depth === 0) {
                                    return d3Util.statusClassFromNumber(d.sensorValue.status) + '-child-text parent';
                                }
                            })
                            .attr("x", function (d) {
                                if (d.depth > 0) {
                                    return d.x;
                                } else {
                                    return width / 2 - 10;
                                }
                            })
                            .attr("y", function (d) {
                                if (d.depth > 0) {
                                    return d.y;
                                } else {
                                    return 18;
                                }
                            })
                            .attr("dy", ".35em")
                            .attr("text-anchor", "middle")
                            .style("opacity", function (d) {
                                return d.r > 50 ? 1 : 0;
                            })
                            .text(function (d) {
                                return d3Util.trimmedReceptorName(d, scope.dataMapName);
                            });

                        //zoom functionality when clicking a child element
                        function zoomPack(d) {

                            var k = r / d.r / 2;
                            x.domain([d.x - d.r, d.x + d.r]);
                            y.domain([d.y - d.r, d.y + d.r]);

                            var transition = svg.transition()
                                .duration(transitionDuration);

                            transition.selectAll("circle")
                                .attr("cx", function (d) {
                                    return x(d.x);
                                })
                                .attr("cy", function (d) {
                                    return y(d.y);
                                })
                                .attr("r", function (d) {
                                    return k * d.r;
                                })
                                .call(function (d) {
                                    d3Util.applyTooltipValues(d, tooltip);
                                });

                            transition.selectAll("text")
                                .attr("x", function (d) {
                                    if (d.depth > 0) {
                                        return x(d.x);
                                    } else {
                                        return width / 2 - 10;
                                    }
                                })
                                .attr("y", function (d) {
                                    if (d.depth > 0) {
                                        return y(d.y);
                                    } else {
                                        return 17;
                                    }
                                })
                                .style("opacity", function (d) {
                                    return k * d.r > 50 ? 1 : 0;
                                });

                            node = d;
                            d3.event.stopPropagation();
                        }
                    }
                });
            }
        };
    });


