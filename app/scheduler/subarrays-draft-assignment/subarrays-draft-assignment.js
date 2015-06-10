(function () {

    angular.module('katGui.scheduler')
        .controller('SubArraysCtrl', SubArraysCtrl);

    function SubArraysCtrl(ObservationScheduleService, $timeout, $rootScope, $scope, $state) {

        var vm = this;
        vm.currentActionsMenuIndex = -1;
        vm.showVerifyMenuItem = false;
        vm.scheduleDraftData = ObservationScheduleService.scheduleDraftData;
        vm.subarrays = ObservationScheduleService.subarrays;

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
            ObservationScheduleService.listSubarrays()
                .then(function () {
                    ObservationScheduleService.getScheduleBlocks();
                });
        };

        vm.assignSelectedScheduleBlocks = function (subarray) {
            //todo fix this to send a list of schedule blocks to subarray
            var timeout = 0;
            ObservationScheduleService.scheduleDraftData.forEach(function (item) {
                if (item.selected) {
                    item.selected = false;
                    $timeout(function () {
                        ObservationScheduleService.assignScheduleBlock(subarray.id, item.id_code)
                            .then($rootScope.displayPromiseResult);
                    }, timeout);
                    timeout += 50;
                }
            });
        };

        vm.freeScheduleBlock = function (subarray, sb) {
            ObservationScheduleService.unassignScheduleBlock(subarray.id, sb.id_code)
                .then($rootScope.displayPromiseResult);
        };

        vm.scheduleDraft = function (sb) {
            ObservationScheduleService.scheduleDraft(sb.sub_nr, sb.id_code)
                .then($rootScope.displayPromiseResult);
        };

        vm.verifyDraft = function (sb) {
            ObservationScheduleService.verifyScheduleBlock(sb.sub_nr, sb.id_code)
                .then($rootScope.displayPromiseResult);
        };

        vm.viewSBTasklog = function (sb) {
            ObservationScheduleService.viewTaskLogForSBIdCode(sb.id_code);
        };

        vm.navigateToSchedulerDetails = function (subarray_id) {
            $state.go('scheduler.observations.detail', {subarray_id: subarray_id});
        };

        vm.refreshScheduleBlocks();
    }
})();
