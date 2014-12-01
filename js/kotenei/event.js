/**
 * 事件
 * @date :2014-12-01
 * @author kotenei (kotenei@qq.com)
 */ 
define('kotenei/event', [], function () {

    var exports = {},
        topics = {},
        subId = -1;

    exports.on = function (topic, func) {
        if (!topics[topic]) {
            topics[topic] = [];
        }
        var token = (++subId).toString();

        topics[topic].push({
            token: token,
            func: func
        });

        return token;
    };

    exports.off = function (topic) {
        if (!topic) {
            subId = -1;
            topics = {};
            return;
        }
        if (/^\d+$/.test(topic)) {
            for (var m in topics) {
                if (topics[m]) {
                    for (var i = 0, j = topics[m].length; i < j; i++) {
                        if (topics[m][i].token === topic) {
                            topics[m].splice(i, 1);
                            return topic;
                        }
                    }
                }
            }
        } else {
            if (topics[topic]) {
                delete topics[topic];
            }
        }
    };

    exports.trigger = function (topic, args) {
        if (!topics[topic]) {
            return false;
        }
        var arr = topics[topic],
            len = arr ? arr.length : 0;

        while (len--) {
            arr[len].func(args);
        }
    };

    return exports;

});
