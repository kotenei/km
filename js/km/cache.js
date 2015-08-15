/**
 * 缓存
 * @date :2014-10-11
 * @author kotenei (kotenei@qq.com)
 */
define('km/cache', [], function () {

    var exports = {};
    var storage = window.localStorage;

    /**
     * 设置缓存
     * @key  {String} key - 缓存的key
     * @value  {Object} value - 缓存值，不设置则删除缓存内容
     * @duration  {Number} duration - 过期时间（秒），不设置或值小于1则为永久保存
     * @return {Void}       
     */
    exports.set = function (key, value, duration) {

        if (!value) {
            exports.remove(key);
            return;
        }

        var expired;

        if (/^[1-9]\d*$/.test(duration)) {
            expired = new Date().getTime() + parseInt(duration) * 1000;
        }

        var data = {
            value: value,
            expired: expired
        };

        storage.setItem(key, JSON.stringify(data));
    };

    /**
     * 获取缓存
     * @key  {String} key - 缓存的key
     * @return {Object}       
     */
    exports.get = function (key) {
        var data = storage.getItem(key);
        var ret = null;
        if (data) {
            data = JSON.parse(data);
            if (data.expired && new Date().getTime() > data.expired) {
                exports.remove(key);
            } else {
                ret = data.value;
            }
        }
        return ret;
    };

    /**
     * 移除缓存
     * @key  {String} key - 缓存的key
     * @return {Void}       
     */
    exports.remove = function (key) {
        storage.removeItem(key);
    };

    /**
     * 清空缓存
     * @return {Void}       
     */
    exports.clear = function () {
        storage.clear();
    };

    return exports;

});
