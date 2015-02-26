angular.module('katGui.d3')

    .directive('statusSingleLevelTreeMap', function (d3Service, StatusService, $timeout, $rootScope, d3Util) {
        return {
            restrict: 'EA',
            scope: {
                dataMapName: '=receptor',
                chartSize: '='
            },
            link: function (scope, element) {

                d3Service.d3().then(function (d3) {

                    $timeout(function () {
                        drawTreemap();
                    }, 1000);

                    function drawTreemap() {

                        var w = 300 - 80,
                            h = 800 - 180,
                            x = d3.scale.linear().range([0, w]),
                            y = d3.scale.linear().range([0, h]),
                            root,
                            node;

                        var treemap = d3.layout.treemap()
                            .round(false)
                            .size([w, h])
                            .sticky(true)
                            .mode("dice")
                            .value(function(d) { return 1; });

                        var svg = d3.select(element[0]).append("div")
                            .attr("class", "health-chart md-whiteframe-z2 treemapHealthChart")
                            .style("width", w + "px")
                            .style("height", h + "px")
                            .append("svg:svg")
                            .attr("width", w)
                            .attr("height", h)
                            .append("svg:g")
                            .attr("transform", "translate(.5,.5)");

                        root = StatusService.topStatusTree;

                        var nodes = treemap.nodes(root)
                            .filter(function(d) { return !d.children; });

                        var cell = svg.selectAll("g")
                            .data(nodes)
                            .enter().append("svg:g")
                            .attr("class", "inactive-child")
                            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
                            .attr("id", function (d) {
                                return d.sensor;
                            });

                        cell.append("svg:rect")
                            .attr("width", function(d) { return d.dx - 1; })
                            .attr("height", function(d) { return d.dy - 1; });

                        cell.append("svg:text")
                            .attr("x", function(d) { return d.dx / 2; })
                            .attr("y", function(d) { return d.dy / 2; })
                            .attr("class", "inactive-child-text")
                            .attr("dy", ".35em")
                            .attr("text-anchor", "middle")
                            .text(function(d) { return d.sensor; });
                    }
                });
            }
        };
    });


