angular.module('katGui.d3')

.directive('timeline', function($state, $rootScope) {
    return {
        restrict: 'EA',
        scope: {
            updateFunction: '='
        },
        replace: false,
        link: function(scope, element) {

            var width = scope.width ? scope.width : 250,
                height = scope.height ? scope.height : 250;
            var svg;

            scope.drawSvg = function() {

            };

            scope.update = function(data) {

            };
        }
    };
});
