/*
 * 弹出框模块
 * @date:2014-09-05
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/popover', ['jquery', 'kotenei/tooltips', 'kotenei/util'], function ($, Tooltips, util) {

    var Popover = function ($element, options) {
        options = $.extend({}, {
            title: '',
            tpl: '<div class="k-popover">' +
                       '<div class="k-popover-arrow"></div>' +
                       '<div class="k-popover-title"></div>' +
                       '<div class="k-popover-inner"></div>' +
                   '</div>'
        }, options);
        Tooltips.call(this, $element, options);     
    };

    Popover.prototype = util.createProto(Tooltips.prototype);

    //设置标题
    Popover.prototype.setTitle = function (title) {
        title = $.trim(title || this.options.title);
        if (title.length === 0) {
            title = this.$element.attr('data-title') || "";
        }
        var $tips = this.$tips;
        $tips.find('.k-popover-title').text(title);
    };

    return Popover;
});