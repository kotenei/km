/*
 * 右键菜单模块
 * @date:2015-07-15
 * @author:kotenei(kotenei@qq.com)
 */
define('km/contextMenu', ['jquery'], function ($) {

    var items = [], $curTarget;

    var identity = 1;

    var $contextMenu = $('<ul class="k-contextMenu"></ul>').appendTo(document.body);

    $contextMenu.on('click.contextmenu', 'li', function () {
        var $el = $(this),
            action = $el.attr('data-action'),
            item = items[action];

        if (item && typeof item.func === 'function') {
            $contextMenu.hide();
            return item.func($curTarget);
        }
    });


    /**
     * 右键菜单模块
     * @constructor
     * @alias km/contextMenu
     * @param {JQuery} $el - dom
     * @param {Object} options - 参数设置
     */
    var ContextMenu = function ($el, options) {
        this.identity = identity++;
        this.$el = $el;
        this.options = $.extend(true, {
            target: '',
            className: 'k-contextMenu',
            items: [],
            callback: {
                onShow: $.noop
            }
        }, options);
        this.tm = null;
        this.init();
    };

    /**
     * 初始化
     * @return {Void}   
     */
    ContextMenu.prototype.init = function () {
        if (this.options.items.length == 0 || this.$el.length == 0) {
            return;
        }
        this.build();
        this.watch();
    };

    /**
     * 事件监控
     * @return {Void}   
     */
    ContextMenu.prototype.watch = function () {
        var self = this;

        this.$el.on('contextmenu.contextmenu', this.options.target, function (e) {
            var left = e.pageX,
                top = e.pageY;
            $curTarget = $(this);
            self.build();
            items = self.items;
            setTimeout(function () {
                $contextMenu.css({
                    left: left,
                    top: top,
                    display: 'block'
                });
                self.options.callback.onShow.call(self);
            });
            return false;
        });


        $(document).on('click.contextmenu.' + this.identity, function () {

            //if (self && self.$el.parent().length == 0) {
            //    $(document.body).off('click.contextmenu.' + self.identity);
            //    self = null;
            //}

            $contextMenu.hide();
            $curTarget = null;
        });
    };

    /**
     * 创建菜单
     * @return {Void}   
     */
    ContextMenu.prototype.build = function () {
        var html = [];
        this.items = {};
        //html.push('<ul class="' + this.options.className + '">');
        for (var i = 0, action; i < this.options.items.length; i++) {

            action = "contextMenu_" + i;

            html.push('<li data-action="' + action + '">' + this.options.items[i].text + '</li>');
            //this.items[this.filterHtml(this.options.items[i].text)] = this.options.items[i];
            this.items[action] = this.options.items[i];
        }
        //html.push('</ul>');
        //this.$contextMenu = $(html.join(''));
        //this.$contextMenu.appendTo(document.body);
        $contextMenu.html(html.join(''));
    };

    /**
     * 过滤html
     * @return {String}   
     */
    ContextMenu.prototype.filterHtml = function (str) {
        return str.replace(/<[^>]*>/ig, '');
    };

    /**
     * 销毁
     * @return {Void}   
     */
    ContextMenu.Destory = function () {
        $contextMenu.remove();
    }

    /**
     * 隐藏
     * @return {Void}   
     */
    ContextMenu.hide = function () {
        $('ul.k-contextMenu').hide();
    }

    /**
     * 全局调用
     * @return {Void}   
     */
    ContextMenu.Global = function ($elms, settings) {
        $elms = $elms || $('[data-module=contextmenu]');
        $elms.each(function () {
            var $el = $(this),
                options = $el.attr('data-options'),
                data = $.data($el[0], 'contextMenu');

            if (!data) {

                if (options && options.length > 0) {
                    options = eval('(0,' + options + ')');
                } else {
                    options = settings;
                }

                data = new ContextMenu($el, options);

                $.data($el[0], 'contextMenu', data);
            }

        });
    };


    return ContextMenu;

});
