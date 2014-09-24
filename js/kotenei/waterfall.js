/**
 * 瀑布流模块
 * @date :2014-09-24
 * @author kotenei (kotenei@qq.com)
 */
define('kotenei/waterfall', ['jquery', 'kotenei/infiniteScroll', 'kotenei/popTips'], function ($, InfiniteScroll, popTips) {

    var Waterfall = function ($element, options) {
        this.$element = $element;
        this.options = $.extend({}, {
            width: 200,
            nodeTag: 'li',
            resize: false,
            url: null,
            callback: $.noop
        }, options);
        this.loading = false;
        this.notMore = false;
    };

    Waterfall.prototype.init = function () {
        var self = this;
        this.infiniteScroll = new InfiniteScroll({
            $watchElement: self.$element,
            callback: function () {
                self.remote();
            }
        });
    };

    Waterfall.prototype.remote = function () {
        if (this.notMore) { return false; }
        if (this.loading) { return; }
        var self = this;
        $.get(this.options.url, {
            rnd: Math.random()
        }).done(function (ret) {
            if (!ret || ret.length === 0) {
                self.notMore = true;
                return false;
            }
        }).fail(function () {
            popTips.error('网络错误！');
        }).always(function () {
            self.loading = false;
        });
    };

    Waterfall.prototype.resize = function () { };

    Waterfall.prototype.arrangement = function () { };

    return Waterfall;

});
