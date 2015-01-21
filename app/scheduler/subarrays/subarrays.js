(function(){

    angular.module('katGui.scheduler')
        .controller('SubArraysCtrl', SubArraysCtrl);

    function SubArraysCtrl($scope) {

        var vm = this;

        vm.subarrays = [{
            id: '1',
            name: 'all of them',
            description: 'some description of the subarray 1',
            scheduleBlocks: []
        }, {
            id: '2',
            name: 'Maintenance',
            description: 'This array is used for maintenance tasks, This array is used for maintenance tasks, This array is used for maintenance tasks, This array is used for maintenance tasks, This array is used for maintenance tasks, This array is used for maintenance tasks, This array is used for maintenance tasks, This array is used for maintenance tasks, This array is used for maintenance tasks',
            scheduleBlocks: []
        }];


    }

})();
