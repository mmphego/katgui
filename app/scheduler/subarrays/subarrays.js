(function(){

    angular.module('katGui.scheduler')
        .controller('SubArraysCtrl', SubArraysCtrl);

    function SubArraysCtrl($scope, ObservationScheduleService, $timeout, $mdDialog) {

        var vm = this;
        vm.scheduleDraftData = ObservationScheduleService.scheduleDraftData;
        ObservationScheduleService.connectListener();

        vm.subarrays = [{
            id: '1',
            name: 'All of them',
            description: 'some description of the subarray 1',
            scheduleBlocks: []
        }, {
            id: '2',
            name: 'Maintenance',
            description: 'This array is used for maintenance tasks, This array is used for maintenance tasks, This array is used for maintenance tasks, This array is used for maintenance tasks, This array is used for maintenance tasks, This array is used for maintenance tasks, This array is used for maintenance tasks, This array is used for maintenance tasks, This array is used for maintenance tasks',
            scheduleBlocks: []
        }];

        $scope.$on('$destroy', function () {
            ObservationScheduleService.disconnectListener();
        });

        vm.refreshScheduleBlocks = function () {
            ObservationScheduleService.getScheduleBlocks()
                .then(draftListProcessingComplete, draftListProcessingError);
        };

        $scope.filterFunction = function(element) {
            return element.sub_nr.match('1') ? true : false;
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

        $timeout(vm.refreshScheduleBlocks, 100);
    }

})();
