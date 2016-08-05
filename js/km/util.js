/**
 * 
 * @module km/util 
 * @author vfasky (vfasky@gmail.com)
 */
define('km/util', function(){
    var exports = {};

    var Ctor = function () {};
    exports.createProto = Object.__proto__ ? function(proto) {
        return {
            __proto__: proto
        };
    } : function(proto) {
        Ctor.prototype = proto;
        return new Ctor();
    };

    exports.isIE8 = function () {
        var version = 8;
        var ua = navigator.userAgent.toLowerCase();
        var isIE = ua.indexOf("msie") > -1;
        var safariVersion;
        if (isIE) {
            safariVersion = parseInt(ua.match(/msie ([\d.]+)/)[1]);
            return safariVersion <= version && ua.indexOf('trident/7.0') == -1
        }
        return false;
    }

    return exports;
});