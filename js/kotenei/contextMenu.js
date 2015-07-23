/*
 * 右键菜单模块
 * @date:2015-07-15
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/contextMenu', ['jquery'], function ($) {

    /**
     * 右键菜单模块
     * @constructor
     * @alias kotenei/contextMenu
     * @param {JQuery} $el - dom
     * @param {Object} options - 参数设置
     */
    var ContextMenu = function ($el, options) {
        this.$el = $el;
        this.options = $.extend({}, {
            target: '',
            className: 'k-contextMenu',
            items: [],
            callback: {
                onShow: $.noop
            }
        }, options);
        this.$curTarget = null;
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

        this.$el.on('contextmenu',this.options.target, function (e) {
            var left = e.pageX,
                top = e.pageY;

            self.$curTarget = $(this);

            self.tm = setTimeout(function () {
                self.$contextMenu.css({
                    left: left,
                    top: top,
                    display: 'block'
                });

                self.options.callback.onShow.call(self);

            }, 100);

            return false;
        });

        this.$contextMenu.on('click', 'li', function () {
            var $el = $(this),
                text = $el.text(),
                item = self.items[text];
            if (item && typeof item.func === 'function') {
                item.func(self.$curTarget);
            }
        });

        $(document.body).on('click', function () {
            self.$contextMenu.hide();
            self.$curTarget = null;
        });
    };

    /**
     * 创建菜单
     * @return {Void}   
     */
    ContextMenu.prototype.build = function () {
        var html = [];
        this.items = {};
        html.push('<ul class="' + this.options.className + '">');
        for (var i = 0; i < this.options.items.length; i++) {
            html.push('<li>' + this.options.items[i].text + '</li>');
            this.items[this.filterHtml(this.options.items[i].text)] = this.options.items[i];
        }
        html.push('</ul>');
        this.$contextMenu = $(html.join(''));
        this.$contextMenu.appendTo(document.body);
    };

    /**
     * 过滤html
     * @return {String}   
     */
    ContextMenu.prototype.filterHtml = function (str) {
        return str.replace(/<[^>]*>/ig, '');
    };


    return function ($elm, options) {
        var contextMenu = new ContextMenu($elm, options);
        return contextMenu;
    }

});
