angular.module('katGui.util')
    .constant('CENTRAL_LOGGER_PORT', 9021)
    .constant('DATETIME_FORMAT', 'HH:mm:ss DD-MM-YYYY')
    .directive('autoGrow', autoGrow)
    .factory('KatGuiUtil', katGuiUtil)
    .filter('regexSearch', regexSearchFilter)
    .filter('prettifyJSON', function() {
        return function (input) {
            return JSON.prettify.prettyPrint(input);
        };
    })
    .filter('utcDateFromUnix', function(DATETIME_FORMAT) {
        return function (input) {
            return moment.utc(input, 'X').format(DATETIME_FORMAT);
        };
    })
    .directive('postNgRepeatLoadMore', function($timeout) {
        return {
            link: function (scope) {
                if (scope.$last) {
                    // iteration is complete, do whatever post-processing
                    // is necessary
                    $timeout(scope.$parent.loadMore, 100);
                }
            }
        };
    })
    .directive('enterPressed', function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if(event.which === 13) {
                    var fn = (function(command) {
                        var cmd = command;
                        return function() {
                            scope.$eval(cmd);
                        };
                    })(attrs.enterPressed.replace('()', '("'+ event.target.value +'")' ));

                  // Apply function
                  scope.$apply(fn);
                  event.stopPropagation();
                }
            });
        };
    })
    .directive('draggable', function($document) {
        return {
            link: function(scope, element, attr) {
                var targetElement = angular.element(document.querySelector(attr.draggable));
                var offset = targetElement.offset();
                var startX = offset.left, startY = offset.top, x = offset.left, y = offset.top;

                targetElement.css({
                    position: 'fixed'
                });

                element.on('mousedown', function(event) {
                    // Prevent default dragging of selected content
                    event.preventDefault();
                    offset = targetElement.offset();
                    x = offset.left; y = offset.top;
                    startX = event.pageX - x;
                    startY = event.pageY - y;
                    $document.on('mousemove', mousemove);
                    $document.on('mouseup', mouseup);
                });

                function mousemove(event) {
                    if (targetElement.innerHeight() > 100) {
                        y = event.pageY - startY;
                        x = event.pageX - startX;

                        targetElement.css({
                            top: y + 'px',
                            left: x + 'px'
                        });

                        targetElement.css({
                            width: targetElement.innerWidth(),
                            height: targetElement.innerHeight()
                        });
                    }

                }

                function mouseup() {
                    $document.off('mousemove', mousemove);
                    $document.off('mouseup', mouseup);
                }
            }
        };
    })
    .directive('inheritBodyBg', function () {
        return {
            scope: {
                target: '@targetColorInherit'
            },
            link: function (scope, element, attr) {

                element.css({
                    'background-color': angular.element(document.querySelector(scope.target)).css('background-color')
                });
            }
        };
    })
    .directive('resizeable', function ($document, $timeout) {
        return {
            link: function (scope, element, attr) {
                var timeout = 0;
                if (attr.dynamicResizeElement) {
                    timeout = 1000;
                }

                $timeout(function () {
                    var targetElement = angular.element(document.querySelector(attr.resizeable));
                    var offset = targetElement.offset(),
                        offsetX, offsetY;
                    var startX = offset.left, startY = offset.top, x = offset.left, y = offset.top;

                    //targetElement.css({
                    //    position: 'fixed'
                    //});

                    element.on('mousedown', function(event) {
                        // Prevent default dragging of selected content
                        event.preventDefault();
                        startX = event.pageX - x;
                        startY = event.pageY - y;
                        offsetX = element.innerWidth() - event.offsetX;
                        offsetY = element.innerHeight() - event.offsetY;

                        $document.on('mousemove', mousemove);
                        $document.on('mouseup', mouseup);
                    });

                    function mousemove(event) {
                        event.preventDefault();
                        if (targetElement.innerHeight() > 10) {
                            y = event.pageY - startY;
                            x = event.pageX - startX;
                            var innerWidth = targetElement.innerWidth(),
                                innerHeight = targetElement.innerHeight();

                            targetElement.css({
                                width: innerWidth - (targetElement.offset().left + innerWidth - event.pageX) + offsetX,
                                height: innerHeight - (targetElement.offset().top + innerHeight - event.pageY)  + offsetY
                            });
                        }
                    }

                    function mouseup() {
                        $document.off('mousemove', mousemove);
                        $document.off('mouseup', mouseup);
                    }
                }, timeout);
            }
        };
    })
    .directive('relativeDraggable', ['$document', function($document) {
        return {
            link: function(scope, element, attr) {
                var startX = element[0].offsetLeft;
                var startY = element[0].offsetTop;
                var x = startX, y = startY;

                var el = angular.element(element[0].getElementsByClassName(attr.relativeDraggable));

                el.css({
                    cursor: 'pointer'
                });

                el.on('mousedown', function(event) {
                    // Prevent default dragging of selected content
                    event.preventDefault();
                    startX = event.pageX - x;
                    startY = event.pageY - y;
                    $document.on('mousemove', mousemove);
                    $document.on('mouseup', mouseup);
                });

                function mousemove(event) {
                    y = event.pageY - startY;
                    x = event.pageX - startX;
                    element.css({
                        top: y + 'px',
                        left:  x + 'px'
                    });
                }

                function mouseup() {
                    $document.off('mousemove', mousemove);
                    $document.off('mouseup', mouseup);
                }
            }
        };
    }]);

