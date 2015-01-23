(function(){

    angular.module('katGui.scheduler')
        .controller('SubArraysCtrl', SubArraysCtrl);

    function SubArraysCtrl($scope, ObservationScheduleService, $timeout, $mdDialog) {

        var vm = this;
        vm.scheduleDraftData = ObservationScheduleService.scheduleDraftData;

        vm.subarrays = [];
        //[{
        //    id: '1',
        //    name: 'All of them',
        //    description: 'some description of the subarray 1',
        //    scheduleBlocks: []
        //}, {
        //    id: '2',
        //    name: 'Maintenance',
        //    description: 'This array is used for maintenance tasks, This array is used for maintenance tasks, This array is used for maintenance tasks, This array is used for maintenance tasks, This array is used for maintenance tasks, This array is used for maintenance tasks, This array is used for maintenance tasks, This array is used for maintenance tasks, This array is used for maintenance tasks',
        //    scheduleBlocks: []
        //}];

        vm.refreshScheduleBlocks = function () {
            ObservationScheduleService.getScheduleBlocks()
                .then(draftListProcessingComplete, draftListProcessingError);

            ObservationScheduleService.listSubArraysByState('free')
                .then(subarraysProcessingComplete, subarraysProcessingError)
                .then(function () {
                    ObservationScheduleService.listSubArraysByState('in_use')
                        .then(subarraysProcessingComplete, subarraysProcessingError)
                        .then(function () {
                            ObservationScheduleService.listSubArraysByState('maintenance')
                                .then(subarraysProcessingComplete, subarraysProcessingError)
                                .then(combineSubarraysInSingleList);
                        });
                });
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
            //ObservationScheduleService.subarraysInUse.push('5');
            //ObservationScheduleService.subarraysMaintenance.push('6');
            vm.subarrays.splice(0, vm.subarrays.length);
            ObservationScheduleService.subarraysFree.forEach(function (item){
                if (item) {
                    vm.subarrays.push({
                        id: parseInt(item),
                        scheduleBlocks: [],
                        state: 'free'
                    });
                }
            });
            ObservationScheduleService.subarraysInUse.forEach(function (item){
                if (item) {
                    vm.subarrays.push({
                        id: parseInt(item),
                        description: 'for test purposes',
                        scheduleBlocks: [],
                        state: 'inUse'
                    });
                }
            });
            ObservationScheduleService.subarraysMaintenance.forEach(function (item){
                if (item) {
                    vm.subarrays.push({
                        id: parseInt(item),
                        description: 'for test purposes',
                        scheduleBlocks: [],
                        state: 'maintenance'
                    });
                }
            });

            vm.scheduleDraftData.forEach(function (item) {
               vm.subarrays.forEach(function (subarray) {
                  if (item.sub_nr === subarray.id) {
                      subarray.scheduleBlocks.push(item);
                  }
               });
            });
        }

        $timeout(vm.refreshScheduleBlocks, 100);
    }

})();
