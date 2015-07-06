angular.module('katGui.d3')

    .directive('receptorHealthTreeMap', function (StatusService, $localStorage, $rootScope, d3Util) {
        return {
            restrict: 'EA',
            scope: {
                dataMapName: '=receptor'
            },
            link: function (scope, element) {

                var tooltip = d3.select(angular.element(document.querySelector('.treemap-tooltip'))[0]), containerSvg;

                StatusService.statusData[scope.dataMapName + "treemapClone"] = clone(StatusService.statusData[scope.dataMapName]);

                function clone(obj) {
                    var copy;
                    // Handle the 3 simple types, and null or undefined
                    if (null === obj || "object" !== typeof obj) {
                        return obj;
                    }
                    // Handle Array
                    if (obj instanceof Array) {
                        copy = [];
                        for (var i = 0, len = obj.length; i < len; i++) {
                            copy[i] = clone(obj[i]);
                        }
                        return copy;
                    }
                    // Handle Object
                    if (obj instanceof Object) {
                        copy = {};
                        for (var attr in obj) {
                            if (attr !== 'parent' && obj.hasOwnProperty(attr)) {
                                copy[attr] = clone(obj[attr]);
                            }
                        }
                        return copy;
                    }
                    throw new Error("Unable to copy obj! Its type isn't supported.");
                }

                if ($localStorage['receptorHealthDisplaySize']) {
                    scope.chartSize = JSON.parse($localStorage['receptorHealthDisplaySize']);
                } else {
                    scope.chartSize = {width: 480, height: 480};
                }

                $rootScope.$on('redrawChartMessage', function (event, message) {
                    if (message.size.width) {
                        scope.chartSize.width = message.size.width;
                    }
                    if (message.size.height) {
                        scope.chartSize.height = message.size.height;
                    }
                    containerSvg.remove();
                    scope.redraw();
                });

                scope.redraw = function () {

                    var root = StatusService.statusData[scope.dataMapName + "treemapClone"];

                    var margin = {top: 20, right: 0, bottom: 0, left: 0},
                        width = scope.chartSize.width,
                        height = scope.chartSize.height - margin.top - margin.bottom,
                        transitioning;

                    var x = d3.scale.linear()
                        .domain([0, width])
                        .range([0, width]);

                    var y = d3.scale.linear()
                        .domain([0, height])
                        .range([0, height]);

                    containerSvg = d3.select(element[0]).append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.bottom + margin.top)
                        .style("margin-left", -margin.left + "px")
                        .style("margin.right", -margin.right + "px")
                        .attr("class", "health-chart treemapHealthChart" + scope.dataMapName);
                    var svg = containerSvg.append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                        .style("shape-rendering", "crispEdges");

                    var treemap = d3.layout.treemap()
                        .children(function (d, depth) {
                            return depth ? null : d._children;
                        })
                        .sort(function (a, b) {
                            return a.value - b.value;
                        })
                        .ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
                        .round(false);

                    initialize(root);
                    accumulate(root);
                    layout(root);

                    var grandparent = svg.append("g")
                        .attr("class", "grandparent")
                        .attr("id", scope.dataMapName + "_" + root.sensor);

                    grandparent.append("rect")
                        .attr("y", -margin.top)
                        .attr("width", width)
                        .attr("height", margin.top);

                    grandparent.append("text")
                        .attr("x", 6)
                        .attr("y", 6 - margin.top)
                        .attr("dy", ".75em");

                    display(root);

                    function initialize(root) {
                        root.x = root.y = 0;
                        root.dx = width;
                        root.dy = height;
                        root.depth = 0;
                        initSizeValuesForLeaves(root);
                    }

                    function initSizeValuesForLeaves(node) {
                        if (node.children && node.children.length === 0) {
                            delete node.children;
                        } else {
                            node._children = node.children;
                        }
                        node.value = 1;
                        if (node.children) {
                            node.children.forEach(function (child) {
                                initSizeValuesForLeaves(child);
                            });
                        }
                    }

                    // Aggregate the values for internal nodes. This is normally done by the
                    // treemap layout, but not here because of our custom implementation.
                    // We also take a snapshot of the original children (_children) to avoid
                    // the children being overwritten when when layout is computed.
                    function accumulate(d) {
                        //return (d._children) ? d.value = d.children.reduce(function (p, v) {
                        //    return p + accumulate(v);
                        //}, 0) : d.value;
                    }

                    // Compute the treemap layout recursively such that each group of siblings
                    // uses the same size (1×1) rather than the dimensions of the parent cell.
                    // This optimizes the layout for the current zoom state. Note that a wrapper
                    // object is created for the parent node for each group of siblings so that
                    // the parent’s dimensions are not discarded as we recurse. Since each group
                    // of sibling was laid out in 1×1, we must rescale to fit using absolute
                    // coordinates. This lets us use a viewport to zoom.
                    function layout(d) {
                        if (d._children) {
                            treemap.nodes({_children: d._children});
                            d._children.forEach(function (c) {
                                c.x = d.x + c.x * d.dx;
                                c.y = d.y + c.y * d.dy;
                                c.dx *= d.dx;
                                c.dy *= d.dy;
                                c.parent = d;
                                layout(c);
                            });
                        }
                    }

                    function display(d) {
                        grandparent
                            .datum(d)
                            .attr("id", function (d) {
                                return d3Util.createSensorId(d, scope.dataMapName);
                            })
                            .attr("class", function (d) {
                                return (StatusService.sensorValues[scope.dataMapName + '_' + d.sensor] ?
                                        StatusService.sensorValues[scope.dataMapName + '_' + d.sensor].sensorValue.status : 'inactive') + '-child child';
                            })
                            .on("click", function (d) {
                                transition(d.parent);
                            })
                            .select("text")
                            .text(function (d) {
                                if (d.parent) {
                                    return name(d);
                                } else {
                                    return d.name;
                                }
                            });

                        var g1 = svg.insert("g", ".grandparent")
                            .datum(d);

                        var g = g1.selectAll("g")
                            .data(d._children)
                            .enter().append("g");

                        g.filter(function (d) {
                            return d._children;
                        }).on("click", transition);

                        g.append("rect")
                            //.attr("class", "parent")
                            .attr("id", function (d) {
                                return d3Util.createSensorId(d, scope.dataMapName);
                            })
                            .attr("class", function (d) {
                                return (StatusService.sensorValues[scope.dataMapName + '_' + d.sensor] ?
                                        StatusService.sensorValues[scope.dataMapName + '_' + d.sensor].sensorValue.status : 'inactive') + '-child child';
                            })
                            .call(rect)
                            .call(function (d) {
                                d3Util.applyTooltipValues(d, tooltip, scope.dataMapName);
                            });

                        g.append("text")
                            .attr("dy", ".75em")
                            .attr("class", function (d) {
                                return (StatusService.sensorValues[scope.dataMapName + '_' + d.sensor] ?
                                        StatusService.sensorValues[scope.dataMapName + '_' + d.sensor].sensorValue.status : 'inactive') + '-child child';
                            })
                            .text(function (d) {
                                return d.name;
                            })
                            .call(text);

                        function transition(d) {
                            if (transitioning || !d) {
                                return;
                            }
                            transitioning = true;

                            var g2 = display(d),
                                t1 = g1.transition().duration(250),
                                t2 = g2.transition().duration(250);

                            // Update the domain only after entering new elements.
                            x.domain([d.x, d.x + d.dx]);
                            y.domain([d.y, d.y + d.dy]);

                            // Enable anti-aliasing during the transition.
                            svg.style("shape-rendering", null);

                            // Draw child nodes on top of parent nodes.
                            //svg.selectAll(".depth").sort(function (a, b) {
                            //    return a.depth - b.depth;
                            //});

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

                        return g;
                    }

                    function text(t) {
                        t.attr("x", function (d) {
                            return x(d.x) + 6;
                        })
                            .attr("y", function (d) {
                                return y(d.y) + 6;
                            });
                    }

                    function rect(r) {
                        r.attr("x", function (d) {
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
                    }

                    function name(d) {
                        return d.parent ? name(d.parent) + "." + d.name
                            : d.name;
                    }
                };

                scope.redraw();
            }
        };
    });
