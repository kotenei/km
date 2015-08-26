/*
 * 面板模块
 * @date:2015-08-21
 * @author:kotenei(kotenei@qq.com)
 */
define('km/panel', ['jquery', 'km/resizable'], function ($, Resizable) {

    /**
     * 面板类
     * @param {JQuery} $elm - dom
     * @param {Object} options - 参数
     */
    var Panel = function ($elm, options) {
        this.$panel = $elm;
        this.options = $.extend(true, {
            width: 'auto',
            height: 'auto',
            minWidth: 100,
            minHeight: 100,
            resizable: {
                enabled: false,
                cover: false,
                border: {
                    left: true,
                    top: true,
                    right: true,
                    bottom: true
                },
                callback: {
                    resize: $.noop,
                    stop: $.noop
                }
            },
        }, options);
        this.init();
    };

    /**
     * 初始化
     * @return {Void}
     */
    Panel.prototype.init = function () {
        var self = this;
        this.$panel.css({
            width: this.options.width,
            height: this.options.height
        });
        this.$header = this.$panel.find('.k-panel-head');
        this.$title = this.$header.find('.k-panel-title');
        this.$body = this.$panel.find('.k-panel-body');
        this.$body.css('height', this.$panel.height() - this.$title.height());

        this.headHeight = this.$header.outerHeight();

        if (this.options.resizable.enabled) {
            this.resizable = new Resizable(this.$panel, {
                border: this.options.resizable.border,
                cover: this.options.resizable.cover,
                minWidth: this.options.minWidth,
                minHeight: this.options.minHeight
            });
        }

        //this._event = {
        //    resize: $.noop,
        //    stop: $.noop
        //};

        this.watch();
    };

    /**
     * 事件监控
     * @return {Void}
     */
    Panel.prototype.watch = function () {
        var self = this;
        this.$panel.on('click.panel', '[role=collapse]', function () {
            self.collapse($(this));
        }).on('click.panel', '[role=expand]', function () {
            self.expand($(this));
        });

        if (this.resizable) {
            this.resizable.on('resize', function (css) {
                self.setHeight(css.height);
                self.options.resizable.callback.resize.call(self, css);
            }).on('stop', function (css) {
                self.options.resizable.callback.stop.call(self, css);
            });
        }

    };

    /**
     * 添加自定义事件
     * @return {Void}
     */
    Panel.prototype.on = function (type, callback) {
        this._event[type] = callback || $.noop;
        return this;
    };

    /**
     * 设置高度
     * @return {Void}
     */
    Panel.prototype.setHeight = function (height) {
        var h = height - this.headHeight;

        this.$body.css('height', h);
    };

    Panel.prototype.setSize = function (size) {
        this.$panel.css({
            width: size.width,
            height: size.height
        });
        this.setHeight(size.height);
    };

    /**
     * 展开
     * @return {Void}
     */
    Panel.prototype.expand = function ($el) {
        var self = this;
        $el.attr('role', 'collapse');
        if ($el.hasClass('fa-angle-double-down')) {
            $el.removeClass('fa-angle-double-down').addClass('fa-angle-double-up');

            this.$panel.stop().animate({
                height: this.orgHeight
            });
            this.$body.stop().animate({
                height: this.orgHeight - this.headHeight,
                display: 'block'
            }, function () {
                if (self.resizable) {
                    self.resizable.$bottomHandle.show();
                }
            });
            return;
        }
    };

    /**
     * 折叠
     * @return {Void}
     */
    Panel.prototype.collapse = function ($el) {
        var h, self = this;

        this.orgHeight = this.$panel.outerHeight();

        $el.attr('role', 'expand');
        if ($el.hasClass('fa-angle-double-up')) {
            $el.removeClass('fa-angle-double-up').addClass('fa-angle-double-down');

            this.$panel.stop().animate({
                height: this.headHeight
            });
            this.$body.stop().animate({
                height: 0
            }, function () {
                self.$body.hide();
                if (self.resizable) {
                    self.resizable.$bottomHandle.hide();
                }
            });
            return;
        }
    };

    return Panel;
});