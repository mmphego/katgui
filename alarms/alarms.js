//var mockData = [
//    {date: moment(new Date()).format('DD/MM/YYYY hh:mm:ss'), name: 'testAlarm', severity: 'severity', priority: 'priority', message: 'message' },
//    {date: moment(new Date()).format('DD/MM/YYYY hh:mm:ss'), name: 'testAlarm', severity: 'severity', priority: 'priority', message: 'message' },
//    {date: moment(new Date()).format('DD/MM/YYYY hh:mm:ss'), name: 'testAlarm', severity: 'severity', priority: 'priority', message: 'message' },
//    {date: moment(new Date()).format('DD/MM/YYYY hh:mm:ss'), name: 'testAlarm', severity: 'severity', priority: 'priority', message: 'message' },
//    {date: moment(new Date()).format('DD/MM/YYYY hh:mm:ss'), name: 'testAlarm', severity: 'severity', priority: 'priority', message: 'message' },
//    {date: moment(new Date()).format('DD/MM/YYYY hh:mm:ss'), name: 'testAlarm', severity: 'severity', priority: 'priority', message: 'message' },
//    {date: moment(new Date()).format('DD/MM/YYYY hh:mm:ss'), name: 'testAlarm', severity: 'severity', priority: 'priority', message: 'message' },
//    {date: moment(new Date()).format('DD/MM/YYYY hh:mm:ss'), name: 'testAlarm', severity: 'severity', priority: 'priority', message: 'message' }
//];


angular.module('katGui')

    .controller('AlarmsCtrl', function ($scope, alarms) {

//        $scope.alarmsData = mockData;
        $scope.selectAll = false;

        $scope.$watch('selectAll', function (newVal) {

            if ($scope.alarmsData) {
                $scope.alarmsData.forEach(function (alarm) {
                    if (alarm.selected !== newVal) {
                        alarm.selected = newVal;
                    }
                });
            }
        });

        $scope.addAlarmTest = function () {

            alarms.addErrorMessage('error message');
            alarms.addInfoMessage('info message');
            alarms.addWarnMessage('warn message');
            alarms.addSuccessMessage('success message');
        };

    });