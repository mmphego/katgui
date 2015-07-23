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

    function UserlogCtrl($scope, UserLogService, $mdDialog, $rootScope, $filter, $log) {

        var vm = this;

        var blank_tags = [];

        $scope.blank_ulog = {
            id: "",
            user: "",
            userlog_type: "",
            start_time: "",
            end_time: "",
            userlog_content: "",
            tags: blank_tags,
        };

        $scope.blank_query = {
            userlog_type: "",
            start_time: "",
            end_time: "",
        };


        $scope.getCompleteUserLog = function (ulog, userlogs, event) {
            $scope.fetchUserlogProcessingServerCall = true;
            UserLogService.getUserLog(ulog.id).then(function () {
                $scope.focused_ulog = UserLogService.focus_ulog;
                $scope.editUserLog($scope.focused_ulog, userlogs, event);
                $scope.fetchUserlogProcessingServerCall = false;
            });
        };


        $scope.userlogs = UserLogService.userlogs;
        $scope.getUserLogs = function (event) {
            $scope.userListProcessingServerCall = true;
            UserLogService.listUserLogs().then(function () {
                $scope.userListProcessingServerCall = false;
            });
        };


        $scope.my_userlogs = UserLogService.my_userlogs;
        $scope.getMyUserLogs = function (event) {
            var user = $rootScope.currentUser.id;
            $log.info('Fetching logs for user: ' + user);
            $scope.myLogsProcessingServerCall = true;
            UserLogService.listMyUserLogs(user).then(function () {
                $scope.myLogsProcessingServerCall = false;
            });
        };


        $scope.tags = UserLogService.tags;
        $scope.getTags = function () {
            $scope.tagListProcessingServerCall = true;
            UserLogService.listTags().then(function () {
                $scope.tagListProcessingServerCall = false;
            });
        };
        $scope.getTags();


        $scope.taxonomies = UserLogService.taxonomies;
        $scope.getTaxonomies = function (event) {
            $scope.taxonomyListProcessingServerCall = true;
            UserLogService.listTaxonomies().then(function () {
                $scope.taxonomyListProcessingServerCall = false;
            });
        };


        $scope.report_userlogs = UserLogService.report_userlogs;
        $scope.queryUserlogs = function (event, b_query) {
            var query = "?";
            var log_type = b_query.userlog_type;
            var start_time = $filter('date')(b_query.start_time, 'yyyy-MM-dd HH:mm');
            var end_time = $filter('date')(b_query.end_time, 'yyyy-MM-dd HH:mm');
            if (log_type) {query += "log_type=" + log_type + "&"}
            if (start_time) {query += "start_time=" + start_time + "&"}
            if (end_time) {query += "end_time=" + end_time + "&"}
            UserLogService.queryUserLogs(query).then(function () {
                $scope.userlogs = $scope.report_userlogs;
            });
        };


        $scope.editUserLog = function (ulog, userlogs, tags, event) {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog, $filter, $timeout, $q) {
                        $scope.themePrimary = $rootScope.themePrimary;
                        $scope.themePrimaryButtons = $rootScope.themePrimaryButtons;
                        $scope.ulog = ulog;
                        $log.info('Updated focus log: ' + JSON.stringify(ulog));
                        $scope.userlogs = userlogs;
                        $scope.tags = tags;
                        $scope.selectedItem = null;
                        $scope.searchText = null;
                        $scope.selectedTags = ulog.tags;
                        $log.info('Tags already on log: ' + JSON.stringify(ulog.tags));
                        $scope.chosen_tags = [];
                        $log.info('Tags fetched from db: ' + JSON.stringify(tags));
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
                        $scope.file_url = UserLogService.file_url;
                        $scope.getFile = function(downloadPath, name, ulog_id) {
                            UserLogService.getFileFromUrl(downloadPath, name, ulog_id);
                        };
                    },
                    templateUrl: 'app/userlogs/userlogdialog.tmpl.html',
                    targetEvent: event
                })
                .then(function(userlog_entry) {
                    $scope.blank_ulog = {
                        id: "",
                        user: "",
                        userlog_type: "",
                        start_time: "",
                        end_time: "",
                        userlog_content: "",
                        tags: blank_tags,
                    };
                    $log.info('Closing userlog editing dialog');   
                });
        };
    }
})();
