(function () {

    angular.module('katGui.scheduler')
        .controller('SubArrayObservationsDetail', SubArrayObservationsDetail);

    function SubArrayObservationsDetail($rootScope, $scope, $state, ObsSchedService, $stateParams, $mdDialog, $interval,
                                        NotifyService, KatGuiUtil, $localStorage) {

        var vm = this;

        vm.selectedSchedule = null;
        vm.scheduleData = ObsSchedService.scheduleData;
        vm.scheduleCompletedData = ObsSchedService.scheduleCompletedData;
        vm.observationSchedule = ObsSchedService.observationSchedule;
        vm.subarray = $scope.$parent.vm.subarray;
        $scope.subarray = vm.subarray;

        vm.showSchedSBDetails = $localStorage.showSchedSBDetails;
        vm.showCompletedSBs = $localStorage.showCompletedSBs;
        if (!angular.isDefined(vm.showSchedSBDetails)) {
            vm.showSchedSBDetails = true;
        }
        if (!angular.isDefined(vm.showCompletedSBs)) {
            vm.showCompletedSBs = true;
        }

        $scope.$watch('vm.showSchedSBDetails', function (newValue) {
            $localStorage.showSchedSBDetails = newValue;
        });

        $scope.$watch('vm.showCompletedSBs', function (newValue) {
            $localStorage.showCompletedSBs = newValue;
        });

        $scope.parent = $scope.$parent;
        vm.iAmAtLeastCA = $scope.$parent.vm.iAmAtLeastCA;

        vm.getCompletedScheduleBlocks = function () {
            if (vm.showCompletedSBs) {
                ObsSchedService.getCompletedScheduleBlocks(vm.subarray.id, 100);
            }
        };

        if (!$scope.$parent.vm.subarray) {
            $scope.$parent.vm.waitForSubarrayToExist().then(function (subarrayId) {
                vm.subarray = _.findWhere(ObsSchedService.subarrays, {id: subarrayId});
                $scope.subarray = vm.subarray;
                vm.getCompletedScheduleBlocks();
            });
        } else {
            vm.subarray = $scope.$parent.vm.subarray;
            $scope.subarray = vm.subarray;
            vm.getCompletedScheduleBlocks();
        }

        vm.completedFields = [
            {label: 'ID', value: 'id_code'},
            {label: 'Description', value: 'description'},
            {label: 'State', value: 'state'},
            {label: 'Outcome', value: 'outcome'},
            {label: 'Date', value: 'actual_end_time'},
            {label: 'State', value: 'state'},
            {label: 'Type', value: 'type'}
        ];

        vm.stateGo = function (state) {
            $state.go(state, {subarray_id: vm.subarray.id});
        };

        vm.setSelectedSchedule = function (selectedSchedule, dontDeselectOnSame) {
            if (vm.selectedSchedule === selectedSchedule && !dontDeselectOnSame) {
                vm.selectedSchedule = null;
            } else {
                vm.selectedSchedule = selectedSchedule;
            }
        };

        vm.freeSubarray = function () {
            ObsSchedService.freeSubarray(vm.subarray.id);
        };

        vm.activateSubarray = function () {
            ObsSchedService.activateSubarray(vm.subarray.id)
                .then(function (result) {
                    var splitMessage = result.data.result.split(' ');
                    var message = KatGuiUtil.sanitizeKATCPMessage(result.data.result);
                    if (splitMessage.length > 2 && splitMessage[1] !== 'ok') {
                        NotifyService.showPreDialog('Error activating subarray', message);
                    } else {
                        NotifyService.showSimpleToast(result.data.result);
                    }
                    vm.subarray.showProgress = false;
                }, function (error) {
                    NotifyService.showSimpleDialog('Could not activate Subarray', error.data.result);
                    vm.subarray.showProgress = false;
                });
        };

        vm.isResourceInMaintenance = function (resource) {
            resource.maintenance = ObsSchedService.resources_in_maintenance.indexOf(resource.name) !== -1;
            return resource.maintenance;
        };

        vm.isResourceFaulty = function (resource) {
            resource.faulty = ObsSchedService.resources_faulty.indexOf(resource.name) !== -1;
            return resource.faulty;
        };

        vm.setSubarrayMaintenance = function (maintenance) {
            ObsSchedService.setSubarrayMaintenance(vm.subarray.id, maintenance ? 'set' : 'clear');
        };

        $scope.$on('$destroy', function () {
            if (vm.progressInterval) {
                $interval.cancel(vm.progressInterval);
            }
            if (vm.unbindDelegateWatch) {
                vm.unbindDelegateWatch();
            }
        });
    }
})();
