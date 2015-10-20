/**
 * 标签页
 * @date :2015-10-20
 * @author kotenei (kotenei@qq.com)
 */
define('km/tab', ['jquery', 'km/ajax', 'km/contextMenu'], function ($, ajax, contextMenu) {

    var Tab = function ($elm, options) {
        this.$elm = $elm;
        this.options = $.extend(true, {
            contextMenu: {
                items: []
            },
            callback: {
                click: $.noop,
                close: $.noop,
                refresh: $.noop
            }
        }, options);
        this.tabCount = 0;
        this.curIndex = 0;
        this._event = {
            click: $.noop,
            close: $.noop,
            refresh: $.noop
        };
        this.isLoading = false;
        this.init();
    }

    Tab.prototype.init = function () {
        this.$tabNav = this.$elm.find('ul.k-tab-nav');
        this.$tabContainer = this.$elm.find('div.k-tab-container');
        this.tabCount = this.$tabNav.find('li').length;
        this.contextMenuInit();
        this.watch();
    };


    Tab.prototype.contextMenuInit = function () {

        if (this.options.contextMenu.items.length == 0) {
            return;
        }

        var self = this;

        contextMenu(this.$tabNav.children(), {
            items: this.options.contextMenu.items
        });
    };

    Tab.prototype.watch = function () {
        var self = this;

        this.$elm.on('click.tab', '[role=tab]', function () {
            self.toggle($(this).index());
        }).on('click.tab', '[role=refresh]', function () {

            self.refresh($(this).parents('li:eq(0)').index());

            return false;

        }).on('click.tab', '[role=close]', function () {

            self.close($(this).parents('li:eq(0)').index());

            return false;

        });

    };

    Tab.prototype.on = function (type, callback) {
        this._event[type] = callback || $.noop;
        return this;
    };

    Tab.prototype.add = function (data) {
        //数据格式
        //data = {
        //    url: 'ddddddd',
        //    title: '标签标题',
        //    content: '标签内容',
        //    canClose: true,
        //    canRefresh: true
        //};

        if (!data) {
            return;
        }

        var tabHtml = [],
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

        this.$tabNav.append(tabHtml.join(''));
        this.$tabContainer.append(contentHtml.join(''));
    };

    Tab.prototype.toggle = function (index) {

        if (this.curIndex == index) {
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

            $.get(url, { rand: new Date().getTime() }).success(function (ret) {
                $content.html(ret);
            }).complete(function () {
                self.isLoading = false;
            });
        }

        this.refresh(index);

        this._event.click.call(this, $el);

    };

    Tab.prototype.close = function (index) {
        this.tabCount--;
        var $el = this.$tabNav.children().eq(index).remove();
        this.$tabContainer.children().eq(index).remove();

        if (this.curIndex == index) {

            if (index != 0) {
                index--;
            } else {
                this.curIndex = -1;
            }

            this.toggle(index);
        }

        this._event.close.call(this, $el);
    };

    Tab.prototype.refresh = function (index) {
        var $el = this.$tabNav.children().eq(index);
        var url = $el.attr('data-url');
        var $content = this.$tabContainer.children().eq(index);
        

        if (url) {

            if (this.isLoading) {
                return;
            }

            $content.html('');

            this.isLoading = true;

            $.get(url, { rand: new Date().getTime() }).success(function (ret) {
                $content.html(ret);
            }).complete(function () {
                self.isLoading = false;
                self._event.refresh.call(this, $el);
            });
        }

        
    };

    Tab.Global = function ($elms, options) {
        $elms.each(function () {
            var $el = $(this),
                setting = $el.attr('data-options'),
                data = $.data($el[0], 'tab');

            if (!data) {

                if (setting && setting.length > 0) {
                    options = eval('(0,' + setting + ')');
                }

                data = new Tab($el, options);

                if (options.callback) {
                    data.on('click', options.callback.click)
                        .on('close', options.callback.close)
                        .on('refresh', options.callback.refresh);
                }

                $.data($el[0], 'tab', data);
            }

        })
    };

    return Tab;
});
