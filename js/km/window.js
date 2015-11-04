/*
 * 窗体模块
 * @date:2014-09-17
 * @author:kotenei(kotenei@qq.com)
 */
define('km/window', ['jquery', 'km/dragdrop', 'km/popTips', 'km/loading'], function ($, DragDrop, popTips, Loading) {

    /**
     * 窗体模块
     * @param {Object} options - 参数
     */
    var Window = function (options) {
        this.options = $.extend(true, {
            id: null,
            url: null,
            params: null,
            title: '弹出框',
            content: null,
            width: '600',
            height: null,
            backdrop: true,
            backdropClose: false,
            iframe: false,
            appendTo: document.body,
            showFooter: true,
            borderRadius: '6px',
            btns: []
        }, options);

        if (this.options.btns.length == 0) {
            this.options.btns = [
                { text: '确定', className: 'k-btn-primary', action: 'ok' },
                { text: '取消', className: 'k-btn-default', action: 'close' }
            ];
        }

        this._event = {
            open: $.noop,
            ok: $.noop,
            close: $.noop,
            afterClose: $.noop
        };
        this.identity = this.options.id || ids.get();
        this.isClose = true;
        this.loading = false;
        this.template = '<div class="k-window" id="k-window-' + (this.identity) + '">' +
                            '<h4 class="k-window-header"><span class="k-window-title"></span><span class="k-window-close" role="kwin_close">×</span></h4>' +
                            '<div class="k-window-container"></div>' +
                            '<div class="k-window-footer">' +

                                //'<div class="k-btn-box">'+

                                //'<button type="button" class="k-btn k-btn-primary k-window-ok k-btn-inner" role="kwin_ok">确定</button>' +
                                //'<div class="insert-btn-box"></div>' +

                                //'<button type="button" class="k-btn k-btn-default k-window-cancel k-btn-inner" role="kwin_close">取消</button>' +

                                //'</div>'+

                                 //'<div class="append-btn-box"></div>' +

                            '</div>' +
                        '</div>';
        this.backdrop = '<div class="k-window-backdrop"></div>';
        this.$document = $(document);
        this.$window = $(window);
        this.init();
    };

    /**
     * 初始化
     * @return {Void} 
     */
    Window.prototype.init = function () {
        this.build();
        this.setTitle(this.options.title);

        if (this.options.iframe) {

            this.$container.css({
                padding: 0,
                overflowY: 'hidden'
            }).append('<iframe frameborder="0" width="100%" src="' + (this.options.url || "about:blank") + '" scrolling="auto"></iframe>');
            this.$iframe = this.$container.find('iframe');
        } else {
            this.setContent(this.options.content);
        }
        this.eventBind();
    };

    /**
     * 事件绑定
     * @return {Void}
     */
    Window.prototype.eventBind = function () {
        var self = this;

        this.$window.on('resize.window.' + this.identity, function () {

            if (self.tm) {
                clearTimeout(self.tm);
            }

            self.tm = setTimeout(function () {
                self.layout();
            }, 300);
            
        });

        this.$backdrop.on('click.window', function () {
            if (self.options.backdropClose) {
                self.close();
            }
        });


        this.$win.on('click.window', '[role=kwin_close],[role=kwin_cancel]', function () {
            if (self._event.close.call(self) !== false) {
                self.close();
            }
        }).on('click.window', '[role=kwin_ok]', function () {

            if (self._event.ok.call(self) !== false) {
                self.close();
            }
        });


        if (this.options.btns && this.options.btns.length > 0) {
            for (var i = 0, item, action; i < this.options.btns.length; i++) {
                item = this.options.btns[i];
                action = item.action.toLowerCase();

                if (action == 'ok' || action == "cancel" || action == 'close') {
                    continue;
                }


                (function (item, action, self) {

                    self.$win.off('click.window', '[role=kwin_' + action + ']')
                        .on('click.window', '[role=kwin_' + action + ']', function () {
                            if (item.func && item.func.call(self, self.$iframe) !== false) {
                                self.close();
                            }
                        });

                })(item, action, this);



            }
        }

    };

    /**
     * 设置事件回调
     * @param  {String}   type  - 事件名
     * @param  {Function} callback - 回调方法
     * @return {Void}           
     */
    Window.prototype.on = function (type, callback) {
        this._event[type] = callback || $.noop;
        return this;
    };

    /**
     * 设置标题
     * @param {String} title - 标题 
     */
    Window.prototype.setTitle = function (title) {
        this.$header.find('.k-window-title').text(title);
    };

    /**
     * 设置内容
     * @param {String} content - 内容
     */
    Window.prototype.setContent = function (content) {
        content = content || this.options.content;
        this.$container.html(content);
    };

    /**
     * 设置大小
     * @param {Object} size - 尺寸
     */
    Window.prototype.setSize = function (size) {
        this.options.width = size.width;
        this.options.height = size.height;
        this.$win.css(size);
    };

    /**
     * 远程取内容
     * @return {Object} 
     */
    Window.prototype.remote = function () {
        if (typeof this.options.url !== 'string' || this.options.content != null || this.options.iframe) { return; }
        var self = this;
        var dtd = $.Deferred();
        this.loading = true;
        this.$container.load(this.options.url + "?rnd=" + Math.random(), this.options.params, function () {
            self.loading = false;
            dtd.resolve();
        });
        return dtd.promise();
    };

    /**
     * 打开窗体
     * @return {Void}
     */
    Window.prototype.open = function () {
        var self = this;
        Loading.show();
        $.when(
            this.remote()
        ).done(function () {

            if (self.options.iframe) {
                var url = self.options.url;
                if (url.indexOf('?') != -1) {
                    url += '&rand=' + Math.random();
                } else {
                    url += '?rand=' + Math.random();
                }
                self.$iframe.attr('src', url);

                if (!self.bindIframeLoad) {
                    self.$iframe.on('load', function () {
                        self.show();
                        self.bindIframeLoad = true;
                    });
                }

            } else {
                self.show();
            }

        });
    };

    /**
     * 关闭窗体
     * @param  {Boolean} enforce - 是否强制关闭
     * @return {Void}  
     */
    Window.prototype.close = function (enforce) {
        this.isClose = true;
        this.$win.css({ left: '-900px', top: '-900px' });
        this.$backdrop.hide();
        zIndex.pop();
        this._event.afterClose.call(self);
    };

    /**
    * 打开窗体
    * @return {Void}
    */
    Window.prototype.show = function () {
        this.isClose = false;
        this.$win.show();
        if (this.options.backdrop) { this.$backdrop.show(); }
        this.layout();
        this._event.open(this.$win);
        var z = zIndex.get();
        this.$win.css('zIndex', z);
        this.$backdrop.css('zIndex', --z);
        Loading.hide();
    };

    /**
     * 设置窗体高度
     * @return {Void}
     */
    Window.prototype.layout = function () {

        if (this.isClose) {
            return;
        }

        //屏幕高度
        var screenHeight = this.$window.height();
        //最大弹窗高度
        var maxWinHeight = screenHeight - 100;
        //头部高度
        var headerHeight = this.$header.height();
        //底部高度
        var footerHeight = this.options.showFooter ? this.$footer.height() : 4;
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
        if (this.options.iframe) {
            this.$container.find('iframe').height(containerHeight);
        }

        this.$win.css({
            left: '50%',
            top: '50%',
            height: newHeight,
            marginLeft: -this.options.width / 2,
            marginTop: -newHeight / 2
        });
    };

    /**
     * 创建窗体
     * @return {Void} 
     */
    Window.prototype.build = function () {
        this.$win = $(this.template).css({
            width: this.options.width,
            height: this.options.height,
            borderRadius: this.options.borderRadius
        });

        $.data(this.$win[0], 'window', this);

        this.$backdrop = $(this.backdrop);
        this.$header = this.$win.find('.k-window-header');
        this.$container = this.$win.find('.k-window-container');
        this.$footer = this.$win.find('.k-window-footer');
        this.$btnBox = this.$footer.find('.k-btn-box');
        this.$appendBtnBox = this.$footer.find('.append-btn-box');
        this.$insertBtnBox = this.$footer.find('.insert-btn-box');
        this.$win.appendTo(this.options.appendTo);
        this.$backdrop.appendTo(this.options.appendTo);
        if (!this.options.showFooter) {
            this.$footer.hide();
        }
        if (this.options.btns && this.options.btns.length > 0) {
            this.$footer.find('.k-btn-inner').hide();
            var html = this.getBtnHtml(this.options.btns);
            this.$footer.append(html);
        }
    };

    /**
     * 设置按钮
     * @return {Void} 
     */
    Window.prototype.setBtns = function (btns) {


        this.$footer.find('.k-btn-inner').show().end().find('.k-btn-custom').remove();

        if (!btns || btns.length == 0) {

            return;
        }

        var self = this;

        this.$footer.find('.k-btn-inner').hide().end().append(this.getBtnHtml(btns, true));

        for (var i = 0, item, action; i < btns.length; i++) {

            item = btns[i];
            action = item.action.toLowerCase();

            if (action == 'ok' || action == 'close' || action == 'cancel') {
                continue;
            }


            (function (item, action, self) {

                self.$win
                .off('click.window', '[role=kwin_' + action + ']')
                .on('click.window', '[role=kwin_' + action + ']', function () {

                    if (item.func && item.func.call(self, self.$iframe) !== false) {
                        self.close();
                    }
                });

            })(item, action, this)


        }
    };

    /**
     * 取创建按钮HTML
     * @return {Void} 
     */
    Window.prototype.getBtnHtml = function (btns, isSet) {

        var html = [];

        for (var i = 0, item, action, className, custom; i < btns.length; i++) {
            item = btns[i];
            action = item.action.toLowerCase();
            className = item.className;
            custom = "k-btn-custom";

            if (action == 'ok') {

                custom = isSet ? custom : "k-btn-inner";

                if (!className) {
                    className = "k-btn-primary";
                }
            }

            if (action == 'close' || action == "cancel") {

                custom = isSet ? custom : "k-btn-inner";

                if (!className) {
                    className = "k-btn-default";
                }
            }

            html.push('<button type="button" class="k-btn ' + (className || "k-btn-primary") + ' ' + custom + ' " role="kwin_' + (action == 'cancel' ? 'close' : action) + '">' + item.text + '</button>');

        }

        return html.join('');
    };


    /**
     * 提示对话框
     * @param  {String} title  - 标题
     * @param  {String} content - 内容
     * @param  {Function} onOk   -  确定回调函数
     * @return {Void}   
     */
    Window.alert = function (title, content, onOk) {
        if ($.isFunction(content)) {
            onOk = content;
            content = title;
            title = "提示";
        }
        var win = window.winAlert;
        if (!win) {
            win = new Window({ width: 400, backdropClose: false });
            win.$win.find(".window-cancel").hide();
            window.winAlert = win;
        }
        win.$win.find("button[role=kwin_close]").hide();
        win.setTitle(title);
        win.setContent(content);
        win.on('ok', onOk || $.noop);
        win.open();
    };

    /**
     * 确认对话框
     * @param  {String} title  - 标题
     * @param  {String} content - 内容
     * @param  {Function} onOk  - 确定回调函数
     * @param  {Function} onClose - 关闭回调函数
     * @return {Void}    
     */
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

    /**
     * 关闭窗体静态方法
     * @param  {String|Int} id  - 窗体的ID号
     * @return {Void}   
     */
    Window.close = function (id) {
        $win = $('#k-window-' + id);
        var win = $.data($win[0], 'window');
        if (win) {
            win.close(true);
        }
    };

    /**
     * 打开窗体静态方法
     * @param  {Object} options  - 窗体参数
     * @return {Object}   
     */
    Window.open = function (options) {
        var win = new Window(options);
        win.open();
        return win;
    };


    /**
     * 全局调用
     * @return {void}
     */
    Window.Global = function ($elms) {
        $elms = $elms || $('[data-module=window]');
        $elms.each(function () {
            var $elm = $(this),
                options = $elm.attr('data-options'),
                url = $elm.attr('data-url'),
                width = $elm.attr('data-width'),
                height = $elm.attr('data-height'),
                iframe = $elm.attr('data-iframe'),
                title = $elm.attr('data-title') || '模态窗口',
                content = $elm.attr('data-content'),
                showFooter = $elm.attr('data-showFooter'),
                buttons = $elm.attr('data-btns'),
                onOk = $elm.attr('data-onOk'),
                onClose = $elm.attr('data-onClose'),
                onAfterClose = $elm.attr('data-onAfterClose'),
                data = $.data($elm[0], 'window');




            if (!data) {

                onOk = onOk && onOk.length > 0 ? eval('(0,' + onOk + ')') : $.noop;
                onClose = onClose && onClose.length > 0 ? eval('(0,' + onClose + ')') : $.noop;
                onAfterClose = onAfterClose && onAfterClose.length > 0 ? eval('(0,' + onAfterClose + ')') : $.noop;


                if (options && options.length > 0) {
                    options = eval('(0,' + options + ')');
                } else {
                    options = {
                        url: url,
                        title: title,
                        content: content,
                        width: width && width.length > 0 ? parseInt(width) : 680,
                        height: height && height.length > 0 ? parseInt(height) : 480,
                        showFooter: showFooter && showFooter == 'false' ? false : true,
                        iframe: iframe && iframe == 'false' ? false : true,
                        btns: buttons && buttons.length > 0 ? eval('(0,' + buttons + ')') : []
                    }
                }


                data = new Window(options);

                data.on('ok', function () {
                    return onOk.call(this);
                }).on('close', function () {
                    return onClose.call(this);
                }).on('afterClose', function () {
                    return onAfterClose.call(this);
                });

                $elm.parent('.k-input-group')
                    .off('click.window', 'button')
                    .on('click.window', 'button', function () {
                        data.open();
                    });

                $elm.on('click.window', function () {
                    data.open();
                });

                $.data($elm[0], 'window', data);
            }

        });
    };

    /**
     * 窗体堆叠顺序设置
     * @return {Object}
     */
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

    var ids = (function () {
        var ids = [];

        return {
            get: function () {
                var id;
                if (ids.length == 0) {
                    id = 1;
                    ids.push(id);
                } else {
                    id = ids[ids.length - 1];
                    id += 1;
                    ids.push(id);
                }
                return id;
            }
        };

    })();

    return Window;

});