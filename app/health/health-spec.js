describe('HealthCtrl', function () {

    beforeEach(module('katGui.health'));
    beforeEach(module('ngStorage'));

    var scope, ctrl, ConfigService, StatusService, MonitorService, q, d3Util, interval, deferred;

    var testTree = {
        name: 'comms_ok',
        subs: [
            {
                name: "m011",
                sensor: "mon:m011.comms_ok"
            },
            {
                name: "m022",
                sensor: "mon:m022.comms_ok"
            }],
        children: []
    };

    beforeEach(inject(function ($rootScope, $controller, _ConfigService_, _StatusService_, _MonitorService_, $interval, $q, _d3Util_) {
        interval = $interval;
        d3Util = _d3Util_;
        q = $q;
        scope = $rootScope.$new();
        _ConfigService_.loadAggregateSensorDetail = function () {
        };
        ConfigService = _ConfigService_;

        StatusService = _StatusService_;
        StatusService.setTopStatusTrees = function () {
            StatusService.topStatusTrees = [testTree];
        };
        MonitorService = _MonitorService_;
        deferred = q.defer();
        //$rootScope.showSimpleDialog = function () {
        //};
        ConfigService.getStatusTreesForTop = function () {
            return wrapPromise(deferred.promise);
        };
        ctrl = $controller('HealthCtrl', {
            $scope: scope, ConfigService: ConfigService, $interval: interval,
            StatusService: StatusService, MonitorService: MonitorService, d3Util: d3Util
        });
    }));


    //wrap the spy promises so that it looks like the $http promise that our service is returning
    function wrapPromise(promise) {
        return {
            then: promise.then,
            success: function (fn) {
                promise.then(fn);
                return wrapPromise(promise);
            },
            error: function (fn) {
                promise.then(null, fn);
                return wrapPromise(promise);
            }
        };
    }
});
