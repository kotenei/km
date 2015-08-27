/*
 * 放大镜模块
 * @date:2015-07-15
 * @author:kotenei(kotenei@qq.com)
 */
define('km/magnifier', ['jquery'], function ($) {

    /**
     * 放大镜模块
     * @constructor
     * @alias km/magnifier
     * @param {JQuery} $el - dom
     * @param {Object} options - 参数设置
     */
    var Magnifier = function ($el, options) {
        this.options = $.extend(true, {
            offset: 10,
            width: 400,
            height: 250,
            zoomWidth: 400,
            zoomHeight: 400,
            zIndex: 100
        }, options);
        this.$el = $el;
        this._isLoading = false;
        this.init();
    };

    /**
     * 初始化
     * @return {Void}   
     */
    Magnifier.prototype.init = function () {
        this.create();
        this.watch();
    };

    /**
     * 事件监控
     * @return {Void}   
     */
    Magnifier.prototype.watch = function () {
        var self = this;
       

        this.$el.on('mousemove.magnifier', function (e) {
            var src = self.$img.attr('data-big-img');

            self.$view.show();

            if (self.$viewImg.attr('data-isLoad') == 'true') {
                self.$selector.show();
                self.setPosition(e);
            } else {

                self.$viewImg.hide();

                if (self._isLoading) {
                    return;
                }

                self._isLoading = true;

                self.loadImg(src, function (success, size) {

                    self.$viewLoading.hide();

                    self._isLoading = false;

                    self.$viewImg.attr({
                        'src': src,
                        'data-isLoad': true
                    }).show();

                    self.$selector.width(self.options.zoomWidth / (size.width / self.options.width))
                                  .height(self.options.zoomHeight / (size.height / self.options.height));
                    
                });
            }


        }).on('mouseleave.magnifier', function (e) {
            self.$view.hide();
            self.$selector.hide();
        });
    };

    /**
     * 创建
     * @return {Void}   
     */
    Magnifier.prototype.create = function () {

        this.$el.width(this.options.width).height(this.options.height);

        this.$imgBox = this.$el.find('.k-magnifier-imgbox').css({
            width: this.options.width,
            height: this.options.height
        });

        this.$img = this.$el.find('.k-magnifier-imgbox img');

        this.$view = $('<div class="k-magnifier-view"><img src="" /><div class="k-magnifier-loading"><span class="fa fa-spinner fa-spin"></span><br/>图片加载中，请稍候...</div></div>')
            .appendTo(this.$el)
            .css({
                width: this.options.zoomWidth,
                height: this.options.zoomHeight,
                left: this.$imgBox.position().left + this.options.width + this.options.offset,
                top: this.$imgBox.position().top,
                zIndex:this.options.zIndex
            });

        this.$viewLoading = this.$view.find('.k-magnifier-loading');
        this.$viewImg = this.$view.find('img');

        this.$selector = $('<div class="k-magnifier-selector"></div>')
            .appendTo(this.$imgBox)
            .css({
                left: 0,
                top:0
            });
    };

    /**
     * 加载图片
     * @return {Void}   
     */
    Magnifier.prototype.loadImg = function (src, callback) {
        var img = new Image();

        img.onload = function () {
            callback(true, { width: img.width, height: img.height });
        };
        img.onerror = function () {
            callback(false, { width: 0, height: 0 });
        };

        img.src = src;
    };

    /**
     * 设置位置
     * @return {Void}   
     */
    Magnifier.prototype.setPosition = function (e) {
        var x = e.pageX,
            y = e.pageY,
            left = x - this.$el.offset().left,
            top = y - this.$el.offset().top,
            selectorWidth = this.$selector.outerWidth(),
            selectorHeight = this.$selector.outerHeight(),
            maxLeft = this.options.width - selectorWidth,
            maxTop = this.options.height - selectorHeight,
            percentX, percentY;

        left = left - selectorWidth / 2;
        top = top - selectorHeight / 2;

        if (left < 0) {
            left = 0;
        } else if (left > maxLeft) {
            left = maxLeft;
        }

        if (top < 0) {
            top = 0;
        } else if (top > maxTop) {
            top = maxTop;
        }



        percentX = left / (this.$el.width() - selectorWidth);
        percentY = top / (this.$el.height() - selectorHeight);


        this.$selector.css({
            left: left,
            top: top
        });


        this.$viewImg.css({
            width: this.options.zoomWidth / selectorWidth * this.options.width,
            height: this.options.zoomHeight / selectorHeight * this.options.height,
            left: -percentX * (this.$viewImg.width() - this.$view.width()),
            top: -percentY * (this.$viewImg.height() - this.$view.height())
        })
    };

    return function ($elm,options) {
        var magnifier =new Magnifier($elm,options);
        return magnifier;
    }
});
