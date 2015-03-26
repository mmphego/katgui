(function () {

    angular.module('katGui.alarms')
        .controller('AlarmsNotifyCtrl', AlarmsNotifyCtrl)
        .directive('alarmsNotifier', AlarmDirective);

    function AlarmDirective() {
        return {
            restrict: 'E',
            template: [
            '<div ng-show="showAlarms" layout="column" layout-align="start end" class="alarms-notify-list">',
            '   <div class="alarm-item large-alarms-animate" ng-repeat="alarm in $root.alarmsData | filter:{priority:\'new\'} | orderBy:\'dateUnix\'" ng-show="!alarm.hidden"' +
            '       ng-class="{\'large-alarm-item\': hover || showLargeAlarms, ' +
            '                   \'small-alarm-item\': !hover && !showLargeAlarms, ' +
            '                   \'alarm-critical\': alarm.severity === \'critical\', ' +
            '                   \'alarm-error\': alarm.severity === \'error\', ' +
            '                   \'alarm-warning\': alarm.severity === \'warn\', ' +
            '                   \'alarm-maintenance\': alarm.severity === \'maintenance\', ' +
            '                   \'alarm-info\': alarm.severity === \'info\', ' +
            '                   \'alarm-nominal\': alarm.severity === \'nominal\', ' +
            '                   \'alarm-unknown\': alarm.severity === \'unknown\'}" ' +
            '                   title="{{showLargeAlarms? alarm.value : alarm.date + \' --- \' + alarm.severity + \' --- \' + alarm.value}}">',
                //'       ng-mouseover="hover = true;" ng-mouseleave="hover = false;" title="{{alarm.value}}">',
            '       <div>',
            '           <ul>',
            '               <li class="li-inline"><md-button class="alarm-close" aria-label="Hide Alarm Notification" title="Hide Alarm Notification" ng-click="vm.hideAlarmNotification(alarm)"><span class="fa fa-eye-slash"></span></md-button></li>',
            '               <li class="li-inline"><md-button class="alarm-close" aria-label="Acknowledge Alarm" title="Acknowledge Alarm" ng-click="vm.acknowledgeMessage(alarm)">Ack</md-button></li>',
            '               <li class="li-inline"><md-button class="alarm-close" aria-label="Know Alarm" title="Know Alarm" ng-click="vm.knowMessage(alarm)">Know</md-button></li>',
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
            replace: true,
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

        vm.hideAlarmNotification = function (message) {
            message.hidden = true;
        };
    }
})();


