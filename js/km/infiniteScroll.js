/**
 * 无限滚动模块
 * @date :2014-09-24
 * @author kotenei (kotenei@qq.com)
 */
define('km/infiniteScroll', ['jquery'], function ($) {

    /**
     * 无限滚动模块
     * @param {Object} options - 参数
     */
    var InfiniteScroll = function (options) {
        var self = this;
        this.options = $.extend(true, {
            $scrollElement: $(window),
            $watchElement: null,
            scrollDistance:0.3,
            callback: $.noop
        }, options);
        this.$scrollElement = this.options.$scrollElement;
        this.$watchElement = this.options.$watchElement;

        if (!this.$watchElement) { return; }
 
        this.top = this.$watchElement.position().top;

        this.$scrollElement.on('scroll.infiniteScroll', function () {
            self.scroll();
        });

        this.scroll();       
    };

    /**
     * 滚动操作
     * @return {Void}       
     */
    InfiniteScroll.prototype.scroll = function () {
        var scrollElmHeight = this.$scrollElement.height();
        var scrollBottom = scrollElmHeight + this.$scrollElement.scrollTop();
        var watchElmBottom = this.top + this.$watchElement.height();
        var remaining = watchElmBottom - scrollBottom;
        var canScroll = remaining <= scrollElmHeight * this.options.scrollDistance;
        if (canScroll) {
            if (this.options.callback() === false) {
                this.destroy();
            }
        }
    };

    /**
     * 销毁
     * @return {Void}       
     */
    InfiniteScroll.prototype.destroy = function () {
        this.$scrollElement.off('scroll.infiniteScroll');
    };

    return InfiniteScroll;
});
