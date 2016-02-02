angular.module('katGui.d3')

    .directive('subarrayHealthMap', function (ConfigService, SensorsService, StatusService, $interval, $localStorage, $rootScope, d3Util, DATETIME_FORMAT) {
        return {
            restrict: 'E',
            scope: {},
            link: function (scope, element) {

                var root;
                var margin = {top: 8, right: 8, left: 8, bottom: 8};
                var tooltip = d3.select(angular.element(document.querySelector('.treemap-tooltip'))[0]);
                var svg, container, zoom;
                var color = d3.scale.category10();

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
                    scope.redraw(message);
                });
                var width, height, radius;

                function clone(obj, parentName, subarrayKey) {
                    var copy;
                    // Handle the 3 simple types, and null or undefined
                    if (null === obj || "object" !== typeof obj) {
                        return obj;
                    }
                    // Handle Array
                    if (obj instanceof Array) {
                        copy = [];
                        for (var i = 0, len = obj.length; i < len; i++) {
                            copy[i] = clone(obj[i], parentName, subarrayKey);
                        }
                        copy.parentName = parentName;
                        copy.subarrayKey = subarrayKey;
                        return copy;
                    }
                    // Handle Object
                    if (obj instanceof Object) {
                        copy = {parentName: parentName, subarrayKey: subarrayKey};
                        for (var attr in obj) {
                            if (attr !== 'parent' && obj.hasOwnProperty(attr)) {
                                copy[attr] = clone(obj[attr], parentName, subarrayKey);
                            }
                        }
                        return copy;
                    }
                    throw new Error("Unable to copy obj! Its type isn't supported.");
                }

                scope.redraw = function (force) {
                    if (scope.chartSize.width === 0 && scope.chartSize.height === 0) {
                        return;
                    }
                    width = 2800;
                    height = 2800;
                    if (width < 0) {
                        width = 0;
                    }
                    if (height < 0) {
                        height = 0;
                    }
                    radius = height;

                    if (force || !container) {
                        if (container) {
                            container.remove();
                        }

                        d3.selectAll('g').remove();

                        if (zoom) {
                            scope.scaleBeforeResize = zoom.scale();
                            scope.translateBeforeResize = zoom.translate();
                        }

                        zoom = d3.behavior.zoom()
                            .scaleExtent([0.05, 5])
                            .on("zoom", zoomed);

                        if (scope.scaleBeforeResize) {
                            zoom.scale(scope.scaleBeforeResize);
                        } else {
                            zoom.scale(0.25);
                        }
                        if (scope.translateBeforeResize) {
                            zoom.translate(scope.translateBeforeResize);
                        } else if (scope.chartSize.width > 0 && scope.chartSize.height > 0) {
                            zoom.translate([scope.chartSize.width/3, scope.chartSize.height/3]);
                        }

                        container = d3.select(element[0]).append("svg")
                            .style("cursor", "move")
                            .attr("width", width)
                            .attr("height", height)
                            .attr("class", "health-chart treemapHealthChartSubarray")
                            .call(zoom);

                        svg = container.append("g");
                        svg.on("mouseup", function () {
                            zoom.translate(scope.zoomBeforeDrag);
                            zoom.on("zoom", zoomed);
                            zoom.event(container);
                        });
                        scope.lastDrawnSize = scope.chartSize;
                    }

                    scope.subarrayKeys = Object.keys(SensorsService.subarraySensorValues);
                    if (scope.subarrayKeys.length === 0) {
                        return;
                    }
                    var previousRoot = root;
                    root = {children: [], name: 'root'};
                    scope.subarrayKeys.forEach(function (subarrayKey) {
                        var children = [];
                        var subarray = SensorsService.subarraySensorValues[subarrayKey];
                        var resourceList = subarray.pool_resources.value.split(',');
                        if (resourceList.length === 1 && resourceList[0] === "") {
                            resourceList = [];
                        }
                        for (var i = 0; i < resourceList.length; i++) {
                            if (ConfigService.systemConfig["katconn:arrays"].ants.indexOf(resourceList[i]) > -1) {
                                children.push(clone(StatusService.statusData[resourceList[i]], resourceList[i], subarrayKey));
                            }
                        }
                        root.children.push({
                            children: children,
                            subarrayKey: subarrayKey,
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

                    zoom.event(container);

                    if (updateForceLayout || force) {
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
                        if (d.target) {
                            return d.target.id;
                        } else {
                            return null;
                        }
                    });
                    link.exit().remove();
                    link.enter().append("line")
                    .attr("class", function (d) {
                        return "link " + d.source.subarrayKey;
                    });

                    // Update the nodes…
                    var node = graphArea.selectAll('g').data(nodes);
                    node.exit().remove();

                    var force = d3.layout.force()
                        .size([width, height])
                        .on("tick", function () {
                            var q = d3.geom.quadtree(nodes),
                              i = 0,
                              n = nodes.length;

                            while (++i < n) {
                                q.visit(collide(nodes[i]));
                            }

                            link.attr("x1", function(d) { return d.source.x; })
                              .attr("y1", function(d) { return d.source.y; })
                              .attr("x2", function(d) { return d.target.x; })
                              .attr("y2", function(d) { return d.target.y; });
                            node.attr("transform", function(d, i) {
                                return "translate(" + d.x + "," + d.y + ")";
                            });
                        });

                    // Enter any new nodes.
                    var gEnter = node.enter()
                        .append("g")
                        .attr("class", "parent")
                        .on("mousedown", function () {
                            zoom.on("zoom", null);
                            scope.zoomBeforeDrag = zoom.translate();
                        })
                        .call(force.drag);

                    gEnter.append("circle")
                        .attr("class", function (d) {
                            var classString = "";
                            var prefix = d.prefix? d.prefix : '';
                            var fullSensorName;
                            if (d.name.startsWith('Subarray')) {
                                var styleTagName = d.name.toLowerCase();
                                classString += " subarray-node no-fill " + styleTagName;
                                fullSensorName = d.name;
                                var c = color(styleTagName);
                                var style = document.getElementById(styleTagName + '_style_tag');
                                if (!style) {
                                    style = document.createElement('style');
                                    style.type = 'text/css';
                                    style.id = styleTagName + '_style_tag';
                                    style.innerHTML = '.' + styleTagName + ' {stroke:' + c + ';fill:' + c + '}';
                                    document.getElementsByTagName('head')[0].appendChild(style);
                                }
                            } else {
                                fullSensorName = prefix + d.parentName + '_' + d.sensor;
                                if (StatusService.sensorValues[fullSensorName]) {
                                    classString += StatusService.sensorValues[fullSensorName].status + '-child health-full-item ';
                                } else {
                                    classString += ' health-full-item';
                                }
                            }

                            classString += " " + fullSensorName;
                            return classString;
                        })
                        .attr("r", "15")
                        .style("cursor", "default")
                        .on("mouseover", function (d) {
                            if (!d.name.startsWith('Subarray_')) {
                                tooltip.style("visibility", "visible");
                            }
                        }).on("mousemove", function (d) {
                            if (d.name.startsWith('Subarray_')) {
                                return;
                            }
                            var fullSensorName = (d.prefix? d.prefix: '') + (d.parentName + '_') + d.sensor;
                            d.sensorValue = StatusService.sensorValues[fullSensorName];
                            tooltip.html(
                                "<div style='font-size: 14px'>" +
                                "<div><b>" + d.sensorValue.name + "</b></div>" +
                                "<div><span style='width: 100px; display: inline-block; font-style: italic'>value:</span>" + d.sensorValue.value + "</div>" +
                                "<div><span style='width: 100px; display: inline-block; font-style: italic'>status:</span>" + d.sensorValue.status + "</div>" +
                                "<div><span style='width: 100px; display: inline-block; font-style: italic'>timestamp:</span>" + moment.utc(d.sensorValue.timestamp, 'X').format(DATETIME_FORMAT) + "</div>" +
                                "</div>"
                            );

                            var uiViewDiv = document.querySelector('#ui-view-container-div');
                            var offset = d3.mouse(uiViewDiv);
                            var x = offset[0];
                            var y = offset[1];

                            if (window.innerWidth - x < 320) {
                                x = window.innerWidth - 320;
                            }
                            if (window.innerHeight - y < 225) {
                                y = window.innerHeight - 225;
                            }
                            tooltip
                                .style("top", (y + 15 + angular.element(uiViewDiv).scrollTop()) + "px")
                                .style("left", (x + 5 + angular.element(uiViewDiv).scrollLeft()) + "px");
                        }).on("mouseout", function (d) {
                            if (!d.name.startsWith('Subarray_')) {
                                tooltip.style("visibility", "hidden");
                            }
                        });

                    gEnter.append("text")
                        .style("font-size", function (d) {
                            return d.name.startsWith('Subarray') ? 48 : 10;
                        })
                        .style("font-weight", function (d) {
                            return d.name.startsWith('Subarray') ? 800 : 400;
                        })
                        .attr("class", "node-text")
                        .attr("dy", ".35em")
                        .text(function(d) {
                            if (!d.sensorValue && !d.name.startsWith('Subarray')) {
                                return (d.prefix? d.prefix : '') + d.parentName + '_' + d.sensor;
                            }
                            return d.name.startsWith('Subarray') ? d.name : d.sensorValue.name;
                        });

                    gEnter.selectAll('circle')
                        .attr("r", function(d) {
                            d.radius = (this.parentNode.children[1].getBBox().width / 2) + 8;
                            return d.radius;
                        });

                    var k = Math.sqrt(nodes.length / (width * height));

                    force.nodes(nodes)
                        .links(links)
                        .friction(0.8)
                        .charge(-100/k)
                        .gravity(100*k)
                        .start();
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

                function collide(node) {
                  var r = node.radius + 16,
                      nx1 = node.x - r,
                      nx2 = node.x + r,
                      ny1 = node.y - r,
                      ny2 = node.y + r;
                  return function(quad, x1, y1, x2, y2) {
                    if (quad.point && (quad.point !== node)) {
                      var x = node.x - quad.point.x,
                          y = node.y - quad.point.y,
                          l = Math.sqrt(x * x + y * y),
                          r = node.radius + quad.point.radius;
                      if (l < r) {
                        l = (l - r) / l * 0.5;
                        node.x -= x *= l;
                        node.y -= y *= l;
                        quad.point.x += x;
                        quad.point.y += y;
                      }
                    }
                    return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
                  };
                }

                function zoomed() {
                    svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
                }
                scope.redraw(true);
            }
        };
    });
