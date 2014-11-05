angular.module('katGui.util', []);

var objToString = Object.prototype.toString;

_.isString = function (obj) {
    return objToString.call(obj) === '[object String]';
};
