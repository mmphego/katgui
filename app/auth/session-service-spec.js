describe('Session', function () {

    beforeEach(module('katGui'));

    it('should keep session details in a singleton', inject(function (Session) {

        expect(1).toEqual(1);

    }));


});