angular.module('katGui.d3', [])

    .directive('multiLineChart', function ($window, d3Service) {
        return {
            restrict: 'EA',
            scope: {
                data: '=',
                showGridLines: '='
            },
            replace: false,
            link: function (scope, element) {

                d3Service.d3().then(function (d3) {

                    var elementParent = element.parent();

                    var unbindResize = scope.$watch(function() {
                        return elementParent[0].clientHeight + elementParent[0].clientWidth;
                    }, function () {
                        d3.select('svg').remove();
                        drawChart();
                    });

                    var unbindShowGridLines = scope.$watch('showGridLines', function(newVal, oldVal) {
                       if (newVal !== oldVal) {
                           d3.select('svg').remove();
                           drawChart();
                       }
                    });

                    var colors = [
                        '#42A5F5',
                        '#4CAF50',
                        '#E57373',
                        '#CE93D8'
                    ];

                    drawChart();

                    function drawChart() {

                        var margin = {top: 20, right: 30, bottom: 30, left: 50},
                            width = element.parent()[0].clientWidth - margin.left - margin.right,
                            height = element.parent()[0].clientHeight - margin.top - margin.bottom - 54;

                        var x = d3.scale.linear()
                            .domain([0, 12])
                            .range([0, width]);

                        var y = d3.scale.linear()
                            .domain([-1, 16])
                            .range([height, 0]);

                        var xAxis = d3.svg.axis()
                            .scale(x)
                            .tickSize(scope.showGridLines? -height : 0)
                            .tickPadding(10)
                            .tickSubdivide(true)
                            .orient("bottom");

                        var yAxis = d3.svg.axis()
                            .scale(y)
                            .tickPadding(10)
                            .tickSize(scope.showGridLines? -width : 0)
                            .tickSubdivide(true)
                            .orient("left");

                        var zoom = d3.behavior.zoom()
                            .x(x)
                            .y(y)
                            .scaleExtent([1, 10])
                            .on("zoom", zoomed);

                        var svg = d3.select(element[0]).append("svg")
                            .call(zoom)
                            .attr("width", width + margin.left + margin.right)
                            .attr("height", height + margin.top + margin.bottom)
                            .append("g")
                            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                        svg.append("g")
                            .attr("class", "x axis")
                            .attr("transform", "translate(0," + height + ")")
                            .call(xAxis);

                        svg.append("g")
                            .attr("class", "y axis")
                            .call(yAxis);

                        svg.append("g")
                            .attr("class", "y axis")
                            .append("text")
                            .attr("class", "axis-label")
                            .attr("transform", "rotate(-90)")
                            .attr("y", (-margin.left) + 10)
                            .attr("x", -height / 2)
                            .text('Axis Label');

                        svg.append("clipPath")
                            .attr("id", "clip")
                            .append("rect")
                            .attr("width", width)
                            .attr("height", height);

                        var line = d3.svg.line()
                            .interpolate("linear")
                            .x(function (d) {
                                return x(d.x);
                            })
                            .y(function (d) {
                                return y(d.y);
                            });

                        svg.selectAll('.line')
                            .data(scope.data)
                            .enter()
                            .append("path")
                            .attr("class", "line")
                            .attr("clip-path", "url(#clip)")
                            .attr('stroke', function (d, i) {
                                return colors[i % colors.length];
                            })
                            .attr("d", line);

                        var points = svg.selectAll('.dots')
                            .data(scope.data)
                            .enter()
                            .append("g")
                            .attr("class", "dots")
                            .attr("clip-path", "url(#clip)");

                        points.selectAll('.dot')
                            .data(function (d, index) {
                                var a = [];
                                d.forEach(function (point, i) {
                                    a.push({'index': index, 'point': point});
                                });
                                return a;
                            })
                            .enter()
                            .append('circle')
                            .attr('class', 'dot')
                            .attr("r", 2.5)
                            .attr('fill', function (d, i) {
                                return colors[d.index % colors.length];
                            })
                            .attr("transform", function (d) {
                                return "translate(" + x(d.point.x) + "," + y(d.point.y) + ")";
                            }
                        );

                        function zoomed() {
                            svg.select(".x.axis").call(xAxis);
                            svg.select(".y.axis").call(yAxis);
                            svg.selectAll('path.line').attr('d', line);

                            points.selectAll('circle').attr("transform", function (d) {
                                    return "translate(" + x(d.point.x) + "," + y(d.point.y) + ")";
                                }
                            );
                        }
                    }

                    scope.$on('$destroy', function() {
                        unbindResize();
                        unbindShowGridLines();
                    });
                });
            }
        };
    });
