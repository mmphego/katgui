(function () {

    angular.module('katGui')
        .controller('UserlogTagsCtrl', UserlogTagsCtrl);

        function UserlogTagsCtrl(UserLogService, $scope, $mdDialog, $log) {

            var vm = this;

            vm.tags = UserLogService.tags;
            vm.displayDeactivated = false;

            vm.tagsOrderByFields = [
                {label: 'Name', value: 'name'},
                {label: 'Description', value: 'slug'}
            ];

            vm.setTagsOrderBy = function (column) {
                var newOrderBy = _.findWhere(vm.tagsOrderByFields, {value: column});
                if ((vm.tagsOrderBy || {}).value === column) {
                    if (newOrderBy.reverse === undefined) {
                        newOrderBy.reverse = true;
                    } else if (newOrderBy.reverse) {
                        newOrderBy.reverse = undefined;
                        newOrderBy = null;
                    }
                }
                vm.tagsOrderBy = newOrderBy;
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            };

            vm.setTagsOrderBy('name');

            vm.editTag = function (tag, event) {
                if (!tag) {
                    tag = {activated: true};
                }
                $mdDialog
                    .show({
                        controller: function ($rootScope, $scope, $mdDialog) {
                            $scope.title = tag.name? 'Edit Tag - ' + tag.name : 'Create Tag';
                            $scope.name = tag.name;
                            $scope.slug = tag.slug;
                            $scope.activated = tag.activated;

                            $scope.cancel = function () {
                                $mdDialog.hide();
                            };
                            $scope.saveTag = function () {
                                if (tag.id) {
                                    UserLogService.modifyTag({
                                        tag_id: tag.id,
                                        tag_name: $scope.name,
                                        tag_slug: $scope.slug,
                                        activated: $scope.activated
                                    }).then(function (result) {
                                        if (result.data && result.data.success) {
                                            tag.name = $scope.name;
                                            tag.slug = $scope.slug;
                                            tag.activated = $scope.activated;
                                        } else {
                                            $log.error('Error reading the returned result: ' + result.data);
                                        }
                                    });
                                } else {
                                    UserLogService.createTag({
                                        tag_name: $scope.name,
                                        tag_slug: $scope.slug,
                                        activated: $scope.activated
                                    });
                                }
                                $mdDialog.hide();
                            };
                        },
                        template:
                        [
                            '<md-dialog style="padding: 0;" md-theme="{{$root.themePrimary}}">',
                                '<div style="padding: 0; margin: 0; overflow: auto" layout="column">',
                                    '<md-toolbar class="md-primary" layout="row" layout-align="center center">',
                                        '<span flex style="margin: 8px;">{{::title}}</span>',
                                    '</md-toolbar>',
                                    '<div layout="column" md-theme="{{themePrimaryButtons}}">',
                                        '<md-input-container id="nameInput" md-no-float class="long-input" style="padding: 16px">',
                                            '<input placeholder="Tag Name" focus ng-model="name">',
                                        '</md-input-container>',
                                        '<md-input-container id="descriptionInput" md-no-float class="long-input" style="padding: 16px">',
                                            '<input placeholder="Tag Description" ng-model="slug">',
                                        '</md-input-container>',
                                        '<md-checkbox title="Whether users can use this tag" class="fade-in md-primary" style="font-size: 16px; margin: 16px;" ng-model="activated">',
                                            'Activated',
                                        '</md-checkbox>',
                                    '</div>',
                                    '<div layout="row" layout-align="end" style="margin-top: 8px; margin-right: 8px; margin-bottom: 8px; min-height: 40px;">',
                                        '<md-button ng-click="cancel()">Cancel</md-button>',
                                        '<md-button style="margin-left: 8px;" ng-click="saveTag()">Save</md-button>',
                                    '</div>',
                                '</div>',
                            '</md-dialog>'].join(' '),
                        targetEvent: event
                    });
            };

            vm.deactivateTag = function (tag) {

            };

            UserLogService.listTags();
        }
})();
