//describe('GanttWidgetCtrl', function () {
//
//    beforeEach(module('gantt'));
//    beforeEach(module('katGui.widgets.ganttWidget'));
////    beforeEach(module('app/util/gantt/gantt.template.html'));
////    beforeEach(module('gantt-widget.html'));
//
//    var sampleData = [
//        // Order is optional. If not specified it will be assigned automatically
//        {"id": "2f85dbeb-0845-404e-934e-218bf39750c0", "description": "Sub-Array 1", "order": 0, "tasks": [
//            // Dates can be specified as string, timestamp or javascript date object. The data attribute can be used to attach a custom object
//            {"id": "f55549b5-e449-4b0c-9f4b-8b33381f7d78", "subject": "sb1", "color": "#93C47D", "from": "2014-10-07T06:00:00", "to": "2014-10-07T09:00:00", "data": "Can contain any custom data or object"},
//            {"id": "f55549b5-e449-4b0c-9f4b-8b33381f7d76", "subject": "sb2", "color": "#83B06F", "from": "2014-10-07T09:00:00", "to": "2014-10-07T10:00:00", "data": "Can contain any custom data or object"},
//            {"id": "f55549b5-e449-4b0c-9f4b-8b33381f7d77", "subject": "sb3", "color": "#769E64", "from": "2014-10-07T10:00:00", "to": "2014-10-07T12:00:00", "data": "Can contain any custom data or object"},
//            {"id": "f55549b5-e449-4b0c-9f4b-8b33381f7d79", "subject": "sb4", "color": "#6C915C", "from": "2014-10-07T12:30:00", "to": "2014-10-07T14:00:00", "data": "Can contain any custom data or object"},
//            {"id": "f55549b5-e449-4b0c-9f4b-8b33381f7d71", "subject": "sb5", "color": "#93C47D", "from": "2014-10-07T03:00:00", "to": "2014-10-07T06:00:00", "data": "Can contain any custom data or object"},
//            {"id": "f55549b5-e449-4b0c-9f4b-8b33381f7d22", "subject": "sb6", "color": "#83B06F", "from": "2014-10-07T02:00:00", "to": "2014-10-07T03:00:00", "data": "Can contain any custom data or object"},
//            {"id": "f55549b5-e449-4b0c-9f4b-8b33381f7d73", "subject": "sb7", "color": "#769E64", "from": "2014-10-07T14:00:00", "to": "2014-10-07T17:00:00", "data": "Can contain any custom data or object"},
//            {"id": "f55549b5-e449-4b0c-9f4b-8b33381f7d74", "subject": "sb8", "color": "#6C915C", "from": "2014-10-07T17:30:00", "to": "2014-10-07T22:00:00", "data": "Can contain any custom data or object"}
//        ], "data": "Can contain any custom data or object"},
//        {"id": "bffa16c6-c134-4443-8e6e-b09410c37c9f", "description": "Sub-Array 4", "order": 13, "tasks": [
//            {"id": "2f4ec0f1-cd7a-441a-8288-e788ec112af9", "subject": "sb1", "color": "#F1C232", "from": new Date(2014, 9, 7, 6, 0, 0), "to": new Date(2014, 9, 7, 18, 0, 0)}
//        ]},
//        {"id": "ec0c5e31-449f-42d0-9e81-45c66322b640", "description": "Sub-Array 5", "order": 14, "tasks": [
//            {"id": "edf2cece-2d17-436f-bead-691edbc7386b", "subject": "sb1", "color": "#F132CB", "from": new Date(2014, 9, 7, 14, 30, 0), "to": new Date(2014, 9, 7, 18, 0, 0)}
//        ]},
//        {"id": "c65c2672-445d-4297-a7f2-30de241b3145", "description": "Sub-Array 2", "order": 2, "tasks": [
//            {"id": "4e197e4d-02a4-490e-b920-4881c3ba8eb7", "subject": "sb1", "color": "#9FC5F8", "from": new Date(2014, 9, 7, 9, 0, 0), "to": new Date(2014, 9, 7, 10, 0, 0)},
//            {"id": "451046c0-9b17-4eaf-aee0-4e17fcfce6ae", "subject": "sb2", "color": "#9FC5F8", "from": new Date(2014, 9, 7, 10, 0, 0), "to": new Date(2014, 9, 7, 11, 0, 0)},
//            {"id": "fcc568c5-53b0-4046-8f19-265ebab34c0b", "subject": "sb3", "color": "#9FC5F8", "from": new Date(2014, 9, 7, 11, 30, 0), "to": new Date(2014, 9, 7, 12, 30, 0)}
//        ]},
//        {"id": "33e1af55-52c6-4ccd-b261-1f4484ed5773", "description": "Sub-Array 3", "order": 12, "tasks": [
//            {"id": "656b9240-00da-42ff-bfbd-dfe7ba393528", "subject": "sb4", "color": "#32CEF1", "from": new Date(2014, 9, 7, 9, 0, 0), "to": new Date(2014, 9, 7, 12, 0, 0)}
//        ]}
//    ];
//
//    var scope, ctrl, compile, element;
//
//    beforeEach(inject(function ($rootScope, $controller, $compile, $templateCache) {
//        scope = $rootScope.$new();
//        compile = $compile;
//        ctrl = $controller('GanttWidgetCtrl', {$scope: scope});
//
//        $templateCache.put('app/util/gantt/gantt.template.html', '');
//        $rootScope.$digest();
//    }));
//
//    it('should bind sample schedule block data', inject(function () {
//
//        element = angular.element('<gantt load-data="loadData = fn" template-url="app/util/gantt/gantt.template.html"></gantt>');
//
//        //TODO compiling the gantt directive with its replace = true property doesnt play well with $compile, investigate
//        //compile(element)(scope);
//        //scope.$digest();
//
////        scope.loadData(sampleData);
////        scope.$digest();
//        //expect(scope.scheduleData.length).toBe(sampleData.length);
//        expect(1).toBe(1);
//    }));
//
//});
