describe('VideoCtrl', function() {

    beforeEach(module('katGui.video'));
    beforeEach(module('ngMaterial'));

    var scope,ctrl;

    beforeEach(inject(function($rootScope, $controller) {
        scope = $rootScope.$new();
        ctrl = $controller('VideoCtrl', {$scope: scope});
    }));

});
