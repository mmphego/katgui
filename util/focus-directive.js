angular.module('katGui')

    .directive('focus', function () {
        return {
            restrict: 'A',
            scope: {},
            link: function (scope, element, attrs) {

                scope.setFocus = function () {
                    element[0].focus();
                };

                scope.setFocus();
            }
        };
    });