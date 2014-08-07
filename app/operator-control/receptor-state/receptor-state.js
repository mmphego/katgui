angular.module('katGui').directive('receptorState', function() {
	return {
		restrict: 'E',
		scope: {

		},
		templateUrl: 'app/operator-control/receptor-state/receptor-state.html',
		link: function(scope, element, attrs, fn) {
            scope.receptor = JSON.parse(attrs.receptor);
		}
	};
});
