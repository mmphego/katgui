angular.module('katGui.util', [])
  .directive('autoGrow', autoGrow)
  .constant('SERVER_URL', window.location.host === 'localhost:9001' ? 'http://monctl.devf.camlab.kat.ac.za' : window.location.origin)
  .factory('KatGuiUtil', katGuiUtil)
  .filter('regexSearch', regexSearchFilter);

function regexSearchFilter() {
  return function(input, fields, regex) {
    if (regex) {
      var pattern = new RegExp(regex, 'i');
      var out = [];
      for (var i = 0; i < input.length; i++){
        for (var idx in fields) {
          if(pattern.test(input[i][fields[idx].value])) {
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
    //element.css("height", element.parent()[0].scrollHeight + "px");

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

  function declination(day, month, year, UT) {

    var K = Math.PI / 180.0;
    var jd = this.julianDayWithTime(day, month, year, UT);
    var T = (jd - 2451545.0) / 36525.0;
    var L0 = 280.46645 + (36000.76983 + 0.0003032 * T) * T;
    var M = 357.52910 + (35999.05030 - (0.0001559 * T + 0.00000048 * T) * T) * T;
    M = K * M;
    var C = (1.914600 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) + (0.019993 - 0.000101 * T) * Math.sin(2 * M) + 0.000290 * Math.sin(3 * M);
    var theta = L0 + C;
    var omega = 125.04 - 1934.136 * T;
    var lambda = theta - 0.00569 - 0.00478 * Math.sin(K * omega);
    var eps0 = 23.0 + 26.0 / 60.0 + 21.448 / 3600.0 - (46.8150 * T + 0.00059 * T * T - 0.001813 * T * T * T) / 3600;
    var eps = eps0 + 0.00256 * Math.cos(K * omega);
    var declin = Math.sin(K * eps) * Math.sin(K * lambda);
    declin = Math.asin(declin) / K;
    //var RA = Math.atan2(Math.cos(K * eps) * Math.sin(K * lambda), Math.cos(K * lambda)) / K;
    //if (RA < 0) {
    //    RA = RA + 360;
    //}
    return declin;
  }

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
    //if (min==60) str=(h+1)+":00";
    if (secs < 10) {
      str = str + ":0" + secs;
    }
    else {
      str = str + ":" + secs;
    }
    return " " + str;

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
  this.julianDay = function (day, month, year, UT) {
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

  this.getLongitudeFromDegrees = function (latitudeDegrees) {
    var latSplit = latitudeDegrees.split(':');
    var deg = parseInt(latSplit[0]);
    var result = Math.abs(deg) + parseInt(latSplit[1])/60 + parseInt(latSplit[2])/3600;
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


//var Jd = JulianDay(21, 11, 2014, 7.407222222222223);
//var decl = Math.round(1000*declination(utDay,utMonth,utYear,UT))/1000;
//var longitude = 18.49;

//console.log(localSiderealTime(julianDay (21, 11, 2014, 7.407222222222223), longitude));
