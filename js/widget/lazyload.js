/*
 * 图片延迟加载模块
 * @date:2014-09-01
 * @email:kotenei@qq.com
 */
define('widget/lazyload', ['jquery'], function ($) {

    function LazyLoad($elements, options) {
        this.$elements = $elements;
        this.options = $.extend({}, {
            placeholder: null,
            $container: $(window),
            callback: $.noop
        }, options);
        this.cache = [];
        this.init();
    };

    LazyLoad.prototype.init = function () {
        var self = this;
        this.$elements.each(function () {
            if (this.nodeName.toLowerCase() != 'img') { return; }
            var $elm = $(this);
            var data = {};
            if (self.options.placeholder != null) {
                this.setAttribute('data-url', this.src);
                this.src = self.options.placeholder;
            }
            if (!this.getAttribute('data-url')) { return; }
            data.$elm = $elm;
            data.url = this.getAttribute('data-url');
            self.cache.push(data);
        });
        if (this.cache.length === 0) { return; }
        this.count = this.cache.length;
        this.eventBind();
        this.load();
    };

    LazyLoad.prototype.eventBind = function () {
        this.options.$container.on('scroll.lazyload', $.proxy(this.load, this));
    };

    LazyLoad.prototype.load = function () {
        var self = this;
        var position = this.getPosition();
        if (this.count <= 0) {
            return;
        }
        $.each(this.cache, function (k, v) {
            var $elm = v.$elm, url = v.url, tag = v.tag, range, top;
            if ($elm) {
                top = $elm.offset().top;
                range = [top - position.top, top - position.top + $elm.height()];
                if ((range[0] >= 0 && range[0] < position.height) || (range[1] > 0 && range[1] <= position.height)) {
                    (function ($elm, url) {
                        self.imgLoad($elm, url, function () {
                            $elm.hide().fadeIn();
                            self.callback($elm);
                        });
                    })($elm, url);
                    v.$elm = null;
                    self.count--;
                }
            }
        });
    };

    LazyLoad.prototype.imgLoad = function ($img, src, callback) {
        var img = new Image();
        img.onload = function () {
            $img.attr('src', src);
            callback();
        };
        img.onerror = function () {
            callback();
        };
        img.src = src;
    };

    LazyLoad.prototype.getPosition = function () {
        var position = {};
        var $container = this.options.$container;
        var containerHeight = $container.height();
        var containerTop;
        if ($container[0] === window) {
            containerTop = $container.scrollTop();
        } else {
            containerTop = $container.offset().top;
        }
        position.height = containerHeight;
        position.top = containerTop;
        return position;
    };

    LazyLoad.prototype.callback = function ($elm) {
        if ($.isFunction(this.options.callback)) {
            this.options.callback($elm);
        }
    };

    return function ($elements, options) {
        $elements = $elements || $("img");
        return new LazyLoad($elements, options);
    };
});