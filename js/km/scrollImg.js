/*
 * 滚动图片
 * @date:2016-03-17
 * @author:kotenei(kotenei@qq.com)
 */
define('km/scrollImg', ['jquery'], function ($) {

    var ScrollImg = function ($el, options) {
        this.$el = $el;
        this.options = $.extend(true, {
            padding: 30,
            delay: 3000,
            width: 'auto',
            height: 150,
            showNum: 3,
            toggleDealy:700
        }, options);
        this.init();
    };

    /**
     * 初始化
     * @return {Void}   
     */
    ScrollImg.prototype.init = function () {
        var $lis;
        this.tm = null;
        this.isStop = false;
        this.$prev = this.$el.find('div.k-scrollImg-prev');
        this.$next = this.$el.find('div.k-scrollImg-next');
        this.$container = this.$el.find('div.k-scrollImg-container').css({
            width: this.options.width,
            height: this.options.height
        });
        this.$el.css({
            paddingLeft: this.options.padding,
            paddingRight: this.options.padding,
            width: this.options.padding * 2 + this.$container.outerWidth()
        });
        this.$ul = this.$container.find('ul');
        var $lis = this.$ul.children('li');
        if ($lis.length <= this.options.showNum) {
            this.options.showNum = $lis.length;
        }
        this.crateItem();
        $lis = this.$ul.children('li');
        this.total = $lis.length / this.options.showNum;
        this.max = this.total - 2;
        this.index = 0;
        if (this.max > 1) {
            this.$ul.css("marginLeft", -(this.index + 1) * this.options.showNum * this.i_w);
            this.run();
            this.watch();
        }
    };

    /**
     * 创建项
     * @return {Void}   
     */
    ScrollImg.prototype.crateItem = function () {
        var $lis = this.$ul.children('li');
        var width = this.$container.outerWidth();
        var html = [];
        var margin = 10;
        var flag = 0;
        var totalWidth = 0;
        var li_w = width / this.options.showNum - margin;
        var len = $lis.length;
        this.i_w = li_w + margin;

        if (len % this.options.showNum != 0) {
            for (var i = 0; i < len; i++) {
                for (var j = 0; j < this.options.showNum; j++) {
                    html.push($lis[flag].outerHTML);
                    totalWidth += this.i_w;
                    flag++;
                    if (flag >= len) { flag = 0 }
                }
            }
        }

        if (html.length) {
            var pre = [];
            var next = [];
            for (var i = 0; i < this.options.showNum; i++) {
                next.push(html[i]);
            }
            for (var i = html.length - this.options.showNum ; i < html.length ; i++) {
                pre.push(html[i]);
            }
            Array.prototype.push.apply(html, next);
            Array.prototype.push.apply(pre, html);
            totalWidth += (this.i_w) * this.options.showNum * 2;
            this.$ul.html(pre.join('')).width(totalWidth);
        } else {
            if (len > this.options.showNum) {
                var pre = [];
                var next = [];
                for (var i = 0; i < this.options.showNum; i++) {
                    next.push($lis[i].outerHTML);
                }
                for (var i = len - this.options.showNum ; i < len ; i++) {
                    pre.push($lis[i].outerHTML);
                }
                len += this.options.showNum * 2;
                this.$ul.append(next.join(''));
                this.$ul.prepend(pre.join(''));
            }
            this.$ul.width(len * (this.i_w));
        }
        this.$ul.children('li').css('width', li_w);
    };

    /**
     * 事件监控
     * @return {Void}   
     */
    ScrollImg.prototype.watch = function () {
        var self = this;
        if (this.isWatch) {
            return;
        }
        this.isWatch = true;
        this.$el.on('mouseenter.scrollImg', function () {
            self.stop();
        }).on('mouseleave.scrollImg', function () {
            self.run();
        }).on('click.scrollImg', '.k-scrollImg-prev', function () {
            self.index--;
            self.active();
        }).on('click.scrollImg', '.k-scrollImg-next', function () {
            self.index++;
            self.active();
        });
    };

    /**
     * 运行
     * @return {Void}   
     */
    ScrollImg.prototype.run = function () {
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
    ScrollImg.prototype.stop = function () {
        if (this.tm) {
            clearTimeout(this.tm);
            this.isStop = true;
        }
    };

    /**
     * 切换图片
     * @return {Void}   
     */
    ScrollImg.prototype.active = function (callback) {
        var self = this;
        var tmpIndex = this.index + 1;
        var width = this.i_w * this.options.showNum;
        if (this.index == this.max) {
            this.index = 0;
        }
        if (this.index < 0) {
            this.index = this.max - 1;
        }
        this.$ul.stop().animate({
            marginLeft: -tmpIndex * width
        },this.options.toggleDealy, function () {
            if (tmpIndex == self.total - 1) {
                self.$ul.css('marginLeft', -1 * width);
            }
            if (tmpIndex == 0) {
                self.$ul.css('marginLeft', -(self.max) * width);
            }
            if (typeof callback === 'function') {
                callback();
            }
        });
    };

    return function ($elms, settings) {
        $elms.each(function () {
            var $el = $(this),
                options = $el.attr('data-options'),
                data = $.data(this, 'scrollerImg');
            if (!data) {
                if (options) {
                    options = eval('(0,' + options + ')');
                } else {
                    options = settings;
                }
                data = new ScrollImg($(this), options);
                $.data(this, 'scrollerImg', data);
            }
        });
    }
});
