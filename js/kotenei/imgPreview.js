/**
 * 图片预览模块
 * @date :2014-11-6
 * @author kotenei (kotenei@qq.com)
 */
/*global define, require, document*/
define('kotenei/imgPreview', ['jquery', 'kotenei/loading', 'kotenei/popTips'], function ($, Loading, popTips) {

    var ImgPreview = function ($elements, options) {
        this.$elements = $elements;
        this.options = $.extend({}, {
            showButtons: true,
            backdrop: true,
            backdropClose: true,
            tpl: '<div class="k-imgPreview">' +
                    '<div class="container">' +
                        '<span class="close"><i class="fa fa-close"></i></span>' +
                        '<span class="prev"><i class="fa fa-chevron-left"></i></span>' +
                        '<span class="next"><i class="fa fa-chevron-right"></i></span>' +
                        '<img src="" />' +
                    '</div>' +
                    '<p class="description"></p>' +
                 '</div>'
        }, options);
        this.index = 0;
        this.init();
    };

    ImgPreview.prototype.init = function () {
        var self = this;
        if (this.$elements.length === 0) { return; }

        this.$imgPreview = $(this.options.tpl).appendTo(document.body);
        this.$backdrop = $('<div/>').addClass('k-imgPreview-backdrop').appendTo(document.body);

        this.$elements.css('cursor', 'pointer').each(function (i) {
            var $this = $(this),
                id = 'imgPreview_' + i;
            this.id = id;
            $this.attr('data-index', i);
        });

        this.$elements.on('click', function () {
            var $this = $(this),
                src = $this.attr('data-href') || $this.attr('src');

            if (!src) {
                return;
            }

            Loading.show();
            self.imgLoad(src, $this, function (result) {
                if (result) {
                    self.$imgPreview.find('img').attr('src', src);
                    self.show();
                } else {
                    self.hide();
                }
                Loading.hide();
            });
        });

        this.$backdrop.on('click', function () {
            if (self.options.backdropClose) {
                self.hide();
            }
        });
    };

    ImgPreview.prototype.imgLoad = function (src, $img, callback) {
        var img = new Image();

        img.onload = function () {
            $img.attr('src', src);
            callback(true);
        };
        img.onerror = function () {
            popTips.error('图片加载失败！', 1500);
            callback(false);
        };
        img.src = src;
    };

    ImgPreview.prototype.show = function () {
        this.$imgPreview.fadeIn('fast');
        if (this.options.backdrop) {
            this.$backdrop.show();
        }
    };

    ImgPreview.prototype.hide = function () {
        this.$imgPreview.fadeOut('fast');
        if (this.options.backdrop) {
            this.$backdrop.hide();
        }
    };

    return ImgPreview;

});
