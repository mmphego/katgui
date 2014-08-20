angular.module('katGui.operator.receptorstate', ['katGui'])

    .directive('receptorState', function () {
        return {
            restrict: 'E',
            scope: {

            },
            templateUrl: 'operator-control/receptor-state/receptor-state.html',
            link: function (scope, element, attrs) {
                scope.name = attrs.receptorname;
                scope.state = attrs.receptorstate;
                scope.inhibited = attrs.inhibited;

                scope.alertMessage = function() {

                };
            }
        };
    });
