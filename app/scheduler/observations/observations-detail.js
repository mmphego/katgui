(function () {

    angular.module('katGui.scheduler')
        .controller('SubArrayObservationsDetail', SubArrayObservationsDetail);

    function SubArrayObservationsDetail(ObservationScheduleService, $stateParams, $scope, $rootScope) {

        var vm = this;
        vm.subarray_id = parseInt($stateParams.subarray_id);
        vm.draftListProcessingServerCall = false;
        vm.scheduleListProcessingServerCall = false;
        vm.selectedSchedule = null;
        vm.showEditMenu = false;
        vm.modeTypes = ['queue', 'manual'];

        vm.scheduleCompletedData = ObservationScheduleService.scheduleCompletedData;
        vm.scheduleData = ObservationScheduleService.scheduleData;
        vm.poolResources = ObservationScheduleService.poolResources;
        vm.allocations = ObservationScheduleService.allocations;
        vm.schedulerModes = ObservationScheduleService.schedulerModes;

        vm.completedOrderByFields = [
            {label: 'ID', value: 'id_code'},
            {label: 'Description', value: 'description'},
            {label: 'Date', value: 'desired_start_time'},
            {label: 'State', value: 'state'},
            {label: 'Type', value: 'type'}
        ];

        vm.refreshScheduleBlocks = function () {
            ObservationScheduleService.getScheduleBlocks()
                .then(ObservationScheduleService.getScheduleBlocksFinished)
                .then(ObservationScheduleService.listPoolResources)
                .then(function () {
                    ObservationScheduleService.listAllocationsForSubarray(vm.subarray_id)
                        .then(function() {
                            ObservationScheduleService.getSchedulerModeForSubarray(vm.subarray_id)
                                .then(function() {
                                    vm.selectedMode = ObservationScheduleService.schedulerModes[vm.subarray_id];
                                    if (ObservationScheduleService.subarrays.length === 0) {
                                        ObservationScheduleService.listSubarrays()
                                            .then(function() {
                                                vm.subarray = _.findWhere(ObservationScheduleService.subarrays, {id: vm.subarray_id.toString()});
                                            });
                                    } else {
                                        vm.subarray = _.findWhere(ObservationScheduleService.subarrays, {id: vm.subarray_id.toString()});
                                    }
                                });
                        });
                });
        };

        vm.executeSchedule = function (item) {
            ObservationScheduleService.executeSchedule(vm.subarray_id, item.id_code)
                .then($rootScope.displayPromiseResult);
        };

        vm.stopExecuteSchedule = function (item) {
            ObservationScheduleService.cancelExecuteSchedule(vm.subarray_id, item.id_code)
                .then($rootScope.displayPromiseResult);
        };

        vm.cloneSchedule = function (item) {
            ObservationScheduleService.cloneSchedule(item.id_code)
                .then($rootScope.displayPromiseResult);
        };

        vm.moveScheduleRowToFinished = function (item) {
            vm.selectedSchedule = null;
            ObservationScheduleService.scheduleToComplete(vm.subarray_id, item.id_code)
                .then($rootScope.displayPromiseResult);
        };

        vm.moveScheduleRowToDraft = function (item) {
            vm.selectedSchedule = null;
            ObservationScheduleService.scheduleToDraft(vm.subarray_id, item.id_code)
                .then($rootScope.displayPromiseResult);
        };

        vm.setCompletedOrderBy = function (column, reverse) {
            var newOrderBy = _.findWhere(vm.completedOrderByFields, {value: column});
            if ((vm.completedOrderBy || {}).value === column) {
                if (newOrderBy.reverse === undefined) {
                    newOrderBy.reverse = true;
                } else if (newOrderBy.reverse) {
                    newOrderBy.reverse = undefined;
                    newOrderBy = null;
                }
            }
            vm.completedOrderBy = newOrderBy;
        };

        vm.setCompletedOrderBy('id_code', true);

        vm.setSelectedSchedule = function (selectedSchedule, dontDeselectOnSame) {
            if (vm.selectedSchedule === selectedSchedule && !dontDeselectOnSame) {
                vm.selectedSchedule = null;
            } else {
                vm.selectedSchedule = selectedSchedule;
            }
        };

        vm.markResourceFaulty = function (resource) {
            ObservationScheduleService.markResourceFaulty(vm.subarray_id, resource.name, resource.state === 'faulty' ? 0 : 1)
                .then($rootScope.displayPromiseResult);
        };

        vm.schedulerModeChanged = function () {
            ObservationScheduleService.setSchedulerModeForSubarray(vm.subarray_id, vm.selectedMode)
                .then($rootScope.displayPromiseResult);
        };

        //going to be replaced with angular material 0.10
        vm.openSchedulerEditMenu = function (item, $event) {
            var rowIndex = vm.currentScheduleData.indexOf(item);
            if (vm.currentEditMenuIndex !== rowIndex) {
                vm.setSelectedSchedule(vm.currentScheduleData[rowIndex], true);
                var rect = $event.currentTarget.getBoundingClientRect();
                var offset = {x: 0, y: 32};
                var overLayCSS = {
                    left: rect.left + offset.x + 'px',
                    top: rect.top + offset.y + 'px'
                };
                angular.element(document.getElementById('schedulerEditMenu')).css(overLayCSS);
                vm.currentEditMenuIndex = vm.currentScheduleData.indexOf(vm.currentScheduleData[rowIndex]);
                vm.showEditMenu = true;
            } else {
                //the same row's button was clicked, so close the popup
                vm.closeEditMenu();
            }
            $event.stopPropagation();
        };

        //going to be replaced with angular material 0.10
        vm.closeEditMenu = function() {
            if (vm.showEditMenu) {
                vm.showEditMenu = false;
                vm.currentEditMenuIndex = -1;
            }
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        };

        //going to be replaced with angular material 0.10
        vm.moveSelectedSBToDraft = function() {
            if (vm.selectedSchedule) {
                vm.moveScheduleRowToDraft(vm.selectedSchedule);
            }
            vm.closeEditMenu();
        };

        //going to be replaced with angular material 0.10
        vm.viewSelectedSBTaskLog = function() {
            /* istanbul ignore else */
            if (vm.selectedSchedule) {
                ObservationScheduleService.viewTaskLogForSBIdCode(vm.selectedSchedule.id_code);
            }
            vm.closeEditMenu();
        };

        //going to be replaced with angular material 0.10
        vm.moveSelectedSBToFinished = function() {
            if (vm.selectedSchedule) {
                vm.moveScheduleRowToFinished(vm.selectedSchedule);
            }
            vm.closeEditMenu();
        };

        vm.verifySelectedRow = function () {
            if (vm.selectedSchedule) {
                ObservationScheduleService.verifyScheduleBlock(vm.subarray_id, vm.selectedSchedule.id_code)
                    .then($rootScope.displayPromiseResult);
            }
            vm.closeEditMenu();
        };

        vm.unbindShortcuts = $rootScope.$on("keydown", function (e, key) {
            if (key === 40) {
                //down arrow
                var index = vm.currentScheduleData.indexOf(vm.selectedSchedule);
                if (index > -1 && index + 1 < vm.currentScheduleData.length) {
                    vm.setSelectedSchedule(vm.currentScheduleData[index + 1]);
                } else if (vm.currentScheduleData.length > 0) {
                    vm.setSelectedSchedule(vm.currentScheduleData[0]);
                }

            } else if (key === 38) {
                //up arrow
                var indexUp = vm.currentScheduleData.indexOf(vm.selectedSchedule);
                if (indexUp > -1 && indexUp - 1 > -1) {
                    //filteredDraftItems
                    vm.setSelectedSchedule(vm.currentScheduleData[indexUp - 1]);
                } else if (vm.currentScheduleData.length > 0) {
                    vm.setSelectedSchedule(vm.currentScheduleData[vm.currentScheduleData.length - 1]);
                }
            } else if (key === 27) {
                //escape
                vm.selectedSchedule = null;
            }
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        });

        $scope.$on('$destroy', function () {
            vm.unbindShortcuts('keydown');
        });

        vm.refreshScheduleBlocks();
    }
})();
