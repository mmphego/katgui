(function () {

    angular.module('katGui.alarms')
        .controller('AlarmsNotifyCtrl', AlarmsNotifyCtrl)
        .directive('alarmsNotifier', AlarmDirective);
    //ng-class="vm.computeSeverityClasses(message)"

    function AlarmDirective() {
        return {
            restrict: 'A',
            template: [
            '<div class="alarms-notify-list">',
            '   <div class="alarm-item large-alarms-animate" ng-repeat="message in vm.messages | orderBy:\'dateUnix\'" ng-if="message.priority === \'new\'" ' +
            '       ng-class="{\'large-alarm-item\': hover || showLargeAlarms, ' +
            '                   \'small-alarm-item\': !hover && !showLargeAlarms, ' +
            '                   \'alarm-critical\': message.severity === \'critical\', ' +
            '                   \'alarm-error\': message.severity === \'error\', ' +
            '                   \'alarm-warning\': message.severity === \'warn\', ' +
            '                   \'alarm-maintenance\': message.severity === \'maintenance\', ' +
            '                   \'alarm-info\': message.severity === \'info\', ' +
            '                   \'alarm-nominal\': message.severity === \'nominal\', ' +
            '                   \'alarm-unknown\': message.severity === \'unknown\'}" ' +
            '       ng-mouseover="hover = true;" ng-mouseleave="hover = false;">',
            '       <div>',
            '           <ul>',
            '               <li class="li-inline"><button class="alarm-close" ng-click="vm.acknowledgeMessage(message)">Ack</button></li>',
            '               <li class="li-inline"><button class="alarm-close" ng-click="vm.knowMessage(message)">Knw</button></li>',
            '           </ul>',
            '       </div>',
            '       <div class="datestamp"><span>{{message.date}}</span></div>',
            '       <div class="severitystamp"><span>{{message.severity}}</span></div>',
            '       <div><span class="alarm-message-name">{{message.name}}</span>',
            '       <div class="alarm-message"><span>{{message.message}}</span></div>',
            '       </div>',
            '   </div>',
            '</div>'
            ].join(''),
            replace: false,
            scope: true,
            controller: 'AlarmsNotifyCtrl as vm'
        };
    }

    function AlarmsNotifyCtrl($scope, $rootScope, $timeout, ControlService) {

        var vm = this;
        vm.messages = [];

        //$timeout(function () {
        //    //test code alarms
        //    var testData = '[{"date": 1412676372.745636, "priority": "new", "message": "This is a very long message to test overflow in the notify alarms class... you know", "severity": "critical", "name": "sheepsheepsheepsheepsheepsheepsheepsheepsheep"}, {"date": 1412676372.74568, "priority": "new", "message": "hqpbygqbtgnfttxqdvue", "severity": "unknown", "name": "snow"}, {"date": 1412676372.745728, "priority": "cleared", "message": "wfufnftdjnuxpmzcciyr", "severity": "nominal", "name": "humidity"}, {"date": 1412676372.745751, "priority": "new", "message": "jwfuwauvgccjfbuivcfa", "severity": "error", "name": "rain"}, {"date": 1412676372.745774, "priority": "new", "message": "exijrrxixlivodaxqfzo", "severity": "warn", "name": "sprinboks"}, {"date": 1412676372.745804, "priority": "new", "message": "hqlrafkzndcnvlimzqkl", "severity": "unknown", "name": "reindeer"}, {"date": 1412676372.745848, "priority": "new", "message": "wdkzvsnsjcdvdlypphch", "severity": "maintenance", "name": "hail"}]';
        //    var jsonObj = JSON.parse(testData);
        //    jsonObj = [].concat(jsonObj);
        //    jsonObj.forEach(function (obj) {
        //
        //        if (obj.date) {
        //            obj.date = moment.utc(obj.date, 'X').format('hh:mm:ss DD-MM-YYYY');
        //        }
        //
        //        alarms.addAlarmMessage(obj);
        //    });
        //
        //    if (!$rootScope.$$phase) {
        //        $rootScope.$digest();
        //    }
        //    //test code alarms
        //
        //}, 250);


        vm.addAlarmMessage = function (message) {
            vm.messages.push(message);

            if (message.severity === 'unknown' ||
                message.severity === 'nominal' ||
                message.severity === 'maintenance') {
                message.ttl = 10000;
            }

            if (message.ttl && message.ttl !== -1) {
                $timeout(function () {
                    vm.deleteMessage(message);
                }, message.ttl);
            }
        };

        var unbindAlarmMessage = $rootScope.$on('alarmMessage', function (event, message) {
            vm.addAlarmMessage(message);

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

        $scope.$on('$destroy', unbindAlarmMessage);

        vm.acknowledgeMessage = function (message) {
            ControlService.acknowledgeAlarm(message.name);
            //todo: only delete this when the server returns with the updated alarm!
            //todo: show a loading icon then fade out
            vm.deleteMessage(message);
        };

        vm.knowMessage = function (message) {
            ControlService.addKnownAlarm(message.name);
            //todo: only delete this when the server returns with the updated alarm!
            //todo: show a loading icon then fade out
            vm.deleteMessage(message);
        };

        vm.deleteMessage = function (message) {
            var index = vm.messages.indexOf(message);
            if (index > -1) {
                vm.messages.splice(index, 1);
            }
        };
    }
})();


