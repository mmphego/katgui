angular.module('katGui.d3')

.directive('timeline', function($timeout) {
    return {
        restrict: 'E',
        scope: {
            updateFunction: '='
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
                        scope.drawValues(scope.data);
                    }, 750);
                }
            });

            scope.drawSvg = function() {

                d3.select(element[0]).select('svg').remove();

                width = element[0].clientWidth - margin.right - margin.left;

                x = d3.time.scale.utc().range([0, width]);
                y = d3.scale.linear().range([height, 0]);

                xAxis = d3.svg.axis().scale(x).orient("bottom");
                yAxis = d3.svg.axis().scale(y).orient("left");

                xAxis.tickSize(-height);
                yAxis.tickSize(-width);

                svg = d3.select(element[0])
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .attr("class", "chart");

                svg.append("defs").append("clipPath")
                    .append("rect")
                    .attr("width", width)
                    .attr("height", height);

                maing = svg.append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                    .attr("width", width)
                    .attr("height", height);

                xAxisElement = maing.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")");

                yAxisElement = maing.append("g")
                    .attr("class", "y axis y-axis");
            };

            scope.drawValues = function(data) {
                var startDate = moment().subtract(1, 'h').toDate(),
                    endDate = new Date();

                x.domain([startDate, endDate]);
                y.domain([0, height]);

                //update main item rects
                var rects = maing.selectAll("rect")
                    .data(data)
                    .attr("x", function(d) {
                        return x(d.start);
                    })
                    .attr("width", function(d) {
                        return x(d.end) - x(d.start);
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
                    .attr("height", "20");

                rects.exit().remove();

                xAxisElement.call(xAxis);
                yAxisElement.call(yAxis);
            };

            scope.data = [{
                start: moment().subtract(20, 'm').toDate(),
                end: moment().subtract(10, 'm').toDate(),
                lane: 1
            }, {
                start: moment().subtract(40, 'm').toDate(),
                end: moment().subtract(35, 'm').toDate(),
                lane: 2
            }, {
                start: moment().subtract(40, 'm').toDate(),
                end: moment().subtract(35, 'm').toDate(),
                lane: 3
            }, {
                start: moment().subtract(40, 'm').toDate(),
                end: moment().subtract(35, 'm').toDate(),
                lane: 4
            }];
        }
    };
});
