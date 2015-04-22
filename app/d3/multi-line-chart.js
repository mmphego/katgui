angular.module('katGui.d3', [])

    .directive('multiLineChart', function ($window, d3Service) {
        return {
            restrict: 'EA',
            scope: {
                showGridLines: '=',
                redrawFunction: '='
            },
            replace: false,
            link: function (scope, element) {

                d3Service.d3().then(function (d3) {

                    var unbindResize = scope.$watch(function () {
                        return element[0].clientHeight + element[0].clientWidth;
                    }, function () {
                        scope.redrawFunction();
                    });

                    var unbindShowGridLines = scope.$watch('showGridLines', function (newVal, oldVal) {
                        if (newVal !== oldVal) {
                            scope.redrawFunction();
                        }
                    });

                    var colors = [
                        '#42A5F5',
                        '#4CAF50',
                        '#E57373',
                        '#CE93D8'
                    ];

                    scope.data = [];
                    scope.redrawFunction = function (newData) {
                        if (newData) {
                            newData.forEach(function(d) {
                                d.date = new Date(parseFloat(d["'Timestamp'"].replace(/'/g, '')) * 1000);
                                d.value = parseFloat(d["'Value'"].replace(/'/g, ''));
                                scope.data.push(d);
                            });
                        }
                        d3.select('svg').remove();
                        drawChart();
                    };

                    function drawChart() {

                        var margin = {top: 20, right: 30, bottom: 30, left: 80},
                            width = element[0].clientWidth - margin.left - margin.right,
                            height = element[0].clientHeight - margin.top - margin.bottom - 54;

                        // set the ranges
                        var x = d3.time.scale().range([0, width]);
                        var y = d3.scale.linear().range([height, 0]);

                        // define the axes
                        var xAxis = d3.svg.axis().scale(x)
                            .orient("bottom").ticks(10);

                        var yAxis = d3.svg.axis().scale(y)
                            .orient("left").ticks(10);

                        // define the line
                        var line = d3.svg.line()
                            .x(function (d) {
                                return x(d.date);
                            })
                            .y(function (d) {
                                return y(d.value);
                            });

                        // adds the svg canvas
                        var svg = d3.select(element[0])
                            .append("svg")
                            .attr("width", width + margin.left + margin.right)
                            .attr("height", height + margin.top + margin.bottom)
                            .append("g")
                            .attr("transform",
                            "translate(" + margin.left + "," + margin.top + ")");

                        if (scope.data.length > 0) {

                            // scale the range of the data
                            x.domain(d3.extent(scope.data, function (d) {
                                return d.date;
                            }));
                            y.domain([
                                d3.min(scope.data, function (d) {
                                    return d.value;
                                }),
                                d3.max(scope.data, function (d) {
                                    return d.value;
                                })
                            ]);

                            // nest the entries by symbol
                            var dataNest = d3.nest()
                                .key(function (d) {
                                    return d["'Sensor'"];
                                })
                                .entries(scope.data);

                            // loop through each symbol / key
                            dataNest.forEach(function (d, i) {

                                svg.append("path")
                                    .attr("d", line(d.values))
                                    .attr("class", "line")
                                    .attr('stroke', colors[i % colors.length]);
                            });
                        }

                        // add the x axis
                        svg.append("g")
                            .attr("class", "x axis")
                            .attr("transform", "translate(0," + height + ")")
                            .call(xAxis);

                        // add the y axis
                        svg.append("g")
                            .attr("class", "y axis")
                            .call(yAxis);

                        //var zoom = d3.behavior.zoom()
                        //    .x(x)
                        //    .y(y)
                        //    .scaleextent([1, 10])
                        //    .on("zoom", zoomed);

                        //var values = [];
                        //for (var attr in scope.data) {
                        //    //d3.values(scope.data[attr])
                        //    values.push(scope.data[attr]);
                        //}


                        //var datagroup = d3.nest()
                        //    .key(function (d) {
                        //        return d["'sensor'"];
                        //    })
                        //    .entries(scope.data);
                        //
                        //datagroup.foreach(function (d) {
                        //    if (angular.isarray(d.values) && d.values.length > 0) {
                        //        for (var i = 0; i < d.values.length; i++) {
                        //            console.log(d.values[i]["'timestamp'"]);
                        //            if (!angular.isdate(d.values[i]["'timestamp'"])) {
                        //                d.values[i]["'timestamp'"] = new date(parsefloat(d.values[i]["'timestamp'"].replace(/'/, '')) * 1000);
                        //            }
                        //            if (angular.isstring(d.values[i]["'value'"])) {
                        //                d.values[i]["'value'"] = parsefloat(d.values[i]["'value'"].replace(/'/, ''));
                        //            }
                        //        }
                        //    }
                        //
                        //});
                        //
                        //var x = d3.time.scale().range([0, width])
                        //    .domain(d3.extent(scope.data, function(d) {
                        //        return d["'timestamp'"];
                        //    }));
                        //
                        //var y = d3.scale.linear().range(height, 0);
                        //
                        //y.domain([198593, 158593]);
                        //    //.domain([d3.min(scope.data, function (d) {
                        //    //    return d["'value'"];
                        //    //}), d3.max(scope.data, function (d) {
                        //    //    return d["'value'"];
                        //    //})]);
                        //
                        //var xaxis = d3.svg.axis()
                        //    .scale(x)
                        //    .ticksize(-height)
                        //    .tickpadding(10)
                        //    .ticksubdivide(true)
                        //    .orient("bottom");
                        //
                        //var yaxis = d3.svg.axis()
                        //    .scale(y)
                        //    .tickpadding(10)
                        //    .ticksize(-width)
                        //    .ticksubdivide(true)
                        //    .orient("left");
                        //
                        //
                        //var svg = d3.select(element[0]).append("svg")
                        //    //.call(zoom)
                        //    .attr("width", width + margin.left + margin.right)
                        //    .attr("height", height + margin.top + margin.bottom)
                        //    .append("g")
                        //    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
                        //
                        //svg.append("g")
                        //    .attr("class", "x axis")
                        //    .attr("transform", "translate(0," + height + ")")
                        //    .call(xaxis);
                        //
                        //svg.append("g")
                        //    .attr("class", "y axis")
                        //    .call(yaxis);
                        //
                        //svg.append("g")
                        //    .attr("class", "y axis")
                        //    .append("text")
                        //    .attr("class", "axis-label")
                        //    .attr("transform", "rotate(-90)")
                        //    .attr("y", (-margin.left) + 10)
                        //    .attr("x", -height / 2)
                        //    .text('axis label');
                        //
                        //svg.append("clippath")
                        //    .attr("id", "clip")
                        //    .append("rect")
                        //    .attr("width", width)
                        //    .attr("height", height);
                        //
                        //var line = d3.svg.line()
                        //    //.interpolate("linear")
                        //    .x(function (d) {
                        //        return x(d["'timestamp'"]);
                        //    })
                        //    .y(function (d) {
                        //        return y(d["'value'"]);
                        //    });
                        //
                        //datagroup.foreach(function (d) {
                        //    svg.append('path')
                        //        .attr('d', line(d.values))
                        //        .attr('stroke', function (d, i) {
                        //            return colors[i % colors.length];
                        //        })
                        //        .attr('stroke-width', 2)
                        //        .attr('fill', 'none');
                        //});

                        //var points = svg.selectall('.dots')
                        //    .data(scope.data)
                        //    .enter()
                        //    .append("g")
                        //    .attr("class", "dots")
                        //    .attr("clip-path", "url(#clip)");
                        //
                        //points.selectall('.dot')
                        //    .data(function (d, index) {
                        //        var a = [];
                        //        d.foreach(function (point, i) {
                        //            a.push({'index': index, 'point': point});
                        //        });
                        //        return a;
                        //    })
                        //    .enter()
                        //    .append('circle')
                        //    .attr('class', 'dot')
                        //    .attr("r", 2.5)
                        //    .attr('fill', function (d, i) {
                        //        return colors[d.index % colors.length];
                        //    })
                        //    .attr("transform", function (d) {
                        //        return "translate(" + x(d.point.x) + "," + y(d.point.y) + ")";
                        //    }
                        //);

                        //function zoomed() {
                        //    svg.select(".x.axis").call(xaxis);
                        //    svg.select(".y.axis").call(yaxis);
                        //    svg.selectall('path.line').attr('d', line);
                        //
                        //    points.selectall('circle').attr("transform", function (d) {
                        //            return "translate(" + x(d.point.x) + "," + y(d.point.y) + ")";
                        //        }
                        //    );
                        //}
                    }

                    scope.$on('$destroy', function () {
                        unbindResize();
                        unbindShowGridLines();
                    });
                });
            }
        };
    });
