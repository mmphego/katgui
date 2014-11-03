angular.module('katGui')

    .controller('OperatorControlCtrl', function ($rootScope, $scope, $interval, ControlService) {

        $scope.title = 'Operator Controls';

        var nowStr = moment(new Date()).format('HH:mm:ss DD-MM-YYYY');

        //$scope.receptorsData = [
        //    {
        //        name: "m000",
        //        state: "STOP",
        //        inhibited: false,
        //        since: '0:00:00',
        //        lastUpdate: nowStr
        //    },
        //    {
        //        name: "m001",
        //        state: "STOP",
        //        inhibited: false,
        //        since: '0:00:00',
        //        lastUpdate: nowStr
        //    },
        //    {
        //        name: "m062",
        //        state: "STOP",
        //        inhibited: false,
        //        since: '0:00:00',
        //        lastUpdate: nowStr
        //    },
        //    {
        //        name: "m063",
        //        state: "STOP",
        //        inhibited: false,
        //        since: '0:00:00',
        //        lastUpdate: nowStr
        //    }
        //];
        $scope.receptorsData = $rootScope.receptorsData;

        $scope.receptors = [];

        var maxCols = 8;
        var maxRows = 8;
        var counter = 0;
        var dataLength = $scope.receptorsData.length;

        for (var i = 0; i < maxRows; i++) {
            $scope.receptors.push([]);
            for (var j = 0; j < maxCols; j++) {
                if (counter < dataLength) {
                    var obj = {id: counter, receptor: $scope.receptorsData[counter]};
                    $scope.receptors[i][j] = obj;
                    counter++;
                } else {
                    break;
                }
            }
            if (counter >= dataLength) {
                break;
            }
        }

        $rootScope.$on('receptorMessage', function (event, message) {

            var sensorNameList = message.name.split(':');
            var sensor = sensorNameList[0];
            var sensorName = sensorNameList[1];
            $scope.receptorsData.forEach(function (item) {

                if (item.name === sensor) {
                    if (sensorName === 'mode' && item.state !== message.value) {
                        item.state = message.value;
                    } else if (sensorName === 'inhibited' && item.inhibited !== message.value) {
                        item.inhibited = message.value;
                    }

                    item.lastUpdate = moment(message.time, 'X').format('HH:mm:ss DD-MM-YYYY');
                }

            });

            if (!$scope.$$phase) {
                $scope.$digest();
            }

        });

        $interval(function() {

            $scope.receptorsData.forEach(function (item) {
                var ms = moment(new Date()).diff(moment(item.lastUpdate, 'HH:mm:ss DD-MM-YYYY'));
                var d = moment.duration(ms);
                item.since = Math.floor(d.asHours()) + moment(ms).format(":mm:ss");
            });

            if (!$scope.$$phase) {
                $scope.$digest();
            }
        }, 1000);


        $scope.stowAll = function () {
            ControlService.stowAll();
        };

        $scope.inhibitAll = function () {
            ControlService.inhibitAll();
        };

        $scope.stopAll = function () {
            ControlService.stopAll();
        };

        $scope.resumeOperations = function () {
            ControlService.resumeOperations();
        };

        $scope.shutdownComputing = function () {
            ControlService.shutdownComputing();
        };

    });
