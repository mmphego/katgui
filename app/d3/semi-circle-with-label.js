angular.module('katGui.d3')

.directive('semiCircleWithLabel', function($rootScope, $timeout, d3Util) {
    return {
        link: function(scope, element) {
            var skarabTexts = null;

            var margin = {
                top: 0,
                right: 10,
                left: 10,
                bottom: 0
            };

            var width, height, radius;
            var border = 2;

            var the_svg = d3.select(element[0]).append("svg")
                    .attr("width", '100%')
                    .attr("height", '50%');

            scope.vm.svgList.push(the_svg);

            redrawStatus = function (svg) {
                width = svg[0][0].clientWidth - margin.left - margin.right;
                height = svg[0][0].clientHeight - margin.top - margin.bottom;

                radius = width;
                if (height < width)
                  radius = height;

                var arc = d3.svg.arc();
                var halfcircle = function(x,y,rad) {
                	return svg.append('path')
                	.attr('transform', 'translate('+[x,y]+')')
                  .attr('d', arc({
                  		innerRadius: 0,
                  		outerRadius: rad,
                  		startAngle: -Math.PI*0.5,
                  		endAngle: Math.PI*0.5
                	}));
                }
                halfcircle(width/2, height, radius);
            };

            var unbindResize = scope.$watch(function() {
                return element[0].clientHeight + ', ' + element[0].clientWidth;
            }, function(newVal, oldVal) {
                if (scope.resizeTimeout) {
                    $timeout.cancel(scope.resizeTimeout);
                    scope.resizeTimeout = null;
                }
                //allow for some time for the dom elements to complete resizing
                scope.resizeTimeout = $timeout(function() {
                  for (var i=0; i<scope.vm.svgList.length; i++)
                    redrawStatus(scope.vm.svgList[i]);
                }, 1000);
            });

            scope.$on('$destroy', function() {
              unbindResize();
            });


            scope.vm.updateStatus = function(obj) {
              //
              // if (!rectangles)
              //   return;
              //
              // rectangles.data([obj], function(d) {return d.id;})
              //       .attr("class", function(d) {
              //         return d.status + "-child";
              //       });
              //
              // skarabTexts.data([obj], function(d) {return d.id;})
              //       .text(function(d) {
              //         if (d.name) {
              //           var subs = d.name.split('.');
              //           subs.pop();
              //
              //           return subs.pop().replace('skarab', '');
              //         }
              //       });
              //
            };
        }
    };
});
