(function () {

    angular.module('katGui.alarms')
        .controller('AlarmsNotifyCtrl', AlarmsNotifyCtrl)
        .directive('alarmsNotifier', AlarmDirective);

    function AlarmDirective() {
        return {
            restrict: 'A',
            template: [
            '<div ng-show="showAlarms" class="alarms-notify-list">',
            '   <div class="alarm-item large-alarms-animate" ng-repeat="alarm in $root.alarmsData | orderBy:\'dateUnix\'" ng-if="alarm.priority === \'new\'" ' +
            '       ng-class="{\'large-alarm-item\': hover || showLargeAlarms, ' +
            '                   \'small-alarm-item\': !hover && !showLargeAlarms, ' +
            '                   \'alarm-critical\': alarm.severity === \'critical\', ' +
            '                   \'alarm-error\': alarm.severity === \'error\', ' +
            '                   \'alarm-warning\': alarm.severity === \'warn\', ' +
            '                   \'alarm-maintenance\': alarm.severity === \'maintenance\', ' +
            '                   \'alarm-info\': alarm.severity === \'info\', ' +
            '                   \'alarm-nominal\': alarm.severity === \'nominal\', ' +
            '                   \'alarm-unknown\': alarm.severity === \'unknown\'}" ' +
            '       ng-mouseover="hover = true;" ng-mouseleave="hover = false;" title="{{alarm.message}}">',
            '       <div>',
            '           <ul>',
            '               <li class="li-inline"><button class="alarm-close" ng-click="vm.acknowledgeMessage(alarm)">Ack</button></li>',
            '               <li class="li-inline"><button class="alarm-close" ng-click="vm.knowMessage(alarm)">Knw</button></li>',
            '           </ul>',
            '       </div>',
            '       <div class="datestamp"><span>{{alarm.date}}</span></div>',
            '       <div class="severitystamp"><span>{{alarm.severity}}</span></div>',
            '       <div><span class="alarm-message-name">{{alarm.name}}</span>',
            '       <div class="alarm-message"><span>{{alarm.value}}</span></div>',
            '       </div>',
            '   </div>',
            '</div>'
            ].join(''),
            replace: false,
            scope: true,
            controller: 'AlarmsNotifyCtrl as vm'
        };
    }

    function AlarmsNotifyCtrl(ControlService) {

        var vm = this;

        vm.acknowledgeMessage = function (message) {
            ControlService.acknowledgeAlarm(message.name);
        };

        vm.knowMessage = function (message) {
            ControlService.addKnownAlarm(message.name);
        };
    }
})();


