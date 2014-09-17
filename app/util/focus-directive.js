angular.module('katGui.util', [])

    .directive('focus', function () {
        return {
            restrict: 'A',
            scope: {},
            link: function (scope, element) {

                scope.setFocus = function () {
                    element[0].focus();
                };

                scope.setFocus();
            }
        };
    });