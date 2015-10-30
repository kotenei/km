/*
 * 文本占位符模块
 * @date:2014-08-20
 * @author:kotenei(kotenei@qq.com)
 */
define('km/placeholder', ['jquery'], function ($) {

    /**
     * 文本占位符模块
     * @param {JQuery} $elm - dom
     */
    var Placeholder = function ($elm) {
        this.$elm = $elm;
        this.type = 'placeholder';
        this.init();
    }

    /**
     * 初始化
     * @return {Void}
     */
    Placeholder.prototype.init = function () {
        var text = $.trim(this.$elm.attr("placeholder"));
        this.timer = this.$elm.attr("data-timer");
        if (this.timer) {
            this.timer = JSON.stringify(this.timer);
        }

        this.$placeholder = $('<div/>')
            .addClass("placeholder")
            .text(text)
            .insertAfter(this.$elm).hide();

        this.$elm.parent().css("position", "relative");
        this.setPosition();
        this.eventBind();
    };

    /**
     * 事件绑定
     * @return {Void}
     */
    Placeholder.prototype.eventBind = function () {
        var self = this;

        if (this.timer) {
            setInterval(function () {
                self.setPosition();
            }, this.timer.delay);
        }

        this.$elm.on('focus.' + this.type, function () {
            self.$placeholder.hide();
        }).on('blur.' + this.type, function () {
            var value = $.trim(self.$elm.val());
            if (value.length === 0 || value === self.text) {
                self.$elm.val("");
                self.$placeholder.show();
            } else {
                self.$placeholder.hide();
            }
        });

        this.$placeholder.on('focus.' + this.type, function () {
            self.$elm.focus();
        });

    };

    /**
     * 显示或隐藏
     * @return {Void}
     */
    Placeholder.prototype.display = function () {
        var value = $.trim(this.$elm.val());
        if (value.length === 0 || value === $.trim(this.$elm.attr("placeholder"))) {
            this.$placeholder.show();
        } else {
            this.$placeholder.hide();
        }
    };

    /**
     * 定位
     */
    Placeholder.prototype.setPosition = function () {
        var self = this;
        setTimeout(function () {
            var css = {
                left: self.$elm[0].offsetLeft,
                top: self.$elm[0].offsetTop,
                height: self.$elm.outerHeight(),
                width: self.$elm.outerWidth(),
                position: 'absolute',
                paddingLeft: '10px',
                paddingRight: '10px',
                paddingTop: 0,
                margin: 0,
                lineHeight: self.$elm.outerHeight() + 'px',
                cursor: "text",
                color: '#999'
            };
            if (self.$elm[0].nodeName.toLowerCase() === "textarea") {
                css.lineHeight = "auto";
                css.paddingTop = 5;
            }
            self.$placeholder.css(css);
            self.display();
        }, 50);
    };

    /**
     * 全局初始化
     * @param  {JQuery} $elms - dom
     * @return {Void}    
     */
    function init($elms) {
        $elms.each(function () {
            var $elm = $(this);
            var placeholder = $.data($elm[0], 'placeholder');
            if (placeholder === undefined) {
                var text = $.trim($elm.attr("placeholder"));
                if (!text || text.length === 0) {
                    return;
                }
                placeholder = new Placeholder($elm);
                $.data($elm[0], 'placeholder', placeholder)
            } else {
                placeholder.setPosition();
            }
        });
    }

    return function ($elms) {
        if ("placeholder" in document.createElement("input")) {
            return;
        }
        $elms = $elms || $("input,textarea");
        init($elms);
    }
});