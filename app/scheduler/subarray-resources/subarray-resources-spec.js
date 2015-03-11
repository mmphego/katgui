describe('Subarray Resources Controller', function () {

    beforeEach(module('katGui.scheduler'));
    beforeEach(module('ui.router'));

    var scope, ctrl, state, ObservationScheduleService, q, timeout;

    beforeEach(inject(function ($rootScope, $controller, _ObservationScheduleService_, _SCHEDULE_BLOCK_TYPES_, $q, $timeout, $state) {
        q = $q;
        state = $state;
        timeout = $timeout;
        scope = $rootScope.$new();
        ObservationScheduleService = _ObservationScheduleService_;
        ObservationScheduleService.connectListener = function () {};
        ObservationScheduleService.disconnectListener = function () {};
        ctrl = $controller('SubArrayResourcesCtrl', {
            $rootScope: $rootScope, $scope: scope, $state: state,
            ObservationScheduleService: ObservationScheduleService
        });

        $rootScope.showSimpleDialog = function () {};
        $rootScope.showSimpleToast = function() {};
        $rootScope.displayPromiseResult = function() {};
        ctrl.poolResourcesFree = [{name:'anc', state:'ok', sub_nr:'free'}, {name:'m011', state:'ok', sub_nr:'free'}, {name:'m022', state:'ok', sub_nr:'free'}, {name:'m033', state:'ok', sub_nr:'free'}];
    }));

    it('should init the variables', function() {
        expect(ctrl.subarrays).toBeDefined();
        expect(ctrl.poolResourcesFree).toBeDefined();
        expect(ctrl.poolResources).toBeDefined();
    });

    it('should load the subarrays and resources', function() {
        var deferred = q.defer();
        var listSubarraysSpy = spyOn(ObservationScheduleService, "listSubarrays").and.returnValue(deferred.promise);
        var listPoolResourcesSpy = spyOn(ObservationScheduleService, "listPoolResources");
        ctrl.refreshResources();
        expect(listSubarraysSpy).toHaveBeenCalled();
        deferred.resolve();
        scope.$digest();
        expect(listPoolResourcesSpy).toHaveBeenCalled();
    });

    it('should assign the selected resources, call the service function and display the result', function() {
        var deferred = q.defer();
        var assignResourcesToSubarraySpy = spyOn(ObservationScheduleService, "assignResourcesToSubarray").and.returnValue(deferred.promise);
        var displayPromiseSpy = spyOn(scope.$root, "displayPromiseResult");
        ctrl.poolResourcesFree[0].selected = true;
        ctrl.poolResourcesFree[1].selected = true;
        ctrl.assignSelectedResources({id: 1});
        expect(assignResourcesToSubarraySpy).toHaveBeenCalledWith(1, ctrl.poolResourcesFree[0].name + ',' + ctrl.poolResourcesFree[1].name);
        deferred.resolve();
        scope.$digest();
        expect(displayPromiseSpy).toHaveBeenCalled();
    });

    it('should call the service function to free an assigned resource', function() {
        var deferred = q.defer();
        var unassignResourcesFromSubarraySpy = spyOn(ObservationScheduleService, "unassignResourcesFromSubarray").and.returnValue(deferred.promise);
        var displayPromiseSpy = spyOn(scope.$root, "displayPromiseResult");
        ctrl.freeAssignedResource({id: 1}, {name: ctrl.poolResourcesFree[0].name});
        expect(unassignResourcesFromSubarraySpy).toHaveBeenCalledWith(1, ctrl.poolResourcesFree[0].name);
        deferred.resolve();
        scope.$digest();
        expect(displayPromiseSpy).toHaveBeenCalled();
    });

    it('should call the service function to free a subarray', function() {
        var deferred = q.defer();
        var freeSubarraySpy = spyOn(ObservationScheduleService, "freeSubarray").and.returnValue(deferred.promise);
        var refreshResourcesSpy = spyOn(ctrl, "refreshResources");
        ctrl.freeSubarray({id: 1});
        expect(freeSubarraySpy).toHaveBeenCalledWith(1);
        deferred.resolve();
        scope.$digest();
        expect(refreshResourcesSpy).toHaveBeenCalled();
    });

    it('should call the service function to set the subarray in use', function() {
        var deferred = q.defer();
        var setSubarrayInUseSpy = spyOn(ObservationScheduleService, "setSubarrayInUse").and.returnValue(deferred.promise);
        var displayPromiseSpy = spyOn(scope.$root, "displayPromiseResult");
        ctrl.setSubarrayInUse({id: 1, state: 'in_use'});
        expect(setSubarrayInUseSpy).toHaveBeenCalledWith(1, 0);
        ctrl.setSubarrayInUse({id: 1, state: 'free'});
        expect(setSubarrayInUseSpy).toHaveBeenCalledWith(1, 1);
        deferred.resolve();
        scope.$digest();
        expect(displayPromiseSpy).toHaveBeenCalled();
    });

    it('should call the service function to set the subarray in maintenance', function() {
        var deferred = q.defer();
        var setSubarrayMaintenanceSpy = spyOn(ObservationScheduleService, "setSubarrayMaintenance").and.returnValue(deferred.promise);
        var displayPromiseSpy = spyOn(scope.$root, "displayPromiseResult");
        ctrl.setSubarrayInMaintenance({id: 1, in_maintenance: true});
        expect(setSubarrayMaintenanceSpy).toHaveBeenCalledWith(1, 0);
        ctrl.setSubarrayInMaintenance({id: 1, in_maintenance: false});
        expect(setSubarrayMaintenanceSpy).toHaveBeenCalledWith(1, 1);
        deferred.resolve();
        scope.$digest();
        expect(displayPromiseSpy).toHaveBeenCalled();
    });

    it('should call the service function to mark the resource as faulty', function() {
        var deferred = q.defer();
        var markResourceFaultySpy = spyOn(ObservationScheduleService, "markResourceFaulty").and.returnValue(deferred.promise);
        var displayPromiseSpy = spyOn(scope.$root, "displayPromiseResult");
        ctrl.markResourceFaulty({name: 'anc', state: 'faulty'});
        expect(markResourceFaultySpy).toHaveBeenCalledWith('anc', 0);
        ctrl.markResourceFaulty({name: 'anc', state: 'ok'});
        expect(markResourceFaultySpy).toHaveBeenCalledWith('anc', 1);
        deferred.resolve();
        scope.$digest();
        expect(displayPromiseSpy).toHaveBeenCalled();
    });

    it('should call the service function to mark the resource as in maintenance', function() {
        var deferred = q.defer();
        var markResourceInMaintenanceSpy = spyOn(ObservationScheduleService, "markResourceInMaintenance").and.returnValue(deferred.promise);
        var displayPromiseSpy = spyOn(scope.$root, "displayPromiseResult");
        ctrl.markResourceInMaintenance({name: 'anc', in_maintenance: true});
        expect(markResourceInMaintenanceSpy).toHaveBeenCalledWith('anc', 0);
        ctrl.markResourceInMaintenance({name: 'anc', in_maintenance: false});
        expect(markResourceInMaintenanceSpy).toHaveBeenCalledWith('anc', 1);
        deferred.resolve();
        scope.$digest();
        expect(displayPromiseSpy).toHaveBeenCalled();
    });

    it('should navigate to scheduler details', function() {
        var stateSpy = spyOn(state, 'go');
        ctrl.navigateToSchedulerDetails(1);
        expect(stateSpy).toHaveBeenCalledWith('scheduler.observations.detail', {subarray_id: 1});
    });

    it('should unbind watchers', inject(function () {
        var unbindShortcutsSpy = spyOn(ctrl, "unbindShortcuts");
        scope.$emit("$destroy");
        scope.$digest();
        expect(unbindShortcutsSpy).toHaveBeenCalledWith('keydown');
    }));

    it('should clear selection when pressing escape', inject(function () {
        ObservationScheduleService.poolResourcesFree = ctrl.poolResourcesFree;
        ctrl.poolResourcesFree[0].selected = true;
        ctrl.poolResourcesFree[1].selected = false;
        ctrl.poolResourcesFree[2].selected = true;
        ctrl.poolResourcesFree[3].selected = false;
        scope.$root.$broadcast('keydown', 27);
        expect(ctrl.poolResourcesFree[0].selected).toBeFalsy();
        expect(ctrl.poolResourcesFree[1].selected).toBeFalsy();
        expect(ctrl.poolResourcesFree[2].selected).toBeFalsy();
        expect(ctrl.poolResourcesFree[3].selected).toBeFalsy();
    }));

    it('should do nothing on a random keypress', inject(function () {
        ctrl.poolResourcesFree[0].selected = true;
        ctrl.poolResourcesFree[1].selected = false;
        ctrl.poolResourcesFree[2].selected = true;
        ctrl.poolResourcesFree[3].selected = false;
        scope.$root.$broadcast('keydown', -1);
        scope.$root.$broadcast('keydown', 28);
        scope.$root.$broadcast('keydown', 40);
        expect(ctrl.poolResourcesFree[0].selected).toBeTruthy();
        expect(ctrl.poolResourcesFree[1].selected).toBeFalsy();
        expect(ctrl.poolResourcesFree[2].selected).toBeTruthy();
        expect(ctrl.poolResourcesFree[3].selected).toBeFalsy();
    }));
});
