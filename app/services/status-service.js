/*jshint loopfunc: true */
(function () {

    angular.module('katGui.services')
        .service('StatusService', StatusService);

    function StatusService($rootScope, $interval) {

        var api = {};
        api.statusData = {};
        api.receptors = [];
        api.topStatusTrees = [];
        api.itemsToUpdate = {};
        api.sensorValues = {};
        api.resourcesInMaintenance = '';
        api.controlledResources = [];

        api.setReceptorsAndStatusTree = function (statusTree, receptors) {
            api.receptors.splice(0, api.receptors.length);
            receptors.forEach(function (receptor) {
                api.receptors.push(receptor);
            });

            api.controlledResources.forEach(function (resource) {
                var newStatusDataResource = {};
                if (api.statusData[resource]) {
                    newStatusDataResource = api.statusData[resource];
                }
                newStatusDataResource.name = resource;
                newStatusDataResource.sensor = statusTree.sensor.replace('.', '_').replace('-', '_');
                newStatusDataResource.children = statusTree.children;
                api.statusData[resource] = newStatusDataResource;
            });
        };

        api.setTopStatusTrees = function (statusTrees) {
            api.topStatusTrees.splice(0, api.topStatusTrees.length);

            for (var treeName in statusTrees) {
                var tree = statusTrees[treeName];
                api.topStatusTrees.push(tree);

                tree.children = [];
                tree.subs.forEach(function (sub) {
                    tree.children.push({sensor: sub.sensor, name: sub.name});
                });
            }
        };

        api.messageReceivedSensors = function (messageName, message) {
            if (messageName.indexOf('health:') === 0) {
                messageName = messageName.split(':')[1];
            }
            message.name = messageName;

            if (api.receptors.indexOf(messageName.split("_")[0]) > -1 ||
                api.receptors.indexOf(messageName.split("_")[1]) > -1 ) {
                for (var receptor in api.statusData) {
                    if (messageName.indexOf(receptor) > -1) {
                        applyValueToSensor(api.statusData[receptor], messageName, message, receptor);
                        if (api.statusData[receptor + "treemapClone"]) {
                            applyValueToSensor(api.statusData[receptor + "treemapClone"], messageName, message, receptor);
                        }
                    }
                }
            }
            api.sensorValues[messageName] = message;
            api.itemsToUpdate[messageName] = message;
            if (!api.stopUpdating) {
                api.stopUpdating = $interval(api.applyPendingUpdates, 500);
            }
            $rootScope.$emit('sensorUpdateReceived', {name: messageName, sensorValue: message});
        };

        api.receptorMaintenanceMessageReceived = function (message) {
            api.resourcesInMaintenance = message.msg_data.value;
            var attributes = Object.keys(api.sensorValues);
            for (var i = 0; i < attributes.length; i++) {
                var sensorName = api.sensorValues[attributes[i]].name;
                d3.selectAll('rect.health-full-item.' + sensorName).attr('class', function (d) {
                    return api.getClassesOfSensor(d, attributes[i], true) + ' health-full-item';
                });
                d3.selectAll('g.health-full-item.' + sensorName).attr('class', function (d) {
                    return api.getClassesOfSensor(d, attributes[i], true) + ' health-full-item';
                });
            }
        };

        api.applyPendingUpdates = function () {
            var attributes = Object.keys(api.itemsToUpdate);
            if (attributes.length > 0) {
                for (var i = 0; i < attributes.length; i++) {
                    var sensorName = api.sensorValues[attributes[i]].name;
                    d3.selectAll('.health-full-item.' + sensorName).attr('class', function (d) {
                        return api.getClassesOfSensor(d, attributes[i], true) + ' health-full-item';
                    });
                    d3.selectAll('.text-bg-rect.' + sensorName).attr('class', function (d) {
                        return api.getClassesOfSensor(d, attributes[i], false) + ' text-bg-rect';
                    });
                    delete api.itemsToUpdate[attributes[i]];
                }
            } else {
                if (angular.isDefined(api.stopUpdating)) {
                    $interval.cancel(api.stopUpdating);
                    api.stopUpdating = undefined;
                }
            }
        };

        api.getClassesOfSensor = function (d, sensorToUpdateName, checkMaintenance) {
            if (!d) {
                return;
            }
            d.sensorValue = api.itemsToUpdate[sensorToUpdateName];
            if (!d.sensorValue) {
                d.sensorValue = api.sensorValues[sensorToUpdateName];
            }
            var statusClassResult = sensorToUpdateName;
            if (checkMaintenance && api.resourcesInMaintenance.indexOf(d.sensor.replace('agg_', '').split('_')[0]) > -1) {
                statusClassResult += ' in-maintenance-child ';
            } else if (d.sensorValue.status !== undefined) {
               statusClassResult += ' ' + d.sensorValue.status + '-child';
            } else if (api.itemsToUpdate[d.sensor]) {
               statusClassResult += ' ' + api.itemsToUpdate[d.sensor].status + '-child';
            }

            statusClassResult += d.dx > 300 ? " child-big-text" : " child";
            return statusClassResult;
        };

        function applyValueToSensor(node, sensorName, value, rootName) {
            var prefix = node.prefix? node.prefix : '';
            if (sensorName === prefix + rootName + '_' + node.sensor) {
                if (!node.sensorValue) {
                    node.sensorValue = {};
                }
                for (var attr in value) {
                    node.sensorValue[attr] = value[attr];
                }
            }
            else if (node.children && node.children.length > 0) {
                for (var child in node.children) {
                    applyValueToSensor(node.children[child], sensorName, value, rootName);
                }
            }
        }

        return api;
    }
})();