//to suppress warnings about missing aria-labels (ARIA - Accessible Rich Internet Applications)
//our application does not implement any accessibility features
angular.module('material.core')
    .service('$mdAria', function(){
        return {
            expect: function() {},
            expectAsync: function() {},
            expectWithText: function() {}
        };
    });

function regexSearchFilter() {
    return function (input, fields, regex, objDict) {
        if (regex) {
            var pattern;
            try {
                pattern = new RegExp(regex, 'i');
            }
            catch(e) {
                return input;
            }

            if (objDict) {
                input = objDict;
            }

            var inputArray = [];
            if (input instanceof Array === false &&
                angular.isObject(input)) {
                for (var key in input) {
                    input[key]._key = key;
                    inputArray.push(input[key]);
                }
            } else {
                inputArray = input;
            }

            var out = [];
            if (input instanceof Array === false &&
                angular.isObject(input) === "object") {
                out = {};
            }
            for (var i = 0; i < inputArray.length; i++) {
                for (var idx in fields) {
                    if (pattern.test(inputArray[i][fields[idx].value])) {
                        if (objDict) {
                            out.push(inputArray[i]._key);
                        }
                        else if (input instanceof Array === false && angular.isObject(out)) {
                            out[inputArray[i]._key] = inputArray[i];
                        } else {
                            out.push(inputArray[i]);
                        }
                        break;
                    }
                }
            }
            return out;
        } else {
            return input;
        }
    };
}

function autoGrow() {
    return function (scope, element, attr) {
        var update = function () {
            element.css("height", "auto");
            var height = element.parent()[0].clientHeight;
            if (height > 0) {
                element.css("height", height + "px");
            }
        };
        scope.$watch(attr.ngModel, function () {
            update();
        });
        scope.$watch(function () {
            return element.parent()[0].clientHeight;
        }, function () {
            update();
        });
        attr.$set("ngTrim", "false");
    };
}

