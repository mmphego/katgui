/*jshint loopfunc: true */
angular.module('katGui.d3')

    .directive('receptorHealthList', function ($rootScope, d3Util, $timeout, $interval, $log) {
        return {
            restrict: 'E',
            template: '<div ng-repeat="receptor in vm.receptorList" ng-if="vm.receptorList.length > 0" ng-switch="vm.mapType" style="display: inline">' +
            '<receptor-health-tree-map class="treemap-container" receptor="receptor" chart-size="vm.treeChartSize" ng-switch-when="Treemap"></receptor-health-tree-map>' +
            '<receptor-health-pack-map class="treemap-container" receptor="receptor" chart-size="vm.treeChartSize" ng-switch-when="Pack"></receptor-health-pack-map>' +
            '<receptor-health-partition-map class="treemap-container" receptor="receptor" chart-size="vm.treeChartSize" ng-switch-when="Partition"></receptor-health-partition-map>' +
            '<receptor-health-icicle-map class="treemap-container" receptor="receptor" chart-size="vm.treeChartSize" ng-switch-when="Icicle"></receptor-health-icicle-map>' +
            '<receptor-health-sunburst-map class="treemap-container" receptor="receptor" chart-size="vm.treeChartSize" ng-switch-when="Sunburst"></receptor-health-sunburst-map>' +
            '</div>',
            link: function (scope, element) {

                scope.itemsToUpdate = {};

                //everytime we get a sensor update from the StatusService, we need to go update the class of each element,
                //but we might have received the updates before the svg elements exists, so we retry the update
                //until we have found the html element and applied the class change
                var unbindUpdate = $rootScope.$on('sensorUpdateReceived', function (event, sensor) {
                    scope.itemsToUpdate[sensor.name.replace('.', '_')] = sensor;

                    var stopUpdating = $interval(applyPendingUpdates, 200);

                    function applyPendingUpdates() {
                        var attributes = Object.keys(scope.itemsToUpdate);

                        if (attributes.length > 0) {
                            for (var i = 0; i < attributes.length;i++) {
                                var queryString = '#' + attributes[i];
                                var resultList = d3.selectAll(queryString);
                                resultList.attr('class', function(d) {
                                    return setClassesOfSensor(d, attributes[i]);
                                });
                                if (resultList[0].length === 0) {
                                    delete scope.itemsToUpdate[attributes[i]];
                                    //$log.error('Sensor tried to update, but the visual element does not exist - ' + attributes[i]);
                                }
                            }
                        } else {
                            if (angular.isDefined(stopUpdating)) {
                                $interval.cancel(stopUpdating);
                                stopUpdating = undefined;
                            }
                        }
                    }

                    function setClassesOfSensor(d, sensorToUpdateName) {
                        if (d.depth > 0) {
                            if (!d.sensorValue) {
                                d.sensorValue = {};
                            }
                            var statusClassResult = "inactive-child";
                            if (scope.itemsToUpdate[sensorToUpdateName] && scope.itemsToUpdate[sensorToUpdateName].sensorValue !== null) {
                                for (var attr in scope.itemsToUpdate[sensorToUpdateName]) {
                                    d.sensorValue[attr] = scope.itemsToUpdate[sensorToUpdateName].sensorValue[attr];
                                }
                                statusClassResult = scope.itemsToUpdate[sensorToUpdateName].sensorValue.status + '-child child';
                                delete scope.itemsToUpdate[sensorToUpdateName];
                            } else {
                                delete scope.itemsToUpdate[sensorToUpdateName];
                                $log.error('Trying to update sensor that does not exist or that does not have a sensorValue - this might be because the sensor was not subscribed to in kat-monitor-webserver');
                                $log.error(d);
                            }
                            return statusClassResult;
                        } else if (d.sensorValue) {
                            delete scope.itemsToUpdate[d.name + '_' + d.sensor];
                            return d.sensorValue.status + '-child parent';
                        } else {
                            delete scope.itemsToUpdate[sensorToUpdateName];
                            $log.error('deleting a sensor update because the sensorValue is null');
                            $log.error(d);
                        }
                    }

                });

                scope.$on('$destroy', function () {
                    unbindUpdate();
                });
            }
        };
    });

