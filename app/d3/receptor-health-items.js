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
            '<receptor-health-force class="treemap-container" receptor="receptor" ng-switch-when="Force Layout"></receptor-health-force>' +
            '</div>',
            link: function (scope) {

                scope.vm.redrawCharts = function () {
                    $rootScope.$emit('redrawChartMessage', {size: scope.vm.treeChartSize});
                };
            }
        };
    });
