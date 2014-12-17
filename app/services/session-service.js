(function () {

    angular.module('katGui.services')
        .service('SessionService', SessionService);

    function SessionService($http) {

        var urlBase = 'http://localhost:8010';
        var api = {};

        var jwtHeader = {
            "alg": "HS256",
            "type": "JWT"
        };

        api.login = function (email, password) {

            var jwtPayload = { "email": email };
            var msg = window.btoa(JSON.stringify(jwtHeader)) + "." + window.btoa(JSON.stringify(jwtPayload));
            msg = msg.replace(/=/g , "");
            var pass = CryptoJS.HmacSHA256(msg, password + 'x');
            var jwt = msg + '.' + pass.toString(CryptoJS.enc.Base64);
            $http.get(urlBase + '/user/login/' + jwt).then(function (result) {

                console.log(result);

                var a = result.data.split(".");
                //var uHeader = a[0];
                //var uPayload = a[1];
                //var uSignatureInput = uHeader + "." + uPayload;

                //dont need to do anything with the signature
                //var hSig = CryptoJS.enc.Base64.parse(a[2]).toString(CryptoJS.enc.Hex);

                //var header = JSON.parse(window.atob(a[0]));
                var payload = JSON.parse(window.atob(a[1]));
                if (payload.name !== null && payload.activated) {
                    console.log('user logged in with payload:');
                    console.log(payload);
                } else if (payload.name !== null && payload.activated === false) {
                    console.log('this user has been deactivated, contact support');
                    console.log(payload);
                } else {
                    console.log(payload);
                    console.log('invalid username or password!');
                }

                console.log("TODO: now use this information on the frontend!!!");
            });
        };

        return api;
    }

})();
