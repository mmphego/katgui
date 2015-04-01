describe('HealthCtrl', function () {

    beforeEach(module('katGui.health'));
    beforeEach(module('ngStorage'));

    var scope, ctrl, ConfigService, StatusService, MonitorService, q, d3Util, interval, deferred, d3Service;

    var testTree = {
        name: 'comms_ok',
        subs: [
            {
                name: "m011",
                sensor: "m011:comms_ok"
            },
            {
                name: "m022",
                sensor: "m022:comms_ok"
            }],
        children: []
    };

    beforeEach(inject(function ($rootScope, $controller, _ConfigService_, _StatusService_, _MonitorService_, $interval, $q, _d3Util_, _d3Service_) {
        interval = $interval;
        d3Util = _d3Util_;
        q = $q;
        scope = $rootScope.$new();
        d3Service = _d3Service_;
        ConfigService = _ConfigService_;
        StatusService = _StatusService_;
        StatusService.setTopStatusTrees = function () {
            StatusService.topStatusTrees = [testTree];
        };
        MonitorService = _MonitorService_;
        deferred = q.defer();
        $rootScope.showSimpleDialog = function () {
        };
        ConfigService.getStatusTreesForTop = function () {
            return wrapPromise(deferred.promise);
        };
        ctrl = $controller('HealthCtrl', {
            $scope: scope, ConfigService: ConfigService, $interval: interval,
            StatusService: StatusService, MonitorService: MonitorService, d3Util: d3Util
        });
    }));

    it('should init the controller variables and call the service function for the top status view', function () {
        expect(ctrl.topStatusTrees).toBeDefined();
        expect(scope.itemsToUpdate).toBeDefined();
    });

    it('should unbind watchers', inject(function () {
        var unbindUpdateSpy = spyOn(ctrl, "unbindUpdate");
        scope.$emit("$destroy");
        scope.$digest();
        expect(unbindUpdateSpy).toHaveBeenCalled();
    }));

    it('should stop interval on scope destroy', inject(function () {
        ctrl.stopUpdating = function() {
        };
        var cancelSpy = spyOn(interval, "cancel");
        scope.$emit("$destroy");
        scope.$digest();
        expect(cancelSpy).toHaveBeenCalled();
    }));

    it('should call the StatusService functions when getStatusTreesForTop returns', function () {
        var setTopStatusTreesSpy = spyOn(StatusService, 'setTopStatusTrees').and.callThrough();
        var subscribeToChildSensors = spyOn(ctrl, 'subscribeToChildSensors');
        deferred.resolve();
        scope.$digest();
        expect(setTopStatusTreesSpy).toHaveBeenCalled();
        expect(subscribeToChildSensors).toHaveBeenCalled();
    });

    it('should show a dialog when the status trees function returns with an error', function () {
        var showSimpleDialogSpy = spyOn(scope.$root, 'showSimpleDialog');
        deferred.reject();
        scope.$digest();
        expect(showSimpleDialogSpy).toHaveBeenCalled();
    });

    it('should start the update interval when sensor updates are received', function () {
        var sensor = {
            name: 'test:test_sensor', sensorValue: {
                received_timestamp: 1426073881.12494,
                status: 1,
                timestamp: 1426073881.122542,
                value: 21.6588049757
            }
        };
        scope.$root.$emit("sensorUpdateReceived", sensor);
        scope.$digest();
        expect(scope.itemsToUpdate['test_test_sensor']).toBe(sensor);
        expect(ctrl.stopUpdating).toBeDefined();
        scope.$root.$emit("sensorUpdateReceived", sensor);
        scope.$digest();
        expect(ctrl.stopUpdating).toBeDefined();
    });

    it('should apply pending updates', function () {
        var cancelSpy = spyOn(interval, 'cancel');
        var sensor = {
            name: 'test:test_sensor', sensorValue: {
                received_timestamp: 1426073881.12494,
                status: 1,
                timestamp: 1426073881.122542,
                value: 21.6588049757
            }
        };
        scope.$root.$emit("sensorUpdateReceived", sensor);
        scope.$digest();
        expect(scope.itemsToUpdate['test_test_sensor']).toBe(sensor);
        expect(ctrl.stopUpdating).toBeDefined();
        window.d3 = {
            selectAll: function () {
                return {attr: function(){}};
            }
        };
        ctrl.applyPendingUpdates();
        scope.itemsToUpdate = {};
        ctrl.applyPendingUpdates();
        expect(cancelSpy).toHaveBeenCalled();
        ctrl.applyPendingUpdates();
        expect(ctrl.stopUpdating).not.toBeDefined();
    });

    it('should delete the sensor after the update is applies', function() {
        var sensor = {
            name: 'test:test_sensor',
            sensorValue: {
                received_timestamp: 1426073881.12494,
                status: 1,
                timestamp: 1426073881.122542,
                value: 21.6588049757
            },
            sensor: 'test_sensor'
        };

        var sensor2 = {
            name: 'test2:test_sensor2',
            sensorValue: {
                received_timestamp: 1426073881.12494,
                status: 1,
                timestamp: 1426073881.122542,
                value: 21.6588049757
            },
            sensor: 'test_sensor2'
        };

        var sensor3 = {
            name: 'test3:test_sensor3',
            depth: 1,
            sensorValue: {
                received_timestamp: 1426073881.12494,
                status: 1,
                timestamp: 1426073881.122542,
                value: 21.6588049757
            },
            sensor: 'test_sensor3'
        };

        scope.$root.$emit("sensorUpdateReceived", sensor);
        scope.$root.$emit("sensorUpdateReceived", sensor2);
        scope.$digest();
        expect(scope.itemsToUpdate['test_test_sensor']).toBe(sensor);
        ctrl.setClassesOfSensor({}, 'test_test_sensor');
        scope.$digest();
        expect(scope.itemsToUpdate['test_test_sensor']).not.toBeDefined();

        expect(scope.itemsToUpdate['test2_test_sensor2']).toBe(sensor2);
        ctrl.setClassesOfSensor({name: 'test2', sensor: 'test_sensor2',sensorValue: {status:1}}, 'test2_test_sensor2');
        scope.$digest();
        expect(scope.itemsToUpdate['test2_test_sensor2']).not.toBeDefined();

        //update existing sensorValue
        scope.$root.$emit("sensorUpdateReceived", sensor3);
        scope.$digest();
        ctrl.setClassesOfSensor({depth: 1, sensorValue: {status: 1}}, 'test3_test_sensor3');
        expect(scope.itemsToUpdate['test3_test_sensor3']).not.toBeDefined();

        //update new sensorValue
        scope.$root.$emit("sensorUpdateReceived", sensor3);
        scope.$digest();
        ctrl.setClassesOfSensor({depth: 1}, 'test3_test_sensor3');
        expect(scope.itemsToUpdate['test3_test_sensor3']).not.toBeDefined();

        //try to updae a non existing sensor
        ctrl.setClassesOfSensor({depth: 1}, 'test3_test_sensor3');
        expect(scope.itemsToUpdate['test3_test_sensor3']).not.toBeDefined();

        //update new sensorValue when there is not sensorValue attr
        sensor3.sensorValue = null;
        scope.$root.$emit("sensorUpdateReceived", sensor3);
        scope.$digest();
        ctrl.setClassesOfSensor({depth: 1}, 'test3_test_sensor3');
        expect(scope.itemsToUpdate['test3_test_sensor3']).toBeDefined();
    });

    it('should subscribe to child sensors in the tree structure', function() {
        var subscribeSpy = spyOn(MonitorService, 'subscribe');
        StatusService.statusData['m011'] = {
            name: 'm011',
            sensor: 'testsensor',
            children: [{
                name: 'ap',
                sensor: 'aptestsensor',
                children: [{
                    name: 'apchild',
                    sensor: 'apchildtestsensor',
                    subs: ['apchildtestsub1', 'apchildtestsub2']
                }, {
                    name: 'ap2',
                    sensor: 'aptestsensor2'
                }]
            }]
        };
        ctrl.subscribeToChildSensors(StatusService.statusData['m011'], 'm011');
        expect(subscribeSpy).toHaveBeenCalledWith('apchildtestsub1');
        expect(subscribeSpy).toHaveBeenCalledWith('apchildtestsub2');
        expect(subscribeSpy).toHaveBeenCalledWith('apchildtestsensor');
        expect(subscribeSpy).toHaveBeenCalledWith('aptestsensor');
        expect(subscribeSpy).toHaveBeenCalledWith('aptestsensor2');
        expect(subscribeSpy).toHaveBeenCalledWith('testsensor');
    });

    it('should not subscribe to sensors in the tree structure when there is no sensor attr', function() {
        var subscribeSpy = spyOn(MonitorService, 'subscribe');
        StatusService.statusData['m011'] = {
            name: 'm011',
            children: [{
                name: 'ap',
                subs: ['apchildtestsub1', 'apchildtestsub2']
            }]
        };
        ctrl.subscribeToChildSensors(StatusService.statusData['m011'], 'm011');
        expect(subscribeSpy).not.toHaveBeenCalledWith('');
    });

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
