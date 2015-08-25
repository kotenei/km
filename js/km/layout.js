/*
 * 布局模块
 * @date:2015-08-23
 * @author:kotenei(kotenei@qq.com)
 */
define('km/layout', ['jquery', 'km/panel'], function ($, Panel) {

    var Layout = function ($elm, options) {
        this.$layout = $elm;
        this.options = $.extend(true, {

        }, options);
        this.$parent = this.$layout.parent();
        this.init();
    };

    Layout.prototype.init = function () {
        this.$win = $(window);
        this.$panels = this.$layout.children('.k-panel');
        this.$leftPanel = this.$panels.filter('.k-panel-left');
        this.$topPanel = this.$panels.filter('.k-panel-top');
        this.$rightPanel = this.$panels.filter('.k-panel-right');
        this.$bottomPanel = this.$panels.filter('.k-panel-bottom');
        this.$centerPanel = this.$panels.filter('.k-panel-center');
        this.setSize();
        this.panelInit();
        this.watch();
    };

    Layout.prototype.panelInit = function () {
        var self = this;

        this.$panels.each(function () {

            var $panel = $(this),
                type = $panel.attr('data-type'),
                options = { resizable: true, width: $panel.width(), height: $panel.height() },
                min = 40;


            switch (type) {
                case 'top':
                    options.minHeight = min;
                    options.resizeBorder = {
                        bottom: true
                    };
                    break;
                case 'left':
                    options.minWidth = min;
                    options.resizeBorder = {
                        right: true
                    };
                    break;
                case 'right':
                    options.minWidth = min;
                    options.resizeBorder = {
                        left: true
                    };
                    break;
                case 'bottom':
                    options.minHeight = min;
                    options.resizeBorder = {
                        top: true
                    };
                    break;
            }

            var panel = new Panel($panel, options);
            panel.on('resize', function (css) {
                self.setSize();
                self.$centerPanel.resize();
            });
            $panel.data('panel', panel);
        });

    };

    Layout.prototype.watch = function () {
        var self = this;
        this.$win.on('resize.layout', function () {
            self.setSize();
        });
    };

    Layout.prototype.setSize = function () {
        var $parent = this.$parent,
            width = $parent.width(),
            height = $parent.height();

        if ($parent[0].tagName.toLowerCase() == 'body') {
            $parent.addClass('k-layout-body');
            height = this.$win.height();
        }

        this.$layout.css({ width: width, height: height });

        //panel尺寸设置

        var t = 0, w = '100%', h;

        this.$topPanel.css({
            left: 0,
            top: 0,
            width: '100%',
            height: this.$topPanel.height() == 0 ? 100 : this.$topPanel.outerHeight()
        });

        this.$bottomPanel.css({
            left: 0,
            height: this.$bottomPanel.height() == 0 ? 100 : this.$bottomPanel.outerHeight(),
            width: '100%'
        });

        if (this.$topPanel.length > 0 && this.$bottomPanel.length > 0) {
            h = this.$layout.height() - this.$topPanel.outerHeight() - this.$bottomPanel.outerHeight();
        } else if (this.$topPanel.length > 0 && this.$bottomPanel.length == 0) {
            h = this.$layout.height() - this.$topPanel.outerHeight() ;
        } else if (this.$topPanel.length == 0 && this.$bottomPanel.length > 0) {
            h = this.$layout.height() - this.$bottomPanel.outerHeight() ;
        } else {
            h = this.$layout.height();
        }

        if (this.$topPanel.length > 0) {
            t = this.$topPanel.outerHeight()
        }

        this.$leftPanel.css({
            width: this.$leftPanel.width() == 0 ? 150 : this.$leftPanel.outerWidth(),
            left: 0,
            top: t,
            height: h
        });


        this.$rightPanel.css({
            width: this.$rightPanel.width() == 0 ? 150 : this.$rightPanel.outerWidth(),
            top: t,
            height: h,
            right: 0
        });


        if (this.$leftPanel.length > 0 && this.$rightPanel.length > 0) {
            w = width - this.$leftPanel.outerWidth() - this.$rightPanel.outerWidth();
        } else if (this.$leftPanel.length > 0 && this.$rightPanel.length == 0) {
            w = width - this.$leftPanel.outerWidth();
        } else if (this.$leftPanel.length == 0 && this.$rightPanel.length > 0) {
            w = width - this.$rightPanel.outerWidth();
        }

        this.$centerPanel.css({
            top: t,
            left: this.$leftPanel.length > 0 ? this.$leftPanel.outerWidth() : 0,
            width: w,
            height: h
        });

        this.$rightPanel.css({
            'left': this.$leftPanel.outerWidth() + this.$centerPanel.outerWidth(),
            'right':'none'
        });

        this.$bottomPanel.css('top', this.$topPanel.outerHeight() + h);

    };

    return Layout;

});