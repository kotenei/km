/*
 * 字符限制模块
 * @date:2014-09-8
 * @author:kotenei(kotenei@qq.com)
 */
define('km/wordLimit', ['jquery'], function ($) {

    /**
     * 字符限制模块
     * @param {JQuery} $element - dom
     * @param {Object} options - 参数设置
     */
    var WordLimit = function ($element, options) {
        this.$element = $element;
        this.options = $.extend(true, {
            maxLength: 140,
            feedback: '.chars'
        }, options);
        this.init();
    };

    /**
     * 初始化
     * @return {Void}
     */
    WordLimit.prototype.init = function () {
        var self = this;
        this.maxLength = parseInt(this.$element.attr('maxLength') || this.options.maxLength);
        this.$feedback = $(this.options.feedback);
        this.$element.on('keyup.wordlimit', function () {
            var val = $.trim($(this).val());
            self.update(val);
        });
        this.update($.trim(this.$element.val()));
    };

    /**
     * 更新字符长度和反馈状态
     * @param  {String} value 值
     * @return {Void}    
     */
    WordLimit.prototype.update = function (value) {
        var len = value.length,
            limit = this.maxLength,
            count = limit - len;
        if (len >= limit) {
            this.$element.val(value.substring(0, limit));
        }
        this.$feedback.html(count < 0 ? 0 : count);
    };


    /**
     * 重置
     * @return {Void}      
     */
    WordLimit.prototype.reset = function () {
        this.$element.val("");
        this.$feedback.html(this.options.maxLength);
    };

    /**
     * 全局初始化
     * @param {JQuery} $elements - dom
     */
    WordLimit.Global = function ($elements) {
        $elements = $elements || $("input,textarea").filter('[data-module="wordlimit"]');
        $elements.each(function () {
            var $this = $(this),
                options = $this.attr('data-options'),
                maxLength = $this.attr('maxLength'),
                wordLimit = WordLimit.Get($this);
            //if (!maxLength) { return; }

            if (options && options.length > 0) {
                options = eval('(0,' + options + ')');
            } else {
                options = {
                    maxLength: maxLength,
                    feedback: $this.attr('data-feedback')
                };
            }

            if (!wordLimit) {
                wordLimit = new WordLimit($this, options);
                WordLimit.Set($this, wordLimit);
            }
        });
    };

    /**
     * 获取缓存对象
     * @param {JQuery} $element - dom
     */
    WordLimit.Get = function ($element) {
        return $.data($element[0],'wordLimit');
    };

    /**
     * 设置缓存对象
     * @param {JQuery} $element  - dom
     * @param {Object} wordLimit - 被缓存的对象
     */
    WordLimit.Set = function ($element, wordLimit) {
        $.data($element[0], 'wordLimit', wordLimit);
    };


    /**
     * 重置
     * @param {JQuery} $elements - dom
     */
    WordLimit.Reset = function ($elements) {
        $elements = $elements || $("input,textarea").filter('[data-module="wordlimit"]');
        $elements.each(function () {
            var obj = WordLimit.Get($(this));
            if (obj) {
                obj.reset();
            }
        });
    };

    return WordLimit;
});