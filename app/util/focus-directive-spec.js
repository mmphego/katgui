describe('Directive: focus', function () {

    beforeEach(module('katGui.util'));

    var scope, timeout, element, compile;

    beforeEach(inject(function ($rootScope, $compile, _$timeout_) {
        compile = $compile;
        timeout = _$timeout_;
        scope = $rootScope.$new();
    }));

    it('should give the control focus', function () {
        element = angular.element('<input focus/>');
        element.appendTo(document.body);
        compile(element)(scope);
        scope.$digest();
        timeout.flush();
        expect(document.activeElement).toBe(element[0]);
    });

    it('should give the md-input-group control focus', function () {
        element = angular.element('<md-input-container focus><label>label</label><input></md-input-container>');
        element.appendTo(document.body);
        compile(element)(scope);
        scope.$digest();
        timeout.flush();
        expect(document.activeElement).toBe(element[0].children[1]);
    });
});
