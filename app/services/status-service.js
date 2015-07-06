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
            api.sensorValues[messageName.replace('.', '_')] = message;
            api.itemsToUpdate[messageName.replace('.', '_')] = message;
            if (!api.stopUpdating) {
                api.stopUpdating = $interval(api.applyPendingUpdates, 500);
            }
            $rootScope.$emit('sensorUpdateReceived', {name: messageName, sensorValue: message});
        };

        api.applyPendingUpdates = function () {
            var attributes = Object.keys(api.itemsToUpdate);
            if (attributes.length > 0) {
                for (var i = 0; i < attributes.length; i++) {
                    var sensorName = api.sensorValues[attributes[i]].name;
                    sensorName = sensorName.replace(/\./g, '_');
                    var queryString = '.' + sensorName;
                    var resultList = d3.selectAll(queryString);
                    resultList[0].forEach(function (element) {
                        d3.select(element).attr('class', function (d) {
                            return api.setClassesOfSensor(d, attributes[i]);
                        });
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

        api.setClassesOfSensor = function (d, sensorToUpdateName) {
            if (d.depth > 0) {
                if (!d.sensorValue) {
                    d.sensorValue = {};
                }
                var statusClassResult = sensorToUpdateName;
                d.sensorValue = api.itemsToUpdate[sensorToUpdateName];
                if (d.sensorValue) {
                    statusClassResult += ' ' + d.sensorValue.status + '-child';
                }
                statusClassResult += d.dx > 300 ? " child-big-text" : " child";
                return statusClassResult;
            } else if (d.sensorValue) {
                return sensorToUpdateName + ' ' + d.sensorValue.status + '-child parent';
            }
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
