/*
 * 布局模块
 * @date:2015-08-23
 * @author:kotenei(kotenei@qq.com)
 */
define('km/layout', ['jquery', 'km/panel', 'km/cache'], function ($, Panel, cache) {

    /**
     * 布局类
     * @param {JQuery} $elm - dom
     * @param {Object} options - 参数
     */
    var Layout = function ($elm, options) {
        this.$layout = $elm;
        this.options = $.extend(true, {
            cache: false,
            resizeMin: 5
        }, options);
        this.$parent = this.$layout.parent();
        this.init();
        this._event = {
            show: $.noop,
            hide: $.noop
        };
    };

    /**
     * 初始化
     * @return {Void}
     */
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

    /**
     * 面板初始化
     * @return {Void}
     */
    Layout.prototype.panelInit = function () {
        var self = this;
        this.$panels.each(function () {

            var $panel = $(this).show(),
                type = $panel.attr('data-type'),
                min = self.options.resizeMin,
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

    /**
     * 事件监控
     * @return {Void}
     */
    Layout.prototype.watch = function () {
        var self = this;
        this.$win.on('resize.layout', function () {
            self.setSize();
        });
        this.$panels.on('click.layout', 'span[role=hide]', function () {
            self.hide($(this).attr('data-type'));
            return false;
        });
        this.$layout.on('click.layout', 'span[role=show]', function () {
            self.show($(this).attr('data-type'));
            return false;
        });
    };

    /**
     * 添加自定义事件
     * @return {Void}
     */
    Layout.prototype.on = function (type, callback) {
        this._event[type] = callback || $.noop;
        return this;
    };

    /**
     * 显示面板
     * @param {String} type - 面板类别
     * @return {Void}
     */
    Layout.prototype.show = function (type) {
        var self = this,
            panelsInfo = this.getPanelsInfo(),
            info = panelsInfo[type],
            $panel = info.$panel.attr('data-isHide', false),
            $expand = info.$expand,
            css;

        $expand.hide();
        $panel.show();

        switch (type) {
            case 'top':
                css = { top: 0 };
                break;
            case 'left':
                css = { left: 0 };
                break;
            case 'right':
                css = { right: 0 };
                break;
            case 'bottom':
                css = { bottom: 0 };
                break;
        }

        $panel.stop().animate(css, function () {
            self.setSize();
            if (self.$centerPanel) {
                self.$centerPanel.resize();
            }
        });

        this._event.show.call(this, info);
    };

    /**
     * 隐藏面板
     * @param {String} type - 面板类别
     * @return {Void}
     */
    Layout.prototype.hide = function (type) {

        var self = this,
            panelsInfo = this.getPanelsInfo(),
            info = panelsInfo[type],
            css;

        info.$panel.attr('data-isHide', true);

        self.setSize();
        if (self.$centerPanel) {
            self.$centerPanel.resize();
        }

        switch (type) {
            case 'top':
                css = { top: -info.height };
                break;
            case 'left':
                css = { left: -info.width };
                break;
            case 'right':
                css = { right: -info.width };
                info.$panel.css('right', 0);
                break;
            case 'bottom':
                css = { bottom: -info.height };
                info.$panel.css('bottom', 0);
                break;
        }

        info.$panel.stop().animate(css, function () {
            info.$panel.hide();
            info.$expand.show();
            self._event.hide.call(self, info);
        });
    };

    /**
     * 获取面板隐藏后占位图层HTML
     * @param {String} type - 面板类别
     * @return {String}
     */
    Layout.prototype.getExpandHtml = function (type) {
        var ret = '',
            className = '',
            faClassName = '';

        switch (type) {
            case 'left':
                className = "panel-expand panel-expand-left";
                faClassName = "fa fa-angle-double-right";
                break;
            case 'top':
                className = "panel-expand panel-expand-top";
                faClassName = "fa fa-angle-double-down";
                break;
            case 'right':
                className = "panel-expand panel-expand-right";
                faClassName = "fa fa-angle-double-left";
                break;
            case 'bottom':
                className = "panel-expand panel-expand-bottom";
                faClassName = "fa fa-angle-double-up";
                break;
        }
        return '<div class="' + className + '"><span class="' + faClassName + '" role="show" data-type="' + type + '"></span></div>';
    };

    /**
     * 设置所有面板尺寸
     * @return {Void}
     */
    Layout.prototype.setSize = function () {
        var $parent = this.$parent,
            width = $parent.width(),
            height = $parent.height(),
            info = this.getPanelsInfo(),
            t = 0,
            l = 0,
            w = 0,
            h = 0;


        if ($parent[0].tagName.toLowerCase() == 'body') {
            $parent.addClass('k-layout-body');
            height = this.$win.height();
        }


        this.$layout.css({ width: width, height: height });


        if (info.top) {

            info.top.$panel.css({ height: info.top.height, width: '100%' });
            info.top.setBodyHeight();

            if (!info.top.isHide) {
                h += info.top.height;
            } else {
                h += info.top.expandHeight;
            }
        }


        //计算中间面板距离顶部距离
        t += h;

        if (info.bottom) {
            info.bottom.$panel.css({ height: info.bottom.height, width: '100%', top: 'none' });
            info.bottom.setBodyHeight();

            if (!info.bottom.isHide) {
                info.bottom.$panel.css("bottom", 0);
                h += info.bottom.height;
            } else {
                info.bottom.$panel.css("bottom", -info.bottom.height);
                h += info.bottom.expandHeight;
            }
        }

        //计算中间面板的高度
        h = height - h;

        if (info.left) {

            info.left.$panel.css({ width: info.left.width, top: t, height: h });
            info.left.setBodyHeight();
            info.left.$expand.css({ top: t, height: h });

            if (!info.left.isHide) {
                w += info.left.width;
                l += w;
            } else {
                w += info.left.expandWidth;
                l += w;
            }
        }


        if (info.right) {

            info.right.$panel.css({ width: info.right.width, top: t, height: h, left: 'none' });
            info.right.setBodyHeight();
            info.right.$expand.css({ top: t, height: h });

            if (!info.right.isHide) {
                info.right.$panel.css('right', 0);
                w += info.right.width;
            } else {
                info.right.$panel.css('right', -info.right.width);
                w += info.right.expandWidth;
            }
        }

        if (info.center) {
            w = width - w;
            info.center.$panel.css({ top: t, left: l, width: w, height: h });
            info.center.setBodyHeight();
        }

    };

    /**
    * 获取所有面板相关信息
    * @param {String} type - 面板类别
    * @return {Object}
    */
    Layout.prototype.getPanelsInfo = function (type) {
        var ret = {};

        this.$panels.each(function () {
            var $panel = $(this),
                $expand = $panel.data('expand'),
                panel = $panel.data('panel'),
                type = $panel.attr('data-type');

            ret[type] = {
                left: $panel.position().left,
                top: $panel.position().top,
                width: $panel.outerWidth(),
                height: $panel.outerHeight(),
                isHide: $panel.attr('data-ishide') == 'true',
                $panel: $panel,
                $expand: $expand,
                panel: panel,
                expandWidth: $expand.outerWidth(),
                expandHeight: $expand.outerHeight(),
                setBodyHeight: function () {
                    if (panel) {
                        panel.setBodyHeight();
                    }
                }
            };

        });

        if (type) {
            return ret[type];
        }

        return ret;
    };

    /**
     * 全局初始化调用
     * @return {Void}
     */
    Layout.GLOBAL = function ($elms) {
        $elms = $elms || $('div[data-module=layout]');
        $elms.each(function () {
            var $el = $(this),
                options = $el.attr('data-options'),
                show = $el.attr('data-onshow'),
                hide=$el.attr('data-onhide'),
                data = $el.data('layout');

            if (options && options.length > 0) {
                options = eval('(0,' + options + ')');
            }

            show = show && show.length > 0 ? eval('(0,' + show + ')') : $.noop;
            hide = hide && hide.length > 0 ? eval('(0,' + hide + ')') : $.noop;

            if (!data) {
                data = new Layout($el, options);

                data.on('show', function (info) {
                    show.call(this, info);
                }).on('hide', function (info) {
                    hide.call(this, info);
                });

                $el.data('layout', data);
            }

        });
    };

    return Layout;

});