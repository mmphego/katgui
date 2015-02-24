angular.module('katGui.d3')

    .directive('receptorStatusList', function ($rootScope, d3Util, $timeout, $interval) {
        return {
            restrict: 'E',
            template: '<div ng-repeat="receptor in vm.receptorList" ng-if="vm.receptorList.length > 0" ng-switch="vm.mapType" style="display: inline">' +
            '<receptor-status-tree-map class="treemap-container" receptor="receptor" chart-size="vm.treeChartSize" ng-switch-when="tree"></receptor-status-tree-map>' +
            '<receptor-status-pack-map class="treemap-container" receptor="receptor" chart-size="vm.treeChartSize" ng-switch-when="pack"></receptor-status-pack-map>' +
            '<receptor-status-partition-map class="treemap-container" receptor="receptor" chart-size="vm.treeChartSize" ng-switch-when="partition"></receptor-status-partition-map>' +
            '<receptor-status-icicle-map class="treemap-container" receptor="receptor" chart-size="vm.treeChartSize" ng-switch-when="icicle"></receptor-status-icicle-map>' +
            '<receptor-status-sunburst-map class="treemap-container" receptor="receptor" chart-size="vm.treeChartSize" ng-switch-when="sunburst"></receptor-status-sunburst-map>' +
            '</div>',
            link: function (scope, element) {

                scope.itemsToUpdate = {};

                //everytime we get a sensor update from the StatusService, we need to go update the class of each element,
                //but we might have received the updates before the svg elements exists, so we retry the update
                //until we have found the html element and applied the class change
                $rootScope.$on('sensorUpdateReceived', function (event, sensor) {
                    scope.itemsToUpdate[sensor.name.replace(':', '_').replace('.', '_')] = sensor;

                    var stopUpdating = $interval(applyPendingUpdates, 1000);

                    function applyPendingUpdates() {
                        var attributes = Object.keys(scope.itemsToUpdate);

                        if (attributes.length > 0) {
                            for (var i = 0; i < attributes.length;i++) {
                                var queryString = '#sensor_name_' + attributes[i];
                                d3.selectAll(queryString).attr('class', setClassesOfSensor);
                            }
                        } else {
                            if (angular.isDefined(stopUpdating)) {
                                $interval.cancel(stopUpdating);
                                stopUpdating = undefined;
                            }
                        }
                    }

                    function setClassesOfSensor(d) {
                        if (d.depth > 0) {
                            for (var sensorAttr in d.sensorValue) {
                                d.sensorValue[sensorAttr] = d.sensorValue[sensorAttr];
                            }
                            var objName = d.name.replace(':', '_').replace('.', '_');
                            var statusClassResult = d3Util.statusClassFromNumber(scope.itemsToUpdate[objName].sensorValue.status) + '-child child';
                            delete scope.itemsToUpdate[objName];
                            return statusClassResult;
                        } else if (d.sensorValue) {
                            for (var sensorValAttr in sensor.sensorValue) {
                                d.sensorValue[sensorValAttr] = d.sensorValue[sensorValAttr];
                            }
                            delete scope.itemsToUpdate[d.name + '_' + d.sensor];
                            return d3Util.statusClassFromNumber(d.sensorValue.status) + '-child parent';
                        }
                    }

                });
            }
        };
    });

