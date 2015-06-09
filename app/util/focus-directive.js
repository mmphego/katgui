angular.module('katGui.util', ['katGui.services'])

    .directive('focus', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, element) {
                $timeout(function () {
                    if (element[0].nodeName === "MD-INPUT-CONTAINER") {
                        element.children()[1].focus();
                    } else {
                        element[0].focus();
                    }
                }, 100);
            }
        };
    });
