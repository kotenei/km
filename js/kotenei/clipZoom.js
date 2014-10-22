/**
 * 图片剪裁模块
 * @date :2014-10-19
 * @author kotenei (kotenei@qq.com)
 */
define('kotenei/clipZoom', ['jquery', 'kotenei/dragdrop'], function ($, DragDrop) {

    /**
     * 图片剪裁模块
     * @constructor
     * @alias kotenei/clipZoom
     * @param {JQuery} $element - dom
     * @param {Object} options - 参数设置
     */
    var ClipZoom = function ($element, options) {
        this.$element = $element;
        this.options = $.extend({}, {
            imgUrl: '',
            scale: true,
            width: 400,
            height: 300,
            selectorWidth: 120,
            selectorHeight: 100
        }, options);

        this.$selector = $element.find('.selector');
        this.$clipZoomBox = $element.find('.k-clipZoom-Box').width(this.options.width).height(this.options.height);
        this.$container = this.$clipZoomBox.find('.container');
        this.$bigImg = this.$container.find('img');
        this.$viewBox = $element.find(".view-box");
        this.$viewImg = this.$viewBox.find("img");

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
    };


    /**
     * 设置图片尺寸
     * @param  {Number} width - 宽度
     * @param  {Number} height - 高度
     * @return {Void}   
     */
    ClipZoom.prototype.setImgSize = function (width, height) {
        this.$bigImg.width(width - 2).height(height - 2);
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
            self.$container.css({
                width: size.width,
                height: size.height,
                left: 0,
                top: 0
            });

            //设置大图
            self.$bigImg.attr('src', self.options.imgUrl).css({
                width: size.width - 2,
                height: size.height - 2
            });

            //设置预览图
            self.$viewImg.attr('src', self.options.imgUrl).css({
                width: size.width - 2,
                height: size.height - 2
            });

            //记录重重置参数
            self.resetSize = {
                width: size.width,
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
                    resize: function (css) {
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
        return { width: zoomWidth, height: height };
    };

    //裁剪
    ClipZoom.prototype.clip = function () { };

    //居中
    ClipZoom.prototype.center = function () { };

    //重置
    ClipZoom.prototype.reset = function () { };

    //缩放
    ClipZoom.prototype.zoom = function () { };

    /**
     * 设置右则预览
     * @return {Void}   
     */
    ClipZoom.prototype.setPreview = function () {
        var self = this;
        var options = this.options;
        var clipInfo = this.getClipInfo();
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
     * 获取裁剪相关信息
     * @return {Object}   
     */
    ClipZoom.prototype.getClipInfo = function () {
        var options = this.options;
        return {
            imgUrl: options.imgUrl,
            imgWidth: this.$bigImg.width(),
            imgHeight: this.$bigImg.height(),
            imgX: this.$container.position().left,
            imgY: this.$container.position().top,
            selectorWidth: this.$selector.width(),
            selectorHeight: this.$selector.height(),
            selectorX: this.$selector.position().left,
            selectorY: this.$selector.position().top,
            viewPortWidth: options.width,
            viewPortHeight: options.height,
            x2: this.$selector.position().left + this.$selector.outerWidth(),
            y2: this.$selector.position().top + this.$selector.outerHeight()
        };
    };

    return ClipZoom;

});
