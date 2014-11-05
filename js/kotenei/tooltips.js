/*
 * 消息提示模块
 * @date:2014-09-05
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/tooltips', ['jquery'], function ($) {


    /**
     * 消息提示模块
     * @param {JQuery} $element - dom
     * @param {Object} options - 参数
     */
    function Tooltips($element, options) {
        this.$element = $element;
        this.options = $.extend({}, {
            delay: 0,
            content: '',
            tipClass: '',
            placement: 'right',
            trigger: 'hover click',
            container: $(document.body),
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
                this.$element.on(trigger + ".tooltips", $.proxy(this.toggle, this));
            } else if (trigger != 'manual') {
                var eventIn = trigger === 'hover' ? 'mouseenter' : 'focus';
                var eventOut = trigger === 'hover' ? 'mouseleave' : 'blur';
                this.$element.on(eventIn, $.proxy(this.show, this));
                this.$element.on(eventOut, $.proxy(this.hide, this));
            }
        }

        if (this.$container[0].nodeName !== 'BODY') {
            this.$container.css('position', 'relative')
        }

        this.$container.append(this.$tips);

        if (this.options.scrollContainer) {
            $(this.options.scrollContainer).on('scroll.tooltips', function () {
                
            });
        }

        $(window).on('resize.tooltips', function () {
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

        do {
            position.left += parent.offsetLeft - parent.scrollLeft;
            position.top += parent.offsetTop - parent.scrollTop;
        } while ((parent = parent.offsetParent) && parent != this.$container[0]);

        switch (placement) {
            case 'left':
                return { top: position.top + eh / 2 - th / 2, left: position.left - tw };
            case 'top':
                return { top: position.top - th, left: position.left + ew / 2 - tw / 2 };
            case 'right':
                return { top: position.top + eh / 2 - th / 2, left: position.left + ew };
            case 'bottom':
                return { top: position.top + eh, left: position.left + ew / 2 - tw / 2 };
        }
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
     * 全局tooltips
     * @param {JQuery} $elements - dom
     */
    Tooltips.Global = function ($elements) {
        var $elements = $elements || $('[data-module="tooltips"]');
        $elements.each(function () {
            var $this = $(this);
            var tooltips = Tooltips.Get($this);
            if (!tooltips) {
                tooltips = new Tooltips($this, {
                    title: $this.attr('data-title'),
                    content: $this.attr('data-content'),
                    placement: $this.attr('data-placement'),
                    tipClass: $this.attr('data-tipClass'),
                    trigger: $this.attr('data-trigger')
                });
                Tooltips.Set($this, tooltips);
            }
        });
    };

    /**
     * 从缓存获取对象
     * @param {JQuery} $element - dom
     */
    Tooltips.Get = function ($element) {
        return $element.data("tooltips");
    };

    /**
     * 设置缓存
     * @param {JQuery} $element - dom
     * @param {Object} tooltips - 缓存对象
     */
    Tooltips.Set = function ($element, tooltips) {
        $element.data("tooltips", tooltips);
    }

    return Tooltips;
});