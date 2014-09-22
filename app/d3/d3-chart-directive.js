angular.module('katGui.d3', [])

    .directive('d3Line', function ($window, d3Service) {
        return{
            restrict: 'EA',
            scope: {
                data: '=',
                datasize: '='
            },
            replace: false,
            link: function (scope, elem) {

                d3Service.d3().then(function (d3) {

                    var pathClass = "line";
                    var xScale, yScale, xAxis, yAxis, valueLine;
                    var numberOfTicks = 10;

                    var timeFormat = d3.time.format("%H:%M:%S");

                    var margin = {top: 30, right: 20, bottom: 30, left: 50},
                        width = elem.parent()[0].offsetWidth - margin.left - margin.right,
                        height = 500 - margin.top - margin.bottom;

                    var svg = d3.select(elem[0])
                        .append("svg")
                        .attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                        .append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                    scope.$watch('datasize', function () {
                        drawLineChart();
                    }, true);

                    function setChartParameters() {

                        xScale = d3.scale.linear()
                            .domain([scope.data[0].sample_ts, scope.data[scope.data.length - 1].sample_ts])
                            .range([0, width]);

                        yScale = d3.scale.linear()
                            .domain([0, d3.max(scope.data, function (d) {
                                return parseInt(d.value);
                            })])
                            .range([height, 0]);

                        xAxis = d3.svg.axis()
                            .scale(xScale)
                            .orient("bottom")
                            .tickSize(-height, 0, 0)
                            .ticks(numberOfTicks)
                            .tickFormat(function (d) {
                                return timeFormat(new Date(d * 1000));
                            });


                        yAxis = d3.svg.axis()
                            .scale(yScale)
                            .tickSize(-width, 0, 0)
                            .orient("left")
                            .ticks(numberOfTicks);

                        valueLine = d3.svg.line()
                            .x(function (d) {
                                return xScale(d.sample_ts);
                            })
                            .y(function (d) {
                                return yScale(parseInt(d.value));
                            });
                    }

                    function drawLineChart() {

                        if (scope.data.length > 0) {


                            setChartParameters();

                            svg.append("svg:g")
                                .attr("class", "axis")
                                .attr("transform", "translate(0," + height + ")")
                                .call(xAxis);

                            svg.append("svg:g")
                                .attr("class", "axis")
                                .call(yAxis);

                            svg.append("rect")
                                .attr("x", 0)
                                .attr("y", 0)
                                .attr("height", height)
                                .attr("width", width)
                                .attr("class", "gridrect");

                            svg.append("svg:path")
                                .attr({
                                    d: valueLine(scope.data),
                                    "stroke": "blue",
                                    "stroke-width": 2,
                                    "fill": "none",
                                    "class": pathClass
                                });

                        }
                    }

                });
            }
        };
    });


//function redrawLineChart() {
//
//    if (scope.data !== null && scope.data !== undefined && scope.data.length > 0) {
//        setChartParameters();
//
//        svg.selectAll("g.y.axis").call(yAxis);
//
//        svg.selectAll("g.x.axis").call(xAxis);
//
//        svg.selectAll("." + pathClass)
//            .attr({
//                d: valueLine(scope.data)
//            });
//    }
//}

