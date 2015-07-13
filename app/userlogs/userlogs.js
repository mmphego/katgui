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

    function UserlogCtrl($scope, UserLogService, $mdDialog, $rootScope, $filter) {

        var vm = this;
        $scope.users = [{
            firstName: 'Obi-Wan',
            lastName: 'Kenobi'
        }, {
            firstName: 'Boba',
            lastName: 'Fett'
        }, {
            firstName: 'Han',
            lastName: 'Solo'
        }];
        
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
            var query = {};
            var log_type = false; //b_query.userlog_type;
            var start_time = $filter('date')(b_query.start_time, 'yyyy-MM-dd HH:mm');
            var end_time = $filter('date')(b_query.end_time, 'yyyy-MM-dd HH:mm');
            if (log_type) {query.log_type = log_type;}
            if (start_time) {query.start_time = start_time;}
            if (end_time) {query.end_time = end_time;}
            console.log('Updated query: ' + JSON.stringify(query));
            UserLogService.queryUserLogs(query);
        };



        $scope.editUserLog = function (ulog, userlogs, tags, event) {
            $mdDialog
                .show({
                    controller: function ($rootScope, $scope, $mdDialog, $filter, $timeout, $q) {
                        $scope.themePrimary = $rootScope.themePrimary;
                        $scope.themePrimaryButtons = $rootScope.themePrimaryButtons;
                        $scope.ulog = ulog;
                        console.log('Updated focus log: ' + JSON.stringify(ulog));
                        $scope.userlogs = userlogs;
                        $scope.tags = tags;
                        $scope.selectedItem = null;
                        $scope.searchText = null;
                        $scope.selectedTags = ulog.tags;
                        console.log('Tags already on log: ' + JSON.stringify(ulog.tags));
                        $scope.chosen_tags = [];
                        console.log('Tags fetched from db: ' + JSON.stringify(tags));
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
                                console.log('Tag list sent to server: ' + $scope.chosen_tags);
                                //UserLogService.modifyUserLog(ulog).then(function () {
                                //    if (file) {
                                //        console.log('File is: ' + JSON.stringify(file));
                                //        UserLogService.uploadFileToUrl(file, ulog.id);
                                //    }
                                //    UserLogService.listUserLogs();
                                //});
                            } else {
                                console.log('Tag list sent to server: ' + $scope.chosen_tags);
                                //UserLogService.addUserLog(ulog).then(function () {
                                //    if (file) {
                                //        console.log('File is: ' + JSON.stringify(file));
                                //        UserLogService.uploadFileToUrl(file, ulog.id);
                                //    }
                                //    UserLogService.listUserLogs();
                                //});
                            }
                            console.log('Posted log: ' + JSON.stringify(ulog));
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
                                console.log('tag: ' + JSON.stringify(tag));
                                if (tag.name) {
                                    $scope.chosen_tags.push(tag.name);
                                }
                            });
                            console.log('Selected tag objects: ' + JSON.stringify($scope.selectedTags));
                        };
                        $scope.file_url = UserLogService.file_url;
                        $scope.getFile = function(downloadPath, name) {
                            UserLogService.getFileFromUrl(downloadPath, name)
                        };
                    },
                    template: '<md-dialog md-theme="{{themePrimary}}" flex-sm="100" flex-gt-sm="150" flex-gt-md="150" flex-gt-lg="150" class="md-whiteframe-z1" style ="overflow:visible; height: 800px">' +
                        '<md-toolbar><div style="padding-left: 20px; padding-top: 10px;"><p>User Log Editor</p></div></md-toolbar>' +
                        '<md-dialog-content class="md-padding" style ="overflow:visible" layout="column">' +
                        '<div layout="row">' +
                        '  <div class="dropdown" flex="30">' +
                        '       <a class="dropdown-toggle" id="dropdown2" role="button" data-toggle="dropdown" data-target="#" href="#">' +
                        '           <label>Start time: </label><div class="input-group"><input type="text" class="form-control" data-ng-model="ulog.start_time"><span class="input-group-addon"><i class="fa fa-calendar"></i></span>' +
                        '           </div>' +
                        '       </a>' +
                        '       <ul class="dropdown-menu" role="menu" aria-labelledby="dLabel">' +
                        '           <datetimepicker style="color:slategray;" data-ng-model="ulog.start_time" data-datetimepicker-config="{ dropdownSelector: &apos;#dropdown2&apos; }"/>' +
                        '       </ul>' +
                        '   </div>' +
                        '   <div flex="15"></div>' +
                        '  <div class="dropdown" flex="30">' +
                        '       <a class="dropdown-toggle" id="dropdown4" role="button" data-toggle="dropdown" data-target="#" href="#">' +
                        '           <label>End time: </label><div class="input-group"><input type="text" class="form-control" data-ng-model="ulog.end_time"><span class="input-group-addon"><i class="fa fa-calendar"></i></span>' +
                        '           </div>' +
                        '       </a>' +
                        '       <ul class="dropdown-menu" role="menu" aria-labelledby="dLabel">' +
                        '           <datetimepicker  style="color:slategray;" data-ng-model="ulog.end_time" data-datetimepicker-config="{ dropdownSelector: &apos;#dropdown4&apos; }"/>' +
                        '       </ul>' +
                        '   </div>' +
                        '</div>' +
                        '<div flex style="height:30px;"><span></span></div>' +
                        '   <div layout="row">' +
                        '       <md-input-container flex="25">' +   
                        '          <md-select placeholder="Select User Log Type" ng-model="ulog.userlog_type" style="width: 200px">' +
                        '              <md-option value="shift_log">Shift Log</md-option>' +
                        '              <md-option value="time_loss">Time-loss Log</md-option>' +
                        '              <md-option value="observation">Observation Log</md-option>' +
                        '              <md-option value="status_log">Status Log</md-option>' +
                        '              <md-option value="maintenance">Maintenance</md-option>' +
                        '              <md-option value="alarm_log">Alarm Log</md-option>' +
                        '       </md-input-container>' +
                        '       <div flex="5"></div>'  +
                        '       <div layout="column" flex>' +
                        '           <label>Log Message</label>' +
                        '           <md-input-container flex>' +
                        '               <textarea rows="5" columns="1" md-maxlength="150" ng-model="ulog.userlog_content"></textarea>' +
                        '           </md-input-container>' +
                        '       </div>' +
                        '   </div>' +
                        '<div flex style="height:30px;"><span></span></div>' +
                        '   <div layout="row">' +
                        '       <md-input-container flex="25">' + 
                        '           Attachments: <input file-model="myFile" type="file" name="files[]" multiple />' +
                        '       </md-input-container>' +
                        '       <md-chips ng-model="selectedTags" md-autocomplete-snap md-require-match>' +
                        '           <md-autocomplete' +
                        '               md-selected-item="selectedItem" ' +
                        '               md-selected-item-change = "" ' +
                        '               md-search-text="searchText" ' +
                        '               md-search-text-change="" ' +
                        '               md-items="item in querySearch(searchText)" ' +
                        '               md-item-text="item.name" ' +
                        '               ng-blur=clear()' +
                        '               placeholder="Select tags">' +
                        '               <md-item-template>' +
                        '                   <span md-highlight-text="searchText">{{item.name}}</span>' +
                        '               </md-item-template>' +
                        '               <md-not-found>' +
                        '                   No matches found' +
                        '               </md-not-found>' +
                        '           </md-autocomplete>' +
                        '           <md-chip-template>' +
                        '               <span>' +
                        '                  <strong>{{$chip.name}}</strong>' +
                        '               </span>' +
                        '           </md-chip-template>' +
                        '           <md-button class="md-fab" aria-label="Eat cake">' +
                        '               <md-icon md-chip-remove md-font-icon="fa-close" style="color:white; fill:white;"></md-icon>' +
                        '           </md-button>' +
                        '       </md-chips>' +
                        '   </div>' +      
                        '   <md-list>' +
                        '       <md-list-item ng-repeat="attach in ulog.metadata">' +
                        '           <div flex="20">{{attach.m_name}}</div>' +
                        '           <i class="fa fa-download" ng-click="getFile(attach.m_val, attach.m_name)"></i>' +
                        '       </md-list-item>' +
                        '   </md-list>' +                  
                        '</md-dialog-content>' +
                        '  <div class="md-actions">' +
                        '    <md-button ng-click="add()" class="md-primary">' +
                        '      Submit Log' +
                        '    </md-button>' +
                        '    <md-button ng-click="hide()" class="md-primary">' +
                        '      Cancel' +
                        '    </md-button>' +
                        '  </div>' +
                        '</md-dialog>',
                        targetEvent: event
                        })
                .then(function(userlog_entry) {
                    console.log('Controller start time: ' + ulog.start_time + ', Controller end time: ' + ulog.end_time);   
                });
            console.log('Controller start time: ' + ulog.start_time + ', Controller end time: ' + ulog.end_time);
        };
    }
})();
