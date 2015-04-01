describe('Directive: d3-chart', function () {

    var $compile, $rootScope, $window, mockd3Service, $q, html, element, data;

    //setup test
    beforeEach(function(){
        mockd3Service = {};
        module('katGui.d3');

        module(function($provide){
            $provide.value('d3Service', mockd3Service);
        });

        inject(function(_$compile_, _$rootScope_, _$window_, _$q_) {
            $window = _$window_;
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            $q = _$q_;
        });

        mockd3Service.d3 = function() {
            var deferred = $q.defer();
            deferred.resolve($window.d3);
            return deferred.promise;
        };

    });

    it('should create a d3 status single level tree map', function () {
        $rootScope.data = {name:"Test Sensors OK", sensor:"", subs:[{name: "m011", sensor: "mon_proxy:agg_m011_timing_ok"}], children:[{name: "m011", sensor: "mon_proxy:agg_m011_timing_ok"}]};
        html = '<div><status-single-level-tree-map></status-single-level-tree-map></div>';
        $rootScope.$digest();
        element = $compile(html)($rootScope);
        $rootScope.$digest();
        expect(element[0]).toBeDefined();
    });


});
