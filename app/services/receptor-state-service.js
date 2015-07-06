(function () {

    angular.module('katGui.services')
        .service('ReceptorStateService', ReceptorStateService);

    function ReceptorStateService($rootScope, ConfigService, $log) {

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
                            lastUpdateValue = moment(lastUpdate, 'X').format('HH:mm:ss DD-MM-YYYY')
                        }

                        api.receptorsData.push({
                            name: receptor,
                            inhibited: inhibitValue,
                            state: modeValue,
                            lastUpdate: lastUpdateValue
                        });
                    });
                }, function (result) {
                    $rootScope.showSimpleDialog('Error', 'Error retrieving receptor list, please contact CAM support.');
                    $log.error(result);
                });
        };

        api.receptorMessageReceived = function (message) {
            var sensorNameList = message.name.split(':')[1].split('.');
            var receptor = sensorNameList[0];
            var sensorName = sensorNameList[1];
            api.sensorValues[receptor + '_' + sensorName] = message.value;
            if (sensorName === 'vds_flood_lights_on') {
                api.floodLightSensor = message.value;
            } else {
                api.receptorsData.forEach(function (item) {
                    if (item.name === receptor && message.value) {
                        if (sensorName === 'mode' && item.status !== message.value.value) {
                            item.state = message.value.value;
                        } else if (sensorName === 'inhibited' && item.inhibited !== message.value.value) {
                            item.inhibited = message.value.value;
                        }
                        item.lastUpdate = moment(message.value.timestamp, 'X').format('HH:mm:ss DD-MM-YYYY');
                    }
                });
            }
        };

        api.updateReceptorDates = function () {
            api.receptorsData.forEach(function (item) {
                if (item.lastUpdate) {
                    item.since = moment(item.lastUpdate, 'HH:mm:ss DD-MM-YYYY').format('HH:mm:ss DD-MM-YYYY');
                    item.fromNow = moment(item.lastUpdate, 'HH:mm:ss DD-MM-YYYY').fromNow();
                } else {
                    item.since = "error";
                    item.fromNow = "Connection Error!";
                }
            });
        };

        return api;
    }
})();
