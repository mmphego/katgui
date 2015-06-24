angular.module('katGui.d3')

    .directive('receptorHealthIcicleMap', function (d3Service, StatusService, $timeout, $rootScope, d3Util) {
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

                    drawIcicleMap();

                    function drawIcicleMap() {
                        var width = scope.chartSize.width;
                        var height = scope.chartSize.height;
                        node = root = data;

                        r = height - 10;
                        //create our x,y axis linear scales
                        var x = d3.scale.linear().range([0, width]);
                        var y = d3.scale.linear().range([0, height]);

                        //create our maplayout for the data and sort it alphabetically
                        //the bockvalue is the relative size of each child element, it is
                        //set to a static 100 when we get our monitor data in the StatusService
                        var mapLayout = d3.layout.partition()
                            .value(function () {
                                return 10;
                            })
                            .sort(function (a, b) {
                                return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
                            });

                        //create the main svg element
                        var svg = d3.select(element[0]).append("svg")
                            .attr("width", width)
                            .attr("height", height)
                            .attr("class", "health-chart md-whiteframe-z2 treemapHealthChart" + scope.dataMapName)
                            .style("margin-left", margin.left + "px")
                            .style("margin-right", margin.right + "px")
                            .style("margin-top", margin.top + "px")
                            .style("margin-bottom", margin.bottom + "px")
                            .append("g");

                        //create a svg:g element for each child node
                        var g = svg.selectAll("g")
                            .data(mapLayout.nodes(root))
                            .enter().append("rect")
                            .attr("x", function (d) {
                                return x(d.x);
                            })
                            .attr("y", function (d) {
                                return y(d.y);
                            })
                            .attr("width", function (d) {
                                return x(d.dx);
                            })
                            .attr("height", function (d) {
                                return y(d.dy);
                            })
                            .attr("id", function (d) {
                                return d3Util.createSensorId(d, scope.dataMapName);
                            })
                            //style each element according to its status
                            .attr("class", function (d) {
                                return (d.sensorValue ? d.sensorValue.status : 'inactive') + '-child child';
                            })
                            .call(function (d) {
                                d3Util.applyTooltipValues(d, tooltip);
                            })
                            .on("click", icicleClicked);

                        //create text overlays for each svg element
                        var t = svg.selectAll("g")
                            .data(mapLayout.nodes(root)).enter()
                            .append("svg:text")
                            .attr("x", function (d) {
                                return x(d.x);
                            })
                            .attr("y", function (d) {
                                return y(d.y);
                            })
                            .attr("dy", ".2em")
                            .style("opacity", function (d) {
                                return x(d.x + d.dx) - x(d.x) > 14.5 ? 1 : 0;
                            })
                            .text(function (d) {
                                return d.name;
                            })
                            .attr("class", function (d) {
                                if (d.depth > 0) {
                                    return (d.sensorValue ? d.sensorValue.status : 'inactive') + '-child-text child';
                                } else {
                                    return (d.sensorValue ? d.sensorValue.status : 'inactive') + '-child-text parent';
                                }
                            })
                            .attr("text-anchor", "middle")
                            .attr("transform", function (d) {
                                var halfWidth = (x(d.x + d.dx) - x(d.x)) / 2,
                                    halfHeight = (y(d.y + d.dy) - y(d.y)) / 2;

                                var strTranslate = "translate(" + halfWidth + "," + halfHeight + ")";
                                if (halfWidth < 120) {
                                    strTranslate += "rotate(90, " + x(d.x) + ", " + y(d.y) + ")";
                                }
                                return strTranslate;
                            });

                        //implement zoom functionality
                        function icicleClicked(d) {
                            x.domain([d.x, d.x + d.dx]);
                            y.domain([d.y, 1]).range([d.y ? 20 : 0, height]);

                            g.transition()
                                .duration(transitionDuration)
                                .attr("x", function (d) {
                                    return x(d.x);
                                })
                                .attr("y", function (d) {
                                    return y(d.y);
                                })
                                .attr("width", function (d) {
                                    return x(d.x + d.dx) - x(d.x);
                                })
                                .attr("height", function (d) {
                                    return y(d.y + d.dy) - y(d.y);
                                });

                            t.transition()
                                .duration(transitionDuration)
                                .attr("x", function (d) {
                                    return x(d.x);
                                })
                                .attr("y", function (d) {
                                    return y(d.y);
                                })
                                .style("opacity", function (d) {
                                    return x(d.x + d.dx) - x(d.x) > 14.5 ? 1 : 0;
                                })
                                .attr("text-anchor", "middle")
                                .attr("transform", function (d) {
                                    var halfWidth = (x(d.x + d.dx) - x(d.x)) / 2,
                                        halfHeight = (y(d.y + d.dy) - y(d.y)) / 2;

                                    var strTranslate = "translate(" + halfWidth + "," + halfHeight + ")";
                                    if (halfWidth < 120) {
                                        strTranslate += "rotate(90, " + x(d.x) + ", " + y(d.y) + ")";
                                    }
                                    return strTranslate;
                                });
                            d3.event.stopPropagation();
                        }
                    }
                });
            }
        };
    });

