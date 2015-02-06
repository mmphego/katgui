(function(){

    angular.module('katGui.scheduler')
        .controller('SubArraysCtrl', SubArraysCtrl);

    function SubArraysCtrl(ObservationScheduleService, $timeout, $mdDialog) {

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

            var itemsAssigned = [];

            vm.scheduleDraftData.forEach(function (item) {
               if (item.selected) {
                   item.selected = false;
                   subarray.scheduleBlocks.push(item);
                   itemsAssigned.push(item);
               }
            });

            itemsAssigned.forEach(function (item) {
                vm.scheduleDraftData.splice(vm.scheduleDraftData.indexOf(item), 1);
            });
        };

        vm.freeScheduleBlock = function (subarray, sb) {

            sb.sub_nr = null;

            subarray.scheduleBlocks.splice(subarray.scheduleBlocks.indexOf(sb), 1);
            var indexOfSB = vm.scheduleDraftData.indexOf(sb);
            if (indexOfSB === -1) {
                vm.scheduleDraftData.push(sb);
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

        function combineSubarraysInSingleList() {
            //ObservationScheduleService.subarrays.push({id:'5', state:'maintanence', scheduleBlocks: []});
            //ObservationScheduleService.subarrays.push({id:'6', state:'in_use', scheduleBlocks: []});

            vm.scheduleDraftData.forEach(function (item) {
               ObservationScheduleService.subarrays.forEach(function (subarray) {
                  if ((item.sub_nr || {}).toString() === subarray.id) {
                      if (!subarray.scheduleBlocks) {
                          subarray.scheduleBlocks = [];
                      }
                      subarray.scheduleBlocks.push(item);
                  }
               });
            });
        }

        $timeout(vm.refreshScheduleBlocks, 400);
    }

})();
