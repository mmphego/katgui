angular.module('katGui.d3')

    .directive('receptorHealthPartitionMap', function (StatusService, $localStorage, $rootScope, d3Util) {
        return {
            restrict: 'E',
            scope: {
                dataMapName: '=receptor'
            },
            link: function (scope, element) {

                var data = StatusService.statusData[scope.dataMapName];
                var r = 640, node, root, transitionDuration = 250;
                var margin = {top: 8, right: 8, left: 8, bottom: 8};
                var tooltip = d3.select(angular.element(document.querySelector('.treemap-tooltip'))[0]);
                var containerSvg, svg;
                //create our maplayout for the data and sort it alphabetically
                //the bockvalue is the relative size of each child element, it is
                //set to a static 100 when we get our monitor data in the StatusService
                var mapLayout = d3.layout.partition()
                    .value(function () {
                        return 10;
                    })
                    .sort(function (a, b) {
                        return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
                    });

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
                    var width = scope.chartSize.width;
                    var height = scope.chartSize.height;
                    node = root = data;

                    r = height - 10;
                    //create our x,y axis linear scales
                    var x = d3.scale.linear().range([0, width]);
                    var y = d3.scale.linear().range([0, height]);

                    //create the main svg element
                    containerSvg = d3.select(element[0]).append("svg")
                        .attr("width", width)
                        .attr("height", height)
                        .attr("class", "health-chart treemapHealthChart" + scope.dataMapName)
                        .style("margin-left", margin.left + "px")
                        .style("margin-right", margin.right + "px")
                        .style("margin-top", margin.top + "px")
                        .style("margin-bottom", margin.bottom + "px");
                    svg = containerSvg.append("g");

                    //create a svg:g element for each child node
                    var g = svg.selectAll("g")
                        .data(mapLayout.nodes(root))
                        .enter().append("svg:g")
                        .attr("transform", function (d) {
                            return "translate(" + x(d.y) + "," + y(d.x) + ")";
                        })
                        .attr("id", function (d) {
                            return d3Util.createSensorId(d, scope.dataMapName);
                        })
                        .on("click", click);

                    var kx = (width) / root.dx,
                        ky = height / 1;

                    //add a rectangle to each g child node
                    g.append("svg:rect")
                        .attr("width", function (d) {
                            return root.dy * kx;
                        })
                        .attr("height", function (d) {
                            return d.dx * ky;
                        })
                        //.attr("class", function (d) {
                        //    return d.children ? "part-parent" : "child";
                        //})
                        .call(function (d) {
                            d3Util.applyTooltipValues(d, tooltip, scope.dataMapName);
                        })
                        .attr("class", function (d) {
                            var classStr = d3Util.createSensorId(d, scope.dataMapName) + ' ';
                            classStr += (StatusService.sensorValues[scope.dataMapName + '_' + d.sensor] ?
                                StatusService.sensorValues[scope.dataMapName + '_' + d.sensor].status : 'inactive') + '-child child';
                            return classStr;
                        });

                    //add the text overlay for each node
                    g.append("svg:text")
                        .attr("transform", transform)
                        .attr("dy", ".35em")
                        .style("opacity", function (d) {
                            return d.dx * ky > 12 ? 1 : 0;
                        })
                        .attr("class", function (d) {
                            var classStr = d3Util.createSensorId(d, scope.dataMapName) + ' ';
                            classStr += (StatusService.sensorValues[scope.dataMapName + '_' + d.sensor] ?
                                StatusService.sensorValues[scope.dataMapName + '_' + d.sensor].status : 'inactive');
                            if (d.depth === 0) {
                                return classStr + '-child-text parent';
                            } else {
                                return classStr + '-child-text child';
                            }
                        })
                        .text(function (d) {
                            return d.name;
                        });

                    //zoom functionality when clicking on a child node
                    function click(d) {

                        kx = (d.y ? width - 40 : width) / (1 - d.y);
                        ky = height / d.dx;
                        x.domain([d.y, 1]).range([d.y ? 40 : 0, width]);
                        y.domain([d.x, d.x + d.dx]);

                        var t = g.transition()
                            .duration(transitionDuration)
                            .attr("transform", function (d) {
                                return "translate(" + x(d.y) + "," + y(d.x) + ")";
                            });

                        t.select("rect")
                            .attr("width", d.dy * kx)
                            .attr("height", function (d) {
                                return d.dx * ky;
                            })
                            .call(function (d) {
                                d3Util.applyTooltipValues(d, tooltip, scope.dataMapName);
                            });

                        t.select("text")
                            .attr("transform", transform)
                            .style("opacity", function (d) {
                                return d.dx * ky > 12 ? 1 : 0;
                            });

                        d3.event.stopPropagation();
                    }

                    function transform(d) {
                        return "translate(8," + d.dx * ky / 2 + ")";
                    }
                };

                scope.redraw();
            }
        };
    });
