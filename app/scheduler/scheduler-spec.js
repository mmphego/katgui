describe('SchedulerCtrl', function() {

    beforeEach(module('ui.bootstrap.datetimepicker'));
	beforeEach(module('katGui.scheduler'));

	var scope,ctrl;

    beforeEach(inject(function($rootScope, $controller) {
      scope = $rootScope.$new();
      ctrl = $controller('SchedulerCtrl', {$scope: scope});
    }));	

	it('should ...', inject(function() {

//		scope.openDatePicker({ rowIndex: 0, entity: { desiredTime: '' } }, { target : { nodeName: 'BUTTON'} });
		
	}));

});