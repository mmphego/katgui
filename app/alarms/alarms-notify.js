angular.module('katGui.alarms')

    .controller('AlarmsNotifyCtrl', function ($rootScope, $scope, $timeout) {

        $scope.messages = [];


//        $timeout(function () {
//            //test code alarms
//            var testData = '[{"date": 1412676372.745636, "priority": "new", "message": "This is a very long message to test overflow in the notify alarms class... you know", "severity": "critical", "name": "sheepsheepsheepsheepsheepsheepsheepsheepsheep"}, {"date": 1412676372.74568, "priority": "new", "message": "hqpbygqbtgnfttxqdvue", "severity": "unknown", "name": "snow"}, {"date": 1412676372.745728, "priority": "cleared", "message": "wfufnftdjnuxpmzcciyr", "severity": "nominal", "name": "humidity"}, {"date": 1412676372.745751, "priority": "new", "message": "jwfuwauvgccjfbuivcfa", "severity": "error", "name": "rain"}, {"date": 1412676372.745774, "priority": "new", "message": "exijrrxixlivodaxqfzo", "severity": "warn", "name": "sprinboks"}, {"date": 1412676372.745804, "priority": "new", "message": "hqlrafkzndcnvlimzqkl", "severity": "unknown", "name": "reindeer"}, {"date": 1412676372.745848, "priority": "new", "message": "wdkzvsnsjcdvdlypphch", "severity": "maintenance", "name": "hail"}]';
//            var jsonObj = JSON.parse(testData);
//            jsonObj = [].concat(jsonObj);
//            jsonObj.forEach(function (obj) {
//
//                if (obj.date) {
//                    obj.date = moment.utc(obj.date, 'X').format('hh:mm:ss DD-MM-YYYY');
//                }
//
//                alarms.addAlarmMessage(obj);
//            });
//
//            if (!$rootScope.$$phase) {
//                $rootScope.$digest();
//            }
//            //test code alarms
//
//        }, 250);


        $scope.addAlarmMessage = function (message) {
            $scope.messages.push(message);

            if (message.severity === 'unknown' ||
                message.severity === 'nominal' ||
                message.severity === 'maintenance') {
                message.ttl = 10000;
            }

            if (message.ttl && message.ttl !== -1) {
                $timeout(function () {
                    $scope.deleteMessage(message);
                }, message.ttl);
            }
        };

        $rootScope.$on('alarmMessage', function (event, message) {
            $scope.addAlarmMessage(message);

            if (message.priority === 'new') {

                if (message.severity === 'warn') {
                    $rootScope.newAlarmWarnCount++;
                } else if (message.severity === 'error') {
                    $rootScope.newAlarmErrorCount++;
                } else if (message.severity === 'critical') {
                    $rootScope.newAlarmCritCount++;
                }
            }
        });

        $scope.acknowledgeMessage = function (message) {
            $scope.deleteMessage(message);
        };

        $scope.deleteMessage = function (message) {
            var index = $scope.messages.indexOf(message);
            if (index > -1) {
                $scope.messages.splice(index, 1);
            }
        };

        $scope.computeSeverityClasses = function (message) {
            return {
                'alarm-critical': message.severity === 'critical',
                'alarm-error': message.severity === 'error',
                'alarm-warning': message.severity === 'warn',
                'alarm-maintenance': message.severity === 'maintenance',
                'alarm-info': message.severity === 'info',
                'alarm-nominal': message.severity === 'nominal',
                'alarm-unknown': message.severity === 'unknown'
            };
        };

        $scope.getActiveClass = function () {
            return $rootScope.showLargeAlarms ? 'large-alarm' : 'small-alarm';
        };
    })

    .directive('alarm', function () {
        return {
            restrict: 'A',
            template: '<div ng-class="getActiveClass()">' +
                '   <div class="alarm-item" ng-repeat="message in messages" ng-if="message.priority === \'new\'" ng-class="computeSeverityClasses(message)">' +
                '       <div>' +
                '           <ul>' +
                '               <li class="li-inline"><button class="alarm-close" ng-click="acknowledgeMessage(message)">Ack</button></li>' +
                '               <li class="li-inline"><button class="alarm-close" ng-click="deleteMessage(message)">Knw</button></li>' +
                '           </ul>' +
                '       </div>' +
                '       <div class="datestamp"><span>{{message.date}}</span></div>' +
                '       <div class="severitystamp"><span>{{message.severity}}</span></div>' +
                '       <div><span class="alarm-message-name">{{message.name}}</span>' +
                '       <div class="alarm-message"><span>{{message.message}}</span></div>' +
                '       </div>' +
                '   </div>' +
                '</div>',
            replace: false,
            scope: true,
            controller: 'AlarmsNotifyCtrl'
        };
    });
