describe('WeatherCtrl', function() {

    beforeEach(module('katGui.weather'));

	var scope,ctrl;

    beforeEach(inject(function($rootScope, $controller) {
      scope = $rootScope.$new();
      ctrl = $controller('WeatherCtrl', {$scope: scope});
    }));	

	it('should do nothing yet...', inject(function() {

		expect(1).toEqual(1);
		
	}));

});