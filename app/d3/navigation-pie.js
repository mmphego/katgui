angular.module('katGui.d3')

    .directive('navigationPie', function ($state, $rootScope) {
        return {
            restrict: 'EA',
            scope: {
                data: '=',
                width: '=',
                height: '=',
                svgTitle: '@'
            },
            replace: false,
            link: function (scope, element) {

                var themeElement = angular.element(document.querySelector("#btnPrimaryTheme"));
                var bgColor = themeElement.css('background-color');
                var color = themeElement.css('color');
                var width = scope.width ? scope.width : 250,
                    height = scope.height ? scope.height : 250;
                var radius = Math.min(width, height) / 2;
                var tooltip = d3.select(angular.element(document.querySelector('.navigation-tooltip'))[0]);
                var uiViewDiv = document.querySelector('#ui-view-container-div');
                var svg;

                scope.unbindLoginSuccess = $rootScope.$on('loginSuccess', function () {
                    if (svg) {
                        svg.remove();
                    }
                    scope.redraw();
                });

                scope.redraw = function () {
                    var arc = d3.svg.arc()
                        .outerRadius(radius - 10)
                        .innerRadius(0);

                    var pie = d3.layout.pie()
                        .sort(null)
                        .value(function(d) {
                            return d.relativeSize ? d.relativeSize : 1;
                        });

                    svg = d3.select(element[0]).append("svg")
                        .attr("width", width)
                        .attr("height", height + 15);

                    svg.append("g")
                        .attr("class", "md-whiteframe-z1")
                        .attr("transform", "translate(" + width / 2 + ", 15)")
                        .append("text")
                        .attr("fill", "currentColor")
                        .attr("class", "pie-button-text")
                        .attr("font-size", "16px")
                        .attr("font-weight", "bold")
                        .text(scope.svgTitle);

                    var pieG = svg.append("g")
                        .attr("transform", "translate(" + width / 2 + "," + (height / 2 + 15) + ")");

                    var g = pieG.selectAll(".arc")
                        .data(pie(scope.data))
                        .enter().append("g")
                        .attr("class", "arc");

                    g.append("path")
                        .attr("d", arc)
                        .attr("class", 'pie-button-path')
                        .style("stroke", color)
                        .style("fill", bgColor)
                        .on("mousemove", function (d) {
                            tooltip.style("display", null);
                            tooltip.attr("transform", "translate(10, 10)");
                            tooltip.html(
                                "<div>" + d.data.title + "</div>"
                            );
                            var offset = d3.mouse(uiViewDiv);
                            var x = offset[0];
                            var y = offset[1];
                            tooltip
                                .style("top", (y + 15 + angular.element(uiViewDiv).scrollTop()) + "px")
                                .style("left", (x + 5 + angular.element(uiViewDiv).scrollLeft()) + "px");
                        })
                        .on("mouseout", function () {
                           tooltip.style("display", "none");
                        })
                        .on("mouseup", function (d) {
                            if(d.data.state instanceof Function) {
                                d.data.state(d.data.stateParams);
                            } else {
                                $state.go(d.data.state, d.data.stateParams);
                            }
                        });

                    g.append("text")
                        .attr("transform", function(d) {
                            var centerArc = arc.centroid(d);
                            return "translate(" + (centerArc[0] - (d.data.textOffset ? d.data.textOffset : 0)) + ", " + centerArc[1] + ")";
                        })
                        .attr("dy", ".35em")
                        .attr("class", "pie-button-text")
                        .style("fill", color)
                        .text(function(d) {
                            return d.data.name;
                        });
                };

                scope.redraw();

                scope.$on('$destroy', function () {
                    scope.unbindLoginSuccess();
                });
            }
        };
    });
