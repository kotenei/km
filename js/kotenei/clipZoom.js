/**
 * 图片剪裁模块
 * @date :2014-10-19
 * @author kotenei (kotenei@qq.com)
 */
define('kotenei/clipZoom', ['jquery', 'kotenei/dragdrop'], function ($, DragDrop) {

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

    //初始化
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
            scale: this.options.scale
        });

        //图片加载
        this.imgLoad();
    }

    //设置图片尺寸
    ClipZoom.prototype.setImgSize = function (width, height) {
        this.$bigImg.width(width-2).height(height-2);
    };

    //图片加载
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
                width: size.width-2,
                height: size.height-2
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
                    }
                }
            });

            //设置预览
            self.setPreview();

        };
        img.onerr = function () { alert('图片加载失败'); };
        img.src = this.options.imgUrl;
    };


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

    //设置预览
    ClipZoom.prototype.setPreview = function () {
        var self = this;

        var xsize = this.options.selectorWidth;
        var ysize = this.options.selectorHeight;
        //var boundx = data.viewPortWidth;
        //var boundy = data.viewPortHeight;

    };

    return ClipZoom;

});
