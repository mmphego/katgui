angular.module('katGui.d3')

    .directive('subarrayHealthMap', function (SensorsService, StatusService, $interval, $localStorage, $rootScope, d3Util) {
        return {
            restrict: 'E',
            scope: {},
            link: function (scope, element) {

                var root, transitionDuration = 250;
                var margin = {top: 8, right: 8, left: 8, bottom: 8};
                var tooltip = d3.select(angular.element(document.querySelector('.treemap-tooltip'))[0]);
                var svg;

                scope.chartSize = {width: 0, height: 0};
                scope.lastDrawnSize = scope.chartSize;

                var unbindResize = scope.$watch(function () {
                    return element.parent()[0].clientHeight + ', ' + element.parent()[0].clientWidth;
                }, function (newVal, oldVal) {
                    if (newVal !== oldVal) {
                        //allow for some time for the dom elements to complete resizing
                        if (!scope.redrawTimeout) {
                            scope.redrawTimeout = $interval(function () {
                                $interval.cancel(scope.redrawTimeout);
                                scope.redrawTimeout = null;
                                if (Math.abs(scope.lastDrawnSize.width - element.parent()[0].clientWidth) > 20 ||
                                    Math.abs(scope.lastDrawnSize.height - element.parent()[0].clientHeight) > 20) {
                                    scope.chartSize = {width: element.parent()[0].clientWidth, height: element.parent()[0].clientHeight};
                                    scope.redraw(true);
                                }
                            }, 750);
                        }
                    }
                });

                $rootScope.$on('redrawChartMessage', function (event, message) {
                    scope.redraw();
                });
                var width, height, radius;

                function clone(obj, parentName) {
                    var copy;
                    // Handle the 3 simple types, and null or undefined
                    if (null === obj || "object" !== typeof obj) {
                        return obj;
                    }
                    // Handle Array
                    if (obj instanceof Array) {
                        copy = [];
                        for (var i = 0, len = obj.length; i < len; i++) {
                            copy[i] = clone(obj[i], parentName);
                        }
                        copy.parentName = parentName;
                        return copy;
                    }
                    // Handle Object
                    if (obj instanceof Object) {
                        copy = {parentName: parentName};
                        for (var attr in obj) {
                            if (attr !== 'parent' && obj.hasOwnProperty(attr)) {
                                copy[attr] = clone(obj[attr], parentName);
                            }
                        }
                        return copy;
                    }
                    throw new Error("Unable to copy obj! Its type isn't supported.");
                }

                scope.redraw = function (force) {
                    width = scope.chartSize.width - 10;
                    height = scope.chartSize.height - 10;
                    if (width < 0) {
                        width = 0;
                    }
                    if (height < 0) {
                        height = 0;
                    }
                    radius = height;

                    if (force || !svg) {
                        if (svg) {
                            d3.selectAll("svg").remove();
                        }

                        var zoom = d3.behavior.zoom()
                            .scaleExtent([0.1, 10])
                            .on("zoom", zoomed);

                        var container = d3.select(element[0]).append("svg")
                            .style("cursor", "move")
                            .attr("width", width)
                            .attr("height", height)
                            .attr("class", "health-chart treemapHealthChartSubarray")
                            .call(zoom);
                        svg = container.append("g");

                        scope.lastDrawnSize = scope.chartSize;
                    }

                    scope.subarrayKeys = Object.keys(SensorsService.subarraySensorValues);
                    var previousRoot = root;
                    root = {children: [], name: 'root'};
                    scope.subarrayKeys.forEach(function (subarrayKey) {
                        var children = [];
                        var subarray = SensorsService.subarraySensorValues[subarrayKey];
                        var resourceList = subarray.pool_resources.value.split(',');
                        if (resourceList.length === 1 && resourceList[0] === "") {
                            resourceList = [];
                        }
                        resourceList.forEach(function (resource) {
                            children.push(clone(StatusService.statusData[resource], resource));
                        });
                        root.children.push({
                            children: children,
                            sensor: '',
                            name: 'Subarray_' + subarray.id,
                            pool_resources: subarray.pool_resources.value
                        });
                    });
                    var updateForceLayout = false;
                    if (previousRoot && root.children.length > 0 && previousRoot.children.length > 0) {
                        for (var i = 0; i < root.children.length; i++) {
                            if (previousRoot.children.length !== root.children.length ||
                                previousRoot.children[i].pool_resources !== root.children[i].pool_resources) {
                                updateForceLayout = true;
                                break;
                            }
                        }
                    } else {
                        updateForceLayout = true;
                    }
                    if (updateForceLayout) {
                        update();
                    }
                };

                function update() {
                    if (!root.children || root.children.length === 0) {
                        return;
                    }
                    var graphArea = svg;

                    var nodes = flatten(root);
                    nodes.pop();//root
                    var links = d3.layout.tree().links(nodes);
                    graphArea.selectAll("parent").remove();
                    // Update the links…
                    var link = graphArea.selectAll(".link").data(links, function(d) {
                        return d.target.id;
                    });
                    link.exit().remove();
                    link.enter().append("line")
                      .attr("class", "link");

                    // Update the nodes…
                    var node = graphArea.selectAll('g').data(nodes);
                    node.exit().remove();

                    var force = d3.layout.force()
                        .size([width, height])
                        .on("tick", function () {
                            link.attr("x1", function(d) { return d.source.x; })
                              .attr("y1", function(d) { return d.source.y; })
                              .attr("x2", function(d) { return d.target.x; })
                              .attr("y2", function(d) { return d.target.y; });
                            node.attr("transform", function(d, i) {
                                    return "translate(" + d.x + "," + d.y + ")";
                            });
                        });

                    force.nodes(nodes)
                        .links(links)
                        .charge(-500)
                        .start();

                    // Enter any new nodes.
                    var gEnter = node.enter()
                        .append("g")
                        .attr("class", "parent");

                        // .on("click", function (d) {
                        //     if (!d.name.startsWith("Subarray_")) {
                        //         click(d);
                        //     }
                        // });

                    gEnter.append("circle")
                        .attr("class", function (d) {
                            var classString = "";
                            var fullSensorName = d.parentName + '_' + d.sensor;
                            if (StatusService.sensorValues[fullSensorName]) {
                                classString += StatusService.sensorValues[fullSensorName].status + '-child';
                            } else {
                                classString += 'no-fill';
                            }
                            if (d.name.startsWith('Subarray')) {
                                classString += " subarray-node";
                            }
                            classString += " " + fullSensorName;
                            return classString;
                        })
                        .attr("r", function(d) {
                          return d.name.startsWith('Subarray') ? 40 : 15;
                        })
                        .style("cursor", "default")
                        .call(function (d) {
                            d3Util.applyTooltipValues(d, tooltip, d.parentName + '_' + d.sensor);
                        });

                    gEnter.append("text")
                        .style("font-size", function (d) {
                            return d.name.startsWith('Subarray') ? 20 : 10;
                        })
                        .style("font-weight", function (d) {
                            return d.name.startsWith('Subarray') ? 800 : 400;
                        })
                        .attr("class", "node-text")
                        .attr("dy", ".35em")
                        // .style("display", function (d) {
                        //     if (StatusService.sensorValues[d.parentName + '_' + d.sensor] &&
                        //         StatusService.sensorValues[d.parentName + '_' + d.sensor].status === 'nominal') {
                        //             return 'none';
                        //     } else {
                        //         return null;
                        //     }
                        // })
                        .text(function(d) {
                            return d.name;
                        });

                    graphArea.selectAll('subarray-node')
                        .call(force.drag);
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
                        if (!node) {
                            return;
                        }
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

                function zoomed() {
                    svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
                }
                scope.redraw(true);
            }
        };
    });
