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

    function UserlogCtrl($mdDialog, $rootScope, $filter, $log, $timeout, UserLogService) {

        var vm = this;

        vm.orderByFields = [
            {label: 'Start Time', value: 'start_time'},
            {label: 'Timestamp', value: 'timestamp'},
            {label: 'End Time', value: 'end_time'},
            {label: 'Content', value: 'userlog_content'}
        ];

        vm.orderByUserLogsFields = [
            {label: 'Start Time', value: 'start_time'},
            {label: 'Timestamp', value: 'timestamp'},
            {label: 'Name', value: 'name'},
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
            start_time: "",
            end_time: "",
            userlog_content: "",
            tags: []
        };

        vm.blank_query = {
            start_time: "",
            end_time: ""
        };

        vm.onTimeSet = function (value, target, attribute) {
            target[attribute] = $filter('date')(value, 'yyyy-MM-dd HH:mm');
        };

        vm.activity_logs = UserLogService.activity_logs;
        vm.include_activity_logs = false;
        vm.exportPdf = function(reportStart, reportEnd){
            var pdf = new jsPDF('l', 'mm', 'a4');
            var export_time = $filter('date')(new Date(), "yyyy-MM-dd_HH'h'mm");
            var start_time = $filter('date')(reportStart, 'yyyy-MM-dd HH:mm');
            var end_time = $filter('date')(reportEnd, 'yyyy-MM-dd HH:mm');
            var a_query = "?";
            if (start_time) {a_query += "start_time=" + start_time + "&";}
            if (end_time) {a_query += "end_time=" + end_time + "&";}

            UserLogService.queryUserLogs(a_query).then(function (result) {
                var report_markup = '<table id=basic-table border="1px" style="width:100%; font-family:verdana,arial,sans-serif;">' +
                '<thead>' +
                    '<tr>' +
                        '<th>Log Timestamp</th>' +
                        '<th>User</th>' +
                        '<th>Event Started</th>' +
                        '<th>Event Ended</th>' +
                        '<th>Userlog Content</th>' +
                    '</tr>' +
                '</thead>';

                vm.filtered_report_userlogs.forEach(function (item) {
                    report_markup += '<tr>' +
                    '<td>' + item.timestamp + '</td>' +
                    '<td>' + item.name + '</td>' +
                    '<td>' + item.start_time + '</td>' +
                    '<td>' + item.end_time + '</td>' +
                    '<td>' + item.userlog_content + '</td>' +
                    '</tr>';
                });

                report_markup += '</table>';

                pdf.setFontSize(20);
                pdf.text('Userlog Report - ' + export_time, 20, 25);
                pdf.setFontSize(12);
                pdf.setFontSize(12);
                pdf.text(('From: ' + reportStart + '     To: ' + reportEnd), 20, 45);
                var report_element = document.createElement('div');
                report_element.innerHTML = report_markup;
                var res = pdf.autoTableHtmlToJson(report_element.firstChild, true);
                pdf.autoTable(res.columns, res.data, {
                    startY: 60,
                    margins: {horizontal: 15, top: 25, bottom: 20},
                    overflow: 'linebreak',
                    padding: 2,
                    lineHeight: 10,
                    fontSize: 8
                    }
                );
            }).then(function (result) {
                if (vm.include_activity_logs) {
                    var columns = [{title: "System Activity Logs", key: "msg"}];

                    UserLogService.queryActivityLogs(a_query).then(function (result) {
                        pdf.autoTable(columns, vm.activity_logs, {
                            startY: pdf.autoTableEndPosY() + 50,
                            margins: {horizontal: 15, top: 25, bottom: 20},
                            overflow: 'linebreak',
                            padding: 1,
                            lineHeight: 9,
                            fontSize: 7
                            }
                        );
                        pdf.save('Userlog_Report_' + export_time + '.pdf');
                    });
                } else {
                    pdf.save('Userlog_Report_' + export_time + '.pdf');
                }
            });
        };

        vm.getCompleteUserLog = function (ulog, userlogs, event) {
            UserLogService.getUserLog(ulog.id).then(function () {
                vm.focused_ulog = UserLogService.focus_ulog;
                vm.editUserLog(vm.focused_ulog, userlogs, vm.tags, event);
            });
        };

        vm.getCompleteUserLogView = function (ulog, userlogs, event) {
            UserLogService.getUserLog(ulog.id).then(function () {
                vm.focused_ulog = UserLogService.focus_ulog;
                vm.viewUserLog(vm.focused_ulog, userlogs, vm.tags, event);
            });
        };

        vm.my_userlogs = UserLogService.my_userlogs;
        vm.getMyUserLogs = function () {
            if ($rootScope.currentUser) {
                UserLogService.listUserLogs();
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

        vm.selectedItem = null;
        vm.searchText = null;
        vm.tagChips = [];
        vm.chosen_tags = [];
        vm.add_tag_from_list = function (listed_tag) {
            vm.tagChips.push(listed_tag);
        };

        vm.querySearch = function (query) {
            var results = query ? vm.tags.filter(vm.createFilterFor(query)) : [];
            return results;
        };

        vm.createFilterFor = function (query) {
            return function filterFn(tag) {
                return (tag.name.indexOf(query) === 0);
            };
        };

        vm.chipsToList = function () {
            vm.chosen_tags.splice(0, vm.chosen_tags.length);
            vm.tagChips.forEach(function (tag) {
                $log.info('tag: ' + JSON.stringify(tag));
                if (tag.name) {
                    vm.chosen_tags.push(tag.name);
                }
            });
        };

        vm.taxonomies = UserLogService.taxonomies;
        vm.getTaxonomies = function () {
            UserLogService.listTaxonomies();
        };

        vm.queryUserlogs = function (event, b_query) {
            var query = "?";
            var start_time = $filter('date')(b_query.start_time, 'yyyy-MM-dd HH:mm');
            var end_time = $filter('date')(b_query.end_time, 'yyyy-MM-dd HH:mm');
            vm.chipsToList();
            if (start_time) {query += "start_time=" + start_time + "&";}
            if (end_time) {query += "end_time=" + end_time + "&";}
            if (vm.chosen_tags.length > 0) {query += "tags=" + vm.chosen_tags + "&";}
            UserLogService.queryUserLogs(query).then(function (result) {
                vm.report_userlogs = UserLogService.report_userlogs;
                $log.info('User log query result length: ' + vm.report_userlogs.length);
            });
        };

        vm.viewUserLog = function (ulog, userlogs, tags, event) {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog, $filter, UserLogService, $log) {
                        $scope.ulog = ulog;
                        $scope.readonly = true;
                        $log.info('Updated focus log: ' + JSON.stringify(ulog));
                        $scope.tags = tags;
                        $scope.selectedTags = ulog.tags;
                        $log.info('Tags already on log: ' + JSON.stringify(ulog.tags));
                        $scope.hide = function () {
                            $mdDialog.hide();
                        };
                        $scope.file_url = UserLogService.file_url;
                        $scope.getFile = function(downloadPath, name, ulog_id) {
                            UserLogService.getFileFromUrl(downloadPath, name, ulog_id);
                        };
                    },
                    templateUrl: 'app/userlogs/userlogpreview.tmpl.html',
                    targetEvent: event
                })
                .then(function() {
                    vm.blank_ulog = {
                        id: "",
                        user: "",
                        start_time: "",
                        end_time: "",
                        userlog_content: "",
                        tags: []
                    };
                });
        };

        vm.editUserLog = function (ulog, userlogs, tags, event) {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog, $filter, UserLogService, $log) {
                        $scope.ulog = ulog;
                        $scope.metadata_to_del = [];
                        $scope.toggle = function (item, list) {
                            var idx = list.indexOf(item);
                            if (idx > -1) {
                                list.splice(idx, 1);
                            }
                            else {
                                list.push(item);
                            }
                        };
                        $scope.exists = function (item, list) {
                            return list.indexOf(item) > -1;
                        };
                        $log.info('Updated focus log: ' + JSON.stringify(ulog));
                        $scope.tags = tags;
                        $scope.selectedItem = null;
                        $scope.searchText = null;
                        $scope.selectedTags = ulog.tags;
                        $log.info('Tags already on log: ' + JSON.stringify(ulog.tags));
                        $scope.chosen_tags = [];
                        $scope.add_tag_from_list = function (listed_tag) {
                            $scope.selectedTags.push(listed_tag);
                        };
                        $scope.unbindTagWatch = $scope.$watchCollection('selectedTags', function (newVal, oldVal) {
                            if (newVal !== oldVal) {
                                $scope.selectedTags = $scope.selectedTags.filter(function (item) {
                                    return item.name && item.name.length > 0;
                                });
                                $scope.selectedTags = _.uniq($scope.selectedTags, function (item) {
                                   return item.name;
                                });
                            }
                        });

                        $scope.hide = function () {
                            $mdDialog.hide();
                        };
                        $scope.add = function () {
                            var userlog_entry = {
                                id: ulog.id,
                                user: $rootScope.currentUser.id,
                                start_time: $filter('date')(ulog.start_time, 'yyyy-MM-dd HH:mm'),
                                end_time: $filter('date')(ulog.end_time, 'yyyy-MM-dd HH:mm'),
                                userlog_content: ulog.userlog_content,
                                tags: $scope.chosen_tags,
                                metadata_to_del: $scope.metadata_to_del
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
                        };
                        $scope.onTimeSet = function (value, target, attribute) {
                            target[attribute] = $filter('date')(value, 'yyyy-MM-dd HH:mm');
                                if (ulog.start_time <= ulog.end_time) {
                                    $scope.endDateTimeError = false;
                                } else {
                                    $scope.endDateTimeError = true;
                                }
                        };
                        $scope.onTimeChange = function () {
                            if (ulog.start_time <= ulog.end_time) {
                                $scope.endDateTimeError = false;
                            } else {
                                $scope.endDateTimeError = true;
                            }
                        };
                        $scope.file_url = UserLogService.file_url;
                        $scope.getFile = function(downloadPath, name, ulog_id) {
                            UserLogService.getFileFromUrl(downloadPath, name, ulog_id);
                        };
                        $scope.$on('destroy', function () {
                            $scope.unbindTagWatch();
                        });
                    },
                    templateUrl: 'app/userlogs/userlogdialog.tmpl.html',
                    targetEvent: event
                })
                .then(function() {
                    vm.blank_ulog = {
                        id: "",
                        user: "",
                        start_time: "",
                        end_time: "",
                        userlog_content: "",
                        tags: []
                    };
                });
        };
    }
})();
