angular.module('katGui.d3')

.directive('semiCircleWithLabel', function($window, $rootScope, $timeout, d3Util) {
    return {
        scope: {
            vm: '=',
            type: '@type'
        },
        link: function(scope, element) {
            var border = 2;
            var heightAdjust = 3;

            var the_svg = d3.select(element[0]).append('svg')
                            .attr('width', '100%')
                            .attr('height', '100%');

            var statusObj = {'svg': the_svg,
                            'type': scope.type}

            scope.vm.svgList.push(statusObj);

            redrawStatus = function (statusObj) {
                var width, height, radius;
                var svg = statusObj['svg'];
                var type = statusObj['type'];

                svg.select('path').remove();
                width = svg[0][0].clientWidth;
                height = svg[0][0].clientHeight - heightAdjust;

                radius = width/2;
                if (height < width/2)
                  radius = height;

                var arc = d3.svg.arc();

                var tophalfcircle = function(x,y,rad) {
                	return svg.append('path')
                        	.attr('transform', 'translate('+[x,y]+')')
                          .attr('d', arc({
                          		innerRadius: 0,
                          		outerRadius: rad,
                          		startAngle: Math.PI*0.5,
                          		endAngle: -Math.PI*0.5
                        	}))
                          .style('fill', '#4CAF50');
                }
                var bottomhalfcircle = function(x,y,rad) {
                	return svg.append('path')
                  .attr('transform', 'translate('+[x,y]+') rotate(180 0 0) ')
                  .attr('d', arc({
                  		innerRadius: 0,
                  		outerRadius: rad,
                  		startAngle: -Math.PI*0.5,
                  		endAngle: Math.PI*0.5
                	}))
                  .style('fill', '#FFC107');
                }
                if (type == 'top') {
                  tophalfcircle(width/2, height, radius);
                  svg.select('text').remove();
                  svg.append('text').text('5').attr('x', width/2)
                     .attr('y', height - 20);
                } else {
                  bottomhalfcircle(width/2, 0, radius);
                  svg.select('text').remove();
                  svg.append('text').text('5').attr('x', width/2)
                      .attr('y', 60);
                }

            };

            angular.element($window).bind('resize', function(){
              for (var i=0; i<scope.vm.svgList.length; i++)
                redrawStatus(scope.vm.svgList[i]);
            });

            //allow for some time for the dom elements to complete resizing
            $timeout(function() {
                redrawStatus(statusObj);
            }, 1000);

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
