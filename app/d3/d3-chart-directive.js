angular.module('katGui').directive('d3Line', function ($parse, $window, d3Service) {
    return{
        restrict: 'EA',
//        scope: {
//            data: '='
//        },
        replace: false,
        link: function (scope, elem, attrs) {
            d3Service.d3().then(function (d3) {
                var exp = $parse(attrs.data);

                var dataToPlot = exp(scope);
                var pathClass = "line";
                var xScale, yScale, xAxisGen, yAxisGen, valueLine;

                var	margin = {top: 30, right: 20, bottom: 30, left: 50},
                    width = 600 - margin.left - margin.right,
                    height = 270 - margin.top - margin.bottom;

                var svg = d3.select(elem[0])
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                scope.$watchCollection(exp, function (newVal, oldVal) {
                    dataToPlot = newVal;
                    redrawLineChart();
                });

                function setChartParameters() {

                    xScale = d3.scale.linear()
                        .domain([dataToPlot[0].hour, dataToPlot[dataToPlot.length - 1].hour])
                        .range([0, width]);

                    yScale = d3.scale.linear()
                        .domain([0, d3.max(dataToPlot, function (d) {
                            return d.sales;
                        })])
                        .range([height, 0]);

                    xAxisGen = d3.svg.axis()
                        .scale(xScale)
                        .orient("bottom")
                        .ticks(5);

                    yAxisGen = d3.svg.axis()
                        .scale(yScale)
                        .orient("left")
                        .ticks(5);

                    valueLine = d3.svg.line()
                        .x(function (d) {
                            return xScale(d.hour);
                        })
                        .y(function (d) {
                            return yScale(d.sales);
                        });
                }

                function drawLineChart() {

                    setChartParameters();

                    svg.append("svg:g")
                        .attr("class", "x axis")
                        .attr("transform", "translate(0,"+height+")")
                        .call(xAxisGen);

                    svg.append("svg:g")
                        .attr("class", "y axis")
                        .call(yAxisGen);

                    svg.append("svg:path")
                        .attr({
                            d: valueLine(dataToPlot),
                            "stroke": "blue",
                            "stroke-width": 2,
                            "fill": "none",
                            "class": pathClass
                        });
                }

                function redrawLineChart() {

                    setChartParameters();

                    svg.selectAll("g.y.axis").call(yAxisGen);

                    svg.selectAll("g.x.axis").call(xAxisGen);

                    svg.selectAll("." + pathClass)
                        .attr({
                            d: valueLine(dataToPlot)
                        });
                }

                drawLineChart();
            });
        }
    };
});


angular.module('katGui').directive('d3Bars', function ($window, $timeout, d3Service) {
    return {
        restrict: 'EA',
        scope: {
            data: '='
        },
        link: function (scope, ele, attrs) {
            d3Service.d3().then(function (d3) {

                var renderTimeout;
                var margin = parseInt(attrs.margin) || 20,
                    barHeight = parseInt(attrs.barHeight) || 20,
                    barPadding = parseInt(attrs.barPadding) || 5;

                var svg = d3.select(ele[0])
                    .append('svg')
                    .style('width', '100%');

                $window.onresize = function () {
                    scope.$apply();
                };

                scope.$watch(function () {
                    return angular.element($window)[0].innerWidth;
                }, function () {
                    scope.render(scope.data);
                });

                scope.$watch('data', function (newData) {
                    scope.render(newData);
                }, true);

                scope.render = function (data) {
                    svg.selectAll('*').remove();

                    if (!data) {
                        return;
                    }
                    if (renderTimeout) {
                        clearTimeout(renderTimeout);
                    }

                    renderTimeout = $timeout(function () {
                        var width = d3.select(ele[0])[0][0].offsetWidth - margin,
                            height = scope.data.length * (barHeight + barPadding),
                            color = d3.scale.category20(),
                            xScale = d3.scale.linear()
                                .domain([0, d3.max(data, function (d) {
                                    return d.score;
                                })])
                                .range([0, width]);

                        svg.attr('height', height);

                        svg.selectAll('rect')
                            .data(data)
                            .enter()
                            .append('rect')
                            .on('click', function (d, i) {
                                return scope.onClick({item: d});
                            })
                            .attr('height', barHeight)
                            .attr('width', 140)
                            .attr('x', Math.round(margin / 2))
                            .attr('y', function (d, i) {
                                return i * (barHeight + barPadding);
                            })
                            .attr('fill', function (d) {
                                return color(d.score);
                            })
                            .transition()
                            .duration(1000)
                            .attr('width', function (d) {
                                return xScale(d.score);
                            });
                        svg.selectAll('text')
                            .data(data)
                            .enter()
                            .append('text')
                            .attr('fill', '#fff')
                            .attr('y', function (d, i) {
                                return i * (barHeight + barPadding) + 15;
                            })
                            .attr('x', 15)
                            .text(function (d) {
                                return d.name + " (scored: " + d.score + ")";
                            });
                    }, 200);
                };
            });
        }};
});
