angular.module('katGui.d3', [])

    .directive('multiLineChart', function ($window, d3Service) {
        return {
            restrict: 'EA',
            scope: {
                redrawFunction: '=',
                clearFunction: '=',
                removeSensorFunction: '='
            },
            replace: false,
            link: function (scope, element) {

                d3Service.d3().then(function (d3) {

                    var unbindResize = scope.$watch(function () {
                        return element[0].clientHeight + ', ' + element[0].clientWidth;
                    }, function (newVal, oldVal) {
                        if (newVal !== oldVal) {
                            scope.redrawFunction(null, scope.showGridLines);
                        }
                    });

                    var color = d3.scale.category10();
                    scope.data = [];
                    scope.redrawFunction = function (newData, showGridLines) {
                        if (newData) {
                            newData.forEach(function (d) {
                                d.date = new Date(parseFloat(d.Timestamp) * 1000);
                                d.value = parseFloat(d.Value);
                                scope.data.push(d);
                            });
                        }
                        scope.showGridLines = showGridLines;
                        d3.selectAll('svg').remove();
                        drawChart();
                    };

                    scope.clearFunction = function () {
                        scope.data.splice(0, scope.data.length);
                        d3.select('svg').remove();
                        drawChart();
                    };

                    scope.removeSensorFunction = function (sensorName) {
                        console.log('remove ' + sensorName);
                        scope.data = _.reject(scope.data, function (item) {
                           return item.Sensor === sensorName;
                        });
                        d3.select('svg').remove();
                        drawChart();
                    };

                    drawChart();

                    function drawChart() {

                        var margin = {top: 20, right: 30, bottom: 100, left: 80},
                            width = element[0].clientWidth - margin.left - margin.right,
                            height = element[0].clientHeight - margin.top - margin.bottom - 8;

                        // set the ranges
                        var x = d3.time.scale().range([0, width]);
                        var y = d3.scale.linear().range([height, 0]);

                        // define the axes
                        var xAxis = d3.svg.axis().scale(x)
                            .orient("bottom").ticks(10);

                        var yAxis = d3.svg.axis().scale(y)
                            .orient("left").ticks(10);

                        if (scope.showGridLines) {
                            xAxis.tickSize(-height);//.tickSubdivide(true);
                            yAxis.tickSize(-width);//.tickSubdivide(true);
                        }

                        // define the line
                        var line = d3.svg.line()
                            .x(function (d) {
                                return x(d.date);
                            })
                            .y(function (d) {
                                return y(d.value);
                            });

                        //element.parent().css("max-height", element.parent().css("height"));
                        //element.parent().css("max-width", element.parent().css("width"));

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
                                }) - 1,
                                d3.max(scope.data, function (d) {
                                    return d.value;
                                }) + 1
                            ]);

                            // nest the entries by symbol
                            var dataNest = d3.nest()
                                .key(function (d) {
                                    return d.Sensor;
                                })
                                .entries(scope.data);

                            var legendSpace = width / dataNest.length;

                            // loop through each symbol / key
                            dataNest.forEach(function (d, i) {

                                svg.append("path")
                                    .attr("d", line(d.values))
                                    .attr("class", "line")
                                    .attr("id", 'tag' + d.key)
                                    .style("stroke", function () {
                                        return d.color = color(d.key);
                                    });

                                // Add the Legend
                                svg.append("text")
                                    .attr("x", (legendSpace / 2) + i * legendSpace) // spacing
                                    .attr("y", height + 80)
                                    .attr("class", "sensor-graph-legend")    // style the legend
                                    .style("fill", function () { // dynamic colours
                                        return d.color = color(d.key);
                                    })
                                    .on("click", function () {
                                        // Determine if current line is visible
                                        var active = d.active ? false : true,
                                            newOpacity = active ? 0 : 1;
                                        // Hide or show the elements based on the ID
                                        d3.select("#tag" + d.key)
                                            .transition().duration(100)
                                            .style("opacity", newOpacity);
                                        // Update whether or not the elements are active
                                        d.active = active;
                                    })
                                    .text(d.key);
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
                    }

                    scope.$on('$destroy', function () {
                        unbindResize();
                    });
                });
            }
        };
    });
