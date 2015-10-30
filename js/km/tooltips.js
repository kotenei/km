/*
 * 消息提示模块
 * @date:2014-09-05
 * @author:kotenei(kotenei@qq.com)
 */
define('km/tooltips', ['jquery'], function ($) {


    /**
     * 消息提示模块
     * @param {JQuery} $element - dom
     * @param {Object} options - 参数
     */
    function Tooltips($element, options) {
        this.$element = $element;
        this.options = $.extend(true, {
            delay: 0,
            content: '',
            tipClass: '',
            placement: 'right',
            trigger: 'hover click',
            container: $(document.body),
            type: 'tooltips',
            scrollContainer: null,
            tpl: '<div class="k-tooltips">' +
                       '<div class="k-tooltips-arrow"></div>' +
                       '<div class="k-tooltips-inner"></div>' +
                   '</div>'
        }, options);

        this.init();
    };

    /**
     * 初始化
     * @return {Void}
     */
    Tooltips.prototype.init = function () {
        var self = this;
        this.$tips = $(this.options.tpl);
        this.$tips.addClass(this.options.placement).addClass(this.options.tipClass);
        this.$container = $(this.options.container);
        this.setContent();
        this.isShow = false;
        var triggers = this.options.trigger.split(' ');

        for (var i = 0, trigger; i < triggers.length; i++) {
            trigger = triggers[i];
            if (trigger === 'click') {
                this.$element.on(trigger + "." + this.options.type, $.proxy(this.toggle, this));
            } else if (trigger != 'manual') {
                var eventIn = trigger === 'hover' ? 'mouseenter' : 'focus';
                var eventOut = trigger === 'hover' ? 'mouseleave' : 'blur';
                this.$element.on(eventIn + "." + this.options.type, $.proxy(this.show, this));
                this.$element.on(eventOut + "." + this.options.type, $.proxy(this.hide, this));
            }
        }

        if (this.$container[0].nodeName !== 'BODY') {
            this.$container.css('position', 'relative')
        }

        this.$container.append(this.$tips);

        //if (this.options.scrollContainer) {
        //    $(this.options.scrollContainer).on('scroll.' + this.options.type, function () {

        //    });
        //}

        $(window).on('resize.' + this.options.type, function () {
            self.setPosition();
        });

        this.hide();
    };


    /**
     * 设置内容
     * @param {String} content - 内容
     */
    Tooltips.prototype.setContent = function (content) {
        content = $.trim(content || this.options.content);
        if (content.length === 0) {
            content = this.$element.attr('data-content') || "";
        }
        var $tips = this.$tips;
        $tips.find('.k-tooltips-inner').html(content);
    };

    /**
     * 定位
     */
    Tooltips.prototype.setPosition = function () {
        var pos = this.getPosition();
        this.$tips.css(pos);
    };

    /**
     * 获取定位偏移值
     * @return {Object} 
     */
    Tooltips.prototype.getPosition = function () {
        var placement = this.options.placement;
        var container = this.options.container;
        var $element = this.$element;
        var $parent = $element.parent();
        var $tips = this.$tips;
        var ew = $element.outerWidth();
        var eh = $element.outerHeight();
        var tw = $tips.outerWidth();
        var th = $tips.outerHeight();
        var position = { left: 0, top: 0 };
        var parent = $element[0];
        var ret;

        do {
            position.left += parent.offsetLeft - parent.scrollLeft;
            position.top += parent.offsetTop - parent.scrollTop;
        } while ((parent = parent.offsetParent) && parent != this.$container[0]);



        switch (placement) {
            case 'left':
                ret = { top: position.top + eh / 2 - th / 2, left: position.left - tw };
                break;
            case 'top':
                ret = { top: position.top - th, left: position.left + ew / 2 - tw / 2 };
                break;
            case 'right':
                ret = { top: position.top + eh / 2 - th / 2, left: position.left + ew };
                break;
            case 'bottom':
                ret = { top: position.top + eh, left: position.left + ew / 2 - tw / 2 };
                break;
        }

        return ret;
    };


    /**
     * 显示tips
     * @return {Void}
     */
    Tooltips.prototype.show = function () {
        if ($.trim(this.options.content).length === 0) {
            this.hide();
            return;
        }
        this.isShow = true;
        this.setPosition();
        this.$tips.show().addClass('in');
        this.setPosition();
    };

    /**
     * 隐藏tips
     * @return {Void}
     */
    Tooltips.prototype.hide = function () {
        this.isShow = false;
        this.$tips.hide().removeClass('in');
    };

    /**
     * 切换
     * @return {Void}
     */
    Tooltips.prototype.toggle = function () {
        if (this.isShow) {
            this.hide();
        } else {
            this.show();
        }
    };

    /**
     * 销毁
     * @return {Void}
     */
    Tooltips.prototype.destroy = function () {
        this.$tips.remove();
    };

    /**
     * 全局tooltips
     * @param {JQuery} $elements - dom
     */
    Tooltips.Global = function ($elements) {
        var $elements = $elements || $('[data-module="tooltips"]');
        $elements.each(function () {
            var $this = $(this);
            var tooltips = Tooltips.Get($this);
            if (!tooltips) {

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

                tooltips = new Tooltips($this, options);
                Tooltips.Set($this, tooltips);
            }
        });
    };

    /**
     * 从缓存获取对象
     * @param {JQuery} $element - dom
     */
    Tooltips.Get = function ($element) {
        return $.data($element[0], 'tooltips');
    };

    /**
     * 设置缓存
     * @param {JQuery} $element - dom
     * @param {Object} tooltips - 缓存对象
     */
    Tooltips.Set = function ($element, tooltips) {
        $.data($element[0], 'tooltips', tooltips);
    }

    return Tooltips;
});