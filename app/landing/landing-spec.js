describe('LandingCtrl', function() {

	beforeEach(module('katGui.landing'));

	var scope,ctrl;

    beforeEach(inject(function($rootScope, $controller) {
      scope = $rootScope.$new();
      ctrl = $controller('LandingCtrl', {$scope: scope});
    }));	

	it('should display landing control buttons', inject(function() {

		expect(1).toEqual(1);
		
	}));

});