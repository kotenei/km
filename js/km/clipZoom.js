/**
 * 图片剪裁模块
 * @date :2014-10-19
 * @author kotenei (kotenei@qq.com)
 */
define('km/clipZoom', ['jquery', 'km/dragdrop'], function ($, DragDrop) {

    /**
     * 图片剪裁模块
     * @constructor
     * @alias km/clipZoom
     * @param {JQuery} $element - dom
     * @param {Object} options - 参数设置
     */
    var ClipZoom = function ($element, options) {
        this.$element = $element;
        this.options = $.extend(true, {
            imgUrl: '',
            scale: true,
            width: 400,
            height: 300,
            selectorWidth: 120,
            selectorHeight: 100,
            callback: {
                clip: null
            }
        }, options);

        this.$selector = $element.find('.selector');
        this.$clipZoomBox = $element.find('.k-clipZoom-Box').width(this.options.width).height(this.options.height);
        this.$container = this.$clipZoomBox.find('.k-container');
        this.$mainImg = this.$container.find('img');
        this.$viewBox = $element.find(".view-box");
        this.$viewImg = this.$viewBox.find("img");
        this.$resultBox = $element.find('.result-box');
        this.$resultImg = this.$resultBox.find('img');
        this.init();
    };

    /**
     * 初始化
     * @return {Void}   
     */
    ClipZoom.prototype.init = function () {
        var self = this;

        //设置选择层和预览层尺寸
        this.$selector.width(this.options.selectorWidth).height(this.options.selectorHeight);
        this.$viewBox.width(this.options.selectorWidth).height(this.options.selectorHeight);

        //初始化选择层拖动
        this.selectorDnd = new DragDrop({
            $layer: this.$selector,
            $range: this.$clipZoomBox,
            resizable: true,
            scale: this.options.scale,
            callback: {
                resize: function () {
                    self.setPreview();
                },
                move: function () {
                    self.setPreview();
                }
            }
        });

        //图片加载
        this.imgLoad();

        this.eventBind();
    };

    /**
     * 绑定事件
     * @return {Void}   
     */
    ClipZoom.prototype.eventBind = function () {
        var self = this;

        this.$element.on('click.clipzoom', '[role="clip"]', function () {
            //裁剪
            self.clip();
        }).on('click.clipzoom', '[role="center"]', function () {
            //居中
            self.center();
        }).on('click.clipzoom', '[role="reset"]', function () {
            //重置
            self.reset();
        }).on('click.clipzoom', '[role="plus"]', function () {
            //放大
            self.zoom(true);
        }).on('click.clipzoom', '[role="minus"]', function () {
            //缩小
            self.zoom(false);
        });
    };

    /**
     * 设置图片尺寸
     * @param  {Number} width - 宽度
     * @param  {Number} height - 高度
     * @return {Void}   
     */
    ClipZoom.prototype.setImgSize = function (width, height) {
        this.$mainImg.width(width).height(height);
    };

    /**
     * 图片加载
     * @return {Void}   
     */
    ClipZoom.prototype.imgLoad = function () {

        var self = this;
        var img = new Image();
        img.onload = function () {

            var size = self.getSize(img.width, img.height, self.options.width);

            if (img.width < self.options.width) {
                size.width = img.width;
                size.height = img.height;
            }

            //设置图片拖动层样式
            self.$container.width(size.width).height(size.height).css({
                left: 0,
                top: 0
            });

            //设置大图
            self.$mainImg.attr('src', self.options.imgUrl).width(size.width).height(size.height);

            //设置预览图
            self.$viewImg.attr('src', self.options.imgUrl).width(size.width).height(size.height);

            //记录重重置参数
            self.resetSize = {
                width: size.width ,
                height: size.height,
                left: 0,
                top: 0
            };

            //初始化图片拖动
            self.containerDnd = new DragDrop({
                $layer: self.$container,
                $range: self.$clipZoomBox,
                resizable: true,
                boundary: true,
                scale: true,
                callback: {
                    resize: function (e,css) {
                        self.setImgSize(css.width, css.height);
                        self.setPreview();
                    },
                    move: function () {
                        self.setPreview();
                    }
                }
            });

            //设置预览
            self.setPreview();

        };
        img.onerr = function () { alert('图片加载失败'); };
        img.src = this.options.imgUrl;
    };

    /**
     * 获取缩放尺寸
     * @param  {Number} width - 宽度
     * @param  {Number} height - 高度
     * @param  {Number} zoomWidth - 缩放宽度
     * @return {Object}   
     */
    ClipZoom.prototype.getSize = function (width, height, zoomWidth) {
        var ratio;

        if (width >= height) {
            ratio = width / height;
            height = zoomWidth / ratio;
        } else {
            ratio = height / width;
            height = zoomWidth * ratio;
        }
        return { width: parseInt(zoomWidth), height: parseInt(height) };
    };

    /**
     * 缩放
     * @return {Void}   
     */
    ClipZoom.prototype.zoom = function (isPlus) {
        var ow = this.$container.width(),
            oh = this.$container.height(),
            nw;


        if (isPlus) {
            nw = ow / 0.8;
        } else {
            nw = ow * 0.8;
        }

        var size = this.getSize(ow, oh, nw);

        this.$container.width(size.width).height(size.height);
        this.$mainImg.width(size.width).height(size.height);
        this.$viewImg.width(size.width).height(size.height);

        this.setPreview();
    };

    /**
     * 裁剪
     * @return {Void}   
     */
    ClipZoom.prototype.clip = function () {
        var clipData = {
            imgSource: this.options.imgUrl,
            imgWidth: this.$viewImg.width(),
            imgHeight: this.$viewImg.height(),
            imgX: Math.abs(this.$viewImg[0].style.marginLeft.replace("px", "")) - this.$viewImg.position().left,
            imgY: Math.abs(this.$viewImg[0].style.marginTop.replace("px", "")) - this.$viewImg.position().top,
            selectorX: this.$selector.position().left,
            selectorY: this.$selector.position().top,
            cutterWidth: this.options.selectorWidth,
            cutterHeight: this.options.selectorHeight
        };

        if ($.isFunction(this.options.callback.clip)) {
            this.options.callback.clip(clipData);
        }
    };

    /**
     * 居中
     * @return {Void}   
     */
    ClipZoom.prototype.center = function () {
        var imgWidth = parseInt(this.$mainImg.width()),
            imgHeight = parseInt(this.$mainImg.height()),
            selectorWidth = parseInt(this.$selector.width()),
            selectorHeight = parseInt(this.$selector.height()),
            containerWidth = parseInt(this.options.width),
            containerHeight = parseInt(this.options.height);

        var size = this.getSize(imgWidth, imgHeight, selectorWidth);

        if (size.height < selectorHeight) {
            size.width = imgWidth / imgHeight * selectorHeight;
            size.height = selectorHeight;
        }

        this.$mainImg.width(size.width).height(size.height);
        this.$viewImg.width(size.width).height(size.height);

        this.$container.width(size.width).height(size.height).css({
            top: (containerHeight - size.height) / 2,
            left: (containerWidth - size.width) / 2
        });

        this.$selector.css({
            top: (containerHeight - selectorHeight) / 2,
            left: (containerWidth - selectorWidth) / 2
        });

        this.setPreview();

    };

    /**
     * 重置
     * @return {Void}   
     */
    ClipZoom.prototype.reset = function () {
        this.$container.width(this.resetSize.width).height(this.resetSize.height).css({
            left: 0,
            top: 0
        });
        this.$mainImg.width(this.resetSize.width).height(this.resetSize.height);
        this.$viewImg.width(this.resetSize.width).height(this.resetSize.height);

        this.setPreview();
    };

    /**
     * 设置右则预览
     * @return {Void}   
     */
    ClipZoom.prototype.setPreview = function () {
        var self = this;
        var options = this.options;
        var clipInfo = this.getPreviewInfo();
        var xsize = options.selectorWidth;
        var ysize = options.selectorHeight;
        var boundx = clipInfo.viewPortWidth;
        var boundy = clipInfo.viewPortHeight;

        if (clipInfo.selectorWidth > 0) {
            var rx = xsize / clipInfo.selectorWidth;
            var ry = ysize / clipInfo.selectorHeight;
            this.$viewImg.css({
                width: Math.round(rx * clipInfo.imgWidth),
                height: Math.round(ry * clipInfo.imgHeight),
                left: Math.round(rx * clipInfo.imgX),
                top: Math.round(ry * clipInfo.imgY),
                marginLeft: -(Math.round(rx * clipInfo.selectorX)),
                marginTop: -(Math.round(ry * clipInfo.selectorY))
            });
        }
    };

    /**
     * 获取设置预览的相关信息
     * @return {Object}   
     */
    ClipZoom.prototype.getPreviewInfo = function () {
        var options = this.options;
        return {
            imgWidth: this.$mainImg.width(),
            imgHeight: this.$mainImg.height(),
            imgX: this.$container.position().left,
            imgY: this.$container.position().top,
            selectorWidth: this.$selector.width(),
            selectorHeight: this.$selector.height(),
            selectorX: this.$selector.position().left,
            selectorY: this.$selector.position().top,
            viewPortWidth: options.width,
            viewPortHeight: options.height
        };
    };

    return ClipZoom;

});
