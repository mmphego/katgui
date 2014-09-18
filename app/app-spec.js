describe('ApplicationCtrl', function() {

    beforeEach(module('katGui'));

    var scope,ctrl;

    beforeEach(inject(function($rootScope, $controller) {
        scope = $rootScope.$new();
        ctrl = $controller('ApplicationCtrl', {$scope: scope});
    }));

    it('should ...', inject(function() {

//		scope.openDatePicker({ rowIndex: 0, entity: { desiredTime: '' } }, { target : { nodeName: 'BUTTON'} });

    }));

});