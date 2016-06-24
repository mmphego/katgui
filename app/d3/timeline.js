angular.module('katGui.d3')

.directive('timeline', function($timeout, ObsSchedService) {
    return {
        restrict: 'E',
        scope: {
            redrawFunction: '='
        },
        link: function(scope, element) {

            var margin = {top: 10, right: 10, bottom: 20, left: 10};
            var width = 600,
                height = 120;
            var svg, maing, xAxis, yAxis, x, y, xAxisElement, yAxisElement;

            var unbindResize = scope.$watch(function () {
                return element[0].clientHeight + ', ' + element[0].clientWidth;
            }, function (newVal, oldVal) {
                if (newVal !== oldVal) {
                    if (scope.resizeTimeout) {
                        $timeout.cancel(scope.resizeTimeout);
                        scope.resizeTimeout = null;
                    }
                    //allow for some time for the dom elements to complete resizing
                    scope.resizeTimeout = $timeout(function () {
                        scope.drawSvg();
                        scope.redrawFunction(scope.data);
                    }, 750);
                }
            });

            scope.drawSvg = function() {

                d3.select(element[0]).select('svg').remove();

                width = element[0].clientWidth - margin.right - margin.left;
                height = element[0].clientHeight - margin.top - margin.bottom;

                x = d3.time.scale.utc().range([0, width]);
                y = d3.scale.linear().range([height, 0]);

                var startDate = moment().subtract(30, 'm').toDate(),
                    endDate = moment().add(30, 'm').toDate();

                x.domain([startDate, endDate]);
                y.domain([0, height]);

                xAxis = d3.svg.axis().scale(x).orient("bottom");

                xAxis.tickSize(-height);

                svg = d3.select(element[0])
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .attr("class", "chart");

                svg.append("defs").append("clipPath")
                    .attr("id", "clip")
                    .append("rect")
                    .attr("width", "100%")
                    .attr("height", "100%");

                maing = svg.append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                    .attr("width", width)
                    .attr("height", height);

                xAxisElement = maing.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")");

                xAxisElement.call(xAxis);
            };

            scope.redrawFunction = function(data) {

                if (!data || data.length === 0) {
                    return;
                }
                //TODO we might need to append to scope.data instead?
                scope.data = data;

                //update main item rects
                var rects = maing.selectAll("rect.item-container")
                    .data(data)
                    .attr("x", function(d) {
                        return x(d.start);
                    })
                    .attr("width", function(d) {
                        return x(d.end) - x(d.start);
                    })
                    .style("stroke", function (d) {
                        return d.strokeColor? d.strokeColor : "black";
                    })
                    .style("fill", function (d) {
                        return d.fillColor? d.fillColor: "transparent";
                    });

                var texts = maing.selectAll("text.item-container")
                    .data(data)
                    .attr("x", function(d) {
                        return x(d.start) + 4;
                    })
                    .attr("y", function(d) {
                        return y(30 * d.lane) + 15;
                    })
                    .attr("width", function(d) {
                        return x(d.end) - x(d.start);
                    })
                    .attr("fill", "black")
                    .attr("font-size", "12px")
                    .text(function (d) {
                        return d.title;
                    });

                rects.enter().append("rect")
                    .attr("x", function(d) {
                        return x(d.start);
                    })
                    .attr("y", function(d) {
                        return y(30 * d.lane);
                    })
                    .attr("width", function(d) {
                        return x(d.end) - x(d.start);
                    })
                    .style("stroke", function (d) {
                        return d.strokeColor? d.strokeColor : "black";
                    })
                    .style("fill", function (d) {
                        return d.fillColor? d.fillColor: "transparent";
                    })
                    .attr("height", "20")
                    .attr("class", "item-container");

                texts.enter().append("text")
                    .attr("x", function(d) {
                        return x(d.start) + 4;
                    })
                    .attr("y", function(d) {
                        return y(30 * d.lane) + 15;
                    })
                    .attr("width", function(d) {
                        return x(d.end) - x(d.start);
                    })
                    .attr("fill", "black")
                    .attr("font-size", "12px")
                    .attr("class", "item-container")
                    .text(function (d) {
                        return d.title;
                    });

                rects.exit().remove();
                texts.exit().remove();
            };
        }
    };
});
