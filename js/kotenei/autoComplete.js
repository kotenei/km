/**
 * 自动完成模块
 * @date :2014-09-23
 * @author kotenei (kotenei@qq.com)
 */
define('kotenei/autoComplete', ['jquery'], function ($) {

    if (!Array.indexOf) {
        Array.prototype.indexOf = function (obj) {
            for (var i = 0; i < this.length; i++) {
                if (this[i] == obj) {
                    return i;
                }
            }
            return -1;
        }
    }

    var AutoComplete = function ($element, options) {
        this.$element = $element;
        this.options = $.extend({}, {
            remote: null,
            zIndex: 1000,
            data: [],
            formatItem: function (item) { return item[0]; }
        }, options);
        this.tpl = '<div class="k-autoAutoComplete"></div>'
        this.init();
    }

    AutoComplete.prototype.init = function () {
        var self = this;
        this.$list = $(this.tpl).hide().appendTo(document.body);
        this.data = this.options.data || [];
        this.$element.on('keyup', function () {
            var $this = $(this),
                val = $.trim($this.val());
            self.search(val);
        });
    };

    AutoComplete.prototype.search = function (value) {
        if (!value || value.length === 0) { return; }
        if (this.options.remote) {

        } else {
            this.show();
        }
    };

    AutoComplete.prototype.remove = function () {

    };

    AutoComplete.prototype.build = function (data) {
        if (data.length === 0) {
            return;
        }
        var html = '<ul>';
        for (var i = 0, formatted; i < data.length; i++) {
            formatted = this.options.formatItem(data[i]);
            html += '<li>' + formatted + '</li>';
        }
        html += '</ul>';
        return html;
    };

    AutoComplete.prototype.show = function () {
        this.$list.show().css({
            left: this.$element.position().left,
            top: this.$element.outerHeight() + this.$element.position().top,
            width: this.$element.outerWidth()
        });
    };

    AutoComplete.prototype.hide = function () {
        this.$list.hide();
    };

    return AutoComplete;

});
