/*
 * 窗体模块
 * @date:2014-09-17
 * @email:kotenei@qq.com
 */
define('widget/window', ['jquery', 'widget/dragdrop', 'widget/popTips'], function ($, DragDrop, popTips) {

    var Window = function (options) {
        this.options = $.extend({}, {
            url: null,
            params: null,
            title: '弹出框',
            content: null,
            width: '600',
            height: null,
            backdrop: true,
            backdropClose: false
        }, options);

        this._event = {
            open: $.noop,
            ok: $.noop,
            close: $.noop
        };

        this.loading = false;
        this.template = '<div class="window">' +
                            '<h4 class="window-header"><span class="window-title"></span><span class="window-close">×</span></h4>' +
                            '<div class="window-container"></div>' +
                            '<div class="window-footer">' +
                                '<button type="button" class="btn btn-primary window-ok">确定</button>' +
                                '<button type="button" class="btn btn-default window-cancel">取消</button>' +
                            '</div>' +
                        '</div>';
        this.backdrop = '<div class="window-backdrop"></div>';
        this.$document = $(document);
        this.$window = $(window)
        this.init();
    };

    Window.prototype.init = function () {
        this.build();
        this.setTitle(this.options.title);
        if (this.options.content !== null) { this.setContent(this.options.content); }
        this.eventBind();
    };

    Window.prototype.eventBind = function () {
        var self = this;
        this.$window.on('resize.window', function () {
            self.layout();
        });
        this.$backdrop.on('click', function () {
            if (self.options.backdropClose) {
                self.close();
            }
        });
        this.$win.on('click', '.window-cancel,.window-close', function () {
            self.close();
        }).on('click', '.window-ok', function () {
            if (self._event.ok.call(self) !== false) {
                self.hide();
            }
        });
    };

    Window.prototype.on = function (type, callback) {
        if (this._event.hasOwnProperty(type)) {
            this._event[type] = callback || $.noop;
        }
    };

    Window.prototype.setTitle = function (title) {
        this.$header.find('.window-title').text(title);
    };

    Window.prototype.setContent = function (content) {
        content = content || this.options.content;
        this.$container.html(content);
    };

    Window.prototype.remote = function () {
        if (typeof this.options.url !== 'string' || this.options.content != null) { return; }
        var self = this;
        var dtd = $.Deferred();
        this.loading = true;
        this.$container.load(this.options.url + "?rnd=" + Math.random(), this.options.params, function () {
            self.loading = false;
            dtd.resolve();
        });
        return dtd.promise();
    };

    Window.prototype.open = function () {
        var self = this;
        $.when(
            this.remote()
        ).done(function () {
            self.$win.show();
            if (self.options.backdrop) { self.$backdrop.show(); }
            self.layout();
            self._event.open(self.$win);
        });
    };

    Window.prototype.close = function (enforce) {
        if (enforce) {
            this.hide()
            return;
        }

        if (this._event.close() !== false) {
            this.hide();
        }
    };

    Window.prototype.hide = function () {
        this.$win.hide();
        this.$backdrop.hide();
    };

    Window.prototype.layout = function () {
        //屏幕高度
        var screenHeight = this.$window.height();
        //最大弹窗高度
        var maxWinHeight = screenHeight - 100;
        //头部高度
        var headerHeight = this.$header.height();
        //底部高度
        var footerHeight = this.$footer.height();
        //最大容器高度
        var maxContainerHeight = maxWinHeight - headerHeight - footerHeight;

        var newHeight, containerHeight;

        if (this.options.height) {
            // 最大弹窗高度小于设置的高度
            if (maxWinHeight < this.options.height) {
                newHeight = maxWinHeight;
                containerHeight = maxContainerHeight;
            } else {
                newHeight = this.options.height;
                containerHeight = newHeight - headerHeight - footerHeight;
            }
        } else {

            this.orgHeight = this.orgHeight || this.$win.height();
            // 最大弹窗高度小于当前窗体高度
            if (maxWinHeight < this.orgHeight) {
                newHeight = maxWinHeight;
                containerHeight = maxContainerHeight;
            } else {
                newHeight = this.orgHeight;
                containerHeight = this.orgHeight - headerHeight - footerHeight;
            }
        }

        this.$container.css("height", containerHeight);
        this.$win.css({
            height: newHeight,
            marginLeft: -this.$win.width() / 2,
            marginTop: -newHeight / 2
        });
    };

    Window.prototype.build = function () {
        this.$win = $(this.template).css({
            width: this.options.width,
            height: this.options.height
        });
        this.$backdrop = $(this.backdrop);
        this.$header = this.$win.find('.window-header');
        this.$container = this.$win.find('.window-container');
        this.$footer = this.$win.find('.window-footer');
        this.$win.appendTo(document.body);
        this.$backdrop.appendTo(document.body);
    };

    Window.alert = function (title, content, onOk) {
        if ($.isFunction(content)) {
            onOk = content;
            content = title;
            title = "确认提示";
        }
        var win = window.winAlert;
        if (!win) {
            win = new Window({ width: 400, backdropClose: false });
            win.$win.find(".window-cancel").hide();
            window.winAlert = win;
        }
        win.setTitle(title);
        win.setContent(content);
        win.on('ok', onOk || $.noop);
        win.open();
    };

    Window.confirm = function (title, content, onOk, onClose) {
        if ($.isFunction(content)) {
            onClose = onOk;
            onOk = content;
            content = title;
            title = "确认提示";
        }
        var win = window.winConfirm;
        if (!win) {
            win = new Window({ width: 400, backdropClose: false });
            window.winConfirm = win;
        }
        win.setTitle(title);
        win.setContent(content);
        win.on('ok', onOk || $.noop);
        win.on('close', onClose || $.noop);
        win.open();
    };

    var zIndex = (function () {
        var zIndex = [];

        return {
            get: function () {
                var ret;
                if (zIndex.length === 0) {
                    ret = 1000;
                    zIndex.push(ret);
                } else {
                    ret = zIndex[zIndex.length - 1];
                    ret += 2;
                    zIndex.push(ret);
                }
                return ret;
            },
            pop: function () {
                if (zIndex.length === 0) { return; }
                zIndex.pop();
            }
        };

    })();

    return Window;

});