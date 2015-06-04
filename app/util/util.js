angular.module('katGui.util')
    .directive('autoGrow', autoGrow)
    .factory('KatGuiUtil', katGuiUtil)
    .filter('regexSearch', regexSearchFilter)
    .filter('utcDateFromUnix', function() {
        return function (input) {
            return moment.utc(input, 'X').format('HH:mm:ss DD-MM-YYYY');
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
    .directive('resizeable', function ($document) {
        return {
            link: function (scope, element, attr) {
                var targetElement = angular.element(document.querySelector(attr.resizeable));
                var offset = targetElement.offset(),
                    offsetX, offsetY;
                var startX = offset.left, startY = offset.top, x = offset.left, y = offset.top;

                targetElement.css({
                    position: 'fixed'
                });

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
                    if (targetElement.innerHeight() > 100) {
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
            }
        };
    });

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
    return function (input, fields, regex) {
        if (regex) {
            var pattern;
            try {
                pattern = new RegExp(regex, 'i');
            }
            catch(e) {
                return input;
            }

            var out = [];
            for (var i = 0; i < input.length; i++) {
                for (var idx in fields) {
                    if (pattern.test(input[i][fields[idx].value])) {
                        out.push(input[i]);
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
function katGuiUtil() {

    this.generateUUID = function () {
        var d = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
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
        }
        else {
            str = h + ":0" + min;
        }

        if (secs < 10) {
            str = str + ":0" + secs;
        }
        else {
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

    return this;
}

var objToString = Object.prototype.toString;

_.isString = function (obj) {
    return objToString.call(obj) === '[object String]';
};
