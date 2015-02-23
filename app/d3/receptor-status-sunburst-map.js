angular.module('katGui.d3')

    .directive('receptorStatusSunburstMap', function (d3Service, StatusService, $timeout, $rootScope, d3Util) {
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
                        var radius = height / 2;
                        var padding = 2;
                        node = root = data;

                        r = height - 10;
                        var x = d3.scale.linear().range([0, 2 * Math.PI]);
                        var y = d3.scale.linear().range([0, radius]);

                        var mapLayout = d3.layout.partition()
                            .value(function (d) {
                                return d.blockValue;
                            })
                            .sort(function (a, b) {
                                return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
                            });

                        var svg = d3.select(element[0]).append("svg")
                            .attr("class", "health-chart md-whiteframe-z2 treemapHealthChart" + scope.dataMapName)
                            .attr("width", width + padding * 2)
                            .attr("height", height + padding * 2)
                            .append("g")
                            .attr("transform", "translate(" + [radius + padding, radius + padding] + ")");

                        var arc = d3.svg.arc()
                            .startAngle(function (d) {
                                return Math.max(0, Math.min(2 * Math.PI, x(d.x)));
                            })
                            .endAngle(function (d) {
                                return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx)));
                            })
                            .innerRadius(function (d) {
                                return Math.max(0, y(d.y));
                            })
                            .outerRadius(function (d) {
                                return Math.max(0, y(d.y + d.dy));
                            });

                        var g = svg.selectAll("g")
                            .data(mapLayout.nodes(data))
                            .enter().append("g");

                        var path = g.append("path")
                            .attr("d", arc)
                            //.style("fill", function (d) {
                            //    return (d.children ? "#259b24" : "transparent");
                            //})
                            .attr("id", d3Util.createSensorId)
                            .attr("class", function (d) {
                                if (d.objValue) {
                                    return d3Util.statusClassFromNumber(d.objValue.status) + '-child child';
                                } else if (d.sensorValue) {
                                    return d3Util.statusClassFromNumber(d.sensorValue.status) + '-child child';
                                }
                            })
                            .call(function (d) {
                                d3Util.applyTooltip(d, tooltip, scope.dataMapName);
                            })
                            .on("click", click);

                        var text = g.append("text")
                            .attr("transform", function (d) {
                                if (d.depth > 0) {
                                    return "rotate(" + computeTextRotation(d) + ")";
                                } else {
                                    return "translate(-30,3)";
                                }
                            })
                            .attr("x", function (d) {
                                return y(d.y);
                            })
                            .attr("dx", "4") // margin
                            .attr("dy", ".35em") // vertical-align
                            .attr("class", function (d) {
                                if (d.objValue) {
                                    return d3Util.statusClassFromNumber(d.objValue.status) + '-child-text child';
                                } else if (d.sensorValue) {
                                    return d3Util.statusClassFromNumber(d.sensorValue.status) + '-child-text parent';
                                }
                            })
                            .text(function (d) {
                                return d3Util.trimmedName(d, scope.dataMapName);
                            });

                        function click(d) {
                            // fade out all text elements
                            text.transition().attr("opacity", 0);

                            path.transition()
                                .duration(transitionDuration)
                                .attrTween("d", arcTween(d))
                                .each("end", function (e, i) {
                                    // check if the animated element's data e lies within the visible angle span given in d
                                    if (e.x >= d.x && e.x < (d.x + d.dx)) {
                                        // get a selection of the associated text element
                                        var arcText = d3.select(this.parentNode).select("text");
                                        // fade in the text element and recalculate positions
                                        arcText.transition().duration(transitionDuration)
                                            .attr("opacity", 1)
                                            .attr("transform", function () {
                                                return "rotate(" + computeTextRotation(e) + ")";
                                            })
                                            .attr("x", function (d) {
                                                return y(d.y);
                                            });
                                    }
                                });
                        }

                        function arcTween(d) {
                            var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
                                yd = d3.interpolate(y.domain(), [d.y, 1]),
                                yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
                            return function (d, i) {
                                return i ? function (t) {
                                    return arc(d);
                                }
                                    : function (t) {
                                    x.domain(xd(t));
                                    y.domain(yd(t)).range(yr(t));
                                    return arc(d);
                                };
                            };
                        }

                        function computeTextRotation(d) {
                            return (x(d.x + d.dx / 2) - Math.PI / 2) / Math.PI * 180;
                        }
                    }
                });
            }
        };
    });


