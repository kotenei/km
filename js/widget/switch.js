/*
 * 开关模块
 * @date:2014-09-14
 * @email:kotenei@qq.com
 */
define('widget/switch', ['jquery'], function ($) {

    var Switch = function ($element, options) {
        this.$element = $element;
        this.options = $.extend({}, {
            values: {
                on: { text: 'on', value: '1', className: '' },
                off: { text: 'off', value: '0', className: '' }
            },
            callback: {
                onclick: $.noop
            }
        }, options);
        this.template = '<div class="switch"></div>';
        this.init();
    };

    Switch.prototype.init = function () {
        if (this.$element[0].type !== 'checkbox') { return; }      
        this.$switch = $(this.template).append(this.build()).insertAfter(this.$element);
        this.$switchScroller = this.$switch.find('.switch-scroller');
        this.$element.hide();
        this.checked = this.$element.attr('checked') === 'checked';
        this.disabled = this.$element.attr('disabled') === 'disabled';
        this.moveLeft = this.$switch.find('.switch-left').width();
        if (this.checked) { this.on(); } else { this.off(); }
        if (this.disabled) { this.$switch.addClass("disabled"); }
        this.$switch.on('click', $.proxy(this.toggle, this));
    };


    Switch.prototype.build = function () {
        var html = [], values = this.options.values;
        html.push('<div class="switch-scroller">');
        html.push('<span class="switch-left" >' + values['on'].text + '</span>');
        html.push('<span class="switch-middle"></span>');
        html.push('<span class="switch-right">' + values['off'].text + '</span>');
        html.push('</div>');
        return html.join('');
    };

    Switch.prototype.toggle = function () {
        if (this.disabled) { return; }
        if (this.checked) {
            this.checked = false;
            this.off();
        } else {
            this.checked = true;
            this.on();
        }
        this.options.callback.onclick(this.get());
    };

    Switch.prototype.on = function () {
        if (this.disabled) { return;}
        this.$element.prop('checked', true);
        this.$switchScroller.stop().animate({ left: 0 }, 300);
    };

    Switch.prototype.off = function () {
        if (this.disabled) { return; }
        this.$element.prop('checked', false);
        this.$switchScroller.stop().animate({ left: -this.moveLeft }, 300);
    };

    Switch.prototype.get = function () {
        var values = this.options.values;
        if (this.checked) {
            return values['on'].value;
        } else {
            return values['off'].value;
        }
    };

    Switch.prototype.destroy = function () {
        this.$switch.off('click');
        this.$element.show();
        this.$switch.remove();
    };

    return Switch;

});
