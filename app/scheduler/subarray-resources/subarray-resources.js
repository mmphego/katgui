(function () {

    angular.module('katGui.scheduler')
        .controller('SubArrayResourcesCtrl', SubArrayResourcesCtrl);

    function SubArrayResourcesCtrl($scope, ObservationScheduleService, $timeout, $mdDialog, $rootScope, $document) {

        var vm = this;

        vm.subarrays = ObservationScheduleService.subarrays;
        vm.poolResourcesFree = ObservationScheduleService.poolResourcesFree;
        vm.poolResources = ObservationScheduleService.poolResources;

        vm.refreshResources = function () {

            //chain the calls otherwise the server gives us grief
            //TODO: figure out why the server is being silly

            //ObservationScheduleService.listAllocations()
            //    .then(listProcessingComplete, listProcessingError);

            ObservationScheduleService.listSubarrays()
                .then(function () {
                    $timeout(function () {
                        ObservationScheduleService.listPoolResources()
                            .then(listProcessingComplete, listProcessingError);
                    }, 400);
                });
        };

        vm.assignSelectedResources = function (subarray) {

            var itemsAssigned = [];
            vm.poolResourcesFree.forEach(function (item) {
                if (item.selected) {
                    itemsAssigned.push(item.name);
                }
            });
            var itemsString = itemsAssigned.join(',');
            ObservationScheduleService.assignResourcesToSubarray(subarray.id, itemsString)
                .then(displayPromiseResult);
        };

        vm.removeSubarray = function (subarray) {
            //vm.subarrays.splice(vm.subarrays.indexOf(subarray), 1);
        };

        vm.createSubarray = function () {

            //vm.subarrays.push({id:'' + lastId++, state:'free', scheduleBlocks: []});
        };

        vm.freeAssignedResource = function (subarray, resource) {

            ObservationScheduleService.unassignResourcesFromSubarray(subarray.id, resource.name)
                .then(displayPromiseResult);
        };

        vm.freeSubarray = function (subarray) {
            ObservationScheduleService.freeSubarray(subarray.id)
                .then(vm.refreshResources);
        };

        vm.setSubarrayInUse = function (subarray) {
            ObservationScheduleService.setSubarrayInUse(subarray.id,  subarray.state === "in_use"? 0 : 1)
                .then(displayPromiseResult);
        };

        vm.setSubarrayInMaintenance = function (subarray) {
            ObservationScheduleService.setSubarrayMaintenance(subarray.id, subarray.in_maintenance? 0 : 1)
                .then(displayPromiseResult);
        };

        vm.markResourceFaulty = function (resource) {
            ObservationScheduleService.markResourceFaulty(resource.name, resource.state === 'faulty'? 0 : 1)
                .then(displayPromiseResult);
        };

        vm.markResourceInMaintenance = function (resource) {
            ObservationScheduleService.markResourceInMaintenance(resource.name, resource.in_maintenance? 0 : 1)
                .then(displayPromiseResult);
        };

        function listProcessingComplete(result) {
            $timeout(function () {
                //vm.draftListProcessingServerCall = false;
            }, 100);
        }

        function listProcessingError(result) {
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

        function showSimpleErrorDialog(title, message) {
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

        function displayPromiseResult(result) {
            if (result.result === 'ok') {
                $rootScope.showSimpleToast(result.message);
            } else {
                showSimpleErrorDialog(result.result, result.message);
            }
        }

        var unbindShortcuts = $document.bind("keydown", function (e) {

            if (e.keyCode === 27) {
                //clear selection when pressing escape
                ObservationScheduleService.poolResourcesFree.forEach(function (item) {
                   item.selected = false;
                });
            }

            if (!$scope.$$phase) {
                $scope.$digest();
            }
        });

        $scope.$on('$destroy', function () {
            unbindShortcuts.unbind('keydown');
        });

        $timeout(vm.refreshResources, 500);
    }

})();
