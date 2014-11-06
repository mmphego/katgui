(function () {

    angular.module('katGui')
        .service('AuthService', AuthService);

    function AuthService($http, Session, USER_ROLES) {

        this.login = function (credentials) {
            return $http
                .post('/login', credentials)
                .then(function (res) {
                    Session.create(res.id, res.user.id, res.user.role);
                    return res.user;
                });
        };

        this.isAuthenticated = function () {
            return !!Session.userId;
        };

        this.isAuthorized = function (authorizedRoles) {

            if (!angular.isArray(authorizedRoles)) {
                authorizedRoles = [authorizedRoles];
            }

            return (this.isAuthenticated() &&
            (authorizedRoles.indexOf(Session.userRole) !== -1 || authorizedRoles[0] === USER_ROLES.all));
        };

        return this;
    }
})();
