(function () {

    angular.module('katGui')
        .controller('UtilisationReportCtrl', UtilisationReportCtrl);

        function UtilisationReportCtrl($rootScope, $scope, $localStorage, $filter, DataService,
                                    $log, $stateParams, NotifyService, $timeout, $state) {

            var vm = this;
            var DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
            vm.startTime = new Date();
            vm.endTime = vm.startTime;
            vm.startDatetimeReadable = moment(vm.startTime.getTime()).format('YYYY-MM-DD 00:00:00');
            vm.endDatetimeReadable = moment(vm.endTime.getTime()).format('YYYY-MM-DD 23:59:59');
            vm.reportItems = [];

            if ($stateParams.filter) {
                vm.searchInputText = $stateParams.filter;
            }

            vm.reportFields = [
                {label: 'Start Time', value: 'start_time'},
                {label: 'Name', value: 'user.name'},
                {label: 'End Time', value: 'end_time'},
                {label: 'Content', value: 'content'}
            ];

            vm.onStartTimeSet = function () {
                vm.startDatetimeReadable = moment(vm.startTime.getTime()).format(DATETIME_FORMAT);
            };

            vm.onEndTimeSet = function () {
                vm.endDatetimeReadable = moment(vm.endTime.getTime()).format(DATETIME_FORMAT);
            };

            // vm.exportPdf = function(){
            //     vm.exportingPdf = true;
            //     var pdf = new jsPDF('l', 'pt');
            //     var exportTime = moment.utc().format(DATETIME_FORMAT);
            //     var query = "?start_time=" + vm.startDatetimeReadable + "&end_time=" + vm.endDatetimeReadable;
            //
            //     vm.filteredReportUserlogs.forEach(function (userlog) {
            //         userlog.userName = userlog.user.name;
            //         var tagNames = [];
            //         userlog.tags.forEach(function (tag) {
            //             tagNames.push(tag.name);
            //         });
            //         userlog.tag_list = tagNames.join(',');
            //     });
            //
            //     var columns = [
            //         {title: "User", dataKey: "userName"},
            //         {title: "Start", dataKey: "start_time"},
            //         {title: "End", dataKey: "end_time"},
            //         {title: "Content", dataKey: "content"},
            //         {title: "Tags", dataKey: "tag_list"}
            //     ];
            //
            //     pdf.setFontSize(20);
            //     pdf.text('Userlog Report - ' + exportTime + ' (UTC)', 20, 25);
            //     pdf.setFontSize(12);
            //     pdf.setFontSize(12);
            //     pdf.text(('From: ' + vm.startDatetimeReadable + '     To: ' + vm.endDatetimeReadable), 20, 45);
            //
            //     pdf.autoTable(columns, vm.filteredReportUserlogs, {
            //         startY: 55,
            //         theme: 'striped',
            //         margin: {top: 8, bottom: 8},
            //         columnStyles: {
            //             userName: {columnWidth: 80, overflow: 'linebreak'},
            //             start_time: {columnWidth: 120},
            //             end_time: {columnWidth: 120},
            //             content: {overflow: 'linebreak'},
            //             tag_list: {overflow: 'linebreak'}}});
            //
            //     if (vm.includeActivityLogs) {
            //         columns = [{title: "System Activity Logs", key: "msg"}];
            //
            //         UserLogService.queryActivityLogs(query).then(
            //             function (result) {
            //                 pdf.autoTable(columns, result.data, {
            //                     startY: pdf.autoTableEndPosY() + 50,
            //                     theme: 'striped',
            //                     margin: {top: 8, bottom: 8}});
            //                 pdf.save('Userlog_Report_' + exportTime.replace(/ /g, '.') + '.pdf');
            //                 vm.exportingPdf = false;
            //             }, function (error) {
            //                 $log.error(error);
            //                 vm.exportingPdf = false;
            //             });
            //     } else {
            //         pdf.save('Userlog_Report_' + exportTime.replace(/ /g, '.') + '.pdf');
            //         vm.exportingPdf = false;
            //     }
            // };

            vm.createReport = function () {
                $state.go('utilisation-report', {
                        startTime: vm.startDatetimeReadable,
                        endTime: vm.endDatetimeReadable,
                        filter: vm.searchInputText},
                        { notify: false, reload: false });
                vm.results = [];
                var startDate = moment(vm.startDatetimeReadable).toDate().getTime();
                var endDate =  moment(vm.endDatetimeReadable).toDate().getTime();
                DataService.sampleValueDuration(vm.searchInputText, startDate, endDate).then(function (result) {
                    $log.info(result);
                    if (result.data) {
                        vm.results = result.data;
                    }
                });
            };

            vm.afterInit = function() {
                $timeout(function () {
                    var startTimeParam = moment($stateParams.startTime, DATETIME_FORMAT, true);
                    var endTimeParam = moment($stateParams.startTime, DATETIME_FORMAT, true);
                    if (startTimeParam.isValid() && endTimeParam.isValid()) {
                        vm.startTime = startTimeParam.toDate();
                        vm.endTime = endTimeParam.toDate();
                        vm.startDatetimeReadable = $stateParams.startTime;
                        vm.endDatetimeReadable = $stateParams.endTime;

                        // vm.createReport();
                    } else if ($stateParams.startTime && $stateParams.endTime) {
                        NotifyService.showSimpleDialog('Invalid Datetime URL Parameters',
                            'Invalid datetime strings: ' + $stateParams.startTime + ' or ' + $stateParams.endTime + '. Format should be ' + DATETIME_FORMAT);
                    }
                }, 1000);
            };

            if ($rootScope.currentUser) {
                vm.afterInit();
            } else {
                vm.unbindLoginSuccess = $rootScope.$on('loginSuccess', vm.afterInit);
            }

            vm.momentDuration = function (seconds) {
                return moment.duration(seconds, 's').humanize();
            };

            $scope.$on('$destroy', function () {
                if (vm.unbindLoginSuccess) {
                    vm.unbindLoginSuccess();
                }
            });
        }
})();
