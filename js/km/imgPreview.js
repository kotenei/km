/**
 * 图片预览模块
 * @date :2014-11-6
 * @author kotenei (kotenei@qq.com)
 */
/*global define, require, document*/
define('km/imgPreview', ['jquery', 'km/loading', 'km/popTips'], function ($, Loading, popTips) {

    /**
     * 图片预览模块
     * @constructor
     * @alias km/imgPreview
     * @param {JQuery} $elements - dom
     * @param {Object} options - 参数设置
     */
    var ImgPreview = function ($elements, options) {
        this.$elements = $elements;
        this.options = $.extend(true, {
            delay: 500,
            showButtons: true,
            backdrop: true,
            backdropClose: true,
            tpl: '<div class="k-imgPreview">' +
                    '<div class="k-container">' +
                        '<span class="close" role="close"><i class="fa fa-close"></i></span>' +
                        '<span class="prev" role="prev"><i class="fa fa-chevron-left"></i></span>' +
                        '<span class="next" role="next"><i class="fa fa-chevron-right"></i></span>' +
                        '<img src="" />' +
                    '</div>' +
                    '<p class="description"></p>' +
                 '</div>'
        }, options);
        this.$win = $(window);
        this.isLoading = false;
        this.index = 0;
        this.init();
    };

    /**
     * 初始化
     * @return {Void}   
     */
    ImgPreview.prototype.init = function () {
        if (this.$elements.length === 0) { return; }
        this.$imgPreview = $(this.options.tpl).appendTo(document.body);
        this.$container = this.$imgPreview.find('.k-container');
        this.$img = this.$container.find('img');
        this.$prev = this.$container.find('.prev');
        this.$next = this.$container.find('.next');
        this.$backdrop = $('<div/>').addClass('k-imgPreview-backdrop').appendTo(document.body);
        this.$elements.css('cursor', 'pointer').each(function (i) {
            var $this = $(this),
                id = 'imgPreview_' + i;
            this.id = id;
            $this.attr('data-index', i);
        });
        this.eventBind();
    };

    /**
     * 事件绑定
     * @return {Void}   
     */
    ImgPreview.prototype.eventBind = function () {
        var self = this;

        this.$elements.on('click.imgpreview', function () {
            var $this = $(this);
            self.index = Number($this.attr('data-index'));
            self.show();
        });

        this.$backdrop.on('click.imgpreview', function () {
            if (self.options.backdropClose) {
                self.hide();
            }
        });

        this.$imgPreview.on('click.imgpreview', '[role=close]', function () {
            //关闭
            self.hide();
        }).on('click.imgpreview', '[role=prev]', function () {
            if (self.isLoading) {
                return;
            }
            //向前
            if (self.index === 0) {
                return;
            }
            self.index--;
            self.showControls();
            self.show();
        }).on('click.imgpreview', '[role=next]', function () {

            if (self.isLoading) {
                return;
            }

            //向后
            if (self.index >= self.$elements.length - 1) {
                return;
            }
            self.index++;
            self.showControls();
            self.show();
        }).on('mouseenter.imgpreview', function () {
            self.showControls();
        }).on('mouseleave.imgpreview', function () {
            self.$prev.hide();
            self.$next.hide();
        });

        this.$win.on('resize.imgpreview', function () {
            var width = parseInt(self.$img.attr('data-width')),
                height = parseInt(self.$img.attr('data-height'));

            if (self.tm) {
                clearTimeout(self.tm);
            }

            if (self.isShow) {
                self.tm = setTimeout(function () {
                    self.setPosition({ width: width, height: height });
                }, 300);
            }

        });
    };

    /**
     * 按钮显示
     * @return {Void}   
     */
    ImgPreview.prototype.showControls = function () {
        var len = this.$elements.length;

        if (len === 1) {
            return;
        }

        if (this.index === 0) {
            this.$prev.hide();
            this.$next.show();
        } else if (this.index >= len - 1) {
            this.$prev.show();
            this.$next.hide();
        } else {
            this.$prev.show();
            this.$next.show();
        }
    };

    /**
     * 图片加载
     * @param {String} str - 图片路径
     * @param {Function} callback - 回调函数
     * @return {Void}   
     */
    ImgPreview.prototype.imgLoad = function (src, callback) {
        var img = new Image();

        img.onload = function () {
            callback(true, { width: img.width, height: img.height });
        };
        img.onerror = function () {
            popTips.error('图片加载失败！', 1500);
            callback(false, { width: 0, height: 0 });
        };
        img.src = src;
    };

    /**
     * 获取窗体最大尺寸
     * @return {Object}   
     */
    ImgPreview.prototype.getMaxSize = function () {
        return {
            width: this.$win.width() - 100,
            height: this.$win.height() - 100
        };
    };

    /**
     * 缩放
     * @param {Number} width - 宽度
     * @param {Number} height - 高度
     * @return {Object}   
     */
    ImgPreview.prototype.zoom = function (width, height) {

        var ratio;
        var nW, nh;
        var maxSize = this.getMaxSize();

        if (width < maxSize.width && height < maxSize.height) {
            return { width: width, height: height };
        }

        if (width >= height) {
            ratio = width / height;
            nh = maxSize.width / ratio;
        } else {
            ratio = height / width;
            nh = maxSize.width * ratio;
        }

        nw = maxSize.width;

        if (nh > maxSize.height) {
            nh = maxSize.height;
            nw = width / height * nh;
        }

        return { width: nw, height: nh };
    };

    /**
     * 显示
     * @return {Void}   
     */
    ImgPreview.prototype.show = function () {
        var self = this,
            $img = this.$elements.eq(this.index),
            src;

        if ($img.length === 0) { return; }

        src = $img.attr('data-href') || $img.attr('src');

        if (!src || this.isLoading) { return; }

        this.isShow = true;

        this.isLoading = true;

        Loading.show();

        this.imgLoad(src, function (result, size) {

            if (result) {
                self.$img.attr({
                    'src': src,
                    'data-width': size.width,
                    'data-height': size.height
                });

                //self.$imgPreview.hide().fadeIn(self.options.delay);  

                if (self.options.backdrop && self.$backdrop[0].style.display != 'block') {
                    self.$backdrop.css({
                        opacity: 0,
                        display: 'block'
                    }).stop().animate({
                        opacity: 0.8
                    }, self.options.delay)
                }

                self.setPosition(size);

            } else {
                self.hide();
            }
            Loading.hide();
            self.isLoading = false;
        });
    };

    /**
     * 隐藏
     * @return {Void}   
     */
    ImgPreview.prototype.hide = function () {
        this.isLoading = false;
        Loading.hide();
        this.isShow = false;
        this.$imgPreview.fadeOut(this.options.delay);
        if (this.options.backdrop) {
            this.$backdrop.fadeOut(this.options.delay);
        }
    };

    /**
     * 定位
     * @param {Object} imgSize - 图片尺寸
     * @return {Void}   
     */
    ImgPreview.prototype.setPosition = function (imgSize) {

        var win_w = this.$win.width(),
            win_h = this.$win.height(),
            iw = imgSize.width,
            ih = imgSize.height;

        var size = this.zoom(iw, ih);

        this.$container.show().stop().animate({
            width: size.width,
            height: size.height
        });

        this.$imgPreview.show().stop().animate({
            width: size.width + 20,
            height: size.height + 20,
            marginTop: -((size.height + 20) / 2),
            marginLeft: -((size.width + 20) / 2)
        });

    };

    /**
     * 销毁
     * @return {Void}   
     */
    ImgPreview.prototype.destory = function () {
        this.$elements.off();
        this.$backdrop.off().remove();
        this.$imgPreview.off().remove();
    }

    return function ($elms, options) {
        $elms = $elms || $('img');
        if ($elms.length==0) {
            return null;
        }
        var imgPreview = new ImgPreview($elms, options);
        return imgPreview;
    }

});
