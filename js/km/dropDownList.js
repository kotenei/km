/*
 * 下拉列表模块
 * @date:2015-11-06
 * @author:kotenei(kotenei@qq.com)
 */
define('km/dropDownList', ['jquery'], function ($) {

    /**
     * 下拉列表类
     * @param {JQuery} $el - dom
     * @param {Object} options - 参数
     */
    var DropDownList = function ($el, options) {
        this.$el = $el;
        this.options = $.extend(true, {
            $target: null,
            direction: 'left',
            width: 'auto'
        }, options);
        this._event = {
            select: $.noop
        };
        this.init();
    };

    /**
     * 初始化
     * @return {Void}
     */
    DropDownList.prototype.init = function () {

        var $dropDownList = this.$el.parent().children('.k-dropDownList');

        if ($dropDownList.length == 0) {
            return;
        }

        this.isInputGroup = this.$el.hasClass('input-group') || this.$el.hasClass('k-input-group');

        this.isTextBox = this.isInputGroup ? false : this.$el[0].type.toLowerCase() == 'text';

        this.$el.parent().css('position', 'relative');

        this.$dropDownList = $dropDownList;

        if (this.isInputGroup) {
            this.$el.find('input').attr('readonly', 'readonly');
        }

        this.watch();
    };

    /**
     * 事件监控
     * @return {Void}
     */
    DropDownList.prototype.watch = function () {
        var self = this;

        this.$el.on('click.dropdownlist', function (e) {
            $('ul.k-dropDownList').hide();
            self.show();
            e.stopPropagation();
        });

        this.$dropDownList.on('click.dropdownlist', 'li', function (e) {
            var $el = $(this),
                text = $el.attr('data-text'),
                value = $el.attr('data-value'),
                data = {
                    text: text || '',
                    value: value || ''
                };

            if (self.isTextBox) {
                self.$el.val(data.value);
                $el.addClass('active').siblings().removeClass('active');
            }

            if (self.isInputGroup) {
                self.$el.find('input').val(data.value);
                $el.addClass('active').siblings().removeClass('active');
            }

            if (self.options.$target) {
                self.options.$target.val(data.value);
            }

            self._event.select.call(self, $el,data);
        });

        $(document.body).on('click.dropdownlist', function () {
            self.hide();
        });

        $(window).on('resize.dropdownlist', function () {
            self.sysPosition();
        });
    };

    /**
     * 添加回调函数
     * @param  {String} type - 事件名称
     * @param  {Function} callback - 回调函数
     * @return {Void}
     */
    DropDownList.prototype.on = function (name, callback) {
        this._event[name] = callback || $.noop;
        return this;
    }

    /**
     * 显示
     * @return {Void}
     */
    DropDownList.prototype.show = function () {
        this.$dropDownList.show();
        this.sysPosition();
    };

    /**
     * 隐藏
     * @return {Void}
     */
    DropDownList.prototype.hide = function () {
        this.$dropDownList.hide();
    };

    /**
     * 同步定位
     * @return {Void}
     */
    DropDownList.prototype.sysPosition = function () {
        var position = {
            left: 0,
            top: 0,
            width: this.options.width
        };

        switch (this.options.direction) {

            case 'left':
                position.left = this.$el.position().left;
                position.top = this.$el.position().top + this.$el.outerHeight() + 2;
                break;
            case 'right':
                position.left = this.$el.position().left + this.$el.outerWidth() - this.$dropDownList.outerWidth();
                position.top = this.$el.position().top + this.$el.outerHeight() + 2;
                break;
            case 'left up':
                position.left = this.$el.position().left;
                position.top = this.$el.position().top - this.$dropDownList.outerHeight();
                break;
            case 'right up':
                position.left = this.$el.position().left + this.$el.outerWidth() - this.$dropDownList.outerWidth();
                position.top = this.$el.position().top - this.$dropDownList.outerHeight();
                break;
            default:
                position.left = this.$el.position().left;
                position.top = this.$el.position().top + this.$el.outerHeight() + 2;
                break;
        }

        if (this.options.width == '100%') {
            position.width = this.$el.outerWidth();
        }

        this.$dropDownList.css(position);
    };

    /**
     * 全局调用
     * @param  {Jquery} $elms - dom
     * @return {Void}
     */
    DropDownList.Global = function ($elms) {
        $elms = $elms || $('[data-module=dropdownlist]');
        $elms.each(function () {
            var $el = $(this),
                options = $el.attr('data-options'),
                onSelect = $el.attr('data-onselect'),
                data = $.data($el[0], 'dropdownlist');

            if (!data) {

                if (options && options.length > 0) {
                    options = eval('(0,' + options + ')');
                }

                if (onSelect && onSelect.length > 0) {
                    onSelect = eval('(0,' + onSelect + ')');
                }

                data = new DropDownList($el, options);

                data.on('select', onSelect);

                $.data($el[0], 'dropdownlist', data);
            }

        });
    };

    return DropDownList;

});
