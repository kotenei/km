/**
 * 自动完成模块
 * @date :2014-09-23
 * @author kotenei (kotenei@qq.com)
 */
define('kotenei/autoComplete', ['jquery'], function ($) {


    var KEY = {
        UP: 38,
        DOWN: 40,
        DEL: 46,
        TAB: 9,
        ENTER: 13,
        ESC: 27,
        COMMA: 188,
        PAGEUP: 33,
        PAGEDOWN: 34,
        BACKSPACE: 8
    };

    var AutoComplete = function ($element, options) {
        this.$element = $element;
        this.options = $.extend({}, {
            remote: null,
            zIndex: 1000,
            data: [],
            max: 10,
            formatItem: function (item) { return item; }
        }, options);
        this.tpl = '<div class="k-autocomplete"></div>'
        this.init();
    }

    AutoComplete.prototype.init = function () {
        var self = this;
        this.$list = $(this.tpl).hide().appendTo(document.body);
        this.data = this.options.data || [];
        this.$element.on('keyup', function (e) {
            var $this = $(this),
                val = $.trim($this.val());
            self.search(val);

            switch (e.keyCode) {
                case KEY.UP:
                    e.preventDefault();
                    break;
                case KEY.DOWN:
                    break;
                case KEY.ENTER:
                    break;
                case KEY.TAB:
                    break;
                default:
                    break;
            }
        });

        this.$list.on('click', 'li', function () {
            var text = $(this).text();
            self.$element.val(text);
        });

        $(document).on('click.autocomplete', function () {
            self.hide();
        });
    };

    AutoComplete.prototype.search = function (value) {

        if (this.options.remote) {

        } else {
            var data = this.getData(value);
            this.build(data);
            this.show();
        }
    };

    AutoComplete.prototype.getData = function (value) {
        var data = [];
        if (value.length === 0) { return data; }
        for (var i = 0, formatted; i < this.data.length; i++) {
            formatted = this.options.formatItem(this.options.data[i]);
            if (formatted.toLowerCase().indexOf(value) == 0) {
                data.push(formatted);
            }
        }
        return data;
    };


    AutoComplete.prototype.build = function (data) {
        this.$list.find('ul').remove();
        if (data.length === 0) { return; }
        var html = '<ul>';
        for (var i = 0; i < data.length; i++) {
            html += '<li>' + data[i] + '</li>';
            if (i === this.options.max - 1) {
                break;
            }
        }
        html += '</ul>';
        this.$list.append(html);
    };

    AutoComplete.prototype.show = function () {
        if (this.$list.find("ul").length === 0) { this.hide(); return; }
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
