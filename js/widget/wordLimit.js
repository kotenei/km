/*
 * 字符限制
 * @date:2014-09-8
 * @email:kotenei@qq.com
 */
define('widget/wordLimit', ['jquery'], function ($) {
    var WordLimit = function ($element, options) {
        this.$element = $element;
        this.options = $.extend({}, {
            maxLength: 140,
            feedback: '.chars'
        }, options);
        this.init();
    };

    WordLimit.prototype.init = function () {
        var self = this;
        this.maxLength = parseInt(this.$element.attr('maxLength') || this.options.maxLength);
        this.$feedback = $(this.options.feedback);
        this.$element.on('keyup', function () {
            var val = $.trim($(this).val());
            self.update(val);
        });
        this.update($.trim(this.$element.val()));
    };

    WordLimit.prototype.update = function (value) {
        var len = value.length,
            limit = this.maxLength,
            count = limit - len;
        if (len >= limit) {
            this.$element.val(value.substring(0, limit));
        }
        this.$feedback.html(count < 0 ? 0 : count)
    };

    WordLimit.Global = function ($elements) {
        $elements = $elements || $("input,textarea").filter('[data-module="wordlimit"]');
        $elements.each(function () {
            var $this = $(this),
                maxLength = $this.attr('maxLength'),
                wordLimit = WordLimit.Get($this);
            if (!maxLength) { return; }
            if (!wordLimit) {
                wordLimit = new WordLimit($this, {
                    maxLength: maxLength,
                    feedback: $this.attr('data-feedback')
                });
                WordLimit.Set($this, wordLimit);
            }
        });
    };

    WordLimit.Get = function ($element) {
        return $element.data('wordLimit');
    }

    WordLimit.Set = function ($element, wordLimit) {
        $element.data("wordLimit", wordLimit);
    }

    return WordLimit;
});