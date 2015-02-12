(function () {

    angular.module('katGui.scheduler')
        .controller('SubArraysCtrl', SubArraysCtrl);

    function SubArraysCtrl(ObservationScheduleService, $timeout, $mdDialog, $rootScope, $scope) {

        var vm = this;
        vm.currentActionsMenuIndex = -1;
        vm.showVerifyMenuItem = false;
        vm.scheduleDraftData = ObservationScheduleService.scheduleDraftData;
        vm.subarrays = ObservationScheduleService.subarrays;

        vm.refreshScheduleBlocks = function () {

            ObservationScheduleService.listSubarrays()
                .then(function () {
                    ObservationScheduleService.getScheduleBlocks();
                });
        };

        vm.assignSelectedScheduleBlocks = function (subarray) {

            ObservationScheduleService.scheduleDraftData.forEach(function (item) {
                if (item.selected) {
                    item.selected = false;
                    ObservationScheduleService.assignScheduleBlock(subarray.id, item.id_code)
                        .then($rootScope.displayPromiseResult);
                }
            });
        };

        vm.freeScheduleBlock = function (subarray, sb) {

            ObservationScheduleService.unassignScheduleBlock(subarray.id, sb.id_code)
                .then($rootScope.displayPromiseResult);
        };

        vm.showScheduleBlockDetails = function (sb) {
            //showSimpleDialog('Schedule Block Details', JSON.stringify(sb, null, 4));
            alert(JSON.stringify(sb, null, 4));
        };

        vm.scheduleCurrentMenuItemDraft = function () {
            if (vm.currentActionsMenuIndex > -1) {
                var sb = ObservationScheduleService.scheduleDraftData[vm.currentActionsMenuIndex];
                ObservationScheduleService.scheduleDraft(sb.sub_nr, sb.id_code)
                    .then($rootScope.displayPromiseResult);
            }
        };

        vm.verifyCurrentMenuItemDraft = function () {
            if (vm.currentActionsMenuIndex > -1) {
                var sb = ObservationScheduleService.scheduleDraftData[vm.currentActionsMenuIndex];
                ObservationScheduleService.verifyScheduleBlock(sb.sub_nr, sb.id_code)
                    .then($rootScope.displayPromiseResult);
            }
        };

        //schedulerActionsMenu
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

        vm.closeActionsMenu = function() {
            if (vm.showActionsMenu) {
                vm.showActionsMenu = false;
                vm.currentActionsMenuIndex = -1;

                if (!$scope.$$phase) {
                    $scope.$digest();
                }
            }
        };

        function draftListProcessingComplete(result) {
            $timeout(function () {
                //vm.draftListProcessingServerCall = false;
            }, 100);
        }

        function draftListProcessingError(result) {
            $timeout(function () {
                //vm.draftListProcessingServerCall = false;

                var alert = $mdDialog.alert()
                    .title('Server Request Failed!')
                    .content(result)
                    .ok('Close');
                $mdDialog
                    .show(alert)
                    .finally(function () {
                        alert = undefined;
                    });
            }, 100);
        }

        function subarraysProcessingComplete(result) {
            $timeout(function () {

            }, 100);
        }

        function subarraysProcessingError(result) {
            $timeout(function () {
                //vm.draftListProcessingServerCall = false;

                var alert = $mdDialog.alert()
                    .title('Server Request Failed!')
                    .content(result)
                    .ok('Close');
                $mdDialog
                    .show(alert)
                    .finally(function () {
                        alert = undefined;
                    });
            }, 100);
        }

        $timeout(vm.refreshScheduleBlocks, 400);
    }

})();
