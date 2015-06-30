/*jshint loopfunc: true */
angular.module('katGui.d3')

    .directive('receptorHealthList', function ($rootScope, d3Util, $timeout, $interval, $log, StatusService) {
        return {
            restrict: 'E',
            template: '<div ng-repeat="receptor in vm.receptorList track by receptor" ng-if="vm.receptorList.length > 0" ng-switch="vm.mapType" style="display: inline-block">' +
            '<receptor-health-tree-map class="treemap-container" receptor="receptor" ng-switch-when="Treemap"></receptor-health-tree-map>' +
            '<receptor-health-pack-map class="treemap-container" receptor="receptor" ng-switch-when="Pack"></receptor-health-pack-map>' +
            '<receptor-health-partition-map class="treemap-container" receptor="receptor" ng-switch-when="Partition"></receptor-health-partition-map>' +
            '<receptor-health-icicle-map class="treemap-container" receptor="receptor" ng-switch-when="Icicle"></receptor-health-icicle-map>' +
            '<receptor-health-sunburst-map class="treemap-container" receptor="receptor" ng-switch-when="Sunburst"></receptor-health-sunburst-map>' +
            '</div>',
            link: function (scope) {

                scope.itemsToUpdate = {};
                StatusService.sensorValues = {};
                scope.vm.redrawCharts = function () {
                    $rootScope.$emit('redrawChartMessage', {size: scope.vm.treeChartSize});
                };

                //everytime we get a sensor update from the StatusService, we need to go update the class of each element,
                var unbindUpdate = $rootScope.$on('sensorUpdateReceived', function (event, sensor) {
                    var sensorName = sensor.name.replace('.', '_');
                    StatusService.sensorValues[sensorName] = sensor;
                    var queryString = '#' + sensorName;
                    var resultList = d3.selectAll(queryString);
                    resultList.attr('class', function(d) {
                        var classString = '';
                        if (StatusService.sensorValues[d.sensorValue.name.replace('.', '_')]) {
                            classString += StatusService.sensorValues[d.sensorValue.name.replace('.', '_')].sensorValue.status;
                            if (d.depth > 0) {
                                classString += '-child child';
                            } else {
                                classString += '-child parent';
                            }
                            return classString;
                        } else {
                            return 'inactive-child'
                        }
                    });
                });

                scope.$on('$destroy', function () {
                    unbindUpdate();
                });
            }
        };
    });

