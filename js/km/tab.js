/**
 * 标签页
 * @date :2015-10-20
 * @author kotenei (kotenei@qq.com)
 */
define('km/tab', ['jquery', 'km/ajax', 'km/contextMenu', 'km/loading'], function ($, ajax, contextMenu, Loading) {

    var identity = 1;

    /**
     * tab 标签模块
     * @param {JQuery} $elm - dom
     * @param {Object} options - 参数
     */
    var Tab = function ($elm, options) {
        this.identity = identity++;
        this.$elm = $elm;
        this.options = $.extend(true, {
            keepOne: true,
            contextMenu: {
                items: []
            },
            callback: {
                click: $.noop
            }
        }, options);
        this.tabCount = 0;
        this.curIndex = -1;
        this._event = {
            click: $.noop,
            close: $.noop,
            refresh: $.noop
        };
        this.isLoading = false;
        this.tm = null;
        this.init();
    }

    /**
     * 初始化
     * @return {Void}
     */
    Tab.prototype.init = function () {
        var index = 0,$activeItem;
        this.$elm.attr('data-moduleId', this.identity);
        this.$tabHead = this.$elm.children('div.k-tab-head');
        this.$btnLeft = this.$tabHead.find('div.left');
        this.$btnRight = this.$tabHead.find('div.right');
        this.$tabScroller = this.$tabHead.find('div.k-tab-scroller');
        this.$tabNav = this.$tabScroller.find('ul.k-tab-nav');
        this.$tabContainer = this.$elm.children('div.k-tab-container');
        this.tabCount = this.$tabNav.find('li').length;
        this.contextMenuInit();
        this.setSize();
        this.watch();
        index = this.$elm.find('.k-tab-head li.active').index();
        index < 0 ? index = 0 : index;
        this.toggle(index);
    };

    /**
     * 右键菜单初始化
     * @return {Void}
     */
    Tab.prototype.contextMenuInit = function () {

        if (this.options.contextMenu.items.length == 0) {
            return;
        }

        var self = this;

        contextMenu.Global(this.$tabNav.children(), {
            items: this.options.contextMenu.items
        });
    };

    /**
     * 事件监控
     * @return {Void}
     */
    Tab.prototype.watch = function () {
        var self = this;

        this.$elm.on('click.tab', '[role=tab]', function () {
            var $el = $(this),
                index = $el.index();
            self.toggle(index);
            self.childResize();
            if (typeof self.options.callback.click) {
                self.options.callback.click.call(this, $el);
            }
            return self._event.click.call(this, $el);
        }).on('click.tab', '[role=refresh]', function () {
            self.refresh($(this).parents('li:eq(0)').index());
            return false;
        }).on('click.tab', '[role=close]', function () {
            self.close($(this).parents('li:eq(0)').index());
            return false;
        }).on('click.tab', '[role=left]', function () {
            self.scroll('left');
            return false;
        }).on('click.tab', '[role=right]', function () {
            self.scroll('right');
            return false;
        });

        $(window).on('resize.tab.' + this.identity, function () {
            if (self.tm) {
                clearTimeout(self.tm);
            }
            self.tm = setTimeout(function () {
                self.setSize();
            }, 300)
        });

    };

    /**
     * 设置尺寸
     * @return {Void}
     */
    Tab.prototype.setSize = function () {
        var headWidth = this.$tabHead.outerWidth(),
            btnLeftWidth = this.$btnLeft.outerWidth(),
            btnRightWidth = this.$btnRight.outerWidth(),
            scrollWidth = headWidth - btnLeftWidth - btnRightWidth,
            tabsWidth = 0;

        this.$tabNav.children().each(function () {
            tabsWidth += $(this).outerWidth(true);
        });


        if (tabsWidth > headWidth) {
            this.isScroller = true;
            this.$btnLeft.show();
            this.$btnRight.show();
            this.$tabScroller.css('width', scrollWidth - 30);
        } else {
            this.isScroller = false;
            this.$btnLeft.hide();
            this.$btnRight.hide();
            this.$tabScroller.css('width', 'auto');
            this.$tabNav.css('margin-left', '0');
        }
        this.$tabNav.css('width', tabsWidth+1);
        this.maxLeft = (tabsWidth - scrollWidth) + 30;
        this.scrollTo();
    };

    /**
     * 回调函数绑定
     * @param {String} type - 事件名称
     * @param {Function} callback - 回调函数
     * @return {Void}
     */
    Tab.prototype.on = function (type, callback) {
        this._event[type] = callback || $.noop;
        return this;
    };

    /**
     * 添加tab
     * @param {Object} data - 数据项
     * @return {Void}
     */
    Tab.prototype.add = function (data) {
        //数据格式
        //data = {
        //    url: 'ajax地址',
        //    title: '标签标题',
        //    content: '标签内容',   
        //    canClose: true,       //是否启用关闭
        //    canRefresh: true      //是否启用刷新
        //};

        if (!data) {
            return;
        }

        var self = this,
            tabHtml = [],
            contentHtml = [];

        this.tabCount++;

        //标签头
        tabHtml.push('<li ' + (data.url ? 'data-url="' + data.url + '" ' : "") + ' role="tab" class="' + (this.tabCount == 1 ? 'active' : '') + '"  >');
        tabHtml.push('<a href="javascript:void(0);">');
        if (data.canRefresh) {
            tabHtml.push('<span class="fa fa-refresh" role="refresh"></span>');
        }
        tabHtml.push('<span class="k-tab-nav-title" title="' + data.title + '">' + data.title + '</span>');
        if (data.canClose) {
            tabHtml.push('<span class="fa fa-close" role="close"></span>');
        }
        tabHtml.push('</a>');
        tabHtml.push('</li>');

        //标签内容
        contentHtml.push('<div class="k-tab-content" ' + (this.tabCount == 1 ? 'style="display:block;"' : '') + '>');
        contentHtml.push(data.content);
        contentHtml.push('</div>');

        var $content = contentHtml.join('');
        this.$tabNav.append(tabHtml.join(''));
        this.$tabContainer.append($content);

        if (this.tabCount == 1 && data.url && !this.isLoading) {
            this.isLoading = true;
            Loading.show();
            $.get(data.url, { rand: new Date().getTime() }).success(function (ret) {
                $content.html(ret);
            }).complete(function () {
                self.isLoading = false;
                Loading.hide();
            });
        }

        this.setSize();
    };

    /**
     * 切换tab
     * @param {Int} index - tab索引
     * @return {Void}
     */
    Tab.prototype.toggle = function (index) {
        if (this.curIndex == index) {
            return;
        }
        if (this.$tabContainer.children().length == 0) {
            return;
        }
        var self = this;
        this.curIndex = index;
        var $el = this.$tabNav.children().removeClass('active').eq(index).addClass('active');
        var url = $el.attr('data-url');
        var $content = this.$tabContainer.children().hide().eq(index).show();
        var content = $content.html().replace(/\s+/g, '');

        if (url && content.length == 0) {

            if (this.isLoading) {
                return;
            }
            this.isLoading = true;
            Loading.show();
            $.get(url, { rand: new Date().getTime() }).success(function (ret) {
                $content.html(ret);
            }).complete(function () {
                self.isLoading = false;
                Loading.hide();
            });
        }
        this.scrollTo(index);
    };

    /**
     * 关闭tab
     * @param {Int} index - tab索引
     * @return {Void}
     */
    Tab.prototype.close = function (index) {
        if (this.tabCount == 1 && this.options.keepOne) {
            return;
        }
        this.tabCount--;
        var $el = this.$tabNav.children().eq(index).remove();
        this.$tabContainer.children().eq(index).remove();
        if (this.curIndex == index) {

            if (index != 0) {
                index--;
            } else {
                this.curIndex = -1;
            }

            if (this.tabCount > 0) {
                this.toggle(index);
            }
        } else if (this.curIndex != index && index < this.curIndex) {
            this.curIndex--;
        }
        this._event.close.call(this, $el);
        this.setSize();
    };

    /**
     * 刷新tab
     * @param {Int} index - tab索引
     * @return {Void}
     */
    Tab.prototype.refresh = function (index) {
        var self = this;
        var $el = this.$tabNav.children().eq(index);
        var url = $el.attr('data-url');
        var $content = this.$tabContainer.children().eq(index);
        if (url) {
            if (this.isLoading) {
                return;
            }
            $content.html('');
            this.isLoading = true;
            Loading.show();
            $.get(url, { rand: new Date().getTime() }).success(function (ret) {
                $content.html(ret);
            }).complete(function () {
                Loading.hide();
                self.isLoading = false;
                self._event.refresh.call(this, $el);
            });
        }
    };

    /**
     * 左右滑动
     * @param {String} poition - 滑动方向
     * @return {Void}
     */
    Tab.prototype.scroll = function (position) {
        var left = parseInt(this.$tabNav.css('margin-left'));

        if (position == 'left') {
            left += 70;
            if (left > 0) {
                left = 0;
            }
        } else {
            left -= 70;
            if (left < -this.maxLeft) {
                left = -this.maxLeft;
            }
        }
        this.$tabNav.stop().animate({
            marginLeft: left
        }, 300);
    };

    /**
     * 滑动某个tab
     * @param {Int} index - tab索引
     * @return {Void}
     */
    Tab.prototype.scrollTo = function (index) {
        index = index || this.curIndex;
        if (index < 0) {
            index = 0;
        }
        if (index > this.tabCount - 1) {
            index = this.tabCount - 1;
        }
        var left = 0;
        this.$tabNav.children().each(function (i) {
            if (i == index) {
                return false;
            }
            left += $(this).outerWidth();
        });
        if (left >= Math.abs(this.maxLeft)) {
            left = this.maxLeft;
        }
        if (!this.isScroller) {
            left = 0;
        }
        this.$tabNav.stop().animate({
            marginLeft: -left
        }, 300);
    };

    /**
     * 子级tab重置尺寸
     * @return {Void}
     */
    Tab.prototype.childResize = function () {
        var $tabs = this.$tabContainer.find('div.k-tab');
        $tabs.each(function () {
            var tab = $.data(this, 'tab');
            if (tab) {
                tab.setSize();
            }
        });
    }

    /**
     * 全局调用
     * @param {JQuery} $elms - dom
     * @param {Object} options - 参数
     * @return {Void}
     */
    Tab.Global = function ($elms, options) {
        $elms = $elms || $('div.k-tab');
        $elms.each(function () {
            var $el = $(this),
                setting = $el.attr('data-options'),
                onClick = $el.attr('data-onclick'),
                onClose = $el.attr('data-onlose'),
                onRefresh = $el.attr('data-onrefresh'),
                data = $.data($el[0], 'tab');

            if (!data) {
                if (setting && setting.length > 0) {
                    options = eval('(0,' + setting + ')');
                }
                data = new Tab($el, options);
                data.on('click', onClick && onClick.length > 0 ? eval('(0,' + onClick + ')') : $.noop)
                        .on('close', onClose && onClose.length > 0 ? eval('(0,' + onClose + ')') : $.noop)
                        .on('refresh', onRefresh && onRefresh.length > 0 ? eval('(0,' + onRefresh + ')') : $.noop);
                $.data($el[0], 'tab', data);
            }
        });
    };

    return Tab;
});
