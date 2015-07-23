/*
 * 开关模块
 * @date:2014-09-14
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/switch', ['jquery'], function ($) {

    /**
    * 开关模块
    * @param {JQuery} $element - dom
    * @param {Object} options - 参数设置
    */
    var Switch = function ($element, options) {
        this.$element = $element;
        this.options = $.extend({}, {
            values: {
                on: { text: '是', value: true, className: '' },
                off: { text: '否', value: false, className: '' }
            },
            callback: {
                onclick: $.noop
            }
        }, options);
        this.template = '<div class="k-switch"></div>';
        this.init();
    };

    /**
     * 初始化
     * @return {Void}
     */
    Switch.prototype.init = function () {
        if (this.$element[0].type !== 'checkbox') { return; }
        this.$switch = $(this.template).append(this.build()).insertAfter(this.$element);
        this.$switchScroller = this.$switch.find('.k-switch-scroller');
        this.$element.hide();
        this.checked = this.$element.attr('checked') === 'checked';
        this.disabled = this.$element.attr('disabled') === 'disabled';
        this.moveLeft = this.$switch.find('.k-switch-left').width();
        if (this.checked) { this.on(); } else { this.off(); }
        if (this.disabled) { this.$switch.addClass("disabled"); }
        this.$switch.on('click', $.proxy(this.toggle, this));
    };

    /**
     * 构造元素HTML
     * @return {String}
     */
    Switch.prototype.build = function () {
        var html = [], values = this.options.values;
        html.push('<div class="k-switch-scroller">');
        html.push('<span class="k-switch-left" >' + values['on'].text + '</span>');
        html.push('<span class="k-switch-middle"></span>');
        html.push('<span class="k-switch-right">' + values['off'].text + '</span>');
        html.push('</div>');
        return html.join('');
    };

    /**
     * 切换操作
     * @return {Void}
     */
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

    /**
     * 开操作
     * @return {Void}
     */
    Switch.prototype.on = function () {
        if (this.disabled) { return; }
        this.$element.prop('checked', true);
        this.$switchScroller.stop().animate({ left: 0 }, 300);
    };

    /**
     * 关操作
     * @return {Void} 
     */
    Switch.prototype.off = function () {
        if (this.disabled) { return; }
        this.$element.prop('checked', false);
        this.$switchScroller.stop().animate({ left: -this.moveLeft }, 300);
    };

    /**
     * 获取当前状态值
     * @return {String}
     */
    Switch.prototype.get = function () {
        var values = this.options.values;
        if (this.checked) {
            return values['on'].value || values['on'].text;
        } else {
            return values['off'].value || values['off'].text;
        }
    };

    /**
     * 销毁
     * @return {Void}
     */
    Switch.prototype.destroy = function () {
        this.$switch.off('click');
        this.$element.show();
        this.$switch.remove();
    };

    /**
     * 全局Switch绑定
     * @param {JQuery} $elms - 全局元素
     * @return {Void}
     */
    Switch.Global = function ($elms) {
        $elms = $elms || $('input[data-module="switch"]');
        $elms.each(function () {
            var $el = $(this),
                values = $el.attr('data-values'),
                funcName = $el.attr('data-onClick');

            var data = $el.data('switch');

            if (!data) {
                data = new Switch($el, {
                    values: values && values.length > 0 ? eval('(' + values + ')') : undefined,
                    callback: {
                        onclick: funcName && funcName.length > 0 ? eval('(' + funcName + ')') : $.noop
                    }
                });
                $el.data('switch', data);
            }

        });
    };

    return Switch;

});
