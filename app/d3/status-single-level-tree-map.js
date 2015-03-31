angular.module('katGui.d3')

    .directive('statusSingleLevelTreeMap', function (d3Service, d3Util, $window) {
        return {
            restrict: 'EA',
            scope: {
                data: '=',
                chartSize: '='
            },
            link: function (scope, element) {

                d3Service.d3().then(function (d3) {

                    var width = 220,
                        height = element.parent()[0].clientHeight - 40,
                        root, dataDiv;

                    var tooltip = d3.select(angular.element('.treemap-tooltip')[0]);

                    var win = angular.element($window);
                    var unbindResize = win.bind("resize", function () {
                        height = element.parent()[0].clientHeight - 40;
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
                            .mode("dice")
                            .value(function () {
                                return 1;
                            });

                        root = scope.data;

                        d3.select(element[0]).append("div")
                            .attr("class", "status-top-label md-whiteframe-z2")
                            .style("width", "100%")
                            .style("height", "35px")
                            .style("background", function () {
                                return window.getComputedStyle(document.getElementById('main-top-toolbar')).backgroundColor;
                            })
                            .append("div")
                            .attr("class", "status-top-label-text")
                            .html(root.name);

                        dataDiv = d3.select(element[0]).append("div")
                            .attr("class", "md-whiteframe-z2 data-div")
                            .style("width", "100%")
                            .style("height", h + "px");

                        var svg = dataDiv.append("svg:svg")
                            .attr("width", "100%")
                            .attr("height", h)
                            .append("svg:g");

                        var nodes = treemap.nodes(root)
                            .filter(function (d) {
                                return !d.children;
                            });

                        var cell = svg.selectAll("g")
                            .data(nodes)
                            .enter().append("svg:g")
                            .attr("width", function (d) {
                                return "100%";
                            })
                            .attr("class", function (d) {
                                if (d.sensorValue) {
                                    return d3Util.statusClassFromNumber(d.sensorValue.status) + '-child';
                                } else {
                                    return 'inactive-child';
                                }
                            })
                            .attr("transform", function (d) {
                                return "translate(" + d.x + "," + d.y + ")";
                            })
                            .attr("id", function (d) {
                                return d.sensor.replace(":", "_");
                            });

                        //todo handle width/height when tree is spliced horizontally
                        cell.append("svg:rect")
                            .attr("width", function (d) {
                                return "100%";
                            })
                            .attr("height", function (d) {
                                return d.dy - 1;
                            })
                            .call(function (d) {
                                d3Util.applyTooltipValues(d, tooltip);
                            });

                        cell.append("svg:text")
                            .attr("x", function (d) {
                                return "50%";
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
                    }
                });
            }
        };
    });


