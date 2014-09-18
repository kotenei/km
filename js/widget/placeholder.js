/*
 * 文本占位符模块
 * @date:2014-08-20
 * @email:kotenei@qq.com
 */
define('widget/placeholder', ['jquery'], function ($) {

    function Placeholder($elm) {
        this.$elm = $elm;
        this.type = 'placeholder';
        this.init();
    }

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

    Placeholder.prototype.display = function () {
        var value = $.trim(this.$elm.val());
        if (value.length === 0 || value === $.trim(this.$elm.attr("placeholder"))) {
            this.$placeholder.show();
        } else {
            this.$placeholder.hide();
        }
    };

    Placeholder.prototype.setPosition = function () {
        var self = this;
        setTimeout(function () {
            var css = {
                left: self.$elm[0].offsetLeft,
                top: self.$elm[0].offsetTop,
                height: self.$elm.outerHeight(),
                width:self.$elm.outerWidth(),
                position: 'absolute',
                paddingLeft: '10px',
                paddingRight:'10px',
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

    function init($elms) {
        $elms.each(function () {
            var $elm = $(this);
            var placeholder = $elm.data('placeholder');
            if (placeholder === undefined) {
                var text = $.trim($elm.attr("placeholder"));
                if (!text || text.length === 0) {
                    return;
                }
                placeholder = new Placeholder($elm);
                $elm.data('placeholder', placeholder);
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