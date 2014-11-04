angular.module('katGui')

    .service('ReceptorStateService', function ($rootScope, MonitorService) {

        MonitorService.subscribeToReceptorUpdates();

        var nowStr = moment(new Date()).format('HH:mm:ss DD-MM-YYYY');
        this.receptorsData = [
            {
                name: "m000",
                state: "STOP",
                inhibited: false,
                since: '0:00:00',
                lastUpdate: nowStr
            },
            {
                name: "m001",
                state: "STOP",
                inhibited: false,
                since: '0:00:00',
                lastUpdate: nowStr
            },
            {
                name: "m062",
                state: "STOP",
                inhibited: false,
                since: '0:00:00',
                lastUpdate: nowStr
            },
            {
                name: "m063",
                state: "STOP",
                inhibited: false,
                since: '0:00:00',
                lastUpdate: nowStr
            }
        ];

        $rootScope.$on('receptorMessage', this.receptorMessageReceived);

        this.receptorMessageReceived = function(event, message) {
            var sensorNameList = message.name.split(':');
            var sensor = sensorNameList[0];
            var sensorName = sensorNameList[1];
            this.receptorsData.forEach(function (item) {

                if (item.name === sensor) {
                    if (sensorName === 'mode' && item.state !== message.value) {
                        item.state = message.value;
                    } else if (sensorName === 'inhibited' && item.inhibited !== message.value) {
                        item.inhibited = message.value;
                    }

                    item.lastUpdate = moment(message.time, 'X').format('HH:mm:ss DD-MM-YYYY');
                }

            });
        };

        return this;
    });
