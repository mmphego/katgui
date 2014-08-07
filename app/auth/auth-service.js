angular.module('katGui').factory('AuthService', function ($http, Session, USER_ROLES) {
    var authService = {};

    authService.login = function (credentials) {
        return $http
            .post('/login', credentials)
            .then(function (res) {
                Session.create(res.id, res.user.id, res.user.role);
                return res.user;
            });
    };

    authService.isAuthenticated = function () {
        return !!Session.userId;
    };

    authService.isAuthorized = function (authorizedRoles) {

        if (!angular.isArray(authorizedRoles)) {
            authorizedRoles = [authorizedRoles];
        }

        return (authService.isAuthenticated() &&
            (authorizedRoles.indexOf(Session.userRole) !== -1 || authorizedRoles[0] === USER_ROLES.all));
    };

    return authService;
});