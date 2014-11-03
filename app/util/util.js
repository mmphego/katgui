var toString = Object.prototype.toString;

_.isString = function (obj) {
    return toString.call(obj) === '[object String]';
};
