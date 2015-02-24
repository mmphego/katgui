angular.module('katGui.d3')

    .directive('receptorStatusTreeMap', function (d3Service, StatusService, $timeout, $rootScope, d3Util) {
        return {
            restrict: 'E',
            scope: {
                dataMapName: '=receptor',
                chartSize: '='
            },
            link: function (scope, element) {

                d3Service.d3().then(function (d3) {

                    var data = StatusService.statusData[scope.dataMapName];
                    var width = scope.chartSize.width, height = scope.chartSize.height, inited = false, node, root, duration = 250;
                    var margin = {top: 8, right: 8, left: 8, bottom: 8},
                        transitioning;
                    var tooltip = d3Util.createTooltip(element[0]);

                    d3Util.waitUntilDataExists(data)
                        .then(function () {
                            drawTreemap();
                        }, function () {
                            d3Util.displayInitErrorMessage(scope.dataMapName);
                        });

                    function drawTreemap() {
                        node = root = data;
                        if (!inited) {
                            inited = true;
                            data._children = data.children;
                        }

                        //create our x,y axis linear scales
                        var x = d3.scale.linear().domain([0, width]).range([0, width]);
                        var y = d3.scale.linear().domain([0, height]).range([0, height]);


                        //create our maplayout for the data and sort it alphabetically
                        //the bockvalue is the relative size of each child element, it is
                        //set to a static 100 when we get our monitor data in the StatusService
                        var mapLayout = d3.layout.treemap()
                            .children(function (d, depth) {
                                return depth ? null : d._children;
                            })
                            .sort(function (a, b) {
                                return a.name < b.name ? 1 : a.name > b.name ? -1 : 0;
                            })
                            .round(false)
                            .value(function (d) {
                                return d.blockValue;
                            });

                        //create the main svg element
                        var svg = d3.select(element[0]).append("svg")
                            .attr("width", width)
                            .attr("height", height + margin.top + 18)
                            .attr("class", "health-chart md-whiteframe-z2 treemapHealthChart" + scope.dataMapName)
                            .style("margin-left", margin.left + "px")
                            .style("margin-right", margin.right + "px")
                            .style("margin-top", margin.top + "px")
                            .append("g");
                        svg.style("shape-rendering", "crispEdges");
                        //create the top root node
                        var grandparent = svg.append("g")
                            .attr("class", "grandparent");
                        //give the root node a svg:rect element
                        grandparent.append("rect")
                            .attr("y", 0)
                            .attr("width", width)
                            .attr("height", 26);
                        //give the root node some text overlay
                        grandparent.append("text")
                            .attr("x", 6)
                            .attr("y", margin.top)
                            .attr("dy", ".75em");

                        //initialize the data for the draw function
                        data.x = data.y = 0;
                        data.dx = width;
                        data.dy = height;
                        data.depth = 0;
                        d3Util.layout(data, mapLayout);

                        //initialize the root node with actual data
                        grandparent
                            .datum(data)
                            .attr("id", d3Util.createSensorId(data))
                            .attr("class", d3Util.statusClassFromNumber(data.sensorValue.status) + '-child')
                            .on("click", transition)
                            .select("text")
                            .text(function (d) {
                                return d.parent ? d.parent.name + "." + d.name : d.name;
                            })
                            .attr("class", d3Util.statusClassFromNumber(data.sensorValue.status) + '-child-text');

                        //add a svg:g element to the root node that will contain all the child nodes
                        var g1 = svg.insert("g", ".grandparent")
                            .datum(data)
                            .attr("class", "depth")
                            .attr("transform", function (d) {
                                return "translate(0,26)";
                            });

                        //create svg:g elements for each child node
                        var g = g1.selectAll("g")
                            .data(data._children)
                            .enter().append("svg").append("g");

                        //apply the children class to all child nodes
                        g.filter(function (d) {
                            return d._children;
                        }).classed("children", true)
                            .on("click", transition);

                        //create the svg:rect element for each child svg:g node
                        g.append("rect")
                            .attr("class", "parent")
                            .attr("id", d3Util.createSensorId)
                            .attr("class", function (d) {
                                if (d.depth > 0) {
                                    return d3Util.statusClassFromNumber(d.sensorValue.status) + '-child';
                                } else if (d.depth === 0) {
                                    return d3Util.statusClassFromNumber(d.sensorValue.status) + '-child parent';
                                }
                            })
                            .call(rect);

                        //create the text overlay for each child node
                        g.append("text")
                            .attr("dy", ".75em")
                            .text(function (d) {
                                return d3Util.trimmedReceptorName(d, scope.dataMapName);
                            })
                            .attr("class", function (d) {
                                if (d.depth > 0) {
                                    return d3Util.statusClassFromNumber(d.sensorValue.status) + '-child-text child';
                                } else if (d.depth === 0) {
                                    return d3Util.statusClassFromNumber(d.sensorValue.status) + '-child-text parent';
                                }
                            })
                            .classed("text-parent-node", true)
                            .call(text);

                        //implement zoom functionality
                        function transition(d) {
                            tooltip.style("visibility", "hidden");

                            if (transitioning || !d) {
                                return;
                            }
                            transitioning = true;

                            var g2 = drawTreemap(d),
                                t1 = g1.transition().duration(duration),
                                t2 = g2.transition().duration(duration);

                            // Update the domain only after entering new elements.
                            x.domain([d.x, d.x + d.dx]);
                            y.domain([d.y, d.y + d.dy]);

                            // Enable anti-aliasing during the transition.
                            svg.style("shape-rendering", null);

                            // Draw child nodes on top of parent nodes.
                            svg.selectAll(".depth").sort(function (a, b) {
                                //this sorts the data by name ascending, so ANT1 < ANT2 < ANT3 etc
                                return a.name < b.name ? 1 : a.name > b.name ? -1 : 0;
                            });

                            // Fade-in entering text.
                            g2.selectAll("text").style("fill-opacity", 0);

                            // Transition to the new view.
                            t1.selectAll("text").call(text).style("fill-opacity", 0);
                            t2.selectAll("text").call(text).style("fill-opacity", 1);
                            t1.selectAll("rect").call(rect);
                            t2.selectAll("rect").call(rect);

                            // Remove the old node when the transition is finished.
                            t1.remove().each("end", function () {
                                svg.style("shape-rendering", "crispEdges");
                                transitioning = false;
                            });
                        }

                        function text(t) {
                            t.attr("x", function (d) {
                                return x(d.x) + 6;
                            }).attr("y", function (d) {
                                return y(d.y) + 6;
                            });
                        }

                        function rect(r) {
                            r.attr("x", function (d) {
                                return x(d.x);
                            }).attr("y", function (d) {
                                return y(d.y);
                            }).attr("width", function (d) {
                                return x(d.x + d.dx) - x(d.x);
                            }).attr("height", function (d) {
                                return y(d.y + d.dy) - y(d.y);
                            });

                            d3Util.applyTooltipValues(r, tooltip);
                        }
                    }
                });
            }
        };
    });


