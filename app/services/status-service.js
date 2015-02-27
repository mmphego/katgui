/*jshint loopfunc: true */
(function () {

    angular.module('katGui.services')
        .service('StatusService', StatusService);

    function StatusService($rootScope) {

        var api = {};
        api.statusData = {};
        api.receptors = [];
        api.topStatusTrees = [];

        api.setReceptorsAndStatusTree = function (statusTree, receptors) {
            api.receptors = [];
            receptors.forEach(function (receptor) {
                api.receptors.push(receptor);
                api.statusData[receptor] = {
                    name: receptor,
                    sensor: statusTree.sensor.replace('.', '_').replace('-', '_'),
                    children: statusTree.children
                };
            });
        };

        api.setTopStatusTrees = function(statusTrees) {
            api.topStatusTrees.splice(0, api.topStatusTrees.length);

            for (var treeName in statusTrees) {
                var tree = statusTrees[treeName];
                api.topStatusTrees.push(tree);

                tree.children = [];
                tree.subs.forEach(function (sub) {
                    if (sub.name) {
                        tree.children.push({sensor: sub.sensor, name: sub.name});
                    } else {
                        tree.children.push({sensor: sub});
                    }
                });
            }
        };

        api.messageReceivedSensors = function (messageName, message) {

            if (api.receptors.indexOf(messageName.split(":")[0]) > -1) {
                for (var receptor in api.statusData) {
                    if (messageName.indexOf(receptor) > -1) {
                        applyValueToSensor(api.statusData[receptor], messageName, message, receptor);
                        if (api.statusData[receptor + "treemapClone"]) {
                            applyValueToSensor(api.statusData[receptor + "treemapClone"], messageName, message, receptor);
                        }
                    }
                }
            }
            $rootScope.$emit('sensorUpdateReceived', {name: messageName, sensorValue: message});
        };

        function applyValueToSensor(node, sensorName, value, rootName) {
            if (sensorName === rootName + ':' + node.sensor) {
                node.sensorValue = value;
            }
            else if (node.children && node.children.length > 0) {
                for (var child in node.children) {
                    applyValueToSensor(node.children[child], sensorName, value, rootName);
                }
            }
        }

        function trimmedName(oldName) {
            return oldName.replace('mon_proxy:agg_', '');
        }

        return api;
    }
})();
