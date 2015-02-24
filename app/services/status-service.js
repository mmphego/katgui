(function () {

    angular.module('katGui.services')
        .service('StatusService', StatusService);

    function StatusService($rootScope) {

        var api = {};
        api.statusData = {};

        api.setReceptorsAndStatusTree = function (statusTree, receptors) {
            receptors.forEach(function (receptor) {
                api.statusData[receptor] = { name: receptor, sensor: statusTree.sensor, status_children: statusTree.children, children: [] };
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

        function trimmedName(oldName) {
            return oldName.replace('mon_proxy:agg_', '');
        }

        return api;
    }
})();
