angular.module('katGui.d3')

    .directive('statusSingleLevelTreeMap', function (d3Service, d3Util, $window) {
        return {
            restrict: 'EA',
            scope: {
                data: '=',
                layoutMode: '@'
            },
            link: function (scope, element) {

                d3Service.d3().then(function (d3) {

                    var width = 220,
                        height = element.parent()[0].clientHeight - 40,
                        root, dataDiv;

                    if (!scope.layoutMode) {
                        scope.layoutMode = 'dice';
                    } else if (scope.layoutMode === 'slice') {
                        height = 220;
                        width = element.parent()[0].clientWidth - 40;
                    }

                    scope.ignoreList = [];

                    var tooltip = d3.select(angular.element('.treemap-tooltip')[0]);

                    var win = angular.element($window);
                    var unbindResize = win.bind("resize", function () {
                        if (scope.layoutMode === 'dice') {
                            height = element.parent()[0].clientHeight - 40;
                        } else if (scope.layoutMode === 'slice') {
                            width = element.parent()[0].clientWidth - 40;
                        }

                        d3.select(element[0]).selectAll('div').remove();
                        drawTreemap(width, height);
                    });

                    scope.$on('$destroy', function () {
                        unbindResize.unbind();
                    });

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

                        var labelDiv = d3.select(element[0]).append("div")
                            .attr("class", "status-top-label md-whiteframe-z2")
                            .style("width", "100%")
                            .style("height", "35px")
                            .style("background", function () {
                                return (window.getComputedStyle(document.getElementById('main-top-toolbar')) || {}).backgroundColor;
                            });

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
                                .attr("width", "100%")
                                .attr("height", h)
                                .append("svg:g");

                            if (root.children) {
                                root.children = _.filter(root.children, function(item) {
                                    return _.findWhere(scope.ignoreList, item.name) === undefined;
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
                                    if (d.sensorValue) {
                                        classString += d.sensorValue.status + '-child';
                                    } else {
                                        classString += 'inactive-child';
                                    }
                                    classString += d.dx > 300 ? " child-big-text" : " child";
                                    return classString;
                                })
                                .attr("transform", function (d) {
                                    return "translate(" + d.x + "," + d.y + ")";
                                })
                                .attr("id", function (d) {
                                    return d.sensor.replace(".", "_");
                                })
                                .call(function (d) {
                                    d3Util.applyTooltipValues(d, tooltip);
                                })
                                .on("mouseenter", function(d) {
                                    angular.element("#" + d.sensor.replace(".", "_") + "hideButton").css("display", "initial");
                                })
                                .on("mouseleave", function(d) {
                                    angular.element("#" + d.sensor.replace(".", "_") + "hideButton").css("display", "none");
                                });

                            //todo handle width/height when tree is spliced horizontally

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
                                //.attr("x", 3)
                                //.attr("y", 3)
                                .style("width", 26)
                                .style("height", 26)
                                .style("display", "none")
                                .on("click", function (d) {
                                    scope.ignoreList.push(d.name);
                                    labelDiv.remove();
                                    dataDiv.remove();
                                    drawTreemap(w, h);
                                })
                                .append("xhtml:div")
                                .attr("class", function (d) {
                                    return angular.element("#btnPrimaryTheme").prop("class");
                                })
                                .style("cursor", "pointer")
                                .style("border", 0)
                                .style("min-width", "26px")
                                .style("min-height", "26px")
                                .style("margin", "0px")
                                .style("line-height", "1.5")
                                .attr("title", "Hide Sensor")
                                .style("transform", "inherit")
                                .style("position", "inherit")
                                .html('<span class="fa fa-eye-slash"></span>');
                        }
                    }
                });
            }
        };
    });


