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
            api.receptors.splice(0, api.receptors.length);
            receptors.forEach(function (receptor) {
                api.receptors.push(receptor);
                api.statusData[receptor] = {
                    name: receptor,
                    sensor: statusTree.sensor.replace('.', '_').replace('-', '_'),
                    children: statusTree.children
                };
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
            if (messageName.indexOf('mon:') === 0) {
                messageName = messageName.split(':')[1];
            }
            message.name = messageName;

            if (api.receptors.indexOf(messageName.split(".")[0]) > -1) {
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
            if (sensorName === rootName + '.' + node.sensor) {
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
