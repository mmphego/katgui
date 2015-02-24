(function () {

    angular.module('katGui.services')
        .service('StatusService', StatusService);

    function StatusService($rootScope) {

        var api = {};
        api.statusData = {};

        api.setReceptorsAndStatusTree = function (statusTree, receptors) {
            receptors.forEach(function (receptor) {
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
                       api.statusData[attr].children.push({name: messageName, sensorValue: message, blockValue: 100});
                   }
               }
            }
        };

        api.messageReceivedSensorsOk = function (messageName, message) {
            for (var attr in api.statusData) {
                if (messageName.indexOf(attr) > -1) {
                    var existingSensor = api.statusData[messageName.split(':')[0]];
                    if (existingSensor) {
                        if (!existingSensor.sensorValue) {
                            existingSensor.sensorValue = {};
                        }
                        for (var sensorAttr in message) {
                            existingSensor.sensorValue[sensorAttr] = message[sensorAttr];
                        }

                        $rootScope.$emit('sensorUpdateReceived', {name: messageName, sensorValue: message});
                    } else {
                        existingSensor.sensorValue = message;
                    }
                }
            }
        };

        api.messageReceivedSensors = function (messageName, message) {
            for (var attr in api.statusData) {
                if (messageName.indexOf(attr) > -1) {

                    var existingSensor = findSensorInParent(api.statusData[attr], messageName);

                    if (existingSensor) {
                        if (!existingSensor.sensorValue) {
                            existingSensor.sensorValue = {};
                        }
                        for (var sensorAttr in message) {
                            existingSensor.sensorValue[sensorAttr] = message[sensorAttr];
                        }

                        $rootScope.$emit('sensorUpdateReceived', {name: messageName, sensorValue: message});
                    //} else {
                    //    existingSensor.sensorValue = message;
                    }
                }
            }
        };

        function findSensorInParent(parent, sensorName) {
            if (sensorName.indexOf(parent.sensor.replace('.', '_').replace('-', '_')) > -1) {
                return parent;
            }
            else if (parent.children && parent.children.length > 0) {
                for (var child in parent.children) {
                    var result = findSensorInParent(parent.children[child], sensorName);
                    if (result !== null) {
                        return result;
                    }
                }
            } else {
                return null;
            }
        }

        function trimmedName(oldName) {
            return oldName.replace('mon_proxy:agg_', '');
        }

        return api;
    }
})();
