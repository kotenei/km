/**
 * 自动完成模块
 * @date :2014-09-23
 * @author kotenei (kotenei@qq.com)
 */
define('km/autoComplete', ['jquery'], function ($) {

    /**
     * keycode
     * @type {Object}
     */
    var KEY = {
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        TAB: 9,
        ENTER: 13
    };

    /**
     * 自动完成模块
     * @param {JQuery} $element - dom
     * @param {Object} options - 参数
     */
    var AutoComplete = function ($element, options) {
        this.$element = $element;
        this.options = $.extend(true, {
            url: null,
            zIndex: 1000,
            data: [],
            max: 10,
            width: null,
            height: null,
            isBottom: true,
            highlight: false,
            formatItem: function (item) { return item; },
            callback: {
                setValue: null
            }
        }, options);
        this.tpl = '<div class="k-autocomplete k-pop-panel"></div>';
        this.active = 0;
        this.init();
    };

    /**
     * 初始化
     * @return {Void}
     */
    AutoComplete.prototype.init = function () {
        var self = this;
        this.$listBox = $(this.tpl).hide().appendTo(document.body);
        this.data = this.options.data || [];
        this.$element.on('keyup', function (e) {
            var $this = $(this),
                val = $.trim($this.val());

            if (!self.cache) {
                self.cache = val;
                self.search(val);
                self.active = 0;
            } else if (self.cache != val) {
                self.cache = val;
                self.search(val);
                self.active = 0;
            }

            switch (e.keyCode) {
                case KEY.UP:
                case KEY.LEFT:
                    e.preventDefault();
                    self.prev();
                    break;
                case KEY.DOWN:
                case KEY.RIGHT:
                    self.next();
                    break;
                case KEY.ENTER:
                case KEY.TAB:
                    self.select();
                    break;
                default:
                    break;
            }
        });

        this.$listBox.on('click.autocomplete', 'li', function () {
            var text = $(this).text();
            self.$element.val(text).focus();
            if ($.isFunction(self.options.callback.setValue)) {
                var item = self.getItem(text);
                self.options.callback.setValue(item);
            }
        });


        $(document).on('click.autocomplete', function () {
            self.hide();
        });

        $(window).on('resize.autocomplete', function () {
            self.setCss();
        })
    };

    /**
     * 搜索数据
     * @param  {String} value - 输入值
     * @return {Void}       
     */
    AutoComplete.prototype.search = function (value) {
        var self = this;
        if (this.options.url) {
            $.ajax({
                mode: "abort",
                type: 'GET',
                url: this.options.url,
                cache: false,
                data: { keyword: value }
            }).done(function (ret) {
                if (ret && ret instanceof Array) {
                    var data;
                    self.data = ret;
                    data = self.getData(value);
                    self.build(value, data);
                    self.show();
                }
            });
        } else if (this.options.proxy) {
            this.options.proxy(value, function (data) {
                self.data = data;
                data = self.getData(value);
                self.build(value, data);
                self.show();
            });
        } else {
            var data = this.getData(value);
            this.build(value, data);
            this.show();
        }
    };

    /**
     * 获取数据
     * @param  {String} value - 输入值
     * @return {Array}     
     */
    AutoComplete.prototype.getData = function (value) {
        this.cacheData = [];
        var data = [], flag = 0;
        if (value.length === 0) { return data; }
        for (var i = 0, formatted; i < this.data.length; i++) {
            formatted = this.options.formatItem(this.data[i]);
            if (formatted.toLowerCase().indexOf(value.toLowerCase()) >= 0) {
                this.cacheData.push(this.data[i]);
                data.push(formatted);
                if (flag === (this.options.max - 1)) {
                    break;
                }
                flag++;
            }
        }
        return data;
    };

    /**
     * 构造列表
     * @param  {Array} data - 数据
     * @return {Void}    
     */
    AutoComplete.prototype.build = function (value, data) {
        this.$listBox.find('ul').remove();
        this.$listItem = null;
        if (data.length === 0) { return; }
        var html = '<ul>';
        for (var i = 0; i < data.length; i++) {
            html += '<li class="' + (i == 0 ? "active" : "") + '">' + this.highlight(value, data[i]) + '</li>';
        }
        html += '</ul>';
        this.$listBox.append(html);
        this.$list = this.$listBox.find('ul');
        this.$listItem = this.$listBox.find('li');
    };

    /**
     * 高亮显示
     * @param  {String} char - 匹配字符
     * @param  {String} str  -  需要高亮的字符串
     * @return {String}      
     */
    AutoComplete.prototype.highlight = function (char, str) {
        if (this.options.highlight) {
            var reg = new RegExp('(' + char + ')', 'ig');
            str = str.replace(reg, '<strong>$1</strong>');
            return str;
        } else {
            return str;
        }
    };

    /**
     * 显示列表
     * @return {Void}
     */
    AutoComplete.prototype.show = function () {
        $('div.k-pop-panel').hide();
        if (!this.hasItem()) { this.hide(); return; }
        this.setCss();
        this.$listBox.show();
    };


    /**
     * 获取样式
     * @return {Object}
     */
    AutoComplete.prototype.getCss = function () {
        var css = {
            left: this.$element.offset().left,
            top: this.$element.outerHeight() + this.$element.offset().top,
            width: this.options.width || this.$element.outerWidth()
        }

        if (!this.options.isBottom) {
            css.top = this.$element.offset().top - this.$listBox.outerHeight(true);
        }
        return css;
    };

    /**
     * 设置样式
     * @return {Void}
     */
    AutoComplete.prototype.setCss = function () {
        this.$list.css('max-height', this.options.height || "auto");
        var css = this.getCss();
        this.$listBox.css(css);
    }


    /**
     * 隐藏列表
     * @return {Void} 
     */
    AutoComplete.prototype.hide = function () {
        this.$listBox.hide();
    };

    /**
     * 移动到上一项
     * @return {Void} 
     */
    AutoComplete.prototype.prev = function () {
        this.moveSelect(-1);
    };

    /**
     * 移动下一项
     * @return {Void}
     */
    AutoComplete.prototype.next = function () {
        this.moveSelect(1);
    };

    /**
     * 判断是否有列表项
     * @return {Boolean} 
     */
    AutoComplete.prototype.hasItem = function () {
        return this.$listItem && this.$listItem.length > 0;
    };

    /**
     * 移动到选择项
     * @param  {Number} step - 移动步数
     * @return {Void}    
     */
    AutoComplete.prototype.moveSelect = function (step) {
        if (!this.hasItem()) { return; }
        this.active += step;
        if (this.active < 0) {
            this.active = this.$listItem.length - 1;
        } else if (this.active > this.$listItem.length - 1) {
            this.active = 0;
        }
        var $curItem = this.$listItem.removeClass('active').eq(this.active).addClass('active');
        var offset = 0;
        this.$listItem.each(function () {
            offset += this.offsetHeight;
        });

        var listScrollTop = this.$list.scrollTop(),
            clientHeight = this.$list[0].clientHeight,
            itemHeight = $curItem.height(),
            itemTop = $curItem.position().top;

        if (itemTop > clientHeight) {
            this.$list.scrollTop(itemTop + itemHeight - clientHeight + listScrollTop);
        } else if (itemTop < 0) {
            this.$list.scrollTop(listScrollTop + itemTop)
        }

    };

    /**
     * 选择项
     * @return {Void} 
     */
    AutoComplete.prototype.select = function () {
        var $item = this.$listBox.find('li.active');
        var text = $item.text();
        this.$element.val(text);
        this.hide();
        if ($.isFunction(this.options.callback.setValue)) {
            var item = this.getItem(text);
            this.options.callback.setValue(item);
        }
    };

    //根据值获取数据项
    AutoComplete.prototype.getItem = function (value) {
        var data = this.cacheData;
        if (!data || data.length === 0) { return; }
        for (var i = 0, formatted; i < data.length; i++) {
            formatted = this.options.formatItem(data[i]);
            if (value === formatted) {
                return data[i];
            }
        }
        return null;
    }

    return function ($elm, options) {
        var autoComplete = new AutoComplete($elm, options);
        return autoComplete;
    };

});
