/*
 * 焦点图模块
 * @date:2015-07-16
 * @author:kotenei(kotenei@qq.com)
 */
define('km/focusMap', ['jquery'], function ($) {

    /**
     * 焦点图模块
     * @constructor
     * @alias km/focusmap
     * @param {JQuery} $el - dom
     * @param {Object} options - 参数设置
     */
    var FocusMap = function ($el, options) {
        this.$el = $el;
        this.options = $.extend(true, {
            containerWidth: null,
            width: 600,
            height: 300,
            delay: 3000
        }, options);
        this.tm = null;
        this.isStop = false;
        this.index = 0;
        this.init();
    };

    /**
     * 初始化
     * @return {Void}   
     */
    FocusMap.prototype.init = function () {
        var tmpLength;
        this.winWidth = $(window).width();

        if (this.winWidth<this.options.width) {
            this.options.width = this.winWidth;
            this.options.height='auto';
        }

        this.$el.css({
            width: this.options.containerWidth || this.options.width,
            height:this.options.height
        })

        this.$ul = this.$el.find('ul'); 
        this.$lis = this.$ul.find('li');
        if (this.$lis.length == 1) {
            return;
        }
        this.$ul.append(this.$lis.eq(0).clone(true));
        this.$ul.prepend(this.$lis.eq(this.$lis.length - 1).clone(true));
        this.$lis = this.$ul.find('li').width(this.options.width);
        this.total = this.$lis.length;
        this.max = this.total - 2;
        this.$ul.width(this.total * this.options.width).css("marginLeft", -(this.index + 1) * this.options.width);
        this.$lis.show();
        this.create();
        this.watch();
        if (this.max > 1) {
            this.$el.append('<div class="k-focusmap-prev"><</div><div class="k-focusmap-next">></div>');
            this.run();
        }
    };

    /**
     * 创建圆点
     * @return {Void}   
     */
    FocusMap.prototype.create = function () {
        var html = [], marginLeft = this.max * 16 / 2;
        html.push('<div class="k-focusmap-dot" style="margin-left:-' + marginLeft + 'px;">');
        for (var i = 0; i < this.max; i++) {
            html.push('<span class="' + (i == 0 ? "current" : "") + '"></span>');
        }
        html.push('</div>');

        this.$el.append(html.join(''));
        this.$dots = this.$el.find('.k-focusmap-dot span');
    };

    /**
     * 事件监控
     * @return {Void}   
     */
    FocusMap.prototype.watch = function () {
        var self = this;
        if (this.isWatch) {
            return;
        }
        this.isWatch = true;
        this.$el.on('mouseenter.focusmap', function () {
            self.stop();
        }).on('mouseleave.focusmap', function () {
            self.run();
        }).on('click.focusmap', '.k-focusmap-prev', function () {
            self.index--;
            self.active();
        }).on('click.focusmap', '.k-focusmap-next', function () {
            self.index++;
            self.active();
        }).on('click.focusmap', 'span', function () {
            var $el = $(this),
                index = $el.index();
            self.index = index;
            self.active();
        });
    };

    /**
     * 运行焦点图
     * @return {Void}   
     */
    FocusMap.prototype.run = function () {
        var self = this;
        this.isStop = false;
        this.tm = setTimeout(function () {
            self.index++;
            self.active(function () {
                if (!self.isStop) {
                    self.run();
                }
            });
        }, this.options.delay);
    };

    /**
     * 停止运行
     * @return {Void}   
     */
    FocusMap.prototype.stop = function () {
        if (this.tm) {
            clearTimeout(this.tm);
            this.isStop = true;
        }
    };

    /**
     * 切换图片
     * @return {Void}   
     */
    FocusMap.prototype.active = function (callback) {
        var self = this;

        var tmpIndex = this.index + 1;

        if (this.index == this.max) {
            this.index = 0;
        }

        if (this.index < 0) {
            this.index = this.max - 1;
        }

        this.$ul.stop().animate({
            marginLeft: -tmpIndex * this.options.width
        }, function () {

            if (tmpIndex == self.total - 1) {
                self.$ul.css('marginLeft', -1 * self.options.width);
            }

            if (tmpIndex==0) {
                self.$ul.css('marginLeft', -(self.max) * self.options.width);
            }

            self.$dots.removeClass('current').eq(self.index).addClass('current');

            if (typeof callback === 'function') {
                callback();
            }

        });
    };

    return function ($elm, options) {
        var focusMap = new FocusMap($elm, options);
        return focusMap;
    }
});
