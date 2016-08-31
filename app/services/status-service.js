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
        api.topStatusTreesSensors = {};
        api.receptorTreesSensors = {};
        api.updateQueue = [];

        api.addToUpdateQueue = function (sensor) {
            api.updateQueue.push(sensor);
        };

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
                if (api.receptors.indexOf(resource) > -1) {
                    newStatusDataResource.children = statusTree.children;
                }

                api.statusData[resource] = newStatusDataResource;
            });
        };

        api.setTopStatusTrees = function (statusTrees) {
            api.topStatusTrees.splice(0, api.topStatusTrees.length);
            api.topStatusTreesSensors = {};

            for (var treeName in statusTrees) {
                var tree = statusTrees[treeName];
                api.topStatusTrees.push(tree);

                tree.children = [];
                tree.subs.forEach(function (sub) {
                    tree.children.push({sensor: sub.sensor, name: sub.name});
                    api.topStatusTreesSensors[sub.sensor] = true;
                });
            }
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

        api.receptorMaintenanceMessageReceived = function (message) {
            api.resourcesInMaintenance = message.msg_data.value;
            var attributes = Object.keys(api.sensorValues);
            for (var i = 0; i < attributes.length; i++) {
                var sensorName = attributes[i];
                d3.selectAll('rect.health-full-item.' + sensorName).attr('class', function (d) {
                    return api.getClassesOfSensor(d, attributes[i], true) + ' health-full-item';
                });
                d3.selectAll('g.health-full-item.' + sensorName).attr('class', function (d) {
                    return api.getClassesOfSensor(d, attributes[i], true) + ' health-full-item';
                });
            }
        };

        api.applyPendingUpdates = function () {
            while (api.updateQueue.length > 0) {
                var sensorName = api.updateQueue.shift();
                d3.selectAll('.health-full-item.' + sensorName).attr('class', function (d) {
                    return api.getClassesOfSensor(d, sensorName, true) + ' health-full-item';
                });
                d3.selectAll('.text-bg-rect.' + sensorName).attr('class', function (d) {
                    return api.getClassesOfSensor(d, sensorName, false) + ' text-bg-rect';
                });
            }
        };

        api.getClassesOfSensor = function (d, sensorToUpdateName, checkMaintenance) {
            if (!d) {
                return;
            }
            d.sensorValue = api.sensorValues[sensorToUpdateName];
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

        return api;
    }
})();
