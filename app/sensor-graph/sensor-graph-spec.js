describe('SensorGraphCtrl', function() {

	beforeEach(module('katGui'));

	var scope,ctrl;

    beforeEach(inject(function($rootScope, $controller) {
      scope = $rootScope.$new();
      ctrl = $controller('SensorGraphCtrl', {$scope: scope});
    }));

	it('should find sensor by string', inject(function() {

        ctrl.findSensorByString();

	}));

    it('should get sensor meta data', inject(function() {

        ctrl.getSensorMetaData();

    }));

    it('should get sensor data', inject(function() {

        ctrl.getSensorData();

    }));

    it('should map sensor data', inject(function() {

        ctrl.sensorData = { data: [] };
        ctrl.mapSensorData();

    }));

});
