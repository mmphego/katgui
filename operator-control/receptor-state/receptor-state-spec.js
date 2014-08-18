describe('Directive: receptorState', function () {

    beforeEach(module('katGui'));
    beforeEach(module('templates'));

    var scope, compile, httpBackend;

    beforeEach(inject(function ($rootScope, $compile, $httpBackend) {
        scope = $rootScope.$new();
        compile = $compile;
        httpBackend = $httpBackend;
    }));

    it('should replace the element with receptorName, receptorState and displays inhibited', function () {

        var strReceptorState = '<receptor-state receptorName="atn1" receptorState="STOW" inhibited="true"></receptor-state>';

        var element = compile(strReceptorState)(scope);
        scope.$digest();
        expect(element.text()).toContain('atn1');
        expect(element.text()).toContain('STOW');
        expect(element.text()).toContain('Inhibited');
    });

    it('should replace the element with receptorName, receptorState and DOES NOT display inhibited', function () {

        var strReceptorState = '<receptor-state receptorName="atn2" receptorState="STOP" inhibited="false"></receptor-state>';

        var element = compile(strReceptorState)(scope);
        scope.$digest();
        expect(element.text()).toContain('atn2');
        expect(element.text()).toContain('STOP');
        expect(element.text()).not.toContain('Inhibited');
    });
});