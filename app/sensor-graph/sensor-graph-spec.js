describe('SensorGraphCtrl', function() {

	beforeEach(module('katGui'));

	var scope,ctrl;

    beforeEach(inject(function($rootScope, $controller) {
      scope = $rootScope.$new();
      ctrl = $controller('SensorGraphCtrl', {$scope: scope});
    }));	

	it('should find sensor by string', inject(function() {

		scope.findSensorByString();
		
	}));

    it('should get sensor meta data', inject(function() {

        scope.getSensorMetaData();

    }));

    it('should get sensor data', inject(function() {

        scope.getSensorData();

    }));

    it('should map sensor data', inject(function() {

        scope.sensorData = { data: [] };
        scope.mapSensorData();

    }));

});