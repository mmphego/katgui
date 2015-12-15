angular.module('katGui.d3')

    .directive('statusSingleLevelTreeMap', function (StatusService, d3Util, $window, $timeout) {
        return {
            restrict: 'EA',
            scope: {
                data: '=',
                height: '=',
                width: '=',
                offsetLeft: '=',
                offsetTop: '=',
                autoResize: '@',
                layoutMode: '@'
            },
            link: function (scope, element, attr) {

                    var width = 220,
                        height = element.parent()[0].clientHeight,
                        root, dataDiv;

                    if (!scope.layoutMode) {
                        scope.layoutMode = 'dice';
                    } else if (scope.layoutMode === 'slice') {
                        height = 220;
                        width = element.parent()[0].clientWidth;
                    }

                    if (scope.height) {
                        height = scope.height - 42;
                        element.css({height: scope.height + "px"});
                    }

                    if (scope.width) {
                        width = scope.width;
                        element.css({width: scope.width + "px"});
                    }

                    if (scope.offsetLeft || scope.offsetLeft > -1) {
                        element.css({left: scope.offsetLeft});
                    }

                    if (scope.offsetTop || scope.offsetTop > -1) {
                        element.css({top: scope.offsetTop});
                    }

                    scope.ignoreList = [];

                    var tooltip = d3.select(angular.element(document.querySelector('.treemap-tooltip'))[0]);

                    if (scope.autoResize) {
                        var elementResizeTarget = element.parent();
                        if (attr.relativeDraggable) {
                            elementResizeTarget = element;
                        }
                        var unbindResize = scope.$watch(function () {
                            return elementResizeTarget[0].clientHeight + ', ' + elementResizeTarget[0].clientWidth;
                        }, resizeElement);

                        scope.$on('$destroy', function () {
                            unbindResize();
                        });
                    }

                    drawTreemap(width, height);

                    $timeout(function () {
                        resizeElement('force', 'draw');
                    }, 750);

                    function resizeElement(newVal, oldVal) {
                        if (newVal !== oldVal && !scope.drawingSvg) {
                            //allow for some time for the dom elements to complete resizing
                            if (scope.resizeTimeout) {
                                $timeout.cancel(scope.resizeTimeout);
                                scope.resizeTimeout = null;
                            }
                            if (scope.layoutMode === 'dice') {
                                height = elementResizeTarget[0].clientHeight - 42;
                            } else if (scope.layoutMode === 'slice') {
                                width = elementResizeTarget[0].clientWidth - 42;
                            }

                            scope.resizeTimeout = $timeout(function () {
                                // d3.select(element[0]).selectAll('md-toolbar').remove();
                                d3.select(element[0]).selectAll('.data-div').remove();
                                drawTreemap(width, height);
                            }, 750);
                        }
                    }

                    function drawTreemap(w, h) {
                        scope.drawingSvg = true;
                        var x = d3.scale.linear().range([0, w]),
                            y = d3.scale.linear().range([0, h]);

                        var treemap = d3.layout.treemap()
                            .sort(function (a, b) {
                                return a.sensor > b.sensor ? -1 : a.sensor < b.sensor ? 1 : 0;
                            })
                            .round(false)
                            .size([w, h])
                            .sticky(true)
                            .mode(scope.layoutMode)
                            .value(function () {
                                return 1;
                            });

                        root = scope.data;

                        if (!scope.labelDiv) {
                            scope.labelDiv = d3.select(element[0]).append("md-toolbar")
                                .attr("class", function () {
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

                            var svg = dataDiv.append("svg:svg")
                                .attr("width", scope.autoResize ? "100%" : w)
                                .attr("height", h)
                                .append("svg:g");

                            if (root.children) {
                                root.children = _.filter(root.children, function(item) {
                                    return scope.ignoreList.indexOf(item.name) === -1;
                                });
                            }
                            var nodes = treemap.nodes(root)
                                .filter(function (d) {
                                    return !d.children;
                                });

                            var cell = svg.selectAll("g")
                                .data(nodes)
                                .enter().append("svg:g")
                                .attr("transform", function (d) {
                                    return "translate(" + d.x + "," + d.y + ")";
                                })
                                .call(function (d) {
                                    d3Util.applyTooltipValues(d, tooltip);
                                })
                                .on("mouseenter", function(d) {
                                    angular.element(document.querySelector("#" + d.sensor.replace(".", "_") + "hideButton")).css("display", "initial");
                                })
                                .on("mouseleave", function(d) {
                                    angular.element(document.querySelector("#" + d.sensor.replace(".", "_") + "hideButton")).css("display", "none");
                                })
                                .on("click", function(d) {
                                    if (d.sensor.indexOf('agg_') > -1) {
                                        d3Util.showDialogForAggregateSensorInfo(d.sensor);
                                    }
                                });

                            cell.append("svg:rect")
                                .attr("width", function (d) {
                                    if (scope.layoutMode === "dice") {
                                        return "100%";
                                    } else {
                                        return d.dx;
                                    }
                                })
                                .attr("height", function (d) {
                                    if (d.hidden) {
                                        return 0;
                                    }
                                    return d.dy - 1;
                                })
                                .attr("class", function (d) {
                                    var classString = "health-full-item ";
                                    if (StatusService.resourcesInMaintenance.indexOf(d.sensor.replace('agg_', '').split('_')[0]) > -1) {
                                        classString += ' in-maintenance-child ';
                                    } else if (angular.isDefined(d.objectValue)) {
                                       classString += d.objectValue.status + '-child ';
                                    } else if (d.sensorValue) {
                                       classString += d.sensorValue.status + '-child ';
                                    } else if (StatusService.sensorValues[d.sensor.replace('.', '_')]) {
                                       classString += StatusService.sensorValues[d.sensor.replace('.', '_')].status + '-child ';
                                    } else {
                                       classString += ' inactive-child ';
                                    }
                                    return classString + " " + d.sensor;
                                });

                            cell.append("svg:rect")
                                .attr("x", "10%")
                                .attr("y", "15")
                                .attr("width", "80%")
                                .attr("height", function (d) {
                                    if (d.hidden) {
                                        return 0;
                                    }
                                    if (d.dy - 30 > 0) {
                                        return d.dy - 30;
                                    } else {
                                        return 0;
                                    }
                                })
                                .attr("class", function (d) {
                                    var classString = "text-bg-rect ";
                                    if (angular.isDefined(d.objectValue)) {
                                       classString += d.objectValue.status + '-child ';
                                    } else if (d.sensorValue) {
                                       classString += d.sensorValue.status + '-child ';
                                    } else if (StatusService.sensorValues[d.sensor.replace('.', '_')]) {
                                       classString += StatusService.sensorValues[d.sensor.replace('.', '_')].status + '-child ';
                                    } else {
                                       classString += ' inactive-child ';
                                    }
                                   return classString + " " + d.sensor;
                                });

                            cell.append("svg:g")
                                .attr("class", function (d) {
                                    var classString = "text-rect ";
                                    if (angular.isDefined(d.objectValue)) {
                                        classString += d.objectValue.status + '-child ';
                                    } else if (d.sensorValue) {
                                        classString += d.sensorValue.status + '-child ';
                                    } else if (StatusService.sensorValues[d.sensor.replace('.', '_')]) {
                                        classString += StatusService.sensorValues[d.sensor.replace('.', '_')].status + '-child ';
                                    } else {
                                        classString += ' inactive-child ';
                                    }
                                    return classString + " child-text " + d.sensor;
                                })
                                .append("svg:text")
                                .attr("x", function (d) {
                                    if (scope.layoutMode === "dice") {
                                        return "50%";
                                    } else {
                                        return d.dx / 2;
                                    }
                                })
                                .attr("y", function (d) {
                                    return d.dy / 2;
                                })
                                .attr("dy", ".35em")
                                .attr("text-anchor", "middle")

                                .text(function (d) {
                                    return d.name ? d.name : d.sensor;
                                });

                            cell.append("foreignObject")
                                .attr("id", function (d) {
                                    return d.sensor.replace(".", "_") + "hideButton";
                                })
                                .style("display", "none")
                                .on("click", function (d) {
                                    scope.ignoreList.push(d.name);
                                    scope.labelDiv.remove();
                                    dataDiv.remove();
                                    drawTreemap(w, h);
                                })
                                .append("xhtml:div")
                                .style("cursor", "pointer")
                                .style("border", 0)
                                .style("min-width", "26px")
                                .style("min-height", "26px")
                                .style("margin", "0px")
                                .style("line-height", "1.8")
                                .attr("title", "Hide Sensor")
                                .style("position", "inherit")
                                .style("color", "white")
                                .html('<i style="position: fixed" class="fa fa-eye-slash"></i>');
                        }
                    }
            }
        };
    });
