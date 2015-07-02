describe('Directive: d3-chart', function () {

    var $compile, $window, mockd3Service, mockd3Util, $q, html, element, data, scope, StatusService, timeout;

    data = {
        name: "Test Sensors OK",
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
            $provide.service('StatusService', function () {
                return {
                    statusData: {
                        m011: {
                            name: 'm011',
                            sensor: 'sensors_ok',
                            children: [{
                                name: 'ap',
                                sensor: 'ap_device_status',
                                children: [
                                    {
                                        name: 'bp',
                                        sensor: 'bp_device_status',
                                        children: []
                                    },
                                    {
                                        name: 'cp',
                                        sensor: 'cp_device_status',
                                        children: []
                                    }]
                            }]
                        }
                    }
                };
            });
        });

        inject(function (_$compile_, _$rootScope_, _$window_, _$q_, _StatusService_, _$timeout_, _d3Util_) {
            $window = _$window_;
            timeout = _$timeout_;
            $compile = _$compile_;
            scope = _$rootScope_.$new();
            $q = _$q_;
            _StatusService_.sensorValues = {};
            StatusService = _StatusService_;
            _d3Util_.applyTooltipValues = function() {};

            _d3Util_.waitUntilDataExists = function () {
                var deferred = $q.defer();
                deferred.resolve();
                return deferred.promise;
            };
        });

        mockd3Service.d3 = function () {
            var deferred = $q.defer();
            deferred.resolve($window.d3);
            return deferred.promise;
        };
    });

    it('should create a d3 receptor status icicle map', function () {
        html = '<receptor-health-icicle-map receptor="data" chart-size="size"></receptor-health-icicle-map>';
        scope.$digest();
        scope.data = 'm011';
        scope.size = {width: 500, height: 500};
        element = $compile(html)(scope);
        scope.$digest();
        document.body.appendChild(element[0]);
        expect(angular.element(document.querySelector('#m011_sensors_ok')).attr('class')).toContain('inactive-child child');
        expect(angular.element(document.querySelector('#m011_ap_device_status')).attr('class')).toContain('inactive-child');
    });

    it('should create a d3 receptor status pack map', function () {
        html = '<receptor-health-pack-map receptor="data" chart-size="size"></receptor-health-pack-map>';
        scope.$digest();
        scope.data = 'm011';
        scope.size = {width: 500, height: 500};
        element = $compile(html)(scope);
        scope.$digest();
        document.body.appendChild(element[0]);
        expect(angular.element(document.querySelector('#m011_sensors_ok')).attr('class')).toContain('inactive-child child');
        expect(angular.element(document.querySelector('#m011_ap_device_status')).attr('class')).toContain('inactive-child');
    });

    it('should create a d3 receptor status partition map', function () {
        html = '<receptor-health-partition-map receptor="data" chart-size="size"></receptor-health-partition-map>';
        scope.$digest();
        scope.data = 'm011';
        scope.size = {width: 500, height: 500};
        element = $compile(html)(scope);
        scope.$digest();
        document.body.appendChild(element[0]);
        expect(angular.element(document.querySelector('#m011_sensors_ok')).attr('class')).toContain('inactive-child child');
        expect(angular.element(document.querySelector('#m011_ap_device_status')).attr('class')).toContain('inactive-child');
    });

    it('should create a d3 receptor status sunburst map', function () {
        html = '<receptor-health-sunburst-map receptor="data" chart-size="size"></receptor-health-sunburst-map>';
        scope.$digest();
        scope.data = 'm011';
        scope.size = {width: 500, height: 500};
        element = $compile(html)(scope);
        scope.$digest();
        document.body.appendChild(element[0]);
        expect(angular.element(document.querySelector('#m011_sensors_ok')).attr('class')).toContain('inactive-child child');
        expect(angular.element(document.querySelector('#m011_ap_device_status')).attr('class')).toContain('inactive-child');
    });

    it('should create a d3 receptor status tree map', function () {
        html = '<receptor-health-tree-map receptor="data" chart-size="size"></receptor-health-tree-map>';
        scope.$digest();
        scope.data = 'm011';
        scope.size = {width: 500, height: 500};
        element = $compile(html)(scope);
        timeout.flush(1000);
        scope.$digest();
        timeout.flush(1000);
        scope.$digest();
        document.body.appendChild(element[0]);
        expect(angular.element(document.querySelector('#m011_sensors_ok')).attr('class')).toContain('inactive-child child');
        expect(angular.element(document.querySelector('#m011_ap_device_status')).attr('class')).toContain('inactive-child');
    });
});
