angular.module('katGui.d3')

.directive('timeline', function($rootScope, $timeout, $interval, ObsSchedService) {
    return {
        restrict: 'E',
        scope: {
            redrawFunction: '=',
            updateFunction: '=',
            loadOptionsFunction: '='
        },
        link: function(scope, element) {

            var margin = {
                top: 10,
                right: 10,
                bottom: 20,
                left: 80
            };
            var width = 600,
                height = 120;
            var svg, maing, xAxis, yAxis, x, y, xAxisElement, yAxisElement, nowLine, nowText, laneHeight = 30;
            var tooltip = d3.select(element[0]).append("div")
                .attr("class", "timeline-tooltip");

            scope.data = [];

            var unbindResize = scope.$watch(function() {
                return element[0].clientHeight + ', ' + element[0].clientWidth;
            }, function(newVal, oldVal) {
                if (newVal !== oldVal) {
                    if (scope.resizeTimeout) {
                        $timeout.cancel(scope.resizeTimeout);
                        scope.resizeTimeout = null;
                    }
                    //allow for some time for the dom elements to complete resizing
                    scope.resizeTimeout = $timeout(function() {
                        scope.redrawFunction();
                        scope.updateFunction(scope.data);
                    }, 750);
                }
            });

            scope.loadOptionsFunction = function(options) {
                Object.keys(options).forEach(function(optionKey) {
                    scope[optionKey] = options[optionKey];
                });
            };

            scope.redrawFunction = function() {
                if (!$rootScope.utcDate) {
                    //wait until we have utc date time
                    $timeout(function () {
                        scope.redrawFunction();
                    }, 100);
                    return;
                }

                d3.select(element[0]).select('svg').remove();

                width = element[0].clientWidth - margin.right - margin.left;
                height = element[0].clientHeight - margin.top - margin.bottom;
                laneHeight = scope.lanes ? height / scope.lanes.length : laneHeight;

                x = d3.time.scale.utc().range([0, width]);
                y = d3.scale.linear().range([height, 0]);

                xAxis = d3.svg.axis().scale(x).orient("bottom");

                var startDate = moment.utc($rootScope.utcDate).subtract(45, 'm').toDate(),
                    endDate = moment.utc($rootScope.utcDate).add(15, 'm').toDate();

                x.domain([startDate, endDate]);
                y.domain([0, height]);

                xAxis.tickSize(-height);

                svg = d3.select(element[0])
                    .append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .attr("class", "chart");

                svg.append("defs").append("clipPath")
                    .attr("id", "clip")
                    .append("rect")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom);

                maing = svg.append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                    .attr("width", width)
                    .attr("height", height);

                maing.attr("clip-path", "url(#clip)");

                if (scope.lanes) {
                    svg.selectAll("text.lane-label")
                        .data(scope.lanes)
                        .enter()
                        .append("text")
                        .attr("class", "lane-label")
                        .attr("x", 8)
                        .attr("y", function(d) {
                            return y(laneHeight * (scope.lanes.length - d.lane + 1)) + laneHeight/2 + 5 + margin.top;
                        })
                        .text(function(d) {
                            return d.title;
                        });

                    svg.selectAll("line.lane-line")
                        .data(scope.lanes)
                        .enter()
                        .append("line")
                        .attr("class", "lane-line")
                        .attr("x1", margin.left)
                        .attr("x2", width + margin.left)
                        .attr("y1", function(d) {
                            return y(laneHeight * (scope.lanes.length - d.lane + 1)) + laneHeight + margin.top;
                        })
                        .attr("y2", function(d) {
                            return y(laneHeight * (scope.lanes.length - d.lane + 1)) + laneHeight + margin.top;
                        });
                }

                svg.append("line")
                    .attr("x1", margin.left)
                    .attr("x2", width + margin.left)
                    .attr("y1", margin.top)
                    .attr("y2", margin.top)
                    .style("shape-rendering", "crispEdges")
                    .style("stroke", "#9e9e9e")
                    .style("stroke-width", "1px");

                xAxisElement = maing.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")");

                xAxisElement.call(xAxis);

                nowLine = maing.append("line")
                    .style("stroke", "#2196F3")
                    .style("stroke-dasharray", "10 5");

                nowText = svg.append("text")
                    .style("stroke", "#2196F3")
                    .text("Now UTC");
            };

            scope.updateFunction = function(data) {

                if (!$rootScope.utcDate || !maing) {
                    //wait until we have utc date time
                    scope.data = data;
                    $timeout(function () {
                        scope.updateFunction(scope.data);
                    }, 200);
                    return;
                }

                var startDate = moment.utc($rootScope.utcDate).subtract(45, 'm').toDate(),
                    endDate = moment.utc($rootScope.utcDate).add(15, 'm').toDate();

                x.domain([startDate, endDate]);
                y.domain([0, height]);

                nowLine.attr("x1", function(d) {
                        return x($rootScope.utcDate);
                    })
                    .attr("x2", function(d) {
                        return x($rootScope.utcDate);
                    })
                    .attr("y1", "0")
                    .attr("y2", height);

                nowText.attr("x", function(d) {
                        return x($rootScope.utcDate) + margin.left - 22;
                    })
                    .style("font-size", "10px")
                    .attr("y", margin.top - 2);

                xAxisElement.call(xAxis);

                if (!data) {
                    return;
                }

                scope.data = data;

                //update main item rects
                var rects = maing.selectAll("rect.item-container")
                    .data(data)
                    .attr("x", function(d) {
                        return x(d.start);
                    })
                    .attr("y", function(d) {
                        return y(laneHeight * (scope.lanes.length - d.lane + 1)) + (laneHeight - (laneHeight * 0.9)) / 2;
                    })
                    .attr("width", function(d) {
                        return x(d.end) - x(d.start);
                    })
                    .style("stroke", function(d) {
                        return d.strokeColor ? d.strokeColor : "black";
                    })
                    .style("fill", function(d) {
                        return d.fillColor ? d.fillColor : "transparent";
                    });

                var texts = maing.selectAll("text.item-container")
                    .data(data)
                    .attr("x", function(d) {
                        return x(d.start) + 4;
                    })
                    .attr("y", function(d) {
                        return y(laneHeight * (scope.lanes.length - d.lane + 1)) + 12 + margin.top;
                    })
                    .attr("width", function(d) {
                        return x(d.end) - x(d.start);
                    })
                    .attr("fill", "black")
                    .attr("font-size", "12px")
                    .text(function(d) {
                        return d.title;
                    });

                rects.enter().append("rect")
                    .attr("x", function(d) {
                        return x(d.start);
                    })
                    .attr("y", function(d) {
                        return y(laneHeight * (scope.lanes.length - d.lane + 1)) + (laneHeight - (laneHeight * 0.9)) / 2;
                    })
                    .attr("width", function(d) {
                        return x(d.end) - x(d.start);
                    })
                    .style("stroke", function(d) {
                        return d.strokeColor ? d.strokeColor : "black";
                    })
                    .style("fill", function(d) {
                        return d.fillColor ? d.fillColor : "transparent";
                    })
                    .attr("height", laneHeight * 0.9)
                    .attr("class", "item-container")
                    .style("cursor", function(d) {
                        if (d.clickFunction) {
                            return "pointer";
                        } else {
                            return "default";
                        }
                    })
                    .on("mouseover", function(d) {
                        tooltip.transition(100)
                            .style("opacity", 1);
                        if (d.tooltipContentFunction) {
                            tooltip.html(d.tooltipContentFunction());
                        } else {
                            tooltip.html(d.title + "<br/>" + d.start + "<br/>" + d.end);
                        }
                        tooltip.style("left", (d3.event.pageX + 18) + "px")
                            .style("top", (d3.event.pageY - 36) + "px");
                    })
                    .on("mouseout", function(d) {
                        tooltip.transition(100)
                            .style("opacity", 0);
                    })
                    .on("click", function(d) {
                        if (d.clickFunction) {
                            d.clickFunction();
                        }
                    });

                texts.enter().append("text")
                    .attr("x", function(d) {
                        return x(d.start) + 4;
                    })
                    .attr("y", function(d) {
                        return y(laneHeight * (scope.lanes.length - d.lane + 1)) + 12 + margin.top;
                    })
                    .attr("width", function(d) {
                        return x(d.end) - x(d.start);
                    })
                    .attr("fill", "black")
                    .attr("font-size", "12px")
                    .attr("class", "item-container")
                    .text(function(d) {
                        return d.title;
                    });

                rects.exit().remove();
                texts.exit().remove();
            };

            scope.updateInterval = $interval(function() {
                scope.updateFunction(scope.data);
            }, 10000);

            scope.$on('$destroy', function() {
                $interval.cancel(scope.updateInterval);
            });
        }
    };
});
