/*
 * 弹出框模块
 * @date:2014-11-05
 * @author:kotenei(kotenei@qq.com)
 */
define('km/popover', ['jquery', 'km/tooltips', 'km/util'], function ($, Tooltips, util) {

    /**
     * 弹出框模块
     * @param {JQuery} $element - dom
     * @param {Object} options - 参数
     */
    var Popover = function ($element, options) {
        options = $.extend(true, {
            type:'popover',
            title: '标题',
            tpl: '<div class="k-popover">' +
                       '<div class="k-popover-arrow"></div>' +
                       '<div class="k-popover-title"></div>' +
                       '<div class="k-popover-inner"></div>' +
                   '</div>'
        }, options);
        Tooltips.call(this, $element, options);

        this.setTitle();
    };

    /**
     * 继承tooltips
     * @param {String} title - 标题
     */
    Popover.prototype = util.createProto(Tooltips.prototype);

    /**
     * 设置标题
     * @param {String} title - 标题
     */
    Popover.prototype.setTitle = function (title) {
        title = $.trim(title || this.options.title);
        if (title.length === 0) {
            title = this.$element.attr('data-title') || "";
        }
        var $tips = this.$tips;
        $tips.find('.k-popover-title').text(title);
    };

   
    /**
     * 设置内容
     * @param {String} content - 内容
     */
    Popover.prototype.setContent = function (content) {
        content = $.trim(content || this.options.content);
        if (content.length === 0) {
            content = this.$element.attr('data-content') || "";
        }
        var $tips = this.$tips;
        $tips.find('.k-popover-inner').html(content);
    };


    /**
     * 全局popover
     * @param {JQuery} $elements - dom
     */
    Popover.Global = function ($elements) {
        var $elements = $elements || $('[data-module="popover"]');
        $elements.each(function () {
            var $this = $(this);
            var popover = Popover.Get($this);
            if (!popover) {

                var options = $this.attr('data-options');

                if (options && options.length > 0) {
                    options = eval('(0,' + options + ')');
                } else {
                    options = {
                        title: $this.attr('data-title'),
                        content: $this.attr('data-content'),
                        placement: $this.attr('data-placement'),
                        tipClass: $this.attr('data-tipClass'),
                        trigger: $this.attr('data-trigger')
                    };
                }

                popover = new Popover($this, options);
                Popover.Set($this, popover);
            }
        });
    };

    /**
     * 从缓存获取对象
     * @param {JQuery} $element - dom
     */
    Popover.Get = function ($element) {
        return $.data($element[0],'popover');
    };

    /**
     * 设置缓存
     * @param {JQuery} $element - dom
     * @param {Object} popover - 缓存对象
     */
    Popover.Set = function ($element, popover) {
        $.data($element[0], 'popover', popover);
    };

    return Popover;
});