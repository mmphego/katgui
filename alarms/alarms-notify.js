//TODO: sort alerts by warning type
//TODO: decide whether to show duplicates or not
angular.module('katGui')
    .directive('alarm', [
        '$rootScope',
        function ($rootScope) {
            'use strict';
            return {
                restrict: 'A',
                template: '<div class="alarm">' +
                    '   <div class="alarm-item" ng-repeat="message in messages" ng-class="computeClasses(message)">' +
                    '       <button class="alarm-close" ng-click="acknowledgeMessage(message)">Acknowledge</button>' +
                    '       <button ng-show="message.severity !== \'error\'" class="alarm-close" ng-click="deleteMessage(message)">Known</button>' +
                    '       <div><h3>{{message.text}}</h3></div>' +
                    '   </div>' +
                    '</div>',
                replace: false,
                scope: true,
                controller: [
                    '$scope',
                    '$timeout',
                    'alarms',
                    function ($scope, $timeout, alarms) {
                        var onlyUnique = alarms.onlyUnique();
                        $scope.messages = [];
                        function addMessage(message) {
                            $scope.messages.push(message);
                            if (message.ttl && message.ttl !== -1) {
                                $timeout(function () {
                                    $scope.deleteMessage(message);
                                }, message.ttl);
                            }
                        }

                        $rootScope.$on('alarmMessage', function (event, message) {
                            var found;
                            if (onlyUnique) {
                                angular.forEach($scope.messages, function (msg) {
                                    if (message.text === msg.text && message.severity === msg.severity) {
                                        found = true;
                                    }
                                });
                                if (!found) {
                                    addMessage(message);
                                }
                            } else {
                                addMessage(message);
                            }
                        });
                        $scope.acknowledgeMessage = function (message) {
                            var index = $scope.messages.indexOf(message);
                            if (index > -1) {
                                $scope.messages.splice(index, 1);
                            }
                        };
                        $scope.deleteMessage = function (message) {
                            var index = $scope.messages.indexOf(message);
                            if (index > -1) {
                                $scope.messages.splice(index, 1);
                            }
                        };
                        $scope.computeClasses = function (message) {
                            return {
                                'alarm-success': message.severity === 'success',
                                'alarm-error': message.severity === 'error',
                                'alarm-info': message.severity === 'info',
                                'alarm-warning': message.severity === 'warn'
                            };
                        };
                    }
                ]
            };
        }
    ])

    .provider('alarms', function () {
        'use strict';
        var _ttl = null, _onlyUniqueMessages = false;

        this.$get = [
            '$rootScope',
            '$filter',
            function ($rootScope, $filter) {
                var translate;
                try {
                    translate = $filter('translate');
                } catch (e) {
                }
                function broadcastMessage(message) {
                    if (translate) {
                        message.text = translate(message.text);
                    }
                    $rootScope.$broadcast('alarmMessage', message);
                }

                function sendMessage(text, config, severity) {
                    var _config = config || {}, message;
                    message = {
                        text: text,
                        severity: severity,
                        ttl: _config.ttl || _ttl
                    };
                    broadcastMessage(message);
                }

                function addWarnMessage(text, config) {
                    sendMessage(text, config, 'warn');
                }

                function addErrorMessage(text, config) {
                    sendMessage(text, config, 'error');
                }

                function addInfoMessage(text, config) {
                    sendMessage(text, config, 'info');
                }

                function addSuccessMessage(text, config) {
                    sendMessage(text, config, 'success');
                }

                function onlyUnique() {
                    return _onlyUniqueMessages;
                }

                return {
                    addWarnMessage: addWarnMessage,
                    addErrorMessage: addErrorMessage,
                    addInfoMessage: addInfoMessage,
                    addSuccessMessage: addSuccessMessage,
                    onlyUnique: onlyUnique
                };
            }
        ];
    });