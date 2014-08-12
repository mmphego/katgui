describe('Directive: focus', function () {

    beforeEach(module('katGui'));
    beforeEach(module('templates'));

    var scope, compile;

    beforeEach(inject(function ($rootScope, $compile) {
        scope = $rootScope.$new();
        compile = $compile;
    }));

    beforeEach(function () {
        this.addMatchers({
            toBeFocus: function () {
                this.message = function () {
                    return 'Expected \'' + angular.mock.dump(this.actual) + '\' to have focus';
                };

                return this.actual[0].ownerDocument.activeElement === this.actual[0];
            }
        });
    });

    it('should give the control focus', function () {

        var strInputElement = '<input type="text" focus>';
        var element = compile(strInputElement)(scope);

        //Note that for focus related tests, the compiled element has to be attached to the DOM, which can be done like this:
        element.appendTo(document.body);
        scope.$digest();
        element.isolateScope().setFocus();
        expect(element).toBeFocus();
    });
});