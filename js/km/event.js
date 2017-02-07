/**
 * 事件
 * @date :2014-12-01
 * @author kotenei (kotenei@qq.com)
 */
define('km/event', [], function () {

    var Event = function () {
        this.topics = {};
        this.subId = -1;
    }

    Event.prototype.on = function (topic, func) {
        if (!this.topics[topic]) {
            this.topics[topic] = [];
        }
        var token = (++this.subId).toString();

        this.topics[topic].push({
            token: token,
            func: func
        });

        return this;
    }

    Event.prototype.off = function (topic) {
        if (!topic) {
            this.subId = -1;
            this.topics = {};
            return this;
        }
        if (/^\d+$/.test(topic)) {
            for (var m in this.topics) {
                if (this.topics[m]) {
                    for (var i = 0, j = this.topics[m].length; i < j; i++) {
                        if (this.topics[m][i].token === topic) {
                            this.topics[m].splice(i, 1);
                            return this;
                        }
                    }
                }
            }
        } else {
            if (this.topics[topic]) {
                delete this.topics[topic];
            }
        }
        return this;
    }

    Event.prototype.trigger = function (topic, args) {
        if (!this.topics[topic]) {
            return;
        }
        var arr = this.topics[topic],
            len = arr ? arr.length : 0,
            flag = 0;

        while (flag < len && arr[flag]) {
            arr[flag].func(args);
            flag++;
        }
    };

    return Event;

});