/* istanbul ignore next */
//be very sure you know what you are doing when you alter the below functions
//they are not tested
function katGuiUtil(SERVER_URL, $sce) {

    this.generateUUID = function () {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    };

    this.openRelativePath = function (path, port) {
        if (window.location.host !== 'localhost:8000') {
            window.open("http://" + window.location.hostname + ":" + port + "/" + path).focus();
        } else {
            window.open(SERVER_URL + ":" + port + "/" + path).focus();
        }
    };

    function frac(X) {
        X = X - Math.floor(X);
        if (X < 0) {
            X = X + 1.0;
        }
        return X;
    }

    function hoursMinutesSecondsToString(time) {

        var h = Math.floor(time);
        var min = Math.floor(60.0 * frac(time));
        var secs = Math.round(60.0 * (60.0 * frac(time) - min));

        var str;
        if (min >= 10) {
            str = h + ":" + min;
        } else {
            str = h + ":0" + min;
        }

        if (secs < 10) {
            str = str + ":0" + secs;
        } else if (secs === 60) {
            str = str + ":00";
        } else {
            str = str + ":" + secs;
        }
        return (" " + str).trim();
    }

    function generalSiderealTime(jd) {
        var t_eph, ut, MJD0, MJD;
        MJD = jd - 2400000.5;
        MJD0 = Math.floor(MJD);
        ut = (MJD - MJD0) * 24.0;
        t_eph = (MJD0 - 51544.5) / 36525.0;
        return 6.697374558 + 1.0027379093 * ut + (8640184.812866 + (0.093104 - 0.0000062 * t_eph) * t_eph) * t_eph / 3600.0;
    }

    this.localSiderealTime = function (jd, longitude) {
        var GMST = generalSiderealTime(jd);
        var LMST = 24.0 * frac((GMST + longitude / 15.0) / 24.0);
        return hoursMinutesSecondsToString(LMST);
    };

    //UT as a fraction of hours
    this.julianDay = function (day, month, year) {
        var Y = year, M = month, D = day, A, B, C, E, F, JD;
        A = Math.floor(Y / 100);
        B = Math.floor(A / 4);
        C = 2 - A + B;
        E = 365.25 * (Y + 4716);
        F = 30.6001 * (M + 1);
        JD = C + D + E + F - 1524.5;
        return JD;
    };

    this.julianDayWithTime = function (day, month, year, UT) {
        return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day - 13 - 1524.5 + UT / 24.0;
    };

    this.degreesToFloat = function (degrees) {
        var latSplit = degrees.split(':');
        var deg = parseInt(latSplit[0]);
        var result = Math.abs(deg) + parseInt(latSplit[1]) / 60 + parseInt(latSplit[2]) / 3600;
        if (deg < 0) {
            result *= -1;
        }
        return result;
    };

    JSON.prettify = {
        replacer: function(match, pIndent, pKey, pVal, pEnd) {
            var key = '<span class=json-key>';
            var val = '<span class=json-value>';
            var str = '<span class=json-string>';
            var r = pIndent || '';
            if (pKey) {
                r = r + key + pKey.replace(/[": ]/g, '') + '</span>: ';
            }
            if (pVal) {
                r = r + (pVal[0] === '"' ? str : val) + pVal + '</span>';
            }
            return r + (pEnd || '');
        },
        prettyPrint: function(obj) {
            if (obj) {
                var jsonLine = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/mg;
                return $sce.trustAsHtml(JSON.stringify(obj, null, 3)
                    .replace(/&/g, '&amp;').replace(/\\"/g, '&quot;')
                    .replace(/</g, '&lt;').replace(/>/g, '&gt;')
                    .replace(jsonLine, JSON.prettify.replacer));
            } else {
                return '';
            }
        }
    };

    this.getParentNameFromSensor = function (sensorName) {
        var exceptions = ['nm', 'mon', 'subarray', 'data', 'katgui'];
        var sensorNameList = sensorName.split(/_(.+)?/);
        var firstPart = sensorNameList[0];
        var secondPart = sensorNameList[1];
        if (firstPart === 'agg') {
            return 'agg';
        }
        if (exceptions.indexOf(firstPart) > -1) {
            return firstPart + '_' + secondPart.split(/_(.+)?/)[0];
        } else {
            return firstPart;
        }
    };

    this.isValidURL = function(str) {
        var pattern = new RegExp('^(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$');
        //remove possible quotes left in from katconfig
        str = str.replace(/"/g, '').replace(/'/g, "");
        return pattern.test(str);
    };

    return this;
}

var objToString = Object.prototype.toString;

_.isString = function (obj) {
    return objToString.call(obj) === '[object String]';
};
