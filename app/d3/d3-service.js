angular.module('katGui.d3')

    //this factory is used so that we can dynamically load the d3 libraries only when we use them
    .factory('d3Service', function ($document, $window, $q) {
        var d = $q.defer(),
            d3service = {
                d3: function () {
                    return d.promise;
                }
            };

        d3service.onScriptLoad = function () {
            // Load client in the browser
            d.resolve($window.d3);
        };

        var scriptTag = $document[0].createElement('script');
        scriptTag.type = 'text/javascript';
        scriptTag.async = true;
        scriptTag.src = 'bower_components/d3/d3.js';
        scriptTag.onreadystatechange = function () {
            if (this.readyState === 'complete') {
                d3service.onScriptLoad();
            }
        };
        scriptTag.onload = d3service.onScriptLoad;

        var s = $document[0].getElementsByTagName('body')[0];
        s.appendChild(scriptTag);

        return d3service;
    });
