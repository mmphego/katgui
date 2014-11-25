angular.module('katGui')

    .directive('focus', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, element) {

                $timeout(function () {
                    if (element[0].nodeName === "MD-INPUT-GROUP") {
                        element[0].lastChild.focus();
                    } else {
                        element[0].focus();
                    }

                }, 100);

            }
        };
    });
