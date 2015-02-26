/*jshint loopfunc: true */
(function () {

    angular.module('katGui.services')
        .service('StatusService', StatusService);

    function StatusService($rootScope) {

        var api = {};
        api.statusData = {};
        api.receptors = [];
        api.topStatusTree = {};

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

        api.messageReceived = function (messageName, message) {
            message.trimmedName = trimmedName(messageName);
            for (var attr in api.statusData) {
                if (messageName.indexOf(attr) > -1) {
                    var existingSensor = _.findWhere(api.statusData[attr].children, {name: messageName});
                    if (existingSensor) {
                        for (var sensorAttr in message) {
                            existingSensor.sensorValue[sensorAttr] = message[sensorAttr];
                        }
                        $rootScope.$emit('sensorUpdateReceived', {name: messageName, sensorValue: message});
                    } else {
                        api.statusData[attr].children.push({name: messageName, sensorValue: message});
                    }
                }
            }
        };

        api.messageReceivedSensorsOk = function (messageName, message) {
            for (var attr in api.statusData) {
                if (messageName.indexOf(attr) > -1) {
                    var existingSensor = api.statusData[messageName.split(':')[0]];
                    if (existingSensor) {
                        existingSensor.sensorValue = message;

                        $rootScope.$emit('sensorUpdateReceived', {name: messageName, sensorValue: message});
                    } else {
                        existingSensor.sensorValue = message;
                    }
                }
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
