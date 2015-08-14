angular.module('katGui.d3')

    .directive('statusSingleLevelTreeMap', function (StatusService, d3Util, $window) {
        return {
            restrict: 'EA',
            scope: {
                data: '=',
                height: '=',
                width: '=',
                autoResize: '@',
                layoutMode: '@'
            },
            link: function (scope, element) {

                    var width = 220,
                        height = element.parent()[0].clientHeight - 40,
                        root, dataDiv;

                    if (!scope.layoutMode) {
                        scope.layoutMode = 'dice';
                    } else if (scope.layoutMode === 'slice') {
                        height = 220;
                        width = element.parent()[0].clientWidth - 40;
                    }

                    if (scope.height) {
                        height = +scope.height;
                    }

                    if (scope.width) {
                        width = +scope.width;
                    }

                    scope.ignoreList = [];

                    var tooltip = d3.select(angular.element(document.querySelector('.treemap-tooltip'))[0]);

                    if (scope.autoResize) {
                        var win = angular.element($window);
                        var unbindResize = win.bind("resize", function () {
                            if (scope.layoutMode === 'dice') {
                                height = element.parent()[0].clientHeight - 40;
                            } else if (scope.layoutMode === 'slice') {
                                width = element.parent()[0].clientWidth - 40;
                            }

                            d3.select(element[0]).selectAll('md-toolbar').remove();
                            d3.select(element[0]).selectAll('div').remove();
                            drawTreemap(width, height);
                        });

                        scope.$on('$destroy', function () {
                            unbindResize.unbind();
                        });
                    }

                    drawTreemap(width, height);

                    function drawTreemap(w, h) {

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

                        var labelDiv = d3.select(element[0]).append("md-toolbar")
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

                        labelDiv
                            .append("div")
                            .attr("class", "status-top-label-text")
                            .html(root.name);

                        drawData();

                        function drawData() {
                            dataDiv = d3.select(element[0]).append("div")
                                .attr("class", "md-whiteframe-z2 data-div")
                                .style("width", "100%")
                                .style("height", h + "px");

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
                                .attr("class", function (d) {
                                    var classString = "";
                                    if (angular.isDefined(d.objectValue)) {
                                        classString += d.objectValue.status + '-child';
                                    } else if (d.sensorValue) {
                                        classString += d.sensorValue.status + '-child';
                                    } else if (StatusService.sensorValues[d.sensor.replace('.', '_')]) {
                                        classString += StatusService.sensorValues[d.sensor.replace('.', '_')].status + '-child';
                                    } else {
                                        classString += 'inactive-child';
                                    }
                                    classString += d.dx > 300 ? " child-big-text" : " child ";
                                    if (angular.isDefined(d.objectValue)) {
                                        classString += " " + d.objectValue.parent_name;
                                        classString += "_" + d.sensor.replace(/\./g, "_");
                                    } else {
                                        classString += " " + d.sensor.split('.')[0];
                                        classString += "_" + d.sensor.split('.')[1];
                                    }
                                    return classString;
                                })
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
                                    if (d.sensor.indexOf('agg_') !== 0) {
                                        d3Util.showDialogForAggregateSensorInfo(d.sensor.split('.')[1]);
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
                                });

                            cell.append("svg:text")
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
                                //.attr("class", "inactive-child-text")
                                .attr("dy", ".35em")
                                .attr("text-anchor", "middle")
                                .text(function (d) {
                                    return d.name ? d.name : d.sensor;
                                });

                            cell.append("foreignObject")
                                .attr("id", function (d) {
                                    return d.sensor.replace(".", "_") + "hideButton";
                                })
                                //.style("width", 26)
                                //.style("height", 26)
                                .style("display", "none")
                                .on("click", function (d) {
                                    scope.ignoreList.push(d.name);
                                    labelDiv.remove();
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
