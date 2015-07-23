(function () {

    angular.module('katGui.scheduler')
        .controller('SubArraysCtrl', SubArraysCtrl);

    function SubArraysCtrl(ObsSchedService, $scope, $state, $stateParams) {

        var vm = this;
        if ($stateParams.subarray_id) {
            vm.subarray_id = parseInt($stateParams.subarray_id);
        } else {
            vm.subarray_id = null;
        }
        vm.currentActionsMenuIndex = -1;
        vm.showVerifyMenuItem = false;
        vm.scheduleDraftData = ObsSchedService.scheduleDraftData;
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
            vm.limitTo += 10;
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

        vm.navigateToSchedulerDetails = function (subarray_id) {
            $state.go('scheduler.observations.detail', {subarray_id: subarray_id});
        };
    }
})();
