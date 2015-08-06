(function () {

    angular.module('katGui.scheduler')
        .controller('SubArraysCtrl', SubArraysCtrl);

    function SubArraysCtrl($rootScope, ObsSchedService, $scope, $state, $stateParams) {

        var vm = this;
        vm.checkCASubarrays = function () {
            for (var i = 0; i < ObsSchedService.subarrays.length; i++) {
                if (ObsSchedService.subarrays[i]['delegated_ca'] === $rootScope.currentUser.email &&
                    $stateParams.subarray_id === ObsSchedService.subarrays[i].id) {
                    vm.subarray_id = parseInt(ObsSchedService.subarrays[i].id);
                }
            }
        };

        if ($stateParams.subarray_id !== '' && $rootScope.iAmLO) {
            vm.subarray_id = parseInt($stateParams.subarray_id);
        } else {
            vm.checkCASubarrays();
        }
        if (!vm.subarray_id) {
            $state.go('scheduler');
        }
        vm.unbindIAmCA = $rootScope.$watch('iAmCA', function () {
            vm.checkCASubarrays();
        });
        vm.currentActionsMenuIndex = -1;
        vm.showVerifyMenuItem = false;
        vm.scheduleDraftData = ObsSchedService.scheduleDraftData;
        vm.scheduleData = ObsSchedService.scheduleData;
        vm.subarrays = ObsSchedService.subarrays;

        vm.draftsOrderByFields = [
            {label: 'ID', value: 'id_code'},
            {label: 'Description', value: 'description'},
            {label: 'Date', value: 'desired_start_time'},
            {label: 'State', value: 'state'},
            {label: 'Type', value: 'type'}
        ];

        vm.limitTo = 5;
        $scope.loadMore = function() {
            vm.limitTo += 30;
        };

        vm.assignSelectedScheduleBlocks = function (subarray) {
            ObsSchedService.scheduleDraftData.forEach(function (item) {
                if (item.selected) {
                    item.selected = false;
                    ObsSchedService.assignScheduleBlock(subarray.id, item.id_code);
                }
            });
        };

        vm.freeScheduleBlock = function (subarray, sb) {
            ObsSchedService.unassignScheduleBlock(subarray.id, sb.id_code);
        };

        vm.scheduleDraft = function (sb) {
            ObsSchedService.scheduleDraft(sb.sub_nr, sb.id_code);
        };

        vm.verifyDraft = function (sb) {
            ObsSchedService.verifyScheduleBlock(sb.sub_nr, sb.id_code);
        };

        vm.viewSBTasklog = function (sb) {
            ObsSchedService.viewTaskLogForSBIdCode(sb.id_code);
        };

        vm.removeDraft = function (item) {
            ObsSchedService.deleteScheduleDraft(item.id_code)
                .success(function (result) {
                    $log.info(result);
                })
                .error(function (result) {
                    NotifyService.showSimpleDialog('Error Deleteing SB ' + item.id_code + '.', result);
                });
        };

        vm.navigateToSchedulerDetails = function (subarray_id) {
            $state.go('scheduler.observations.detail', {subarray_id: subarray_id});
        };
    }
})();
