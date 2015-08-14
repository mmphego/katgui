(function () {

    angular.module('katGui')
        .directive('fileModel', ['$parse', function ($parse) {
            return {
                restrict: 'A',
                link: function(scope, element, attrs) {
                    var model = $parse(attrs.fileModel);
                    var modelSetter = model.assign;

                    element.bind('change', function(){
                        scope.$apply(function(){
                            modelSetter(scope, element[0].files);
                        });
                    });
                }
            };
        }])
        .controller('UserlogCtrl', UserlogCtrl);

    function UserlogCtrl($mdDialog, $rootScope, $filter, $log, $timeout, $window, $compile, UserLogService) {

        var vm = this;

        vm.orderByFields = [
            {label: 'Type', value: 'userlog_type'},
            {label: 'Start Time', value: 'start_time'},
            {label: 'End Time', value: 'end_time'},
            {label: 'Content', value: 'userlog_content'}
        ];

        vm.setOrderBy = function (column) {
            var newOrderBy = _.findWhere(vm.orderByFields, {value: column});
            if ((vm.orderBy || {}).value === column) {
                if (newOrderBy.reverse === undefined) {
                    newOrderBy.reverse = true;
                } else if (newOrderBy.reverse) {
                    newOrderBy.reverse = undefined;
                    newOrderBy = null;
                }
            }
            vm.orderBy = newOrderBy;
        };

        vm.setOrderBy('start_time');

        vm.blank_ulog = {
            id: "",
            user: "",
            userlog_type: "",
            start_time: "",
            end_time: "",
            userlog_content: "",
            tags: []
        };

        vm.blank_query = {
            userlog_type: "",
            start_time: "",
            end_time: ""
        };

        vm.onTimeSet = function (value, target, attribute) {
            target[attribute] = $filter('date')(value, 'yyyy-MM-dd HH:mm');
        };

        vm.exportPdf = function(reportStart, reportEnd){
            var pdf = new jsPDF('l', 'mm', 'a4');
            var report_markup = '<table id=basic-table border="1px" style="width:100%; font-family:verdana,arial,sans-serif; font-size:10px; padding:10px;">' +
            '<thead>' +
                '<tr>' +
                    '<th>Userlog Type</th>' +
                    '<th>Log Timestamp</th>' +
                    '<th>User</th>' +
                    '<th>Event Started</th>' +
                    '<th>Event Ended</th>' +
                    '<th>Userlog Content</th>' +
                '</tr>' +
            '</thead>';
            for (var ilog = 0; ilog < vm.report_userlogs.length; ilog++) {
                report_markup += '<tr>' +
                    '<td>' + vm.report_userlogs[ilog].userlog_type + '</td>' +
                    '<td>' + vm.report_userlogs[ilog].timestamp + '</td>' +
                    '<td>' + vm.report_userlogs[ilog].name + '</td>' +
                    '<td>' + vm.report_userlogs[ilog].start_time + '</td>' +
                    '<td>' + vm.report_userlogs[ilog].end_time + '</td>' +
                    '<td>' + vm.report_userlogs[ilog].userlog_content + '</td>' +
                    '</tr>';
            };
            report_markup += '</table>';

            pdf.setFontSize(20);
            pdf.text('Shift Report', 20, 25);
            pdf.setFontSize(12);
            pdf.text(('From: ' + reportStart + '     To: ' + reportEnd), 20, 50);
            var report_element = document.createElement('div');
            report_element.innerHTML = report_markup;
            var res = pdf.autoTableHtmlToJson(report_element.firstChild, true);
            pdf.autoTable(res.columns, res.data, {
                startY: 60,
                margins: {horizontal: 15, top: 25, bottom: 20},
                overflow: 'linebreak',
                padding: 2,
                lineHeight: 10
                }
            );
            var export_time = $filter('date')(new Date(), "yyyy-MM-dd_HH'h'mm");
            pdf.save('Shift_Report_' + export_time + '.pdf');
        };

        vm.getCompleteUserLog = function (ulog, userlogs, tags, event) {
            UserLogService.getUserLog(ulog.id).then(function () {
                vm.focused_ulog = UserLogService.focus_ulog;
                vm.editUserLog(vm.focused_ulog, userlogs, tags, event);
            });
        };

        vm.my_userlogs = UserLogService.my_userlogs;
        vm.getMyUserLogs = function () {
            if ($rootScope.currentUser) {
                UserLogService.listMyUserLogs($rootScope.currentUser.id);
            } else {
                $timeout(vm.getMyUserLogs, 1000);
            }
        };
        vm.getMyUserLogs();

        vm.tags = UserLogService.tags;
        vm.getTags = function () {
            UserLogService.listTags();
        };
        vm.getTags();

        vm.taxonomies = UserLogService.taxonomies;
        vm.getTaxonomies = function () {
            UserLogService.listTaxonomies();
        };

        vm.report_userlogs = UserLogService.report_userlogs;
        vm.queryUserlogs = function (event, b_query) {
            var query = "?";
            var log_type = b_query.userlog_type;
            var start_time = $filter('date')(b_query.start_time, 'yyyy-MM-dd HH:mm');
            var end_time = $filter('date')(b_query.end_time, 'yyyy-MM-dd HH:mm');
            if (log_type) {query += "log_type=" + log_type + "&"}
            if (start_time) {query += "start_time=" + start_time + "&"}
            if (end_time) {query += "end_time=" + end_time + "&"}
            UserLogService.queryUserLogs(query).then(function (result) {
                $log.info(result);
            });
        };

        vm.editUserLog = function (ulog, userlogs, tags, event) {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog, $filter) {
                        $scope.ulog = ulog;
                        if (!$scope.ulog.start_time) {
                            $scope.ulog.start_time = $filter('date')(new Date(), 'yyyy-MM-dd HH:mm');
                        }
                        if (!$scope.ulog.end_time) {
                            var now = new Date();
                            now.setHours(now.getHours() + 1);
                            $scope.ulog.end_time = $filter('date')(now, 'yyyy-MM-dd HH:mm');
                        }
                        $log.info('Updated focus log: ' + JSON.stringify(ulog));
                        $scope.tags = tags;
                        $scope.selectedItem = null;
                        $scope.searchText = null;
                        $scope.selectedTags = ulog.tags;
                        $log.info('Tags already on log: ' + JSON.stringify(ulog.tags));
                        $scope.chosen_tags = [];
                        $log.info('Tags fetched from db: ' + JSON.stringify(tags));
                        $scope.add_tag_from_list = function (listed_tag) {
                            $scope.selectedTags.push(listed_tag);
                        };
                        $scope.hide = function () {
                            $mdDialog.hide();
                        };
                        $scope.add = function () {
                            var userlog_entry = {
                                id: ulog.id,
                                user: $rootScope.currentUser.id,
                                userlog_type: ulog.userlog_type,
                                start_time: $filter('date')(ulog.start_time, 'yyyy-MM-dd HH:mm'),
                                end_time: $filter('date')(ulog.end_time, 'yyyy-MM-dd HH:mm'),
                                userlog_content: ulog.userlog_content,
                                tags: $scope.chosen_tags,
                            };
                            $scope.tagFix();
                            var file = $scope.myFile;
                            ulog = userlog_entry;
                            if (ulog.id) {
                                $log.info('Tag list sent to server: ' + $scope.chosen_tags);
                                UserLogService.modifyUserLog(ulog).then(function () {
                                    if (file) {
                                        $log.info('File is: ' + JSON.stringify(file));
                                        UserLogService.uploadFileToUrl(file, ulog.id);
                                    }
                                    UserLogService.listMyUserLogs(ulog.user);
                                });
                            } else {
                                $log.info('Tag list sent to server: ' + $scope.chosen_tags);
                                UserLogService.addUserLog(ulog).then(function () {
                                    if (file) {
                                        $log.info('File is: ' + JSON.stringify(file));
                                        UserLogService.uploadFileToUrl(file, ulog.id);
                                    }
                                    UserLogService.listMyUserLogs(ulog.user);
                                });
                            }
                            $log.info('Posted log: ' + JSON.stringify(ulog));
                            $scope.hide();
                        };
                        $scope.querySearch = function (query) {
                            var results = query ? $scope.tags.filter($scope.createFilterFor(query)) : [];
                            return results;
                        };
                        $scope.createFilterFor = function (query) {
                            return function filterFn(tag) {
                                return (tag.name.indexOf(query) === 0);
                            };
                        };
                        $scope.tagFix = function () {
                            $scope.selectedTags.forEach(function (tag) {
                                $log.info('tag: ' + JSON.stringify(tag));
                                if (tag.name) {
                                    $scope.chosen_tags.push(tag.name);
                                }
                            });
                            $log.info('Selected tag objects: ' + JSON.stringify($scope.selectedTags));
                        };
                        $scope.onTimeSet = function (value, target, attribute) {
                            target[attribute] = $filter('date')(value, 'yyyy-MM-dd HH:mm');
                        };
                        $scope.file_url = UserLogService.file_url;
                        $scope.getFile = function(downloadPath, name, ulog_id) {
                            UserLogService.getFileFromUrl(downloadPath, name, ulog_id);
                        };
                    },
                    templateUrl: 'app/userlogs/userlogdialog.tmpl.html',
                    targetEvent: event
                })
                .then(function() {
                    vm.blank_ulog = {
                        id: "",
                        user: "",
                        userlog_type: "",
                        start_time: "",
                        end_time: "",
                        userlog_content: "",
                        tags: []
                    };
                    $log.info('Closing userlog editing dialog');
                });
        };
    }
})();
