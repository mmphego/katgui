(function () {

    angular.module('katGui.scheduler')
        .controller('SubArraysCtrl', SubArraysCtrl);

    function SubArraysCtrl(ObservationScheduleService, $timeout, $mdDialog, $rootScope, $filter) {

        var lastId = 7;
        var vm = this;
        vm.scheduleDraftData = ObservationScheduleService.scheduleDraftData;
        vm.subarrays = ObservationScheduleService.subarrays;

        vm.refreshScheduleBlocks = function () {
            ObservationScheduleService.getScheduleBlocks()
                .then(draftListProcessingComplete, draftListProcessingError);

            ObservationScheduleService.listSubarrays()
                .then(subarraysProcessingComplete, subarraysProcessingError)
                .then(combineSubarraysInSingleList);
        };

        vm.assignSelectedScheduleBlocks = function (subarray) {

            vm.scheduleDraftData.forEach(function (item) {
                if (item.selected) {
                    item.selected = false;
                    ObservationScheduleService.assignScheduleBlock(subarray.id, item.id_code)
                        .then(function (result) {
                            if (result.result === 'ok') {
                                item.selected = false;
                                item.sub_nr = subarray.id;
                                subarray.scheduleBlocks.push(item);
                                result.message = "Assigned Schedule Block to subarray " + subarray.id;
                            }
                            displayPromiseResult(result);
                        });
                }
            });
        };

        vm.freeScheduleBlock = function (subarray, sb) {

            ObservationScheduleService.unassignScheduleBlock(subarray.id, sb.id_code)
                .then(function (result) {
                    if (result.result === 'ok') {
                        sb.sub_nr = null;
                        subarray.scheduleBlocks.splice(subarray.scheduleBlocks.indexOf(sb), 1);
                        //ObservationScheduleService.scheduleDraftData.push(sb);
                        result.message = "Unassigned Schedule Block from subarray " + subarray.id;
                    }
                    displayPromiseResult(result);
                });
        };

        vm.showScheduleBlockDetails = function (sb) {
            //showSimpleDialog('Schedule Block Details', JSON.stringify(sb, null, 4));
            alert(JSON.stringify(sb, null, 4));
        };

        function displayPromiseResult(result) {
            if (result.result === 'ok') {
                $rootScope.showSimpleToast(result.message);
            } else {
                showSimpleDialog(result.result, result.message);
            }
        }

        function showSimpleDialog(title, message) {
            var alert = $mdDialog.alert()
                .title(title)
                .content(message)
                .ok('Close');
            $mdDialog
                .show(alert)
                .finally(function () {
                    alert = undefined;
                });
        }

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

        function combineSubarraysInSingleList() {
            //ObservationScheduleService.subarrays.push({id:'5', state:'maintanence', scheduleBlocks: []});
            //ObservationScheduleService.subarrays.push({id:'6', state:'in_use', scheduleBlocks: []});

            vm.scheduleDraftData.forEach(function (item) {
                ObservationScheduleService.subarrays.forEach(function (subarray) {
                    if (!subarray.scheduleBlocks) {
                        subarray.scheduleBlocks = [];
                    }
                    if ((item.sub_nr || {}).toString() === subarray.id) {
                        subarray.scheduleBlocks.push(item);
                    }
                });
            });
        }

        $timeout(vm.refreshScheduleBlocks, 400);
    }

})();
