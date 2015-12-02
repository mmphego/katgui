angular.module('katGui.d3')

    .directive('receptorHealthForce', function (StatusService, $localStorage, $rootScope, d3Util) {
        return {
            restrict: 'E',
            scope: {
                dataMapName: '=receptor'
            },
            link: function (scope, element) {

                var data = StatusService.statusData[scope.dataMapName];
                var root, transitionDuration = 250;
                var margin = {top: 8, right: 8, left: 8, bottom: 8};
                var tooltip = d3.select(angular.element(document.querySelector('.treemap-tooltip'))[0]);
                var containerSvg, svg;

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
                var link, node, force, width, height, radius;

                scope.redraw = function () {
                    width = scope.chartSize.width;
                    height = scope.chartSize.height;
                    radius = height;
                    node = root = data;

                    force = d3.layout.force()
                        .size([width, height])
                        .on("tick", tick);

                    //create the main svg element
                    containerSvg = d3.select(element[0]).append("svg")
                        .attr("width", width)
                        .attr("height", height)
                        .attr("class", "health-chart treemapHealthChart" + scope.dataMapName)
                        .style("margin-left", margin.left + "px")
                        .style("margin-right", margin.right + "px");
                    // svg = containerSvg.append("g");
                    // containerSvg.attr("transform", "translate(" + (width - radius) / 2 + "," + (height - radius) / 2 + ")");
                    update();
                };

                function update() {
                    var nodes = flatten(root);
                    var links = d3.layout.tree().links(nodes);

                    // Restart the force layout.
                    force.nodes(nodes)
                        .links(links)
                        .linkStrength(function (d) {
                            return d.children? 1 : 0.2;
                        })
                        .charge(-300)
                        // .linkDistance(40)
                        .start();
                    // Update the links…
                    link = containerSvg.selectAll(".link").data(links, function(d) {
                        return d.target.id;
                    });
                    link.exit().remove();
                    link.enter().append("line")
                      .attr("class", "link");

                    // Update the nodes…
                    node = containerSvg.selectAll('.' + scope.dataMapName + '_node').data(nodes);
                    node.exit().remove();

                    // Enter any new nodes.
                    var gEnter = node.enter().append("g")
                        .attr("class", scope.dataMapName + '_node');

                    gEnter.append("circle")
                        .attr("class", function (d) {
                            var prefix = d.prefix? d.prefix : '';
                            var classStr = prefix + scope.dataMapName + '_' + d.sensor;
                            classStr += ' ' + (StatusService.sensorValues[classStr] ?
                                StatusService.sensorValues[classStr].status : 'inactive') + '-child';
                            return classStr;
                        })
                        .attr("r", function(d) {
                          return d.name.startsWith(scope.dataMapName) ? 30 : 15;
                        })
                        .call(function (d) {
                          d3Util.applyTooltipValues(d, tooltip, scope.dataMapName);
                        });
                    gEnter.append("text")
                        .style("font-size", function (d) {
                            return d.name.startsWith(scope.dataMapName) ? 14 : 10;
                        })
                        .attr("class", "node-text")
                        .attr("dy", ".35em")
                        .text(function(d) { return d.name; });

                }

                function tick() {
                    link.attr("x1", function(d) { return d.source.x; })
                      .attr("y1", function(d) { return d.source.y; })
                      .attr("x2", function(d) { return d.target.x; })
                      .attr("y2", function(d) { return d.target.y; });

                      node.attr("transform", function(d, i) {
                            return "translate(" + d.x + "," + d.y + ")";
                        });
                    // node.attr("cx", function(d) { return d.x; })
                    //   .attr("cy", function(d) { return d.y; });
                }

                // Toggle children on click.
                function click(d) {
                  if (!d3.event.defaultPrevented) {
                    if (d.children) {
                      d._children = d.children;
                      d.children = null;
                    } else {
                      d.children = d._children;
                      d._children = null;
                    }
                    update();
                  }
                }

                // Returns a list of all nodes under the root.
                function flatten(root) {
                  var nodes = [], i = 0;

                  function recurse(node) {
                    if (node.children) {
                        node.children.forEach(recurse);
                    }
                    if (!node.id) {
                        node.id = ++i;
                    }
                    nodes.push(node);
                  }

                  recurse(root);
                  return nodes;
                }
                scope.redraw();
            }
        };
    });
