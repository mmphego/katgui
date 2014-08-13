describe('LoginFormCtrl', function() {

	beforeEach(module('katGui.login'));

	var scope,ctrl;

    beforeEach(inject(function($rootScope, $controller) {
      scope = $rootScope.$new();
      ctrl = $controller('LoginFormCtrl', {$scope: scope});
    }));


    it('should ensure user can log in', function() {
        // expect current scope to contain username
    });
    it('should ensure path has changed', function() {
        // expect path to equal '/dashboard'
    });

});