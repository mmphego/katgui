(function () {

    angular.module('katGui.services')
        .service('ReceptorStateService', ReceptorStateService);

    function ReceptorStateService($rootScope, MonitorService, ConfigService, $log) {

        var api = {receptorsData: []};

        api.getReceptorList = function() {
            api.receptorsData.splice(0, api.receptorsData.length);
            ConfigService.getReceptorList()
                .then(function (receptors) {
                    receptors.forEach(function (receptor) {
                        api.receptorsData.push({name: receptor, inhibited: false});
                        MonitorService.subscribeToReceptorUpdates();
                    });
                }, function (result) {
                    $rootScope.showSimpleDialog('Error', 'Error retrieving receptor list, please contact CAM support.');
                    $log.error(result);
                });
        };

        api.receptorMessageReceived = function (message) {
            var sensorNameList = message.name.split(':')[1];
            var receptor = sensorNameList.split('.')[0];
            var sensorName = sensorNameList.split('.')[1];
            api.receptorsData.forEach(function (item) {
                if (item.name === receptor) {
                    if (sensorName === 'mode' && item.status !== message.value.value) {
                        item.state = message.value.value;
                    } else if (sensorName === 'inhibited' && item.inhibited !== message.value.value) {
                        item.inhibited = message.value.value;
                    }
                    item.lastUpdate = moment(message.value.timestamp, 'X').format('HH:mm:ss DD-MM-YYYY');
                }
            });
        };

        return api;
    }
})();
