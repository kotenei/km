/*
 * ²¼¾ÖÄ£¿é
 * @date:2015-08-23
 * @author:kotenei(kotenei@qq.com)
 */
define('km/layout', ['jquery', 'km/panel', 'km/cache'], function ($, Panel, cache) {

    var Layout = function ($elm, options) {
        this.$layout = $elm;
        this.options = $.extend(true, {

        }, options);
        this.$parent = this.$layout.parent();
        this.init();
    };

    Layout.prototype.init = function () {
        var self = this;
        this.$win = $(window);
        this.$panels = this.$layout.children('.k-panel');
        this.$leftPanel = this.$panels.filter('.k-panel-left');
        this.$topPanel = this.$panels.filter('.k-panel-top');
        this.$rightPanel = this.$panels.filter('.k-panel-right');
        this.$bottomPanel = this.$panels.filter('.k-panel-bottom');
        this.$centerPanel = this.$panels.filter('.k-panel-center');
        this.$panels.each(function () {
            var $panel = $(this),
                type = $panel.attr('data-type'),
                $expand = $(self.getExpandHtml(type)).appendTo(self.$layout);

            $panel.data('expand', $expand);
        });
        this.setSize();
        this.panelInit();
        this.watch();
    };

    Layout.prototype.panelInit = function () {
        var self = this;
        this.$panels.each(function () {

            var $panel = $(this).show(),
                type = $panel.attr('data-type'),
                min = 40,
                options = {
                    resizable: {
                        enabled: true,
                        cover: true,
                        border: {
                            left: false,
                            top: false,
                            right: false,
                            bottom: false
                        },
                        callback: {
                            stop: function () {
                                if (self.$centerPanel.length > 0) {
                                    self.$centerPanel.resize();
                                } else {
                                    self.setSize();
                                }
                            }
                        }
                    },
                    width: $panel.width(),
                    height: $panel.height()
                };

            switch (type) {
                case 'top':
                    options.minHeight = min;
                    options.resizable.border.bottom = true;
                    break;
                case 'left':
                    options.minWidth = min;
                    options.resizable.border.right = true;
                    break;
                case 'right':
                    options.minWidth = min;
                    options.resizable.border.left = true;
                    break;
                case 'bottom':
                    options.minHeight = min;
                    options.resizable.border.top = true;
                    break;
            }
            var panel = new Panel($panel, options);
            $panel.data('panel', panel);
        });
    };

    Layout.prototype.watch = function () {
        var self = this;
        this.$win.on('resize.layout', function () {
            self.setSize();
        });
        this.$panels.on('click.layout', 'span[role=hide]', function () {
            self.hide($(this));
        });
        this.$layout.on('click.layout', 'span[role=show]', function () {
            self.show($(this).attr('data-type'));
        });
    };

    Layout.prototype.show = function (type) {
        var self = this,
            panelsInfo = this.getPanelsInfo(),
            info = panelsInfo[type],
            $panel = info.$panel.attr('data-isHide', false),
            $expand = $panel.data('expand');


        $expand.hide();
        $panel.stop();

        switch (type) {
            case 'top':
                $panel.animate({ top: 0 }, function () {
                    self.setSize();
                });
                break;
            case 'left':
                $panel.animate({ left: 0 }, function () {
                    self.setSize();
                });
                break;
            case 'right':
                $panel.animate({ left: info.left - info.width }, function () {
                    self.setSize();
                });
                break;
            case 'bottom':
                $panel.animate({ top: info.top - info.height }, function () {
                    self.setSize();
                });
                break;
        }
    };

    Layout.prototype.hide = function ($el) {
        var self = this,
            type = $el.attr('data-type'),
            $panel = $el.parents('.k-panel:eq(0)'),
            $expand = $panel.data('expand'),
            w = $panel.outerWidth(),
            h = $panel.outerHeight(),
            t = $panel.position().top,
            l = $panel.position().left,
            min = 40,
            p_w = this.$parent[0].tagName.toLowerCase() == 'body' ? this.$win.width() : this.$parent.width(),
            css;

        $panel.attr('data-isHide', true);

        if (!$expand) {
            $expand = $(this.getExpandHtml(type));
            $expand.appendTo(this.$layout);
            $panel.data('expand', $expand);
        }

        switch (type) {
            case 'top':
                css = { top: t + min, height: this.$leftPanel.height() + h - min };
                this.$leftPanel.css(css);
                this.$centerPanel.css(css);
                this.$rightPanel.css(css);
                this.$topPanel.stop().animate({ top: -h }, function () {
                    $expand.show();
                });
                break;
            case 'left':
                this.$centerPanel.css({
                    left: min,
                    width: this.$centerPanel.outerWidth() + w - min
                });
                this.$leftPanel.stop().animate({ left: -w }, function () {
                    $expand.css({
                        top: t,
                        height: h
                    }).show();
                });
                break;
            case 'right':
                this.$rightPanel.stop().animate({
                    left: l + w
                }, function () {
                    $expand.css({
                        top: t,
                        height: h
                    }).show();
                });
                break;
            case 'bottom':
                css = { height: t - h };
                this.$bottomPanel.stop().animate({
                    top: h + t
                }, function () {
                    $expand.show();
                });
                break;
        }
    };

    Layout.prototype.getExpandHtml = function (type) {
        var ret = '',
            className = '',
            faClassName = '',
            dataType = '';

        switch (type) {
            case 'left':
                className = "panel-expand panel-expand-left";
                faClassName = "fa fa-angle-double-right";
                dataType = 'left';
                break;
            case 'top':
                className = "panel-expand panel-expand-top";
                faClassName = "fa fa-angle-double-down";
                dataType = 'top';
                break;
            case 'right':
                className = "panel-expand panel-expand-right";
                faClassName = "fa fa-angle-double-left";
                dataType = 'right';
                break;
            case 'bottom':
                className = "panel-expand panel-expand-bottom";
                faClassName = "fa fa-angle-double-up";
                dataType = 'bottom'
                break;
        }
        return '<div class="' + className + '"><span class="' + faClassName + '" role="show" data-type="' + dataType + '"></span></div>';
    };

    Layout.prototype.resize = function () {

    };

    Layout.prototype.setSize = function () {
        var $parent = this.$parent,
            width = $parent.width(),
            height = $parent.height(),
            info = this.getPanelsInfo(),
            t = 0, w = '100%', h = 0, outerWidth = 0, outerHeight = 0;

        if ($parent[0].tagName.toLowerCase() == 'body') {
            $parent.addClass('k-layout-body');
            height = this.$win.height();
        }


        this.$layout.css({ width: width, height: height });


        if (!info.top.isHide) {
            outerHeight = this.$topPanel.height() == 0 ? 100 : this.$topPanel.outerHeight();
            this.$topPanel.css({
                left: 0,
                top: 0,
                width: '100%',
                height: outerHeight
            });
            h += outerHeight;
        } else {
            h += this.$topPanel.data('expand').outerHeight();
        }



        t += h;

        if (!info.bottom.isHide) {
            outerHeight = this.$bottomPanel.height() == 0 ? 100 : this.$bottomPanel.outerHeight();
            this.$bottomPanel.css({
                left: 0,
                height: outerHeight,
                width: '100%'
            });
            h += outerHeight;
        } else {
            h += this.$bottomPanel.data('expand').outerHeight();
        }

        h = height - h;

        if (!info.left.isHide) {
            this.$leftPanel.css({
                width: this.$leftPanel.width() == 0 ? 150 : this.$leftPanel.outerWidth(),
                left: 0,
                top: t,
                height: h
            });
        } else {
            this.$leftPanel.data('expand').css({
                top: t,
                height: h
            });
        }


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

        if (this.$centerPanel.length > 0) {
            this.$rightPanel.css({
                'left': this.$leftPanel.outerWidth() + this.$centerPanel.outerWidth(),
                'right': 'none'
            });

        }

        this.$bottomPanel.css('top', this.$topPanel.outerHeight() + h);

    };

    Layout.prototype.getPanelsInfo = function () {
        var ret = {};

        this.$panels.each(function () {
            var $panel = $(this),
                type = $panel.attr('data-type');

            ret[type] = {
                left: $panel.position().left,
                top: $panel.position().top,
                width: $panel.outerWidth(),
                height: $panel.outerHeight(),
                isHide: $panel.attr('data-ishide') == 'true',
                $panel: $panel
            };

        });

        return ret;
    };

    return Layout;

});