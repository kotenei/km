/*
 * ²¼¾ÖÄ£¿é
 * @date:2015-08-23
 * @author:kotenei(kotenei@qq.com)
 */
define('km/layout', ['jquery', 'km/panel'], function ($, Panel) {

    var Layout = function ($elm, options) {
        this.$layout = $elm;
        this.options = $.extend(true, {

        }, options);
        this.init();
    };

    Layout.prototype.init = function () {
        this.$win = $(window);
        this.$panels = this.$layout.find('.k-panel');
        this.setSize();
        this.watch();
    };

    Layout.prototype.watch = function () {
        var self = this;
        this.$win.on('resize.layout', function () {
            self.setSize();
        });
    };

    Layout.prototype.setSize = function () {
        var $parent = this.$layout.parent(),
            width = $parent.width(),
            height = $parent.height();

        if ($parent[0].tagName.toLowerCase() == 'body') {
            width = this.$win.width();
            height = this.$win.height();
        }

        this.$layout.css({ width: width, height: height });
    };

    return Layout;

});