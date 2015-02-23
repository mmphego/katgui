angular.module('katGui.d3')

    .directive('receptorStatusIcicleMap', function (d3Service, StatusService, $timeout, $rootScope, d3Util) {
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
                    var retries = 0, maxRetries = 200;
                    displayIfDataExists();

                    function displayIfDataExists() {
                        if (data.children.length === 0 && retries < maxRetries) {
                            $timeout(function () {
                                displayIfDataExists();
                            }, 500);
                            retries++;
                        } else if (retries >= maxRetries) {
                            $rootScope.showSimpleDialog('Error displaying data', 'Could not display the Receptor Status data, contact the katGUI support team.');
                            console.error('Error binding to StatusService data for receptor ' + scope.dataMapName);
                        } else {
                            drawPartitionMap(data);
                        }
                    }

                    function drawPartitionMap() {
                        var width = scope.chartSize.width;
                        var height = scope.chartSize.height;
                        node = root = data;

                        r = height - 10;
                        var x = d3.scale.linear().range([0, width]);
                        var y = d3.scale.linear().range([0, height]);

                        var mapLayout = d3.layout.partition()
                            .value(function (d) {
                                return d.blockValue;
                            })
                            .sort(function (a, b) {
                                return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
                            });

                        var svg = d3.select(element[0]).append("svg")
                            .attr("width", width)
                            .attr("height", height)
                            .attr("class", "health-chart md-whiteframe-z2 treemapHealthChart" + scope.dataMapName)
                            .style("margin-left", margin.left + "px")
                            .style("margin-right", margin.right + "px")
                            .style("margin-top", margin.top + "px")
                            .style("margin-bottom", margin.bottom + "px")
                            .append("g");

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
                            .attr("id", d3Util.createSensorId)
                            .attr("class", function (d) {
                                if (d.objValue) {
                                    return d3Util.statusClassFromNumber(d.objValue.status) + '-child child';
                                } else if (d.sensorValue) {
                                    return d3Util.statusClassFromNumber(d.sensorValue.status) + '-child child';
                                }
                            })
                            .call(function(d) {
                                d3Util.applyTooltip(d, tooltip, scope.dataMapName);
                            })
                            .on("click", icicleClicked);

                        var kx = width / root.dx;

                        var t = svg.selectAll("g")
                            .data(mapLayout.nodes(root)).enter()
                            .append("svg:text")
                            .attr("x", function (d) {
                                return x(d.x) - 23;
                            })
                            .attr("y", function (d) {
                                return y(d.y);
                            })
                            .attr("dy", ".2em")
                            .style("opacity", function (d) {
                                return x(d.x + d.dx) - x(d.x) > 14.5 ? 1 : 0;
                            })
                            .text(function (d) {
                                return d3Util.trimmedName(d, scope.dataMapName);
                            })
                            .attr("class", function (d) {
                                if (d.objValue) {
                                    return d3Util.statusClassFromNumber(d.objValue.status) + '-child-text child';
                                } else if (d.sensorValue) {
                                    return d3Util.statusClassFromNumber(d.sensorValue.status) + '-child-text parent';
                                }
                            })
                            .attr("text-anchor", "start")
                            .attr("transform", function (d) {
                                var halfWidth = (x(d.x + d.dx) - x(d.x)) / 2,
                                    halfHeight = (y(d.y + d.dy) - y(d.y)) / 2;

                                var strTranslate = "translate(" + halfWidth + "," + halfHeight + ")";
                                if (halfWidth < 60) {
                                    strTranslate += "rotate(90, " + x(d.x) + ", " + y(d.y) + ")";
                                    strTranslate += "translate(-60,0)";
                                }
                                return strTranslate;
                            });

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
                                    if (halfWidth < 60) {
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


