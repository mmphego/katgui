angular.module('katGui.d3')

    .directive('statusSingleLevelTreeMap', function (d3Service, StatusService, $timeout) {
        return {
            restrict: 'EA',
            scope: {
                data: '=',
                chartSize: '='
            },
            link: function (scope, element) {

                d3Service.d3().then(function (d3) {

                    var w = 220,
                        h = 1200 - 180,
                        x = d3.scale.linear().range([0, w]),
                        y = d3.scale.linear().range([0, h]),
                        root;

                    drawTreemap();

                    function drawTreemap() {

                        var treemap = d3.layout.treemap()
                            .sort(function (a, b) {
                                return a.sensor > b.sensor ? -1 : a.sensor < b.sensor ? 1 : 0;
                            })
                            .round(false)
                            .size([w, h])
                            .sticky(true)
                            .mode("dice")
                            .value(function() { return 1; });

                        root = scope.data;

                        d3.select(element[0]).append("div")
                            .attr("class", "status-top-label md-whiteframe-z2")
                            .style("width", "100%")
                            .style("height", "35px")
                            .append("div")
                            .attr("class", "status-top-label-text")
                            .html(root.name);

                        var svg = d3.select(element[0]).append("div")
                            .attr("class", "md-whiteframe-z2")
                            .style("width", "100%")
                            .style("height", h + "px")
                            .append("svg:svg")
                            .attr("width", "100%")
                            .attr("height", h)
                            .append("svg:g");

                        var nodes = treemap.nodes(root)
                            .filter(function(d) { return !d.children; });

                        var cell = svg.selectAll("g")
                            .data(nodes)
                            .enter().append("svg:g")
                            .attr("width", function(d) { return "100%"; })
                            .attr("class", "inactive-child")
                            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
                            .attr("id", function (d) {
                                return d.sensor.replace(":", "_");
                            });

                        //todo handle width/height when tree is spliced horizontally
                        cell.append("svg:rect")
                            .attr("width", function(d) { return "100%"; })
                            .attr("height", function(d) { return d.dy - 1; });

                        cell.append("svg:text")
                            .attr("x", function(d) { return "50%"; })
                            .attr("y", function(d) { return d.dy / 2; })
                            //.attr("class", "inactive-child-text")
                            .attr("dy", ".35em")
                            .attr("text-anchor", "middle")
                            .text(function(d) {
                                return d.name? d.name : d.sensor;
                            });
                    }
                });
            }
        };
    });


