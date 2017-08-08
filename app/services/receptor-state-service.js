(function () {

    angular.module('katGui.services')
        .service('ReceptorStateService', ReceptorStateService);

    function ReceptorStateService(NotifyService, ConfigService, $log, MOMENT_DATETIME_FORMAT) {

        var api = {receptorsData: []};
        api.sensorValues = {};

        api.getReceptorList = function() {
            api.receptorsData.splice(0, api.receptorsData.length);
            ConfigService.getReceptorList()
                .then(function (receptors) {
                    receptors.forEach(function (receptor) {
                        var modeValue = '';
                        var lastUpdate = null;
                        if (api.sensorValues[receptor + '_' + 'mode']) {
                            modeValue = api.sensorValues[receptor + '_' + 'mode'].value;
                            lastUpdate = api.sensorValues[receptor + '_' + 'mode'].timestamp;
                        }
                        var inhibitValue = false;
                        if (api.sensorValues[receptor + '_' + 'inhibited']) {
                            inhibitValue = api.sensorValues[receptor + '_' + 'inhibited'].value;
                            lastUpdate = api.sensorValues[receptor + '_' + 'mode'].timestamp;
                        }
                        var lastUpdateValue;
                        if (lastUpdate) {
                            lastUpdateValue = moment(lastUpdate, 'X').format(MOMENT_DATETIME_FORMAT);
                        }

                        api.receptorsData.push({
                            name: receptor,
                            inhibited: inhibitValue,
                            state: modeValue,
                            lastUpdate: lastUpdateValue
                        });
                    });
                }, function (result) {
                    NotifyService.showSimpleDialog('Error', 'Error retrieving receptor list, please contact CAM support.');
                    $log.error(result);
                });
        };

        api.receptorMessageReceived = function (message) {
            var sensorName = message.name.split(':')[1];
            api.sensorValues[sensorName] = message.value;
        };

        return api;
    }
})();
