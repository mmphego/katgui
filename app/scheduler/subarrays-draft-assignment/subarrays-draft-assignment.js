(function () {

    angular.module('katGui.scheduler')
        .controller('SubArraysCtrl', SubArraysCtrl);

    function SubArraysCtrl(ObsSchedService, $timeout, $rootScope, $scope, $state) {

        var vm = this;
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

        vm.refreshScheduleBlocks = function () {
            ObsSchedService.listSubarrays()
                .then(function () {
                    ObsSchedService.getScheduleBlocks();
                });
        };

        vm.assignSelectedScheduleBlocks = function (subarray) {
            //todo fix this to send a list of schedule blocks to subarray
            var timeout = 0;
            ObsSchedService.scheduleDraftData.forEach(function (item) {
                if (item.selected) {
                    item.selected = false;
                    $timeout(function () {
                        ObsSchedService.assignScheduleBlock(subarray.id, item.id_code)
                            .then($rootScope.displayPromiseResult);
                    }, timeout);
                    timeout += 50;
                }
            });
        };

        vm.freeScheduleBlock = function (subarray, sb) {
            ObsSchedService.unassignScheduleBlock(subarray.id, sb.id_code)
                .then($rootScope.displayPromiseResult);
        };

        vm.scheduleDraft = function (sb) {
            ObsSchedService.scheduleDraft(sb.sub_nr, sb.id_code)
                .then($rootScope.displayPromiseResult);
        };

        vm.verifyDraft = function (sb) {
            ObsSchedService.verifyScheduleBlock(sb.sub_nr, sb.id_code)
                .then($rootScope.displayPromiseResult);
        };

        vm.viewSBTasklog = function (sb) {
            ObsSchedService.viewTaskLogForSBIdCode(sb.id_code);
        };

        vm.navigateToSchedulerDetails = function (subarray_id) {
            $state.go('scheduler.observations.detail', {subarray_id: subarray_id});
        };

        vm.refreshScheduleBlocks();
    }
})();
