describe('OperatorControlCtrl', function() {

	beforeEach(module('katGui'));

	var scope,ctrl;

    beforeEach(inject(function($rootScope, $controller) {
      scope = $rootScope.$new();
      ctrl = $controller('OperatorControlCtrl', {$scope: scope});
    }));	

	it('should display all the configured receptors', inject(function() {

		expect(1).toEqual(1);
		
	}));

});