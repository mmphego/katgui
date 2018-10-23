angular.module('katGui.d3')

.directive('skarabHealthView', function($rootScope, $timeout, d3Util) {
    return {
        restrict: 'E',
        controller: 'SKARABHealthCtrl',
        controllerAs: 'vm',
        scope: {
        },
        link: function(scope, element) {
            const format = d3.time.format.utc("%Y-%m-%d %X");

            var circles = null;

            var margin = {
                top: 20,
                right: 20,
                left: 20,
                bottom: 50
            };

            var chart_margin = {
              left: 30
            };

            var svg;
            var width, height, radius;

            scope.vm.redrawStatus = function () {

              width = element[0].clientWidth-margin.left-margin.right;
              height = width*scope.vm.NUM_OF_RACKS/scope.vm.NUM_OF_SLOTS;

              radius = width/(scope.vm.NUM_OF_SLOTS*2)-5;
              d3.select('svg').remove();

              d3.select(element[0]).append("svg")
                      .attr("width", element[0].clientWidth)
                      .attr("height", height + margin.bottom)
                      .attr("transform", "translate(0" + ", " + margin.top + ")");

              svg = d3.select('svg');

               var x = d3.scale.linear().domain([0,scope.vm.NUM_OF_SLOTS+1]).range([0, width]);
               var y = d3.scale.linear().domain([0,scope.vm.NUM_OF_RACKS+1]).range([0, height]);

               var xAxis = d3.svg.axis().scale(x).orient("top").ticks(10);
               var yAxis = d3.svg.axis().scale(y).orient("right").ticks(10);

              function draw_circle(selection) {
                 var circleAttributes
                     = selection.attr("cx", function (d) { return x(d.slot); })
                                .attr("cy", function (d) { return y(d.rack); })
                                .attr("ObjectID",function(d) {return d.id;})
                                .style("stroke", "white")
                                .style("stroke-width", 0)
                                .on('mouseover',function(d) {
                                  d3.select(this)
                                 	  .style("fill-opacity", .8)
                                    .style("stroke-width", 5);

                                  var x =  d3.event.pageX;
                                  if (d.slot > 43*2/3)
                                    x = x-350;
                                  tooltipdiv.html(
                                        "<table>" +
                                        "<tr><th colspan='2'>" + d.sensor_value.name + " value at <br>" + format(new Date(d.sensor_value.time*1000)) + "</th></tr>" +
                                        "<tr><td class='sensor_field'>Location</td><td>" + d.position + "</td></tr>" +
                                        "<tr><td class='sensor_field'>Description</td><td>" + d.sensor_value.description + "</td></tr>" +
                                        "<tr><td class='sensor_field'>Status</td><td>" + d.sensor_value.status + "</td></tr>" +
                                        "<tr><td class='sensor_field'>Value</td><td>" + d.sensor_value.value + "</td></tr>" +
                                        "<tr><td class='sensor_field'>Value Timestamp</td><td>" + format(new Date(d.sensor_value.value_ts*1000)) + "</td></tr>" +
                                        "</table>")
                                       .style("left", x + "px")
                                       .style("top", (d3.event.pageY-50) + "px");

                                  tooltipdiv.transition()
                                       .duration(200)
                                       .style("opacity", .9);
                                 })
                                 .on('mouseout',function (d) {
                                   d3.select(this)
                                     .style("fill-opacity", 1)
                                     .style("stroke-width", 0);

                                     tooltipdiv.transition()
                                         .duration(500)
                                         .style("opacity", 0);
                                 })
                                .attr("r", function (d) {
                                  if (d.status=='empty')
                                    return 0;

                                  if (d.status=='nominal')
                                    return radius/2;

                                   return radius;
                                })
                                .attr("class", function(d) {
                                  return d.status + "-child";
                                });
                 };


                var area = svg.append("g")
                                 .attr("transform","translate(" + chart_margin.left + ",0)")
                                 .attr("width", width)
                                 .attr("height", height);

                 area.append("rect")
                     .attr("x", x(0)+radius)
                     .attr("y", y(1)-radius-margin.top/2)
                     .attr("width", x(scope.vm.NUM_OF_SLOTS+1)-2*radius)
                     .attr("height", y(scope.vm.NUM_OF_RACKS+1)-radius)
                     .attr('fill', '#BDBDBD');


                circles = area.selectAll("circle")
                  .data(scope.vm.data)
                  .enter()
                  .append("circle")
                  .call(draw_circle);

               var textArea = area.append('g');
               var texts = textArea.selectAll("text")
                                .data(['05','10','15','20','25','30','35','40'])
                                .enter()
                                .append("text");

              texts.attr("x", function(d) { return x(d)-8; })
                    .attr("y", function(d) { return y(scope.vm.NUM_OF_RACKS+1)+radius; })
                    .text( function (d) { return ""+d; })
                    .attr("font-family", "sans-serif")
                    .attr("font-size", "14px")
                    .attr("fill", "grey");

              textArea = area.append('g');
              texts = textArea.selectAll("text")
                               .data(['1','2','3','4','5','6','7','8','9'])
                               .enter()
                               .append("text");

              texts.attr("x", function(d) { return x(0); })
                   .attr("y", function(d) { return y(d)+8; })
                   .text( function (d) { return ""+d; })
                   .attr("font-family", "sans-serif")
                   .attr("font-size", "14px")
                   .attr("fill", "grey");

               var tooltipdiv = d3.select(element[0]).append("div")
                  .attr("class", "skarab-tooltip")
                  .style("opacity", 0);
            };

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
                        scope.vm.redrawStatus();
                    }, 1000);
                }
            });


            scope.vm.updateStatus = function(obj) {
              if (!circles)
                return;
              circles.data([obj], function(d) {return d.id;})
                    .transition()
                    .duration(1000)
                    .attr("r", 0)
                    .transition()
                    .duration(1000)
                    .attr("r", function (d) {
                      if (d.status=='empty')
                        return 0;

                      if (d.status=='nominal')
                        return radius/2;

                       return radius;
                    })
                    .attr("class", function(d) {
                      return d.status + "-child";
                    });
            };

            scope.$on('$destroy', function() {
                $interval.cancel(scope.unbindResize());
            });
        }
    };
});
