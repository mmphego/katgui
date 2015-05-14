describe('Directive: d3-chart', function () {

    var $compile, $window, mockd3Service, $q, html, element, data, scope;

    data = {name: "Test Sensors OK",
        children: [{name: "m011", sensor: "mon_proxy:agg_test_sensor1"}, {
            name: "m011",
            sensorValue: {status: 2},
            sensor: "mon_proxy:agg_test_sensor2"
        }]
    };

    //setup test
    beforeEach(function () {
        mockd3Service = {};
        module('katGui.d3');

        module(function ($provide) {
            $provide.value('d3Service', mockd3Service);
        });

        inject(function (_$compile_, _$rootScope_, _$window_, _$q_) {
            $window = _$window_;
            $compile = _$compile_;
            scope = _$rootScope_.$new();
            $q = _$q_;
        });

        mockd3Service.d3 = function () {
            var deferred = $q.defer();
            deferred.resolve($window.d3);
            return deferred.promise;
        };
    });

    //it('should create a d3 status single level tree map', function () {
    //    html = '<div><status-single-level-tree-map data="data"></status-single-level-tree-map></div>';
    //    scope.$digest();
    //    scope.data = data;
    //    element = $compile(html)(scope);
    //    scope.$digest();
    //    document.body.appendChild(element[0]);
    //    expect(angular.element('#mon_proxy_agg_test_sensor1').attr('class')).toContain('inactive-child');
    //    expect(angular.element('#mon_proxy_agg_test_sensor2')).toBeDefined();
    //    expect(angular.element('#mon_proxy_agg_test_sensor2').attr('class')).toContain('warn-child');
    //});
});
