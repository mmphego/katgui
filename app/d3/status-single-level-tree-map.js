angular.module('katGui.d3')

    .directive('statusSingleLevelTreeMap', function(StatusService, d3Util, $window, $timeout) {
        return {
            restrict: 'EA',
            scope: {
                data: '=',
                height: '=',
                width: '=',
                offsetLeft: '=',
                offsetTop: '=',
                autoResize: '@'
            },
            link: function(scope, element, attr) {

                var width = 220,
                    height = element.parent()[0].clientHeight,
                    root, dataDiv;

                if (scope.height) {
                    height = scope.height - 42;
                    element.css({
                        height: scope.height + "px"
                    });
                }

                if (scope.width) {
                    width = scope.width;
                    element.css({
                        width: scope.width + "px"
                    });
                }

                if (scope.offsetLeft || scope.offsetLeft > -1) {
                    element.css({
                        left: scope.offsetLeft
                    });
                }

                if (scope.offsetTop || scope.offsetTop > -1) {
                    element.css({
                        top: scope.offsetTop
                    });
                }

                scope.ignoreList = [];

                var tooltip = d3.select(angular.element(document.querySelector('.treemap-tooltip'))[0]);

                if (scope.autoResize) {
                    var elementResizeTarget = element.parent();
                    if (attr.relativeDraggable) {
                        elementResizeTarget = element;
                    }
                    var unbindResize = scope.$watch(function() {
                        return elementResizeTarget[0].clientHeight + ', ' + elementResizeTarget[0].clientWidth;
                    }, resizeElement);

                    scope.$on('$destroy', function() {
                        unbindResize();
                    });
                }

                drawTreemap(width, height);

                $timeout(function() {
                resizeElement('force', 'draw');
                }, 250);

                function resizeElement(newVal, oldVal) {
                    if (newVal !== oldVal && !scope.drawingSvg) {
                        //allow for some time for the dom elements to complete resizing
                        if (scope.resizeTimeout) {
                            $timeout.cancel(scope.resizeTimeout);
                            scope.resizeTimeout = null;
                        }
                        height = elementResizeTarget[0].clientHeight - 42;

                        scope.resizeTimeout = $timeout(function() {
                            // d3.select(element[0]).selectAll('md-toolbar').remove();
                            d3.select(element[0]).selectAll('.data-div').remove();
                            drawTreemap(width, height);
                        });
                    }
                }

                function drawTreemap(w, h) {
                    scope.drawingSvg = true;
                    var x = d3.scale.linear().range([0, w]),
                        y = d3.scale.linear().range([0, h]);

                    var treemap = d3.layout.treemap()
                        .sort(function(a, b) {
                            var aFullName = a.prefix + a.sensor;
                            var bFullName = b.prefix + b.sensor;
                            return aFullName > bFullName ? -1 : aFullName < bFullName ? 1 : 0;
                        })
                        .round(false)
                        .size([w, h])
                        .sticky(true)
                        .mode('dice')
                        .value(function() {
                            return 1;
                        });

                    root = scope.data;

                    if (!scope.labelDiv) {
                        scope.labelDiv = d3.select(element[0]).append("md-toolbar")
                            .attr("class", function() {
                                var classStr = "status-top-label md-whiteframe-z2 ";
                                classStr += angular.element(document.querySelector('md-content')).attr('class');
                                return classStr;
                            })
                            .attr("title", root.name)
                            .style("overflow", "hidden")
                            .style("width", "100%")
                            .style("max-height", "35px")
                            .style("min-height", "35px");

                        scope.labelDiv
                            .append("div")
                            .attr("class", "status-top-label-text")
                            .html(root.name);
                    }
                    drawData();
                    scope.drawingSvg = false;

                    function drawData() {
                        dataDiv = d3.select(element[0]).append("div")
                            .attr("class", "md-whiteframe-z2 data-div")
                            .style("width", "100%")
                            .style("height", "calc(100% - 38px)");

                        var svg = dataDiv.append("svg")
                            .attr("width", scope.autoResize ? "100%" : w)
                            .attr("height", h)
                            .append("g");

                        if (root.children) {
                            root.children = _.filter(root.children, function(item) {
                                return scope.ignoreList.indexOf(item.name) === -1;
                            });
                        }
                        var nodes = treemap.nodes(root)
                            .filter(function(d) {
                                return !d.children;
                            });

                        var cell = svg.selectAll("g")
                            .data(nodes)
                            .enter().append("g")
                            .attr("transform", function(d) {
                                return "translate(" + d.x + "," + d.y + ")";
                            })
                            .call(function(d) {
                                d3Util.applyTooltipValues(d, tooltip);
                            })
                            .on("click", function(d) {
                                if (d.sensor.indexOf('agg_') > -1) {
                                    d3Util.showDialogForAggregateSensorInfo(d.sensor);
                                }
                            });

                        cell.append("rect")
                            .style("stroke-width", "8px")
                            // .attr("x", "4px")
                            .attr("width", "calc(100%)")
                            .attr("height", function(d) {
                                return d.dy - 2;
                            })
                            .attr("class", function(d) {
                                var sensorName = d.prefix + d.sensor;
                                var classes = [sensorName];
                                var sensor = StatusService.sensorValues[sensorName];
                                if (StatusService.sensorValues.katpool_resources_in_maintenance &&
                                    StatusService.sensorValues.katpool_resources_in_maintenance.value.indexOf(d.component) > -1) {
                                    classes.push('in-maintenance-child');
                                }
                                if (sensor && sensor.status) {
                                    classes.push(sensor.status + '-child');
                                } else {
                                    classes.push('inactive-child');
                                }
                                return classes.join(' ');
                            });

                        cell.append("g")
                            .attr("class", function(d) {
                                var sensorName = d.prefix + d.sensor;
                                var classes = [sensorName, 'text-rect', 'child-text'];
                                var sensor = StatusService.sensorValues[sensorName];
                                if (sensor && sensor.status) {
                                    classes.push(sensor.status + '-child');
                                } else {
                                    classes.push('inactive-child');
                                }
                                return classes.join(' ');
                            })
                            .append("text")
                            .attr("x", "50%")
                            .attr("y", function(d) {
                                return d.dy / 2;
                            })
                            .attr("dy", ".35em")
                            .attr("text-anchor", "middle")
                            .text(function(d) {
                                return d.name ? d.name : d.sensor;
                            });
                    }
                }
            }
        };
    });
