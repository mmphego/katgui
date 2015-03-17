/*jshint loopfunc: true */
angular.module('katGui.d3')

    .directive('receptorStatusList', function ($rootScope, d3Util, $timeout, $interval) {
        return {
            restrict: 'E',
            template: '<div ng-repeat="receptor in vm.receptorList" ng-if="vm.receptorList.length > 0" ng-switch="vm.mapType" style="display: inline">' +
            '<receptor-status-tree-map class="treemap-container" receptor="receptor" chart-size="vm.treeChartSize" ng-switch-when="Treemap"></receptor-status-tree-map>' +
            '<receptor-status-pack-map class="treemap-container" receptor="receptor" chart-size="vm.treeChartSize" ng-switch-when="Pack"></receptor-status-pack-map>' +
            '<receptor-status-partition-map class="treemap-container" receptor="receptor" chart-size="vm.treeChartSize" ng-switch-when="Partition"></receptor-status-partition-map>' +
            '<receptor-status-icicle-map class="treemap-container" receptor="receptor" chart-size="vm.treeChartSize" ng-switch-when="Icicle"></receptor-status-icicle-map>' +
            '<receptor-status-sunburst-map class="treemap-container" receptor="receptor" chart-size="vm.treeChartSize" ng-switch-when="Sunburst"></receptor-status-sunburst-map>' +
            '</div>',
            link: function (scope, element) {

                scope.itemsToUpdate = {};

                //everytime we get a sensor update from the StatusService, we need to go update the class of each element,
                //but we might have received the updates before the svg elements exists, so we retry the update
                //until we have found the html element and applied the class change
                var unbindUpdate = $rootScope.$on('sensorUpdateReceived', function (event, sensor) {
                    scope.itemsToUpdate[sensor.name.replace(':', '_')] = sensor;

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
                                    //console.error('Sensor tried to update, but the visual element does not exist - ' + attributes[i]);
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
                                statusClassResult = d3Util.statusClassFromNumber(scope.itemsToUpdate[sensorToUpdateName].sensorValue.status) + '-child child';
                                delete scope.itemsToUpdate[sensorToUpdateName];
                            } else {
                                delete scope.itemsToUpdate[sensorToUpdateName];
                                console.error('Trying to update sensor that does not exist or that does not have a sensorValue - this might be because the sensor was not subscribed to in kat-monitor-webserver');
                                console.error(d);
                            }
                            return statusClassResult;
                        } else if (d.sensorValue) {
                            delete scope.itemsToUpdate[d.name + '_' + d.sensor];
                            return d3Util.statusClassFromNumber(d.sensorValue.status) + '-child parent';
                        } else {
                            delete scope.itemsToUpdate[sensorToUpdateName];
                            console.error('deleting a sensor update because the sensorValue is null');
                            console.error(d);
                        }
                    }

                });

                scope.$on('$destroy', function () {
                    unbindUpdate();
                });
            }
        };
    });

