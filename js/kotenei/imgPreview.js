/**
 * 图片预览模块
 * @date :2014-11-6
 * @author kotenei (kotenei@qq.com)
 */
/*global define, require, document*/
define('kotenei/imgPreview', ['jquery', 'kotenei/loading', 'kotenei/popTips'], function ($, Loading, popTips) {

    var ImgPreview = function ($elements, options) {
        this.$elements = $elements;
        this.options = $.extend({
            showButtons: true,
            backdrop: true,
            backdropClose: true,
            tpl: '<div class="k-imgPreview">' +
                    '<div class="container"></div>' +
                    '<p class="description"></p>' +
                 '</div>'
        });
        this.imgs = {};
        this.init();
    };

    ImgPreview.prototype.init = function () {
        var self = this;
        if (this.$elements.length === 0) { return; }
        this.$imgPreview = $(this.options.tpl).appendTo(document.body);
        this.$elements.css('cursor', 'pointer').each(function (i) {
            var id = 'imgPreview_' + i;
            this.id = id;
            self.imgs[id] = $(this);
        });

    };

    return ImgPreview;

});
