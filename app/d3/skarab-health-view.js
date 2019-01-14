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

            var rectangles = null;
            var skarabTexts = null;

            var margin = {
                top: 10,
                right: 20,
                left: 50,
                bottom: 30
            };

            var svg;
            var width, height, radius;

            scope.vm.redrawStatus = function () {

              width = element[0].clientWidth - margin.left - margin.right;
              height = element[0].clientHeight - margin.top - margin.bottom;

              unitWidth = width/scope.vm.NUM_OF_RACKS - 2;
              unitHeight = height/scope.vm.NUM_OF_SLOTS - 2;

              d3.select('svg').remove();

              var tooltipdiv = d3.select(element[0]).append("div")
                 .attr("class", "skarab-tooltip")
                 .style("opacity", 0);

              svg = d3.select(element[0]).append("svg")
                      .attr("width", element[0].clientWidth)
                      .attr("height", element[0].clientHeight);


              var area = svg.append("g")
                           .attr("transform","translate(" + margin.left + "," + margin.top + ")")
                           .attr("width", width)
                           .attr("height", height);

              area.append("rect")
                  .attr("x", 0)
                  .attr("y", 0)
                  .attr("width", width)
                  .attr("height", height)
                  .attr('fill', '#BDBDBD');

              var graph = area.append("g")
                              .attr("x", 0)
                              .attr("y", 0)
                              .attr("width", width-1)
                              .attr("height", height)
                              .attr("transform","translate(1,0)")

              var x = d3.scale.linear().domain([0,scope.vm.NUM_OF_RACKS]).range([0, width]);
              var y = d3.scale.linear().domain([0,scope.vm.NUM_OF_SLOTS]).range([0, height]);

              var xAxis = d3.svg.axis().scale(x).orient("top").ticks(10);
              var yAxis = d3.svg.axis().scale(y).orient("right").ticks(10);

              function draw_rectangles(selection) {
                 var rectangleAttributes
                     = selection.attr("x", function (d) { return x(d.rack-1); })
                                .attr("y", function (d) { return y(d.slot-1); })
                                .attr("ObjectID",function(d) { return d.id; })
                                .style("stroke", "white")
                                .style("stroke-width", 0)
                                .attr("width", function (d) {
                                  return unitWidth;
                                })
                                .attr("height", function (d) {
                                  return unitHeight;
                                })
                                .attr("class", function(d) {
                                  return d.status + "-child";
                                })
                                .on('mouseover',function(d) {
                                  d3.select(this)
                                 	  .style("fill-opacity", .8)
                                    .style("stroke-width", 5);

                                  var x =  d3.event.pageX;
                                  var y =  d3.event.pageY;
                                  if (d.rack > scope.vm.NUM_OF_RACKS*2/3)
                                    x = x-450;
                                  if (d.slot > scope.vm.NUM_OF_SLOTS*2/3)
                                    y = y-200;
                                  else
                                    y -= 50;

                                  var date = '';
                                  var description = '';
                                  var value = '';
                                  var timestamp = '';
                                  var status = 'empty';
                                  var name = '';

                                  if (d.sensor) {
                                    date = format(new Date(d.sensor.time*1000));
                                    description = d.description;
                                    status = d.sensor.status;
                                    value = d.sensor.value;
                                    timestamp = format(new Date(d.sensor.value_ts*1000));
                                    name = d.name;
                                  }
                                  tooltipdiv.html(
                                        "<table>" +
                                        "<tr><th colspan='2'>" + d.sensorName + "</th></tr>" +
                                        "<tr><td class='sensor_field'>Original Name</td><td>" + name + "</td></tr>" +
                                        "<tr><td class='sensor_field'>Location</td><td>" + d.position + "</td></tr>" +
                                        "<tr><td class='sensor_field'>Description</td><td>" + description + "</td></tr>" +
                                        "<tr><td class='sensor_field'>Status</td><td>" + status + "</td></tr>" +
                                        "<tr><td class='sensor_field'>Value</td><td>" + value + "</td></tr>" +
                                        "<tr><td class='sensor_field'>Value Timestamp</td><td>" + timestamp + "</td></tr>" +
                                        "<tr><td class='sensor_field'>Value Reveiced</td><td>" + date + "</td></tr>" +
                                        "</table>")
                                       .style("left", x + "px")
                                       .style("top", y + "px");

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
                                 .on('click', function(d){
                                   scope.vm.navigateToSensorList('cbfhealth', 'skarab02-03');
                                 });
                 };

              rectangles = graph.selectAll("rect")
                .data(scope.vm.data)
                .enter()
                .append("rect")
                .call(draw_rectangles);

              var skarabArea = area.append('g');

              skarabTexts = skarabArea.selectAll('text')
                                  .data(scope.vm.data)
                                  .enter()
                                  .append('text');

              skarabTexts.attr("x", function (d) { return x(d.rack-1) + unitWidth/2; })
                          .attr("y", function (d) { return y(d.slot) - 5; })
                          .attr("ObjectID", function(d) { return d.id; })
                          .style('text-anchor', 'middle')
                          .text(function(d) {
                            if (d.status=='empty' || d.status=='nominal')
                              return '';
                              
                            return d.position;
                          });

              var textArea = area.append('g');
              var slotTexts = textArea.selectAll("text")
                              .data(['05','10','15','20','25','30','35','40'])
                              .enter()
                              .append("text");

              slotTexts.attr("x", function(d) { return -20; })
                    .attr("y", function(d) { return y(d) - 7; })
                    .text( function (d) { return ""+d; })
                    .attr("font-family", "sans-serif")
                    .attr("font-size", "14px")
                    .attr("fill", "grey");

              textArea = area.append('g');
              var rackTexts = textArea.selectAll("text")
                               .data(['1','2','3','4','5','6','7','8','9'])
                               .enter()
                               .append("text");

              rackTexts.attr("x", function(d) { return x(d) - unitWidth/2; })
                   .attr("y", function(d) { return height + 15; })
                   .text( function (d) { return ""+d; })
                   .attr("font-family", "sans-serif")
                   .attr("font-size", "14px")
                   .attr("fill", "grey");
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

            scope.$on('$destroy', function() {
              unbindResize();
            });


            scope.vm.updateStatus = function(obj) {
              if (!rectangles)
                return;

              rectangles.data([obj], function(d) {return d.id;})
                    .attr("class", function(d) {
                      return d.status + "-child";
                    });
            };
        }
    };
});
