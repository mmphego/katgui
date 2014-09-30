angular.module('katGui.d3')

    .directive('d3Treemap', function ($window, d3Service) {
        return{
            restrict: 'EA',
            scope: {
                data: '=',
                chartSize: '=',
                mapType: '='
            },
            replace: false,
            link: function (scope, element) {

                d3Service.d3().then(function (d3) {

                    var cacheData = JSON.parse(JSON.stringify(scope.data));

                    var width, height, inited = false, r = 720, node, root, padding = 5, duration = 500;
                    var arc;

                    var margin = {top: 20, right: 0, bottom: 0, left: 0},
                        transitioning;

                    scope.$watch('chartSize', function () {
                        if (scope.chartSize.width !== width || scope.chartSize.height !== height + margin.top) {
                            d3.select("#treemapHealthChart").remove();
                            chart(cacheData);
                        }
                    }, true);

                    scope.$watch('mapType', function (newVal, oldVal) {
                        if (oldVal !== newVal) {
                            inited = false;
                            d3.select("#treemapHealthChart").remove();
                            cacheData = JSON.parse(JSON.stringify(scope.data));
                            chart(cacheData);
                        }
                    });

                    var tooltip = d3.select(element[0]).append("div")
                        .attr("class", "treemap-tooltip")
                        .style("visibility", "hidden")
                        .style("background-color", "#ffffff");

                    chart(cacheData);

                    function chart(data) {

                        var radius = height / 2;
                        node = root = data;

                        if (!inited && scope.mapType === 'tree') {
                            inited = true;
                            //we should only accumulate the data once, not on every redraw
                            //TODO: unless we get new data - we'll know how once the backend gives us data
                            accumulate(data);
                        }

                        width = scope.chartSize.width;
                        height = scope.chartSize.height - margin.top - margin.bottom;

                        r = height - 10;

                        var x = d3.scale.linear()
                            .domain([0, width])
                            .range([0, width]);

                        var y = d3.scale.linear()
                            .domain([0, height])
                            .range([0, height]);

                        if (scope.mapType === 'pack') {
                            x = d3.scale.linear().range([0, r]);
                            y = d3.scale.linear().range([0, r]);
                        } else if (scope.mapType === 'partition' || scope.mapType === 'icicle') {
                            x = d3.scale.linear().range([0, width]);
                            y = d3.scale.linear().range([0, height]);
                        } else if (scope.mapType === 'wheel') {
                            x = d3.scale.linear().range([0, 2 * Math.PI]);
                            y = d3.scale.pow().exponent(1.3).domain([0, 1]).range([0, radius]);
                        }

                        var mapLayout;

                        if (scope.mapType === 'tree') {
                            mapLayout = d3.layout.treemap()
                                .children(function (d, depth) {
                                    return depth ? null : d._children;
                                })
                                .sort(function (a, b) {
                                    //this sorts the data by name ascending, so ANT1 < ANT2 < ANT3 etc
                                    return a.name < b.name ? 1 : a.name > b.name ? -1 : 0;
                                })
                                .ratio(height / width * 0.5 * (1 + Math.sqrt(5)))
                                .round(false);
                        } else if (scope.mapType === 'pack') {
                            mapLayout = d3.layout.pack()
                                .size([r, r])
                                .value(function (d) {
                                    return d.value;
                                });
                        } else if (scope.mapType === 'partition') {
                            mapLayout = d3.layout.partition()
                                .value(function(d) { return d.value; });
                        } else if (scope.mapType === 'icicle') {
                            mapLayout = d3.layout.partition()
                                .value(function(d) { return d.value; });
                        }else if (scope.mapType === 'wheel') {
                            mapLayout = d3.layout.partition()
                                .sort(null)
                                .value(function(d) { return 5.8 - d.depth; });

                        } else {
                            console.log('wrong maptype!');
                            return;
                        }


                        var svg;

                        if (scope.mapType === 'pack') {
                            svg = d3.select(element[0]).append("svg")
                                .attr("id", "treemapHealthChart")
                                .attr("width", width + margin.left + margin.right)
                                .attr("height", height + margin.bottom + margin.top)
                                .attr("class", "health-chart")
                                .style("margin-left", -margin.left + "px")
                                .style("margin.right", -margin.right + "px")
                                .append("g");
                            svg.attr("transform", "translate(" + (width - r) / 2 + "," + (height - r) / 2 + ")");
                        } else if (scope.mapType === 'tree') {
                            svg = d3.select(element[0]).append("svg")
                                .attr("id", "treemapHealthChart")
                                .attr("width", width + margin.left + margin.right)
                                .attr("height", height + margin.bottom + margin.top)
                                .attr("class", "health-chart")
                                .style("margin-left", -margin.left + "px")
                                .style("margin.right", -margin.right + "px")
                                .append("g");
                            svg.style("shape-rendering", "crispEdges");
                            svg.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                            var grandparent = svg.append("g")
                                .attr("class", "grandparent");

                            grandparent.append("rect")
                                .attr("y", -margin.top)
                                .attr("width", width)
                                .attr("height", margin.top);

                            grandparent.append("text")
                                .attr("x", 6)
                                .attr("y", 6 - margin.top)
                                .attr("dy", ".75em");
                        } else if (scope.mapType === 'partition' || scope.mapType === 'icicle') {
                            svg = d3.select(element[0]).append("svg")
                                .attr("id", "treemapHealthChart")
                                .attr("width", width + margin.left + margin.right)
                                .attr("height", height + margin.bottom + margin.top)
                                .attr("class", "health-chart")
                                .style("margin-left", -margin.left + "px")
                                .style("margin.right", -margin.right + "px")
                                .append("g");
                        } else if (scope.mapType === 'wheel') {
                            svg = d3.select(element[0]).append("svg")
                                .attr("id", "treemapHealthChart")
                                .attr("class", "health-chart")
                                .attr("width", width + padding * 2)
                                .attr("height", height + padding * 2)
                                .append("g")
                                .attr("transform", "translate(" + [radius + padding, radius + padding] + ")");
                        }

                        if (scope.mapType === 'pack') {
                            displayPack(data);
                        } else  if (scope.mapType === 'partition') {
                            displayPartition();
                        } else  if (scope.mapType === 'icicle') {
                            displayIcicle();
                        } else if (scope.mapType === 'wheel') {
                            displayWheel(data);
                        } else {
                            initialize(data);
                            layout(data);
                            display(data);
                        }

                        function initialize(data) {
                            data.x = data.y = 0;
                            data.dx = width;
                            data.dy = height;
                            data.depth = 0;
                        }

                        // Aggregate the values for internal nodes. This is normally done by the
                        // treemap layout, but not here because of our custom implementation.
                        // We also take a snapshot of the original children (_children) to avoid
                        // the children being overwritten when when layout is computed.
                        function accumulate(d) {
                            return (d._children = d.children) ? d.value = d.children.reduce(function (p, v) {
                                return p + accumulate(v);
                            }, 0) : d.value;
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
                                mapLayout.nodes({_children: d._children});
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
                                .datum(d.parent)
                                .on("click", transition)
                                .select("text")
                                .text(name(d));

                            var g1 = svg.insert("g", ".grandparent")
                                .datum(d)
                                .attr("class", "depth");

                            var g = g1.selectAll("g")
                                .data(d._children)
                                .enter().append("svg").append("g");

                            g.filter(function (d) {
                                return d._children;
                            })
                                .classed("children", true)
                                .on("click", transition);

                            g.filter(function (d) {
                                return !d._children;
                            })
                                .classed("no-children", true);

                            g.selectAll(".child")
                                .data(function (d) {
                                    return d._children || [d];
                                })
                                .enter().append("rect")
                                .attr("class", "child")
                                .call(rect);


                            //overlay each direct child with its text in the center
//                            g.selectAll(".children")
//                                .data(function (d) {
//                                    return d._children || [d];
//                                })
//                                .enter().append("text")
//                                .attr("x", function (d, i) {
//                                    return d.x + this.parentNode.children[i].width.baseVal.value / 2;
//                                })
//                                .attr("y", function (d, i) {
//                                    return d.y + this.parentNode.children[i].height.baseVal.value / 2;
//                                })
//                                .attr("text-anchor", "middle")
//                                .text(function (d) {
//                                    return d.name;
//                                });

                            g.append("rect")
                                .attr("class", "parent")
                                .call(rect);


                            g.append("text")
                                .attr("dy", ".75em")
                                .text(function (d) {
                                    return d.name;
//                                    return d.depth === 1 && d._children ? d.name : "";
                                })
                                .classed("text-parent-node", true)
                                .call(text);


                            function transition(d) {
                                tooltip.style("visibility", "hidden");

                                if (transitioning || !d) {
                                    return;
                                }
                                transitioning = true;

                                var g2 = display(d),
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
                            r
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

                            //r.on is not defined while transitioning, so check it!
                            if (r.on) {

                                r
                                    .on("mouseover", function (d) {
                                        tooltip.html(d.name + " value: " + d.value);
                                        tooltip.style("visibility", "visible");
                                    })
                                    .on("mousemove", function () {
                                        tooltip
                                            .style("top", (d3.event.pageY + 10) + "px")
                                            .style("left", (d3.event.pageX + 10) + "px");
                                    })
                                    .on("mouseout", function () {
                                        tooltip.style("visibility", "hidden");
                                    });
                            }
                        }

                        function name(d) {
                            return d.parent ? name(d.parent) + "." + d.name : d.name;
                        }

                        function displayPack(dataT) {

                            var nodes = mapLayout.nodes(dataT);

                            svg.selectAll("circle")
                                .data(nodes)
                                .enter().append("svg:circle")
                                .attr("class", function (d) {
                                    return d.children ? "parent" : "child";
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
                                });

                            svg.selectAll("text")
                                .data(nodes)
                                .enter().append("svg:text")
                                .attr("class", function (d) {
                                    return d.children ? "parent" : "child";
                                })
                                .attr("x", function (d) {
                                    return d.x;
                                })
                                .attr("y", function (d) {
                                    return d.y;
                                })
                                .attr("dy", ".35em")
                                .attr("text-anchor", "middle")
                                .style("opacity", function (d) {
                                    return d.r > 40 ? 1 : 0;
                                })
                                .text(function (d) {
                                    return d.name;
                                });

                            d3.select(window).on("click", function () {
                                zoomPack(root);
                            });
                        }

                        function zoomPack(d, i) {
                            if (scope.mapType !== 'pack') {
                                return;
                            }

                            var k = r / d.r / 2;
                            x.domain([d.x - d.r, d.x + d.r]);
                            y.domain([d.y - d.r, d.y + d.r]);

                            var t = svg.transition()
                                .duration(duration);

                            t.selectAll("circle")
                                .attr("cx", function (d) {
                                    return x(d.x);
                                })
                                .attr("cy", function (d) {
                                    return y(d.y);
                                })
                                .attr("r", function (d) {
                                    return k * d.r;
                                });

                            t.selectAll("text")
                                .attr("x", function (d) {
                                    return x(d.x);
                                })
                                .attr("y", function (d) {
                                    return y(d.y);
                                })
                                .style("opacity", function (d) {
                                    return k * d.r > 20 ? 1 : 0;
                                });

                            node = d;
                            d3.event.stopPropagation();
                        }

                        function displayPartition() {
                            var g = svg.selectAll("g")
                                .data(mapLayout.nodes(root))
                                .enter().append("svg:g")
                                .attr("transform", function(d) { return "translate(" + x(d.y) + "," + y(d.x) + ")"; })
                                .on("click", click);

                            var kx = width / root.dx,
                                ky = height / 1;

                            g.append("svg:rect")
                                .attr("width", root.dy * kx)
                                .attr("height", function(d) { return d.dx * ky; })
                                .attr("class", function(d) { return d.children ? "part-parent" : "child"; });

                            g.append("svg:text")
                                .attr("transform", transform)
                                .attr("dy", ".35em")
                                .style("opacity", function(d) { return d.dx * ky > 12 ? 1 : 0; })
                                .text(function(d) { return d.name; });

                            d3.select(window)
                                .on("click", function() { click(root); });

                            function click(d) {
                                if (!d.children) { return; }

                                kx = (d.y ? width - 40 : width) / (1 - d.y);
                                ky = height / d.dx;
                                x.domain([d.y, 1]).range([d.y ? 40 : 0, width]);
                                y.domain([d.x, d.x + d.dx]);

                                var t = g.transition()
                                    .duration(duration)
                                    .attr("transform", function(d) { return "translate(" + x(d.y) + "," + y(d.x) + ")"; });

                                t.select("rect")
                                    .attr("width", d.dy * kx)
                                    .attr("height", function(d) { return d.dx * ky; });

                                t.select("text")
                                    .attr("transform", transform)
                                    .style("opacity", function(d) { return d.dx * ky > 12 ? 1 : 0; });

                                d3.event.stopPropagation();
                            }

                            function transform(d) {
                                return "translate(8," + d.dx * ky / 2 + ")";
                            }
                        }

                        function displayIcicle() {

                            var g = svg.selectAll("g")
                                .data(mapLayout.nodes(root))
                                .enter().append("rect")
                                .attr("x", function(d) { return x(d.x); })
                                .attr("y", function(d) { return y(d.y); })
                                .attr("width", function(d) { return x(d.dx); })
                                .attr("height", function(d) { return y(d.dy); })
                                .attr("class", function(d) { return d.children ? "part-parent" : "child"; })
                                .on("click", icicleClicked);

                            var kx = width / root.dx;

                            var t = svg.selectAll("g")
                                .data(mapLayout.nodes(root)).enter()
                                .append("svg:text")
                                .attr("x", function(d) { return x(d.x); })
                                .attr("y", function(d) { return y(d.y); })
                                .attr("dy", ".2em")
                                .style("opacity", function(d) {
                                    return x(d.x + d.dx) - x(d.x) > 14.5 ? 1 : 0;
                                })
                                .text(function(d) { return d.name; })
                                .attr("text-anchor", "middle")
                                .attr("transform", function (d) {
                                    var halfWidth = (x(d.x + d.dx) - x(d.x)) / 2,
                                        halfHeight = (y(d.y + d.dy) - y(d.y)) / 2;

                                    var strTranslate = "translate(" + halfWidth + "," + halfHeight  + ")";
                                    if (halfWidth < 60) {
                                        strTranslate += "rotate(90, " + x(d.x) + ", " + y(d.y) + ")";
                                    }
                                    return strTranslate;
                                });

                            function icicleClicked(d) {
                                x.domain([d.x, d.x + d.dx]);
                                y.domain([d.y, 1]).range([d.y ? 20 : 0, height]);

                                g.transition()
                                    .duration(duration)
                                    .attr("x", function(d) { return x(d.x); })
                                    .attr("y", function(d) { return y(d.y); })
                                    .attr("width", function(d) { return x(d.x + d.dx) - x(d.x); })
                                    .attr("height", function(d) { return y(d.y + d.dy) - y(d.y); });

                                t.transition()
                                    .duration(duration)
                                    .attr("x", function(d) { return x(d.x); })
                                    .attr("y", function(d) { return y(d.y); })
                                    .style("opacity", function(d) {
                                        return x(d.x + d.dx) - x(d.x) > 14.5 ? 1 : 0;
                                    })
                                    .attr("text-anchor", "middle")
                                    .attr("transform", function (d) {
                                        var halfWidth = (x(d.x + d.dx) - x(d.x)) / 2,
                                            halfHeight = (y(d.y + d.dy) - y(d.y)) / 2;

                                        var strTranslate = "translate(" + halfWidth + "," + halfHeight  + ")";
                                        if (halfWidth < 60) {
                                            strTranslate += "rotate(90, " + x(d.x) + ", " + y(d.y) + ")";
                                        }
                                        return strTranslate;
                                    });
                                d3.event.stopPropagation();
                            }
                        }

                        function displayWheel(data) {
                            var nodes = mapLayout.nodes(data);

                            var arc = d3.svg.arc()
                                .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
                                .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
                                .innerRadius(function(d) { return Math.max(0, d.y ? y(d.y) : d.y); })
                                .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });

                            var path = svg.selectAll("path").data(nodes);
                            path.enter().append("path")
                                .attr("id", function(d, i) { return "path-" + i; })
                                .attr("d", arc)
                                .attr("fill-rule", "evenodd")
                                .style("fill", colour)
                                .on("click", click);

                            var text = svg.selectAll("text").data(nodes);
                            var textEnter = text.enter().append("text")
                                .style("fill-opacity", 1)
                                .style("fill", function(d) {
                                    return brightness(d3.rgb(colour(d))) < 125 ? "#eee" : "#000";
                                })
                                .attr("text-anchor", function(d) {
                                    return x(d.x + d.dx / 2) > Math.PI ? "end" : "start";
                                })
                                .attr("dy", ".2em")
                                .attr("transform", function(d) {
                                    var multiline = (d.name || "").split(" ").length > 1,
                                        angle = x(d.x + d.dx / 2) * 180 / Math.PI - 90,
                                        rotate = angle + (multiline ? -0.5 : 0);
                                    return "rotate(" + rotate + ")translate(" + (y(d.y) + padding) + ")rotate(" + (angle > 90 ? -180 : 0) + ")";
                                })
                                .on("click", click);
                            textEnter.append("tspan")
                                .attr("x", 0)
                                .text(function(d) { return d.depth ? d.name.split(" ")[0] : ""; });
                            textEnter.append("tspan")
                                .attr("x", 0)
                                .attr("dy", "1em")
                                .text(function(d) { return d.depth ? d.name.split(" ")[1] || "" : ""; });

                            function click(d) {
                                path.transition()
                                    .duration(duration)
                                    .attrTween("d", arcTween(d));

                                // Somewhat of a hack as we rely on arcTween updating the scales.
                                text.style("visibility", function(e) {
                                    return isParentOf(d, e) ? null : d3.select(this).style("visibility");
                                })
                                    .transition()
                                    .duration(duration)
                                    .attrTween("text-anchor", function(d) {
                                        return function() {
                                            return x(d.x + d.dx / 2) > Math.PI ? "end" : "start";
                                        };
                                    })
                                    .attrTween("transform", function(d) {
                                        var multiline = (d.name || "").split(" ").length > 1;
                                        return function() {
                                            var angle = x(d.x + d.dx / 2) * 180 / Math.PI - 90,
                                                rotate = angle + (multiline ? -0.5 : 0);
                                            return "rotate(" + rotate + ")translate(" + (y(d.y) + padding) + ")rotate(" + (angle > 90 ? -180 : 0) + ")";
                                        };
                                    })
                                    .style("fill-opacity", function(e) { return isParentOf(d, e) ? 1 : 1e-6; })
                                    .each("end", function(e) {
                                        d3.select(this).style("visibility", isParentOf(d, e) ? null : "hidden");
                                    });
                            }

                            function isParentOf(p, c) {
                                if (p === c) { return true; }
                                if (p.children) {
                                    return p.children.some(function(d) {
                                        return isParentOf(d, c);
                                    });
                                }
                                return false;
                            }

                            function colour(d) {
                                if (d.children) {
                                    // There is a maximum of two children!
//                                    var colours = d.children.map(colour),
                                    var colours = ['green', 'lightgreen'],
                                        a = d3.hsl(colours[0]),
                                        b = d3.hsl(colours[1]);
                                    // L*a*b* might be better here...
                                    return d3.hsl((a.h + b.h) / 2, a.s * 1.2, a.l / 1.2);
                                }
                                return d.colour || "#fff";
                            }

                            // Interpolate the scales!
                            function arcTween(d) {
                                var my = maxY(d),
                                    xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
                                    yd = d3.interpolate(y.domain(), [d.y, my]),
                                    yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
                                return function(d) {
                                    return function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
                                };
                            }

                            function maxY(d) {
                                return d.children ? Math.max.apply(Math, d.children.map(maxY)) : d.y + d.dy;
                            }

                            // http://www.w3.org/WAI/ER/WD-AERT/#color-contrast
                            function brightness(rgb) {
                                return rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114;
                            }
                        }
                    }

                });
            }
        };
    });