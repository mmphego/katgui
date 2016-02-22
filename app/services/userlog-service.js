(function () {

    angular.module('katGui.services')
        .service('UserLogService', UserLogService);

    function UserLogService($http, $q, $rootScope, $window, $log, $filter, SERVER_URL, NotifyService) {

        var api = {};
        api.urlBase = SERVER_URL + '/katcontrol';
        api.userlogs = [];
        api.report_userlogs = [];
        api.activity_logs = [];
        api.focus_ulog = {};
        api.tags = [];
        api.taxonomies = [];
        api.file_url = "";

        api.getUserLog = function (ulog_id) {

            var def = $q.defer();
            $http(createRequest('get', api.urlBase + '/logs/' + ulog_id)).then(
                function (result) {

                    if (result && result.data) {
                        api.focus_ulog = result.data;
                        def.resolve();
                    } else {
                        $log.error('Could not retrieve requested userlog.');
                        def.reject();
                    }
                });
            return def.promise;
        };

        api.listUserLogs = function () {

            var deferred = $q.defer();
            $http(createRequest('get', api.urlBase + '/logs')).then(
                function (result) {

                    if (result && result.data) {
                        api.userlogs.splice(0, api.userlogs.length);
                        result.data.forEach(function (userlog) {
                            api.userlogs.push(userlog);
                        });
                        deferred.resolve();
                    } else {
                        $log.error('Could not retrieve any users.');
                        deferred.reject();
                    }
                }, function (error) {
                    NotifyService.showHttpErrorDialog('Could not retrieve any userlogs', error);
                    deferred.reject();
                });
            return deferred.promise;
        };

        api.listUserLogsForToday = function () {

            var deferred = $q.defer();
            var start = moment.utc().format('YYYY-MM-DD 00:00:00');
            var end = moment.utc().format('YYYY-MM-DD 23:59:59');
            var query = '?start_time=' + start + '&end_time=' + end;
            $http(createRequest('get', api.urlBase + '/logs/query' + query)).then(
                function (result) {

                    if (result && result.data) {
                        api.userlogs.splice(0, api.userlogs.length);
                        result.data.forEach(function (userlog) {
                            api.userlogs.push(userlog);
                        });
                        deferred.resolve();
                    } else {
                        $log.error('Could not retrieve any users.');
                        deferred.reject();
                    }
                }, function (error) {
                    NotifyService.showHttpErrorDialog('Could not retrieve any userlogs', error);
                    deferred.reject();
                });
            return deferred.promise;
        };

        api.listTags = function () {

            var def = $q.defer();
            $http(createRequest('get', api.urlBase + '/tags')).then(
                function (result) {

                    if (result && result.data) {
                        api.tags.splice(0, api.tags.length);
                        result.data.forEach(function (tag) {
                            api.tags.push(tag);
                        });
                        def.resolve();
                    } else {
                        $log.error('Could not retrieve any tags.');
                        def.reject();
                    }
                });
            return def.promise;
        };

        api.listTaxonomies = function () {

            var def = $q.defer();
            $http(createRequest('get', api.urlBase + '/taxonomies')).then(
                function (result) {

                    if (result && result.data) {
                        api.taxonomies.splice(0, api.taxonomies.length);
                        result.data.forEach(function (taxonomy) {
                            api.taxonomies.push(taxonomy);
                        });
                        def.resolve();
                    } else {
                        $log.error('Could not retrieve any taxonomies.');
                        def.reject();
                    }
                });
            return def.promise;
        };

        api.queryUserLogs = function (query) {
            var query_uri = encodeURI(query);
            $log.info("Query uri: " + query_uri);
            var defer = $q.defer();
            $http(createRequest('get', api.urlBase + '/logs/query' + query_uri))
                .then(function (result) {
                    api.report_userlogs.splice(0, api.report_userlogs.length);
                    result.data.forEach(function (userlog) {
                        userlog.timestamp = moment(userlog.timestamp).format('YYYY-DD-MM HH:mm:ss.SSS');
                        userlog.start_time = $filter('date')(new Date(userlog.start_time), 'yyyy-MM-dd HH:mm');
                        userlog.end_time = $filter('date')(new Date(userlog.end_time), 'yyyy-MM-dd HH:mm');
                        api.report_userlogs.push(userlog);
                    });
                    defer.resolve();
                }, function (result) {
                    NotifyService.showSimpleDialog("Could not retrieve any userlogs", result);
                    defer.reject();
                });
            return defer.promise;
        };

        api.queryActivityLogs = function (query) {
            var query_uri = encodeURI(query);
            $log.info("Activity Log Query uri: " + query_uri);
            var defer = $q.defer();
            $http(createRequest('get', api.urlBase + '/activity' + query_uri))
                .then(function (result) {
                    api.activity_logs.splice(0, api.activity_logs.length);
                    result.data.forEach(function (activitylog) {
                        api.activity_logs.push(activitylog);
                    });
                    defer.resolve();
                }, function (error) {
                    NotifyService.showHttpErrorDialog("Could not retrieve any activity logs", error);
                    defer.reject();
                });
            return defer.promise;
        };

        api.uploadFileToUrl = function (file, ulog_id) {
            var fd = new FormData();
            for (var i = 0; i < file.length; i++) {
                fd.append('filedata[]', file[i]);
            }
            $http.post(api.urlBase + '/logs/' + ulog_id + '/attachments', fd, {
                transformRequest: angular.identity,
                headers: {
                    'Content-Type': undefined,
                    'Authorization': 'CustomJWT ' + $rootScope.jwt
                }
            })
                .then(function () {
                    $log.info("Attachments uploaded!");
                }, function () {
                    $log.error(api.urlBase + '/log/attach/' + ulog_id);
                });
        };

        api.getFileFromUrl = function (file_name, file_alias, ulog_id) {
            $http.get(api.urlBase + '/logs/' + ulog_id + '/attachments/' + file_name, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'CustomJWT ' + $rootScope.jwt
                },
                responseType: 'blob'
            })
                .then(function (result) {
                    var blob = result.data;
                    var url = $window.URL || $window.webkitURL;
                    var file_url = url.createObjectURL(blob);
                    var downloadLink = angular.element('<a></a>');
                    downloadLink.attr('href', file_url);
                    downloadLink.attr('download', file_alias);
                    downloadLink[0].click();
                    url.revokeObjectURL(file_url);
                }, function () {
                    $log.error(api.urlBase + '/logs/get/attach');
                });
        };

        api.addUserLog = function (log) {
            var defer = $q.defer();
            $http(createRequest('post',
                api.urlBase + '/logs',
                {
                    user: log.user,
                    start_time: log.start_time,
                    end_time: log.end_time,
                    content: log.content,
                    tag_ids: log.tag_ids
                }))
                .then(function (result) {
                    NotifyService.showSimpleToast("Log Created. ");
                    defer.resolve(result);
                }, function (error) {
                    NotifyService.showHttpErrorDialog("Error creating user log", error);
                    defer.reject(error);
                });
            return defer.promise;
        };

        api.modifyUserLog = function (ulog) {
            var defer = $q.defer();
            $http(createRequest('put',
                api.urlBase + '/logs/' + ulog.id,
                {
                    start_time: ulog.start_time,
                    end_time: ulog.end_time,
                    content: ulog.content,
                    tags: ulog.tags,
                    metadata_to_del: ulog.metadata_to_del
                }))
                .then(function (result) {
                    ulog.id = result.data.id;
                    NotifyService.showSimpleToast("Edited userlog " + result.data.id);
                    defer.resolve(result);
                }, function (error) {
                    NotifyService.showHttpErrorDialog("Error editing user log", error);
                    defer.reject(error);
                });
            return defer.promise;
        };

        api.modifyTag = function (tag) {
            var defer = $q.defer();
            $http(createRequest('post',
                api.urlBase + '/tags/modify/' + tag.id,
                {
                    name: tag.name,
                    slug: tag.slug,
                    activated: tag.activated
                }))
                .then(function (result) {
                    NotifyService.showSimpleToast("Modified tag " + tag.id + ".");
                    defer.resolve(result);
                }, function (result) {
                    NotifyService.showSimpleDialog("Error modifying tag", result);
                    defer.reject(result);
                });
            return defer.promise;
        };

        api.createTag = function (tag) {
            var defer = $q.defer();
            $http(createRequest('post',
                api.urlBase + '/tags/add',
                {
                    name: tag.name,
                    slug: tag.slug,
                    activated: tag.activated
                }))
                .then(function (result) {
                    tag.id = result.data.id;
                    tag.name = tag.name;
                    tag.slug = tag.slug;
                    api.tags.push(tag);
                    NotifyService.showSimpleToast("Created tag " + tag.name + " id:" + result.data.id + ".");
                    defer.resolve(result);
                }, function (result) {
                    NotifyService.showSimpleDialog("Error creating tag", result);
                    defer.reject(result);
                });
            return defer.promise;
        };

        function createRequest(method, url, data) {
            var req = {
                method: method,
                url: url,
                headers: {
                    'Authorization': 'CustomJWT ' + $rootScope.jwt
                }
            };
            if ((data && method === 'post') || (data && method === 'put')) {
                req.headers['Content-Type'] = 'application/json';
                req.data = data;
            }
            return req;
        }

        api.receivedUserlogMessage = function (messageChannel, messageData) {
            $log.info(messageData);
            if (messageChannel === 'userlogs:add') {
                $rootScope.$apply(function () {
                    api.userlogs.push(messageData);
                });
            } else if (messageChannel === 'userlogs:modify') {
                debugger;
                var userlog = _.findWhere(api.userlogs, {id: messageData.id});
                if (userlog) {
                    debugger;
                    userlog.content = messageData.content;
                }
            } else {
                $log.error('Dangling Userlogs message: ' + messageData);
            }
        };

        return api;
    }

})();
