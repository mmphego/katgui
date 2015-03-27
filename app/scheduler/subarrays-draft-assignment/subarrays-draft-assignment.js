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

        /* istanbul ignore next */
        //can ignore for now, is tested in another test and will change with the menu in angular material 0.10grunt te
        vm.scheduleCurrentMenuItemDraft = function () {
            if (vm.currentActionsMenuIndex > -1) {
                var sb = ObservationScheduleService.scheduleDraftData[vm.currentActionsMenuIndex];
                ObservationScheduleService.scheduleDraft(sb.sub_nr, sb.id_code)
                    .then($rootScope.displayPromiseResult);
            }
        };

        /* istanbul ignore next */
        //can ignore for now, is tested in another test and will change with the menu in angular material 0.10
        vm.verifyCurrentMenuItemDraft = function () {
            if (vm.currentActionsMenuIndex > -1) {
                var sb = ObservationScheduleService.scheduleDraftData[vm.currentActionsMenuIndex];
                ObservationScheduleService.verifyScheduleBlock(sb.sub_nr, sb.id_code)
                    .then($rootScope.displayPromiseResult);
            }
        };

        /* istanbul ignore next */
        //can ignore for now, is tested in another test and will change with the menu in angular material 0.10
        vm.viewSBTasklog = function () {
            var sb = ObservationScheduleService.scheduleDraftData[vm.currentActionsMenuIndex];
            ObservationScheduleService.viewTaskLogForSBIdCode(sb.id_code);
            vm.closeActionsMenu();
        };

        /* istanbul ignore next */
        //we can ignore this because it will be replaced by the menu in angular material 0.10
        vm.openSchedulerActionsMenu = function (item, $event) {
            var rowIndex = ObservationScheduleService.scheduleDraftData.indexOf(item);
            if (vm.currentActionsMenuIndex !== rowIndex) {
                var rect = $event.currentTarget.getBoundingClientRect();
                var offset = {x: 0, y: 44};
                var overLayCSS = {
                    left: rect.left + offset.x + 'px',
                    top: rect.top + offset.y + 'px'
                };
                angular.element(document.getElementById('schedulerActionsMenu')).css(overLayCSS);
                vm.currentActionsMenuIndex = ObservationScheduleService.scheduleDraftData.indexOf(ObservationScheduleService.scheduleDraftData[rowIndex]);
                vm.showVerifyMenuItem = item.type === "OBSERVATION";
                vm.showActionsMenu = true;
            } else {
                //the same row's button was clicked, so close the popup
                vm.closeActionsMenu();
            }
            $event.stopPropagation();
        };

        /* istanbul ignore next */
        //we can ignore this because it will be replaced by the menu in angular material 0.10
        vm.closeActionsMenu = function () {
            if (vm.showActionsMenu) {
                vm.showActionsMenu = false;
                vm.currentActionsMenuIndex = -1;

                if (!$scope.$$phase) {
                    $scope.$digest();
                }
            }
        };

        vm.navigateToSchedulerDetails = function (subarray_id) {
            $state.go('scheduler.observations.detail', {subarray_id: subarray_id});
        };

        vm.refreshScheduleBlocks();
    }
})();
