describe('GanttWidgetCtrl', function () {

    beforeEach(module('katGui.widgets.ganttWidget'));

    var scope, ctrl, compile, element;

    beforeEach(inject(function ($rootScope, $controller, $compile, $templateCache) {
        scope = $rootScope.$new();
        compile = $compile;
        ctrl = $controller('GanttWidgetCtrl', {$scope: scope});

        $templateCache.put('app/util/gantt/gantt.template.html', '');
        $rootScope.$digest();
    }));

    it('should create the controller', inject(function () {
        expect(ctrl).toBeDefined();
    }));

});
