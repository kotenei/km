/**
 * 自动完成模块
 * @date :2014-09-23
 * @author kotenei (kotenei@qq.com)
 */
define('kotenei/autoComplete', ['jquery'], function ($) {

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
        this.options = $.extend({}, {
            url: null,
            zIndex: 1000,
            data: [],
            max: 10,
            width: null,
            height: null,
            isBottom: true,
            hightLight: false,
            formatItem: function (item) { return item; },
            callback: {
                setValue: null
            }
        }, options);
        this.tpl = '<div class="k-autocomplete"></div>';
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

        this.$listBox.on('click', 'li', function () {
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
            html += '<li class="' + (i == 0 ? "active" : "") + '">' + this.hightLight(value, data[i]) + '</li>';
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
    AutoComplete.prototype.hightLight = function (char, str) {
        if (this.options.hightLight) {
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

    return AutoComplete;

});

/**
 * 缓存
 * @date :2014-10-11
 * @author kotenei (kotenei@qq.com)
 */
define('kotenei/cache', [], function () {

    var exports = {};
    var storage = window.localStorage;

    /**
     * 设置缓存
     * @key  {String} key - 缓存的key
     * @value  {Object} value - 缓存值，不设置则删除缓存内容
     * @duration  {Number} duration - 过期时间（秒），不设置或值小于1则为永久保存
     * @return {Void}       
     */
    exports.set = function (key, value, duration) {

        if (!value) {
            exports.remove(key);
            return;
        }

        var expired;

        if (/^[1-9]\d*$/.test(duration)) {
            expired = new Date().getTime() + parseInt(duration) * 1000;
        }

        var data = {
            value: value,
            expired: expired
        };

        storage.setItem(key, JSON.stringify(data));
    };

    /**
     * 获取缓存
     * @key  {String} key - 缓存的key
     * @return {Object}       
     */
    exports.get = function (key) {
        var data = storage.getItem(key);
        var ret = null;
        if (data) {
            data = JSON.parse(data);
            if (data.expired && new Date().getTime() > data.expired) {
                exports.remove(key);
            } else {
                ret = data.value;
            }
        }
        return ret;
    };

    /**
     * 移除缓存
     * @key  {String} key - 缓存的key
     * @return {Void}       
     */
    exports.remove = function (key) {
        storage.removeItem(key);
    };

    /**
     * 清空缓存
     * @return {Void}       
     */
    exports.clear = function () {
        storage.clear();
    };

    return exports;

});

/**
 * 图片剪裁模块
 * @date :2014-10-19
 * @author kotenei (kotenei@qq.com)
 */
define('kotenei/clipZoom', ['jquery', 'kotenei/dragdrop'], function ($, DragDrop) {

    /**
     * 图片剪裁模块
     * @constructor
     * @alias kotenei/clipZoom
     * @param {JQuery} $element - dom
     * @param {Object} options - 参数设置
     */
    var ClipZoom = function ($element, options) {
        this.$element = $element;
        this.options = $.extend({}, {
            imgUrl: '',
            scale: true,
            width: 400,
            height: 300,
            selectorWidth: 120,
            selectorHeight: 100,
            callback: {
                clip: null
            }
        }, options);

        this.$selector = $element.find('.selector');
        this.$clipZoomBox = $element.find('.k-clipZoom-Box').width(this.options.width).height(this.options.height);
        this.$container = this.$clipZoomBox.find('.container');
        this.$mainImg = this.$container.find('img');
        this.$viewBox = $element.find(".view-box");
        this.$viewImg = this.$viewBox.find("img");
        this.$resultBox = $element.find('.result-box');
        this.$resultImg = this.$resultBox.find('img');
        this.init();
    };

    /**
     * 初始化
     * @return {Void}   
     */
    ClipZoom.prototype.init = function () {
        var self = this;

        //设置选择层和预览层尺寸
        this.$selector.width(this.options.selectorWidth).height(this.options.selectorHeight);
        this.$viewBox.width(this.options.selectorWidth).height(this.options.selectorHeight);

        //初始化选择层拖动
        this.selectorDnd = new DragDrop({
            $layer: this.$selector,
            $range: this.$clipZoomBox,
            resizable: true,
            scale: this.options.scale,
            callback: {
                resize: function () {
                    self.setPreview();
                },
                move: function () {
                    self.setPreview();
                }
            }
        });

        //图片加载
        this.imgLoad();

        this.eventBind();
    };

    /**
     * 绑定事件
     * @return {Void}   
     */
    ClipZoom.prototype.eventBind = function () {
        var self = this;

        this.$element.on('click', '[role="clip"]', function () {
            //裁剪
            self.clip();
        }).on('click', '[role="center"]', function () {
            //居中
            self.center();
        }).on('click', '[role="reset"]', function () {
            //重置
            self.reset();
        }).on('click', '[role="plus"]', function () {
            //放大
            self.zoom(true);
        }).on('click', '[role="minus"]', function () {
            //缩小
            self.zoom(false);
        });
    };

    /**
     * 设置图片尺寸
     * @param  {Number} width - 宽度
     * @param  {Number} height - 高度
     * @return {Void}   
     */
    ClipZoom.prototype.setImgSize = function (width, height) {
        this.$mainImg.width(width).height(height);
    };

    /**
     * 图片加载
     * @return {Void}   
     */
    ClipZoom.prototype.imgLoad = function () {

        var self = this;
        var img = new Image();
        img.onload = function () {

            var size = self.getSize(img.width, img.height, self.options.width);

            if (img.width < self.options.width) {
                size.width = img.width;
                size.height = img.height;
            }

            //设置图片拖动层样式
            self.$container.width(size.width).height(size.height).css({
                left: 0,
                top: 0
            });

            //设置大图
            self.$mainImg.attr('src', self.options.imgUrl).width(size.width).height(size.height);

            //设置预览图
            self.$viewImg.attr('src', self.options.imgUrl).width(size.width).height(size.height);

            //记录重重置参数
            self.resetSize = {
                width: size.width ,
                height: size.height,
                left: 0,
                top: 0
            };

            //初始化图片拖动
            self.containerDnd = new DragDrop({
                $layer: self.$container,
                $range: self.$clipZoomBox,
                resizable: true,
                boundary: true,
                scale: true,
                callback: {
                    resize: function (css) {
                        self.setImgSize(css.width, css.height);
                        self.setPreview();
                    },
                    move: function () {
                        self.setPreview();
                    }
                }
            });

            //设置预览
            self.setPreview();

        };
        img.onerr = function () { alert('图片加载失败'); };
        img.src = this.options.imgUrl;
    };

    /**
     * 获取缩放尺寸
     * @param  {Number} width - 宽度
     * @param  {Number} height - 高度
     * @param  {Number} zoomWidth - 缩放宽度
     * @return {Object}   
     */
    ClipZoom.prototype.getSize = function (width, height, zoomWidth) {
        var ratio;

        if (width >= height) {
            ratio = width / height;
            height = zoomWidth / ratio;
        } else {
            ratio = height / width;
            height = zoomWidth * ratio;
        }
        return { width: parseInt(zoomWidth), height: parseInt(height) };
    };

    /**
     * 缩放
     * @return {Void}   
     */
    ClipZoom.prototype.zoom = function (isPlus) {
        var ow = this.$container.width(),
            oh = this.$container.height(),
            nw;


        if (isPlus) {
            nw = ow / 0.8;
        } else {
            nw = ow * 0.8;
        }

        var size = this.getSize(ow, oh, nw);

        this.$container.width(size.width).height(size.height);
        this.$mainImg.width(size.width).height(size.height);
        this.$viewImg.width(size.width).height(size.height);

        this.setPreview();
    };

    /**
     * 裁剪
     * @return {Void}   
     */
    ClipZoom.prototype.clip = function () {
        var clipData = {
            imgSource: this.options.imgUrl,
            imgWidth: this.$viewImg.width(),
            imgHeight: this.$viewImg.height(),
            imgX: Math.abs(this.$viewImg[0].style.marginLeft.replace("px", "")) - this.$viewImg.position().left,
            imgY: Math.abs(this.$viewImg[0].style.marginTop.replace("px", "")) - this.$viewImg.position().top,
            selectorX: this.$selector.position().left,
            selectorY: this.$selector.position().top,
            cutterWidth: this.options.selectorWidth,
            cutterHeight: this.options.selectorHeight
        };

        if ($.isFunction(this.options.callback.clip)) {
            this.options.callback.clip(clipData);
        }
    };

    /**
     * 居中
     * @return {Void}   
     */
    ClipZoom.prototype.center = function () {
        var imgWidth = parseInt(this.$mainImg.width()),
            imgHeight = parseInt(this.$mainImg.height()),
            selectorWidth = parseInt(this.$selector.width()),
            selectorHeight = parseInt(this.$selector.height()),
            containerWidth = parseInt(this.options.width),
            containerHeight = parseInt(this.options.height);

        var size = this.getSize(imgWidth, imgHeight, selectorWidth);

        if (size.height < selectorHeight) {
            size.width = imgWidth / imgHeight * selectorHeight;
            size.height = selectorHeight;
        }

        this.$mainImg.width(size.width).height(size.height);
        this.$viewImg.width(size.width).height(size.height);

        this.$container.width(size.width).height(size.height).css({
            top: (containerHeight - size.height) / 2,
            left: (containerWidth - size.width) / 2
        });

        this.$selector.css({
            top: (containerHeight - selectorHeight) / 2,
            left: (containerWidth - selectorWidth) / 2
        });

        this.setPreview();

    };

    /**
     * 重置
     * @return {Void}   
     */
    ClipZoom.prototype.reset = function () {
        this.$container.width(this.resetSize.width).height(this.resetSize.height).css({
            left: 0,
            top: 0
        });
        this.$mainImg.width(this.resetSize.width).height(this.resetSize.height);
        this.$viewImg.width(this.resetSize.width).height(this.resetSize.height);

        this.setPreview();
    };

    /**
     * 设置右则预览
     * @return {Void}   
     */
    ClipZoom.prototype.setPreview = function () {
        var self = this;
        var options = this.options;
        var clipInfo = this.getPreviewInfo();
        var xsize = options.selectorWidth;
        var ysize = options.selectorHeight;
        var boundx = clipInfo.viewPortWidth;
        var boundy = clipInfo.viewPortHeight;

        if (clipInfo.selectorWidth > 0) {
            var rx = xsize / clipInfo.selectorWidth;
            var ry = ysize / clipInfo.selectorHeight;
            this.$viewImg.css({
                width: Math.round(rx * clipInfo.imgWidth),
                height: Math.round(ry * clipInfo.imgHeight),
                left: Math.round(rx * clipInfo.imgX),
                top: Math.round(ry * clipInfo.imgY),
                marginLeft: -(Math.round(rx * clipInfo.selectorX)),
                marginTop: -(Math.round(ry * clipInfo.selectorY))
            });
        }
    };

    /**
     * 获取设置预览的相关信息
     * @return {Object}   
     */
    ClipZoom.prototype.getPreviewInfo = function () {
        var options = this.options;
        return {
            imgWidth: this.$mainImg.width(),
            imgHeight: this.$mainImg.height(),
            imgX: this.$container.position().left,
            imgY: this.$container.position().top,
            selectorWidth: this.$selector.width(),
            selectorHeight: this.$selector.height(),
            selectorX: this.$selector.position().left,
            selectorY: this.$selector.position().top,
            viewPortWidth: options.width,
            viewPortHeight: options.height
        };
    };

    return ClipZoom;

});

/**
 * 日期模块
 * @date :2014-10-31
 * @author kotenei (kotenei@qq.com)
 */
define('kotenei/datepicker', ['jquery'], function ($) {

   
    var dates = {
        months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
        days: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
        daysShort: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
        daysMin: ["日", "一", "二", "三", "四", "五", "六"]
    };

    var view = {

    };

    var DatePicker = function ($element, options) {
        this.$element = $element;
        this.options = $.extend({}, {
            year: { min: 1900, max: 2100 },
            format: 'yyyy-mm-dd'
        }, options);
        this.year = new Date().getFullYear();
        this.month = new Date().getMonth() + 1;
        this.day = new Date().getDate();

        this.init();
        this.eventBind();
    }

    DatePicker.prototype.init = function () { };

    DatePicker.prototype.eventBind = function () { };

    DatePicker.prototype.createPanel = function () { };

    DatePicker.prototype.createYear = function () { };

    DatePicker.prototype.createMonth = function () { };

    DatePicker.prototype.createDay = function () { };

    DatePicker.prototype.createTime = function () { };

    return DatePicker;

});

/**
 * 拖放模块
 * @date :2014-09-10
 * @author kotenei (kotenei@qq.com)
 */
define('kotenei/dragdrop', ['jquery'], function ($) {

    /**
     * 拖放模块
     * @constructor
     * @alias kotenei/dragdrop
     * @param {Object} options - 参数设置
     */
    var DragDrop = function (options) {

        this.options = $.extend({}, {
            $layer: null,
            $handle: null,
            $range: null,
            direction: '',      // h:水平  v:垂直
            resizable: false,   //是否可拖放
            scale: false,        //是否按比例缩放
            boundary: false,     //是否可移出边界
            minWidth: 100,
            callback: {
                start: $.noop,
                move: $.noop,
                stop: $.noop,
                resize:$.noop
            }
        }, options);

        this.$layer = options.$layer;
        this.$handle = options.$handle;
        this.$range = options.$range;
        this.$window = $(window);
        this.$document = $(document);

        //是否设置大小
        this.isResize = false;
        //是否移动中
        this.moving = false;
        //鼠标相对拖动层偏移值
        this.offset = { x: 0, y: 0 };
        //原来坐标
        this.originalCoord = { x: 0, y: 0 };
        //调整尺寸参数
        this.resizeParams = { left: 0, top: 0, width: 0, height: 0, type: 'bottomRight' };

        this.init();
    }

    /**
     * 初始化
     * @return {Void} 
     */
    DragDrop.prototype.init = function () {
        if (!this.$layer) { return; }
        if (this.$range) { this.$range.css("position", "relative"); }
        this.$handle = this.$handle || this.$layer;
        this.$layer.css({ cursor: "move", position: 'absolute' });

        if (this.options.resizable) {
            this.$layer.append('<span class="k-resizable k-resizable-topLeft" data-type="topLeft"></span>');
            this.$layer.append('<span class="k-resizable k-resizable-topRight" data-type="topRight"></span>');
            this.$layer.append('<span class="k-resizable k-resizable-bottomLeft" data-type="bottomLeft"></span>');
            this.$layer.append('<span class="k-resizable k-resizable-bottomRight" data-type="bottomRight"></span>');

            if (!this.options.scale) {
                this.$layer.append('<span class="k-resizable k-resizable-topCenter" data-type="topCenter"></span>');
                this.$layer.append('<span class="k-resizable k-resizable-leftCenter" data-type="leftCenter"></span>');
                this.$layer.append('<span class="k-resizable k-resizable-rightCenter" data-type="rightCenter"></span>');
                this.$layer.append('<span class="k-resizable k-resizable-bottomCenter" data-type="bottomCenter"></span>');
            }

        }

        this.setMinSize();

        this.eventBind();
    };

    /**
    * 设置最小尺寸
    * @return {Void} 
    */
    DragDrop.prototype.setMinSize = function () {

        var w = this.$layer.outerWidth(),
            h = this.$layer.outerHeight(),
            ratio;

        this.minWidth = this.options.minWidth || w;

        if (w >= h) {
            ratio = w / h;
            this.minHeight = this.minWidth / ratio;
        } else {
            ratio = h / w;
            this.minHeight = this.minWidth * ratio;
        }

    }

    /**
     * 绑定事件
     * @return {Void} 
     */
    DragDrop.prototype.eventBind = function () {
        var self = this;

        this.$handle.on('mousedown', function (e) {
            e.stopPropagation();
            e.preventDefault();
            self.start(e);
            //禁止文档选择事件
            document.onselectstart = function () { return false };
        }).on('mousedown', '.k-resizable', function () {
            self.isResize = true;
            self.resizeParams.type = $(this).attr("data-type");
            self.resizeParams.left = parseInt(self.$layer.position().left);
            self.resizeParams.top = parseInt(self.$layer.position().top);
            self.resizeParams.width = parseInt(self.$layer.outerWidth());
            self.resizeParams.height = parseInt(self.$layer.outerHeight());
            self.resizeParams.ratio = self.resizeParams.width >= self.resizeParams.height ? self.resizeParams.width / self.resizeParams.height : self.resizeParams.height / self.resizeParams.width
        })
    };

    /**
     * 开始拖动
     * @param  {Object} e - 事件
     * @return {Boolean}  
     */
    DragDrop.prototype.start = function (e) {
        var self = this;

        //给文档绑定事件
        this.$document.on('mousemove', function (e) {
            if (self.isMoving) {
                if (self.isResize) {
                    self.resize(e);
                }
                else {
                    self.move(e);
                }
            }
        }).on('mouseup', function (e) {
            self.stop(e);
            $(this).off();
        });


        //获取鼠标位置
        var mouseCoord = this.getMouseCoord(e);

        //记录鼠标在拖动层的坐标位置
        this.offset.x = mouseCoord.x - this.$layer.position().left;
        this.offset.y = mouseCoord.y - this.$layer.position().top;
        //记录鼠标点击后的坐标
        this.originalCoord.x = mouseCoord.x;
        this.originalCoord.y = mouseCoord.y;

        //捕捉鼠标的作用范围，防止鼠标移动过快丢失
        if (this.$handle[0].setCapture) {
            this.$handle[0].setCapture();
        }

        this.isMoving = true;

        //开始拖动回调函数
        if ($.isFunction(this.options.callback.start)) {
            this.options.callback.start(e, this.$layer);
        }

        return false;

    };

    /**
     * 移动中
     * @param  {Object} e -事件
     * @return {Void}   
     */
    DragDrop.prototype.move = function (e) {
        var self = this;
        var mouseCoord = this.getMouseCoord(e);
        var moveCoord = {
            x: mouseCoord.x - this.offset.x,
            y: mouseCoord.y - this.offset.y
        };
        var $range = this.$range;
        var rightBoundary, bottomBoundary;

        if ($range) {
            //元素范围内移动
            rightBoundary = $range.width() - this.$layer.outerWidth(true);
            bottomBoundary = $range.height() - this.$layer.outerHeight(true);

            if (!this.options.boundary) {
                if (moveCoord.x < 0) { moveCoord.x = 0; }
                if (moveCoord.y < 0) { moveCoord.y = 0; }
                if (moveCoord.x > rightBoundary) { moveCoord.x = rightBoundary; }
                if (moveCoord.y > bottomBoundary) { moveCoord.y = bottomBoundary; }
            }

        } else {
            //窗体内移动
            rightBoundary = this.$window.width() - this.$layer.outerWidth() + this.$document.scrollLeft();
            bottomBoundary = this.$window.height() - this.$layer.outerHeight() + this.$document.scrollTop();
            if (moveCoord.x < 0) { moveCoord.x = 0; }
            if (moveCoord.y < 0) { moveCoord.y = 0; }
            if (moveCoord.x > rightBoundary) { moveCoord.x = rightBoundary; }
            if (moveCoord.y > bottomBoundary) { moveCoord.y = bottomBoundary; }
        }
        this.setPosition(moveCoord);

        if ($.isFunction(this.options.callback.move)) {
            this.options.callback.move(moveCoord);
        }

    };

    /**
     * 调整大小
     * @param  {Object} e -事件
     * @return {Void}   
     */
    DragDrop.prototype.resize = function (e) {
        var org
        var mouseCoord = this.getMouseCoord(e);
        var moveCoord = {
            x: mouseCoord.x - this.offset.x,
            y: mouseCoord.y - this.offset.y
        };
        var $layer = this.$layer;
        var resizeParams = this.resizeParams;
        var css = { left: 0, top: 0, width: 0, height: 0 };
        var rightBoundary, bottomBoundary;
        var rw, rh;
        var $range = this.$range;

        if ($range) {
            rw = $range.width();
            rh = $range.height();
        } else {
            rw = this.$window.width() + this.$document.scrollLeft();
            rh = this.$window.height() + this.$document.scrollTop();
        }


        switch (this.resizeParams.type) {
            case "topLeft":
                css.width = resizeParams.width + (resizeParams.left - moveCoord.x);
                css.width = css.width < this.minWidth ? this.minWidth : css.width;
                css.height = this.getScaleHeight(css.width);
                css.top = resizeParams.top - (css.height - resizeParams.height);
                css.left = resizeParams.left - (css.width - resizeParams.width);

                if (css.left < 0) {
                    css.left = 0;
                    css.width = resizeParams.width + resizeParams.left;
                    css.height = this.getScaleHeight(css.width);
                    css.top = resizeParams.top - (css.height - resizeParams.height);
                }

                if (css.top < 0) {
                    css.top = 0;
                    css.height = resizeParams.height + resizeParams.top;
                    css.width = this.getScaleWidth(css.height);
                    css.left = resizeParams.left - (css.width - resizeParams.width);
                }

                break;
            case "topRight":
                css.left = resizeParams.left;
                css.width = resizeParams.width - (this.originalCoord.x - mouseCoord.x);
                css.width = css.width < this.minWidth ? this.minWidth : css.width;
                css.height = this.getScaleHeight(css.width);

                if ((css.width + css.left) >= rw) {
                    css.width = rw - resizeParams.left;
                    css.height = this.getScaleHeight(css.width);
                }

                css.top = resizeParams.top - (css.height - resizeParams.height);

                if (css.top < 0) {
                    css.top = 0;
                    css.height = resizeParams.height + resizeParams.top;
                    css.width = this.getScaleWidth(css.height);
                }

                break;
            case "leftCenter":
                css.top = resizeParams.top;
                css.height = resizeParams.height;
                if (moveCoord.x <= 0) {
                    css.left = 0;
                    css.width = resizeParams.width + resizeParams.left;
                } else {
                    css.left = moveCoord.x;
                    css.width = resizeParams.width + (this.originalCoord.x - mouseCoord.x);
                }
                if (css.width <= this.minWidth) {
                    css.width = this.minWidth;
                    css.left = resizeParams.left + (resizeParams.width - css.width);
                }
                break;
            case "rightCenter":
                css.top = resizeParams.top;
                css.left = resizeParams.left;
                css.height = resizeParams.height;
                css.width = resizeParams.width - (this.originalCoord.x - mouseCoord.x);
                if ((css.width + css.left) >= rw) {
                    css.width = rw - resizeParams.left;
                }
                if (css.width <= this.minWidth) {
                    css.width = this.minWidth;
                }
                break;
            case "topCenter":
                css.top = moveCoord.y;
                css.left = resizeParams.left;
                css.width = resizeParams.width;
                css.height = resizeParams.height + (this.originalCoord.y - mouseCoord.y);
                if (moveCoord.y < 0) {
                    css.top = 0;
                    css.height = resizeParams.height + resizeParams.top;
                }
                if (css.height <= this.minHeight) {
                    css.height = this.minHeight;
                    css.top = resizeParams.top + (resizeParams.height - css.height);
                }
                break;
            case "bottomCenter":
                css.top = resizeParams.top;
                css.left = resizeParams.left;
                css.width = resizeParams.width;
                css.height = resizeParams.height - (this.originalCoord.y - mouseCoord.y);
                if (css.height + css.top >= rh) {
                    css.height = rh - resizeParams.top;
                }
                if (css.height <= this.minHeight) {
                    css.height = this.minHeight;
                }
                break;
            case "bottomLeft":
                css.top = resizeParams.top;
                css.width = resizeParams.width + (this.originalCoord.x - mouseCoord.x);
                css.width = css.width < this.minWidth ? this.minWidth : css.width;
                css.height = this.getScaleHeight(css.width);
                css.left = resizeParams.left - (css.width - resizeParams.width);

                if (css.left <= 0) {
                    css.left = 0;
                    css.width = resizeParams.width + resizeParams.left;
                    css.height = this.getScaleHeight(css.width);
                }

                if (css.height + css.top >= rh) {
                    css.height = rh - css.top;
                    css.width = this.getScaleWidth(css.height);
                    css.left = resizeParams.left - (css.width - resizeParams.width);
                }

                break;
            case "bottomRight":
                css.top = resizeParams.top;
                css.left = resizeParams.left;
                css.width = resizeParams.width - (this.originalCoord.x - mouseCoord.x);
                css.width = css.width < this.minWidth ? this.minWidth : css.width;
                css.height = this.getScaleHeight(css.width);

                if ((css.width + css.left) >= rw) {
                    css.width = rw - resizeParams.left;
                    css.height = this.getScaleHeight(css.width);
                }

                if (css.top + css.height >= rh) {
                    css.height = rh - css.top;
                    css.width = this.getScaleWidth(css.height);
                }

                break;
            default:
                break;
        }

        this.$layer.css(css);

        if ($.isFunction(this.options.callback.resize)) {
            this.options.callback.resize(css);
        }
    };

    /**
     * 根据高度按比例获取宽度
     * @param  {Number} height - 高度
     * @param  {Number} ratio - 比例
     * @return {Number}   
     */
    DragDrop.prototype.getScaleWidth = function (height, ratio) {
        ratio = ratio || this.resizeParams.ratio;
        if (this.resizeParams.width >= this.resizeParams.height) {
            return height * ratio;
        } else {
            return height / ratio;
        }
    };

    /**
     * 根据宽度按比例获取高度
     * @param  {Number} width - 宽度
     * @param  {Number} ratio - 比例
     * @return {Number}   
     */
    DragDrop.prototype.getScaleHeight = function (width, ratio) {
        ratio = ratio || this.resizeParams.ratio;
        if (this.resizeParams.width >= this.resizeParams.height) {
            return width / ratio;
        } else {
            return width * ratio;
        }
    }


    /**
     * 停止拖动
     * @param  {Object} e -事件
     * @return {Void}   
     */
    DragDrop.prototype.stop = function (e) {
        this.isMoving = false;
        this.isResize = false;

        if (this.$handle[0].releaseCapture) {
            this.$handle[0].releaseCapture();
        }

        if ($.isFunction(this.options.callback.stop)) {
            this.options.callback.stop(e, this.$layer);
        }
    };

    /**
     * 获取鼠标坐标
     * @param  {Object} e -事件
     * @return {Object}  
     */
    DragDrop.prototype.getMouseCoord = function (e) {
        return {
            x: e.pageX || e.clientX + document.body.scrollLeft - document.body.clientLeft,
            y: e.pageY || e.clientY + document.body.scrollTop - document.body.clientTop
        };
    };

    /**
     * 设置拖动层位置
     * @param {Object} moveCoord - 鼠标坐标
     */
    DragDrop.prototype.setPosition = function (moveCoord) {
        if (this.options.direction === 'h') {
            this.$layer.css('left', moveCoord.x);
        } else if (this.options.direction === 'v') {
            this.$layer.css('top', moveCoord.y);
        } else {
            this.$layer.css({
                left: moveCoord.x,
                top: moveCoord.y
            });
        }
    }

    return DragDrop;

});

/**
 * 下拉框
 * @author vfasky (vfasky@gmail.com)
 */
define('kotenei/dropdown', ['jquery'], function($){
    var $body = $('body');
    var $win  = $(document);

    var _id=0;

    /**
     * 下拉框
     * @constructor
     * @alias kotenei/dropdown
     * @param {jQuery} $el - dom
     * @param {Object} setting - 参数设置
     * @param {Number} setting.width - 宽度
     * @param {Number} setting.height - 高度
     */
    var Dropdown = function($el, setting){
        this.$soure  = $el;
        this.setting = $.extend({
            width: $el.width(),
            height: $el.height()
        }, setting || {});

        $el.data('widget', this);

        _id++;

        this.id = _id;
        this.nameSpace = 'dropdown_' + String(this.id);

        this.initDom();
    };

    /**
     * 初始化 this.$el
     * @return {Void}
     */
    Dropdown.prototype.initDom = function() {
        var $parent = this.$soure.parent();
        var self   = this;

        this.$soure.css({
            visibility: 'hidden'
        });

        if($parent.css('position') === 'static'){
            $parent.css({
                visibility: 'relative'
            });
        }

        var zIndex = 1;
        if(this.$soure.css('zIndex') === 'auto'){
            this.$soure.css('zIndex', 1);
        }
        else{
            zIndex = Number(this.$soure.css('zIndex'));
        }
       
        this.$el = $('<div class="widget-dropbox"/>').css({
            width: this.setting.width,
            height: this.setting.height,
            zIndex: zIndex + 1
        });

        //在侧内容
        this.$label = $('<div class="label"/>').css({
            width: this.setting.width - this.setting.height,
            height: this.setting.height,
            lineHeight: String(this.setting.height - 4) + 'px'
        }).appendTo(this.$el);

        //右侧icon
        this.$icon = $('<div class="ic">&#9660;</div>').css({
            width: this.setting.height,
            height: this.setting.height,
            lineHeight: String(this.setting.height) + 'px'
            
        }).appendTo(this.$el);

        this.buildDrop();

        this.$el.insertBefore(this.$soure);

        this.watch();
    };

    /**
     * 同步下拉框位置
     * @return {Void}
     */
    Dropdown.prototype.syncPosition = function(){
        this.$el.css(this.$soure.position());
    };

    /**
     * 设置下拉框显示的值
     * @return {Void}
     */
    Dropdown.prototype.setLabel = function(label){
        this.$label.text(label).attr('title', label);
    };

    /**
     * 取下拉框的值
     * @return {Void}
     */
    Dropdown.prototype.getVal = function(){
        return this.$soure.val();
    };

    /**
     * 设置下拉框的值
     * @return {Void}
     */
    Dropdown.prototype.setVal = function(val){
        this.$soure.val(val).change();
    };

    /**
     * 生成下拉框内容
     * @return {jQuery} - dom
     */
    Dropdown.prototype.buildDrop = function(){
        if(this.$drop){
            this.$drop.remove();
        }
        this.$drop = $('<div class="widget-dropbox-drop"/>').css({
            width: this.setting.width,
        }).hide();

        var html = [];
        this.$soure.find('option').each(function(){
            var $el = $(this);
            html.push('<li data-val="'+ $el.val() +'">' + $el.text() + '</li>');
        });
        var $el = $('<ul>' + html.join('') + '</ul>');

        $el.appendTo(this.$drop);
        this.$drop.appendTo($body);
        this.syncPosition();
        this.sync();
    };

    /**
     * 与原下拉框同步数据
     * @return {Void}
     */
    Dropdown.prototype.sync = function(){
        var label = this.$soure.find('option:selected').text();
        if(!label){
            var $option = this.$soure.find('option').eq(0);
            label = $option.text();
            this.setVal($option.val());
        }
        this.setLabel(label);
    };

    /**
     * 显示下拉框
     * @return {Void}
     */
    Dropdown.prototype.showDrop = function(){
        var self   = this;
        var offset = self.$el.offset();
        self.$el.addClass('widget-dropbox-hover');
        self.$drop.css({
            top: offset.top + self.setting.height + 2,
            left: offset.left
        }).show();

        $win.on('click.' + self.nameSpace, function(e){
            if(e.target !== self.$label[0] &&
               e.target !== self.$icon[0] &&
               e.target !== self.$drop[0] &&
               false === $.contains(self.$drop[0], e.target)){
                self.hideDrop();
            }
        });
    };

    /**
     * 隐藏下拉框
     * @return {Void}
     */
    Dropdown.prototype.hideDrop = function(){
        var self = this;
        self.$drop.hide(); 
        self.$el.removeClass('widget-dropbox-hover');
        $win.off('click.' + self.nameSpace);
    };

    /**
     * 监听事件
     * @return {Void}
     */
    Dropdown.prototype.watch = function(){
        var self = this;
        this.$el.on('click', function(){
            self.showDrop();
        });

        this.$drop.on('click', 'li', function(){
            var $el = $(this);
            self.setVal($el.data('val'));
            self.sync();
            self.hideDrop();
            return false;
        });
    };

    /**
     * 重新加载数据
     * @return {Void}
     */
    Dropdown.prototype.reload = function(){
        this.buildDrop();
    };

    return Dropdown;
});
/**
 * 日历下拉框 
 * @module kotenei/dropdownDatepicker 
 * @author vfasky (vfasky@gmail.com)
 */
define('kotenei/dropdownDatepicker', 
['jquery', 'kotenei/dropdown', 'kotenei/util', 'foundation-datepicker'],
function($, Dropdown, util){

    $.fn.fdatepicker.dates['zh-CN'] = {
        days: ["日", "一", "二", "三", "四", "五", "六", "日"],
        daysShort: ["日", "一", "二", "三", "四", "五", "六", "日"],
        daysMin: ["日", "一", "二", "三", "四", "五", "六", "日"],
        months: ["1 月", "2 月", "3 月", "4 月", "5 月", "6 月", "7 月", "8 月", "9 月", "10 月", "11 月", "12 月"],
        monthsShort: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
        today: "今天"
    };

    var Datepicker = function($el, setting){
        Dropdown.call(this, $el, setting);
    };

    Datepicker.prototype = util.createProto(Dropdown.prototype);

    Datepicker.prototype.buildDrop = function(){
        if(this.$drop){
            return;
        }
        var self = this;
        self.$drop = $('<div class="widget-dropbox-drop"/>').css({
            width: 242,
            height: 252
        }).hide();

        self.$el.fdatepicker($.extend({
            format: 'yyyy-mm-dd',
            language: 'zh-CN'
        }, self.setting)).on('changeDate', function(val){
            var date = self.datepicker.getFormattedDate();
            self.setVal(date);
            self.setLabel(date);
        });
        self.datepicker = self.$el.data('datepicker');
        self.datepicker.picker.appendTo(self.$drop);
        self.$drop.appendTo($('body'));
        self.syncPosition(); 
        self.sync();
    };

    Datepicker.prototype.watch = function(){
        var self = this;
        this.$el.on('click', function(){
            self.showDrop();
        });
    };

    Datepicker.prototype.sync = function(){
        var date = this.getVal();
        if(date){
            this.$el.data('date', date);
            this.datepicker.update();
            this.setLabel(date);
        }
        else{
            var placeholder = this.$soure.attr('placeholder') || '选择日期';
            this.setLabel(placeholder);
        }
    };

    return Datepicker;
});
/**
 * 高亮模块
 * @date :2014-10-30
 * @author kotenei (kotenei@qq.com)
 */
define('kotenei/highlight', ['jquery'], function ($) {

    var exports = {};
    var $body = $(document.body);
    var defaultClass = "k-highlight";

    /**
     * 高亮HTML内容
     * @param  {JQuery} $elm - dom
     * @param  {String|Array} keywords - 需要高亮的关键字
     * @param  {String} className - 高亮样式
     * @return {Void}
     */
    exports.highlightHtml = function ($elm, keywords, className) {

        if ($.isArray($elm)) {
            className = keywords;
            keywords = $elm;
            $elm = $body;
        }

        var html = this.highlightText($elm.html(), keywords, className);
        $elm.html(html);
    };

    /**
     * 高亮文本
     * @param  {String} Source - 原字符串
     * @param  {String|Array} keywords - 需要高亮的关键字
     * @param  {String} className - 高亮样式
     * @return {String}
     */
    exports.highlightText = function (source, keywords, className) {

        if (!source || source.length === 0) {
            return '';
        }

        source = this.highlightClean(source, className);
        className = className || defaultClass;


        if (!keywords) {
            return source;
        }

        if (!$.isArray(keywords)) {
            keywords = [keywords];
        }

        if (keywords.length === 1 && $.trim(keywords[0]).length === 0) {
            return source;
        }

        var matches = source.match(/[^<>]+|<(\/?)([A-Za-z]+)([^<>]*)>/g);
        for (var i = 0; i < matches.length; i++) {
            if (!/<[^>]+>/.test(matches[i]) && $.trim(matches[i]).length != 0) {
                matches[i] = matches[i].replace(new RegExp('(' + keywords.join('|') + ')', 'ig'), '<mark class="' + className + '">$1</mark>');
            }
        }

        return matches.join('');
    };

    /**
     * 清除带高亮标签的文本并返回
     * @param  {String} Source - 原字符串
     * @param  {String} className - 高亮样式
     * @return {String}
     */
    exports.highlightClean = function (source, className) {

        className = className || defaultClass;

        var reg = new RegExp('<mark class="?' + className + '"?>(.*?)<\/mark>', 'ig');

        source = source.replace(reg, '$1');

        return source;
    };

    return exports;
});

/**
 * 无限滚动模块
 * @date :2014-09-24
 * @author kotenei (kotenei@qq.com)
 */
define('kotenei/infiniteScroll', ['jquery'], function ($) {

    /**
     * 无限滚动模块
     * @param {Object} options - 参数
     */
    var InfiniteScroll = function (options) {
        var self = this;
        this.options = $.extend({}, {
            $scrollElement: $(window),
            $watchElement: null,
            scrollDistance:0.3,
            callback: $.noop
        }, options);
        this.$scrollElement = this.options.$scrollElement;
        this.$watchElement = this.options.$watchElement;

        if (!this.$watchElement) { return; }
 
        this.$scrollElement.on('scroll.infiniteScroll', function () {
            self.scroll();
        });

        this.scroll();       
    };

    /**
     * 滚动操作
     * @return {Void}       
     */
    InfiniteScroll.prototype.scroll = function () {
        var scrollElmHeight = this.$scrollElement.height();
        var scrollBottom = scrollElmHeight + this.$scrollElement.scrollTop();
        var watchElmBottom = this.$watchElement.offset().top + this.$watchElement.height();
        var remaining = watchElmBottom - scrollBottom;
        var canScroll = remaining <= scrollElmHeight * this.options.scrollDistance;
        if (canScroll) {
            if (this.options.callback() === false) {
                this.destroy();
            }
        }
    };

    /**
     * 销毁
     * @return {Void}       
     */
    InfiniteScroll.prototype.destroy = function () {
        this.$scrollElement.off('scroll.infiniteScroll');
    };

    return InfiniteScroll;
});

/*
 * 图片延迟加载模块
 * @date:2014-09-01
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/lazyload', ['jquery'], function ($) {

/**
 * 图片延迟加载模块
 * @param {JQuery} $elements -dom
 * @param {Object} options  - 参数设置
 */
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

    /**
     * 初始化
     * @return {Void} 
     */
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

    /**
     * 事件绑定
     * @return {Void}
     */
    LazyLoad.prototype.eventBind = function () {
        this.options.$container.on('scroll.lazyload', $.proxy(this.load, this));
    };

    /**
     * 可视范围加载
     * @return {Void} 
     */
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

    /**
     * 图片加载
     * @param  {JQuery}   $img   - dom
     * @param  {String}   src     - 图片地址
     * @param  {Function} callback - 回调函数
     * @return {Void}   
     */
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

    /**
     * 获取可视区范围
     * @return {Object} 
     */
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

    /**
     * 加载后执行回调函数
     * @param  {JQuery}   $elm - dom
     * @return {Function}    
     */
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
/**
 * loading模块
 * @date :2014-09-23
 * @author kotenei (kotenei@qq.com)
 */
define('kotenei/loading', ['jquery', 'spin'], function ($, Spinner) {

    var global;

    var Loading = function (options) {
        this.options = $.extend({}, {
            lines: 12, // 花瓣数目
            length: 10, // 花瓣长度
            width: 4, // 花瓣宽度
            radius: 14, // 花瓣距中心半径
            corners: 1, // 花瓣圆滑度 (0-1)
            rotate: 0, // 花瓣旋转角度
            direction: 1, // 花瓣旋转方向 1: 顺时针, -1: 逆时针
            color: 'white', // 花瓣颜色
            speed: 1, // 花瓣旋转速度
            trail: 60, // 花瓣旋转时的拖影(百分比)
            shadow: false, // 花瓣是否显示阴影
            hwaccel: false, // 是否启用硬件加速及高速旋转            
            className: 'spinner', // css 样式名称
            zIndex: 2e9, // spinner的z轴 (默认是2000000000)
            top: '70px', // spinner 相对父容器Top定位 单位 px
            left: '70px'// spinner 相对父容器Left定位 单位 px
        }, options);
        this.tpl = '<div class="k-loading"></div>';
        this.init();
    }

    Loading.prototype.init = function () {
        this.spinner = new Spinner(this.options);
        this.$loading = $(this.tpl).appendTo(document.body).hide();
    };

    Loading.prototype.show = function () {
        this.spinner.spin(this.$loading.get(0));
        this.$loading.fadeIn('fast');
    };

    Loading.prototype.hide = function () {
        var self = this;
        this.$loading.hide();
        this.spinner.stop();
    };

    Loading.show = function () {
        if (!global) { global = new Loading(); }
        global.show();
    };

    Loading.hide = function () {
        if (!global) { return; }
        global.hide();
    };

    return Loading;

});

/*
 * 分页模块
 * @date:2014-09-14
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/pager', ['jquery'], function ($) {

    /**
     * 分页模块
     * @param {JQuery} $element - dom
     * @param {Object} options - 参数设置
     */
    var Pager = function ($element, options) {
        this.$element = $element;
        this.options = $.extend({}, {
            className: 'k-pagination',
            onclick: $.noop
        }, options);
        this.curPage = 1;
        this.totalCount = 0;
        this.pageSize = 10;
        this.template = '<div class="pager-box"></div>';
    }

    /**
     * 初始化
     * @return {Void} 
     */
    Pager.prototype.init = function () {
        if (this.totalCount === 0) { return; }
        var self = this;
        this.$pager = $(this.template).append(this.build()).appendTo(this.$element);
        this.$pager.on('click', 'li', function () {
            var $this = $(this),
                page = $this.attr('data-page');
            if ($this.hasClass("disabled") || $this.hasClass("active")) { return; }
            self.curPage = parseInt(page);
            self.$pager.html(self.build());
            self.options.onclick(self.curPage);
        });
    };

    /**
     * 创建分页HTML
     * @return {String} 
     */
    Pager.prototype.build = function () {
        var info = this.getInfo(),
            html = [], className;

        html.push('<ul class="' + this.options.className + '">');

        className = this.curPage > 1 ? '' : 'disabled';
        html.push('<li class="' + className + '" data-page="' + info.pre + '" ><a href="javascript:void(0);">«</a></li>');

        for (var i = info.start; i <= info.end; i++) {
            className = (i === this.curPage) ? 'active' : '';
            html.push('<li class="' + className + '" data-page="' + i + '" ><a href="javascript:void(0);">' + i + '</a></li>');
        }

        className = this.curPage !== info.allPage ? '' : 'disabled';
        html.push('<li class="' + className + '" data-page="' + info.next + '" ><a href="javascript:void(0);">»</a></li>');

        html.push('</ul>');
        return html.join('');
    };

    /**
     * 获取分页相关信息（起始页、结束页、总页等）
     * @return {Object}
     */
    Pager.prototype.getInfo = function () {
        var start, end, pre, next, allPage;
        //确定总页数
        allPage = parseInt(this.totalCount / this.pageSize);
        allPage = ((this.totalCount % this.pageSize) !== 0 ? allPage + 1 : allPage);
        allPage = (allPage === 0 ? 1 : allPage);

        
        //确定起始和结束页码
        start = (this.curPage + 2) > allPage ? (allPage - 4) : (this.curPage - 2);
        end = this.curPage < 4 ? 5 : this.curPage + 2;

        //修正起始和结束页的溢出
        if (start < 1) { start = 1; }
        if (end > allPage) { end = allPage; }


        //确定前一页和下一页的数字
        pre = (this.curPage - 1) < 1 ? 1 : (this.curPage - 1);
        next = (this.curPage + 1) > allPage ? allPage : (this.curPage + 1);


        return {
            start: start, end: end, pre: pre, next: next, allPage: allPage
        }
    };
 
    return Pager;
});

/*
 * 文本占位符模块
 * @date:2014-08-20
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/placeholder', ['jquery'], function($) {

    /**
     * 文本占位符模块
     * @param {JQuery} $elm - dom
     */
    var Placeholder = function($elm) {
        this.$elm = $elm;
        this.type = 'placeholder';
        this.init();
    }

    /**
     * 初始化
     * @return {Void}
     */
    Placeholder.prototype.init = function() {
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
    Placeholder.prototype.eventBind = function() {
        var self = this;

        if (this.timer) {
            setInterval(function() {
                self.setPosition();
            }, this.timer.delay);
        }

        this.$elm.on('focus.' + this.type, function() {
            self.$placeholder.hide();
        }).on('blur.' + this.type, function() {
            var value = $.trim(self.$elm.val());
            if (value.length === 0 || value === self.text) {
                self.$elm.val("");
                self.$placeholder.show();
            } else {
                self.$placeholder.hide();
            }
        });

        this.$placeholder.on('focus.' + this.type, function() {
            self.$elm.focus();
        });

    };

    /**
     * 显示或隐藏
     * @return {Void}
     */
    Placeholder.prototype.display = function() {
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
    Placeholder.prototype.setPosition = function() {
        var self = this;
        setTimeout(function() {
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
        $elms.each(function() {
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

    return function($elms) {
        if ("placeholder" in document.createElement("input")) {
            return;
        }
        $elms = $elms || $("input,textarea");
        init($elms);
    }
});
/*
 * 弹出提示模块
 * @date:2014-09-10
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/popTips', ['jquery'], function ($) {

    /**
     * 弹出提示模块
     * @return {Object} 
     */
    var PopTips = (function () {

        var _instance;

        function init() {

            var $tips, tm;

            function build(status, content, delay, callback) {

                if (tm) { clearTimeout(tm); }

                if ($.isFunction(delay)) { callback = delay; delay = 3000; }

                callback = callback || $.noop;
                delay = delay || 3000;

                if ($tips) { $tips.stop().remove(); }

                $tips = $(getHtml(status, content))
                        .appendTo(document.body).hide();

                $tips.css({ marginLeft: -($tips.width() / 2), marginTop: -($tips.height() / 2) }).fadeIn('fase', function () {
                    tm = setTimeout(function () {
                        $tips.stop().remove();
                        callback();
                    }, delay);
                })
            }

            function getHtml(status, content) {
                var html = [];
                switch (status) {
                    case "success":
                        html.push('<div class="k-pop-tips success"><span class="fa fa-check"></span>&nbsp;<span>' + content + '</span></div>');
                        break;
                    case "error":
                        html.push('<div class="k-pop-tips error"><span class="fa fa-close"></span>&nbsp;<span>' + content + '</span></div>');
                        break;
                    case "warning":
                        html.push('<div class="k-pop-tips warning"><span class="fa fa-exclamation"></span>&nbsp;<span>' + content + '</span></div>');
                        break;
                }
                return html.join('');
            }

            return {
                success: function (content, callback, delay) {
                    build("success", content, callback, delay);
                },
                error: function (content, callback, delay) {
                    build("error", content, callback, delay);
                },
                warning: function (content, callback, delay) {
                    build("warning", content, callback, delay);
                }
            };
        }

        return {
            getInstance: function () {
                if (!_instance) {
                    _instance = init();
                }
                return _instance;
            }
        }
    })();

    return PopTips.getInstance();
});

/**
 * 路由
 * @date :2014-09-21
 * @author kotenei(kotenei@qq.com)
 */
(function (window) {

    /**
     * 事件处理
     * @type {Object}
     */
    var eventHelper = {
        addEventListener: function (element, type, handle) {
            if (element.addEventListener) {
                element.addEventListener(type, handle, false);
            } else if (element.attachEvent) {
                element.attachEvent("on" + type, handle);
            } else {
                element["on" + type] = handle;
            }
        },
        removeEventListener: function (element, type, handle) {
            if (element.removeEventListener) {
                element.removeEventListener(type, handler, false);
            } else if (element.detachEvent) {
                element.detachEvent("on" + type, handler);
            } else {
                element["on" + type] = null;
            }
        },
        proxy: function (fn, thisObject) {
            var proxy = function () {
                return fn.apply(thisObject || this, arguments)
            }
            return proxy
        }
    };

    /**
     * 路由
     */
    var Router = function () {
        this._routes = [];
    };

    /**
     * 初始化
     * @return {Void}
     */
    Router.prototype.init = function () {
        var self = this;
        eventHelper.addEventListener(window, 'hashchange', eventHelper.proxy(self.listener, this));
        this.listener();
    };


    /**
     * 监听hash变化
     * @return {Void}
     */
    Router.prototype.listener = function () {
        var paths = location.hash.slice(1).split('?');
        var path = paths[0], params;

        if (paths[1]) {
            params = this.getUrlParams(paths[1]);
        }

        var route = this.getRoute(path);
        var values, ret = {};

        if (!route) {
            location.replace('#/');
            return;
        }

        values = this.getValues(path, route);

        for (var i = 0; i < route.params.length; i++) {
            ret[route.params[i]] = values[i];
        }

        params = $.extend({}, ret, params);
        route.handle(params);
    };


    /**
     * 取URL参数  param1=value1&param2=value2
     * @param  {String} str  - 带参数的字符串    
     */
    Router.prototype.getUrlParams = function (str) {
        var params = {};
        if (!str) { return params; }
        var arrStr = str.split('&');
        for (var i = 0, arrParams; i < arrStr.length; i++) {
            arrParams = arrStr[i].split('=');
            params[arrParams[0]] = arrParams[1];
        }
        return params;
    };

    /**
     * 设置路由
     * @param  {String} routeUrl  - 路由地址
     * @param  {String} templateUrl - 模板地址
     * @param  {Object} constraints - 正则约束
     * @return {Object}     
     */
    Router.prototype.map = function (routeUrl, constraints, callback) {
        var reg, pattern, result, params = [];
        pattern = routeUrl.replace(/\//g, '\\/');

        if (typeof constraints === 'function') {
            callback = constraints;
            constraints = null;
        }

        if (constraints) {
            for (var k in constraints) {
                reg = new RegExp('\\{' + k + '\\}', 'g');
                pattern = pattern.replace(reg, '(' + constraints[k].replace(/\^/, '').replace(/\$/, '') + ')');
                params.push(k);
            }
        }

        //(?<={)[^}]+(?=}) js不支持零宽断言-_-b
        reg = new RegExp('{([^}]+)}', 'g');
        result;
        while ((result = reg.exec(pattern)) != null) {
            params.push(result[1]);
            reg.lastIndex;
        }

        pattern = '^' + pattern.replace(/{[^}]+}/gi, '(.+)') + '$';

        this._routes.push({
            routeUrl: routeUrl,
            pattern: pattern,
            params: params,
            handle: callback || function () { }
        });

        return this;
    };

    /**
     * 获取参数值
     * @param  {String} path  - 路径
     * @param  {Object} route - 路由相关信息
     * @return {Array}  
     */
    Router.prototype.getValues = function (path, route) {
        var route, values = [];

        if (path.length === 0) {
            return values;
        }

        route = route || this.getRoute(path);

        if (route != null) {
            var matches = path.match(route.pattern);
            if (matches.length != 0) {
                for (var i = 1; i < matches.length; i++) {
                    values.push(matches[i]);
                }
            }
        }
        return values;
    };

    /**
     * 获取匹配路由
     * @param  {String} path - 路径
     * @return {Object}     
     */
    Router.prototype.getRoute = function (path) {
        for (var i = 0; i < this._routes.length; i++) {
            if (new RegExp(this._routes[i].pattern).test(path)) {
                return this._routes[i];
            }
        }
        return null;
    };

    /**
     * 注册一个AMD模块
     * 
     */
    if (typeof window.define === "function" && define.amd) {
        define("kotenei/router", [], function () {
            return Router;
        });
    } else {
        window.Router = Router;
    }

})(window);
/*
 * 滑块模块
 * @date:2014-09-15
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/slider', ['jquery', 'kotenei/dragdrop'], function ($, DragDrop) {

    /**
     * 滑块模块
     * @param {JQuery} $element - dom
     * @param {Object} options  - 参数设置
     */
    var Slider = function ($element, options) {
        this.$element = $element;
        this.options = $.extend({}, {
            min: 1,
            max: 10,
            step: 1,
            value: 1,
            $bindElement: $([]),
            callback: {
                slide: $.noop
            }
        }, options);
        this.template = '<div class="k-slider"><div class="k-slider-selection"></div><div class="k-slider-handle"></div></div>';
        this.min = this.options.min;
        this.max = this.options.max;
        this.step = this.options.step;
        this.diff = this.max - this.min;
        this.init();
    };

    /**
     * 初始化
     * @return {Void} 
     */
    Slider.prototype.init = function () {
        var self = this;
        this.$slider = $(this.template).appendTo(this.$element);
        this.$sliderSelection = this.$slider.find("div.k-slider-selection");
        this.$sliderHandle = this.$slider.find("div.k-slider-handle");
        this.handleWidth = this.$sliderHandle.width();
        this.sliderWidth = this.$slider.outerWidth();
        this.$bindElement = this.options.$bindElement;
        this.dragdrop = new DragDrop({
            $range: this.$slider,
            $layer: this.$slider.find(".k-slider-handle"),
            direction: 'h',
            callback: {
                move: function (moveCoord) {
                    var val = self.getMoveValue(moveCoord);
                    self.setValue(val);
                    self.options.callback.slide(val);
                }
            }
        });

        this.eventBind();
        this.setValue(this.options.value);
    };

    /**
     * 事件绑定
     * @return {Void}
     */
    Slider.prototype.eventBind = function () {
        if (!this.allowElement()) { return; }

        var type = this.$bindElement[0].type;
        var self = this;

        if (type.indexOf('select') !==-1) {
            this.$bindElement.on('change', function () {
                var $this = $(this),
                    val = $.trim(self.getFilterValue($this.val()));
                self.setValue(val);
            });
        } else {
            this.$bindElement.on('keyup', function (e) {
                var $this = $(this),
                    val = $.trim(self.getFilterValue($this.val()));
                if (e.keyCode === 13) {
                    self.setValue(val);
                }
            });
        }
    };

    /**
     * 是否是允许绑定的元素
     * @return {Boolean} 
     */
    Slider.prototype.allowElement = function () {
        if (this.$bindElement.length === 0) { return false; }
        var type = this.$bindElement[0].type;
        if (type !== 'text'
            && type !== "textarea"
            && type.indexOf("select") === -1) {
            return false;
        }
        return true;
    };

    /**
     * 获取过滤后的值
     * @param  {Number} value -输入的值
     * @return {Number}    
     */
    Slider.prototype.getFilterValue = function (value) {
        if (!value) { value = this.min; }
        if (isNaN(value)) { value = this.min; }
        if (value < this.min) { value = this.min; }
        if (value > this.max) { value = this.max; }
        return value;
    };

    /**
     * 设置值
     * @param {Number} value- 设置的值
     */
    Slider.prototype.setValue = function (value) {
        if (value > this.max) { value = this.max; }
        if (value < this.min) { value = this.min; }
        var percent = (value - this.min) / this.diff * 100;
        this.setPercent(percent);
        this.setElementValue(value)
    };

    /**
     * 设置绑定元素值
     * @param {Number} value - 要设置的值
     */
    Slider.prototype.setElementValue = function (value) {
        if (!this.allowElement()) { return; }
        var type = this.$bindElement[0].type;
        if (type.indexOf('select') != -1) {
            this.$bindElement.find("option[value='" + value + "']").prop("selected", true);
        } else {
            this.$bindElement.val(value);
        }
    };

    /**
     * 获取滑动时的值
     * @param  {Object} moveCoord - 滑动时坐标
     * @return {Number}    
     */
    Slider.prototype.getMoveValue = function (moveCoord) {
        var percent = (moveCoord.x / (this.sliderWidth - this.handleWidth) * 100);
        var val = Math.round((percent / 100 * this.diff) / this.step) * this.step + this.min;
        val = val > this.max ? this.max : val;
        return val;
    };

    /**
     * 设置百分比
     * @param {Number} percent 
     */
    Slider.prototype.setPercent = function (percent) {
        this.$sliderSelection.width(percent + "%");
        this.$sliderHandle.css("left", percent + "%");
    };

    return Slider;

});

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
                on: { text: 'on', value: '1', className: '' },
                off: { text: 'off', value: '0', className: '' }
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
        if (this.disabled) { return;}
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
            return values['on'].value;
        } else {
            return values['off'].value;
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

    return Switch;

});

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
            //title: '',
            content: '',
            tipClass: '',
            placement: 'right',
            trigger: 'hover click',
            container: $(document.body),
            scrollContainer: null
        }, options);
        this.tpl = '<div class="k-tooltips">' +
                       '<div class="k-tooltips-arrow"></div>' +
                       '<div class="k-tooltips-title"></div>' +
                       '<div class="k-tooltips-inner"></div>' +
                   '</div>';
        this.init();
    };

    /**
     * 初始化
     * @return {Void}
     */
    Tooltips.prototype.init = function () {
        var self = this;
        this.$tips = $(this.tpl);
        this.$tips.addClass(this.options.placement).addClass(this.options.tipClass);
        this.$container = $(this.options.container);
        //this.setTitle();
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
                console.log("")
            });
        }

        $(window).on('resize.tooltips', function () {
            self.setPosition();
        });

        this.hide();
    };

    /*设置标题
    Tooltips.prototype.setTitle = function (title) {
        title = $.trim(title || this.options.title);
        if (title.length === 0) {
            title = this.$element.attr('data-title') || "";
        }
        var $tips = this.$tips;
        $tips.find('.tooltips-title').text(title);
    };*/


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
/*
 * 树型模块
 * @date:2014-10-22
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/tree', ['jquery', 'kotenei/dragdrop'], function ($, DragDrop) {

    /**
     * 默认参数
     * @type {Object}
     */
    var DEFAULTS = {
        data: [],
        edit: {
            enable: false
            //showAddBtn: false,
            //showEditBtn: false,
            //showRemvoeBtn: false
        },
        check: {
            enable: false,                          // 是否启用
            chkType: 'checkbox',                    // 单选框还是复选框，默认复选
            chkBoxType: { Y: "ps", N: "ps" }        // Y：选中时对父与子级的关联关系，N：取消选中时对父与子级的关联关系，p:父级,s:子级
        },
        callback: {
            beforeCheck: $.noop,
            beforeSelect: $.noop,
            beforeAdd: $.noop,
            beforeRemove: $.noop,

            onCheck: $.noop,
            onSelect: $.noop,
            onAdd: $.noop,
            onRemove: $.noop
        }
    };

    /**
     * 常量
     * @type {Object}
     */
    var _consts = {
        className: {
            ICON: 'icon',
            SWITCH: 'switch'
        },
        floder: {
            OPEN: 'open',
            CLOSE: 'close',
            DOCU: 'docu'
        },
        line: {
            ROOT: 'root',
            ROOTS: 'roots',
            CENTER: 'center',
            BOTTOM: 'bottom'
        },
        node: {
            SELECTED: 'selected'
        }
    };

    /**
     * 工具
     * @type {Object}
     */
    var utils = {
        isArray: function (data) {
            return data instanceof Array;
        },
        getIndex: function (node, nodes) {
            for (var i = 0; i < nodes.length; i++) {
                if (node.nodeId === nodes[i].nodeId) {
                    return i;
                }
            }
            return -1;
        }
    };


    var isCheckRadio = false;

    /**
     * view的操作
     * @type {Object}
     */
    var view = {
        getLineHtml: function (node) {
            var lineType = _consts.line.CENTER;

            if (node.isFirst && node.parentId === 0) {
                lineType = _consts.line.ROOTS;
            } else if (node.isLast) {
                lineType = _consts.line.BOTTOM;
            }


            if (node.hasChildren) {
                if (node.open) {
                    lineType += "_" + _consts.floder.OPEN;
                } else {
                    lineType += "_" + _consts.floder.CLOSE;
                }
            } else {
                lineType += "_" + _consts.floder.DOCU;
            }

            return '<span id="switch_' + node.nodeId + '" nId="' + node.nodeId + '" class="' + _consts.className.ICON + ' ' + _consts.className.SWITCH + ' ' + lineType + '"></span>';
        },
        getIconHtml: function (node) {
            html = '<span id="' + _consts.className.ICON + '_' + node.nodeId + '" class="' + _consts.className.ICON + ' ico_' + _consts.floder.DOCU + '"></span>';
            if (node.hasChildren) {
                //有子节点
                if (node.open) {
                    html = '<span id="' + _consts.className.ICON + '_' + node.nodeId + '"  class="' + _consts.className.ICON + ' ico_' + _consts.floder.OPEN + '"></span>';
                } else {
                    html = '<span id="' + _consts.className.ICON + '_' + node.nodeId + '"  class="' + _consts.className.ICON + ' ico_' + _consts.floder.CLOSE + '"></span>';
                }
            }
            return html;
        },
        getChkHtml: function (node, options) {
            if (!options.check.enable || node.noCheck) {
                return '';
            }

            var checked = String(node.checked === true);
            var className;

            if (options.check.chkType === 'radio') {
                if (!isCheckRadio) {
                    isCheckRadio = true;
                } else {
                    checked = false;
                }
            }

            className = options.check.chkType + '_' + checked + '_' + (node.chkDisabled ? 'part' : 'full');

            return '<span id="chk_' + node.nodeId + '" nId="' + node.nodeId + '" class="' + _consts.className.ICON + ' chk ' + className + '"></span>';

        },
        //getOperateHtml: function (node, options) {
        //    var str = [];

        //    if (!options.edit.enable) {
        //        return '';
        //    }

        //    if (options.edit.showAddBtn) {
        //        str.push('<span id="add_' + node.nodeId + '" nId="' + node.nodeId + '" class="' + _consts.className.ICON + ' add"></span>');
        //    }
        //    if (options.edit.showEditBtn) {
        //        str.push('<span id="edit_' + node.nodeId + '" nId="' + node.nodeId + '" class="' + _consts.className.ICON + ' edit"></span>');
        //    }
        //    if (options.edit.showRemoveBtn) {
        //        str.push('<span id="remove_' + node.nodeId + '" nId="' + node.nodeId + '"  class="' + _consts.className.ICON + ' remove"></span>');
        //    }

        //    return str.join('');
        //},
        replaceSwitchClass: function ($element, newName) {
            var className = $element.attr('class');

            if (!className) { return; }
            var tmpList = className.split('_');

            switch (newName) {
                case _consts.line.ROOT:
                case _consts.line.ROOTS:
                case _consts.line.CENTER:
                case _consts.line.BOTTOM:
                    tmpList[0] = _consts.className.ICON + ' ' + _consts.className.SWITCH + ' ' + newName;
                    break;
                case _consts.floder.OPEN:
                case _consts.floder.CLOSE:
                case _consts.floder.DOCU:
                    tmpList[1] = newName;
                    break;
            }

            $element.attr('class', tmpList.join('_'));
        },
        replaceChkClass: function ($element, checked) {
            $element.attr('class', $element.attr('class').replace(checked ? 'false' : 'true', checked ? 'true' : 'false'));
        }
    };

    /**
     * 树型类
     * @param {JQuery} $element - dom
     * @param {Object} options - 参数
     */
    var Tree = function ($element, options) {
        this.$element = $element;
        this.options = $.extend(true, DEFAULTS, options);
        this.nodes = {};
        this.prefix = 'node';
        this.init();
    };

    /**
     * 初始化
     * @return {Void}
     */
    Tree.prototype.init = function () {
        this.initNodes(this.options.data);
        this.createTree();
        this.eventBind();
    };

    /**
     * 初始化节点
     * @param  {Array} data - 数组节点
     * @return {Void}
     */
    Tree.prototype.initNodes = function (data) {
        if (!utils.isArray(data) || data.length === 0) {
            return;
        }

        for (var i = 0, node; i < data.length; i++) {
            node = data[i];

            if (i === 0 && (i + 1) < data.length) {
                node.isFirst = true;
            } else if ((i + 1) === data.length) {
                node.isLast = true;
            }


            node.hasChildren = this.hasChildren(node);
            node.isParent = node.hasChildren;

            this.nodes[this.prefix + node.nodeId] = node;
            this.initNodes(node.nodes);
        }
    };

    /**
     * 事件绑定
     * @return {Void}       
     */
    Tree.prototype.eventBind = function () {
        var self = this;

        this.$element.on('click', "." + _consts.className.SWITCH, function () {
            //展开或收缩
            var $this = $(this),
                id = $this.attr('nId'),
                $children = self.$tree.find('#ul_' + id),
                $icon = self.$tree.find('#icon_' + id);

            if ($children.length === 0) { return; }
            $children.slideToggle('fast', function () {
                view.replaceSwitchClass($this, $children[0].style.display === "none" ? _consts.floder.CLOSE : _consts.floder.OPEN);
                view.replaceSwitchClass($icon, $children[0].style.display === "none" ? _consts.floder.CLOSE : _consts.floder.OPEN);
            });

        }).on('click', '.chk', function () {
            //复选或单选
            var $this = $(this),
                id = $this.attr('nId'),
                node = self.getNode(id),
                className = this.className,
                checkedNodes = self.getCheckedNodes(),
                checked = className.indexOf('true') === -1;

            if (self.options.callback.beforeCheck() === false) {
                return;
            }

            if (node.chkDisabled) { return; }

            node.checked = checked;
            view.replaceChkClass($this, node.checked);

            if (self.options.check.chkType === "checkbox") {
                self.check(node);
            } else {
                for (var i = 0; i < checkedNodes.length; i++) {
                    if (checkedNodes[i] != node) {
                        checkedNodes[i].checked = false;
                        view.replaceChkClass(self.$tree.find('#chk_' + checkedNodes[i].nodeId), false);
                    }
                }
            }

            self.options.callback.onCheck(node);

        }).on('click', 'a', function () {
            //选择
            var $this = $(this);

            if (self.options.callback.beforeSelect() === false) {
                return;
            }

            if ($this.hasClass(_consts.node.SELECTED)) { return; }
            self.$element.find('a').removeClass(_consts.node.SELECTED);
            $this.addClass(_consts.node.SELECTED);

            self.options.callback.onSelect(self.getSelectedNode());

        }).on('click', '.add', function () {
            //添加
            var $this = $(this);
        }).on('click', '.edit', function () {
            //编辑
            var $this = $(this);
        }).on('click', '.remove', function () {
            //删除
            var $this = $(this);
        });
    };

    /**
     * 创建树
     * @return {Void}
     */
    Tree.prototype.createTree = function () {
        var html = [];
        html.push('<ul class="k-tree">');
        this.createNode(this.options.data, html);
        html.push('</ul>');
        this.$tree = $(html.join(''))
        this.$element.append(this.$tree);
    };

    /**
     * 创建节点
     * @param  {Array} data - 数组节点
     * @param  {Array} html - 字符串数组
     * @param  {Object} parentNode - 父节点
     * @return {Void}
     */
    Tree.prototype.createNode = function (data, html, parentNode) {

        var node, line = 'line';

        if (!utils.isArray(data) || data.length === 0 || !utils.isArray(html)) {
            return;
        }

        if (parentNode) {


            if (parentNode.isLast) {
                line = '';
            }

            if (!parentNode.open) {
                html.push('<ul id="ul_' + parentNode.nodeId + '" style="display:none;" class="' + line + '" >');
            } else {
                html.push('<ul id="ul_' + parentNode.nodeId + '" class="' + line + '">');
            }

        }

        for (var i = 0, node; i < data.length; i++) {
            node = this.getNode(data[i].nodeId);
            if (node) {
                html.push('<li id="li_' + node.nodeId + '" nId="' + node.nodeId + '">');
                html.push(view.getLineHtml(node));
                html.push(view.getChkHtml(node, this.options));
                html.push('<a href="javascript:void(0);" id="a_' + node.nodeId + '" nId="' + node.nodeId + '">');
                html.push(view.getIconHtml(node));
                html.push('<span>' + node.text + '</span>');
                //html.push(view.getOperateHtml(node, this.options));
                html.push('</a>');
                this.createNode(node.nodes, html, node);
                html.push('</li>');
            }
        }

        if (parentNode) {
            html.push('</ul>');
        }

    };

    /**
     * 添加节点
     * @param  {Object} parentNode - 父节点
     * @param  {Object|Array} newNodes - 新节点
     * @return {Void}
     */
    Tree.prototype.addNodes = function (parentNode, newNodes) {

        var nodeHtml = [], parentNode;

        if (!utils.isArray(newNodes)) {
            newNodes = [newNodes];
        }

        parentNode = parentNode || this.getNode(newNodes[0].parentId);

        this.initNodes(newNodes);
        this.createNode(newNodes, nodeHtml);

        if (parentNode) {
            var $parent = this.$tree.find('#li_' + parentNode.nodeId);
            var $children = $parent.find('#ul_' + parentNode.nodeId);

            if ($children.length === 0) {
                parentNode.nodes = newNodes;
                var $switch = $parent.find('#' + _consts.className.SWITCH + "_" + parentNode.nodeId);
                var $icon = $parent.find('#' + _consts.className.ICON + "_" + parentNode.nodeId);
                //父节点是一个子节点，需改变父节点的line和icon
                $children = $('<ul class="' + (parentNode.isLast ? "" : "line") + '" />').attr('id', 'ul_' + parentNode.nodeId);
                view.replaceSwitchClass($switch, _consts.floder.OPEN);
                view.replaceSwitchClass($icon, _consts.floder.OPEN);
            } else {

                var lastNode = parentNode.nodes[parentNode.nodes.length - 1];
                var $last = $parent.find('#li_' + lastNode.nodeId);
                $last.children('ul').addClass('line');

                var $switch = $last.find('#' + _consts.className.SWITCH + "_" + lastNode.nodeId);
                lastNode.isLast = false;
                //需要改变同级节点的line
                view.replaceSwitchClass($switch, _consts.line.CENTER);
                Array.prototype.push.apply(parentNode.nodes, newNodes);
            }
            $children.append(nodeHtml.join('')).appendTo($parent);
        } else {
            var $last = this.$tree.children('li').last(),
                $lastChildren = $last.find('#ul_' + $last.attr('nid'));
            $lastChildren.addClass('line');
            this.$tree.append(nodeHtml.join(''));
        }
    };

    /**
     * 移除节点
     * @param  {Object} node - 节点
     * @return {Void}
     */
    Tree.prototype.removeNode = function (node) {

        if (!node) { return; }

        var parentNode = this.getNode(node.parentId);
        var childNodes = this.getChildNodes(node);
        var $parent = this.$tree.find('#li_' + node.parentId);
        var $current = this.$tree.find('#li_' + node.nodeId);
        var $prev = $current.prev();
        var $next = $current.next();
        var prevNode = this.getNode($prev.attr('nId'));
        var nextNode = this.getNode($next.attr('nId'));

        //删除当前节点下所有子节点
        for (var i = 0; i < childNodes.length; i++) {
            this.$tree.find('#li_' + childNodes[i].nodeId).remove();
            delete this.nodes[this.prefix + childNodes[i].nodeId];
        }

        //有父节点，表明当前删除节点是子节点
        if (parentNode) {
            var index = utils.getIndex(node, parentNode.nodes);
            if (index >= 0) {
                parentNode.nodes.splice(index, 1);
            }

            if (parentNode.nodes.length === 0) {
                $current.parent().remove();
                parentNode.isParent = false;
                parentNode.open = false;
                view.replaceSwitchClass($parent.find('#' + _consts.className.SWITCH + '_' + parentNode.nodeId), _consts.floder.DOCU);
                view.replaceSwitchClass($parent.find('#' + _consts.className.ICON + '_' + parentNode.nodeId), _consts.floder.DOCU);
            }
        }
        
        if (prevNode) {
            if (node.isLast) {
                prevNode.isLast = true;

                $prev.children('ul').removeClass('line');

                if (prevNode.isFirst && prevNode.parentId === 0) {
                    view.replaceSwitchClass($prev.find('#' + _consts.className.SWITCH + '_' + prevNode.nodeId), _consts.line.ROOT);
                } else {
                    view.replaceSwitchClass($prev.find('#' + _consts.className.SWITCH + '_' + prevNode.nodeId), _consts.line.BOTTOM);
                }
            }
        } 
     

        if (node.isFirst && node.parentId === 0) {
            if (nextNode) {
                nextNode.isFirst = true;
                view.replaceSwitchClass($next.find('#' + _consts.className.SWITCH + '_' + nextNode.nodeId), _consts.line.ROOT);
            }
        }

        $current.remove();
        delete this.nodes[this.prefix + node.nodeId];
    };

    /**
     * 复选操作
     * @param  {Object} node - 节点
     * @return {Void}
     */
    Tree.prototype.check = function (node) {
        var parentNodes = this.getParentNodes(node),
            childNodes = this.getChildNodes(node),
            parentNode = this.getNode(node.parentId),
            options = this.options;

        if (node.checked) {
            switch (options.check.chkBoxType.Y.toLowerCase()) {
                case "p":
                    this.checkAction(parentNodes, node.checked);
                    break;
                case "s":
                    this.checkAction(childNodes, node.checked);
                    break;
                default:
                    this.checkAction(parentNodes, node.checked);
                    this.checkAction(childNodes, node.checked);
                    break;
            }
        } else {
            switch (options.check.chkBoxType.N.toLowerCase()) {
                case "p":
                    uncheckParent.call(this, parentNode, node.checked);
                    break;
                case "s":
                    this.checkAction(childNodes, node.checked);
                    break;
                default:
                    uncheckParent.call(this, parentNode, node.checked);
                    this.checkAction(childNodes, node.checked);
                    break;
            }
        }

        //取消选择父节点
        function uncheckParent(parentNode, checked) {
            var unchecked = true;
            while (parentNode && utils.isArray(parentNode.nodes)) {
                for (var i = 0, siblingNode; i < parentNode.nodes.length; i++) {
                    siblingNode = parentNode.nodes[i];
                    if (siblingNode.checked) {
                        unchecked = false;
                        break;
                    }
                }
                if (unchecked) {
                    this.checkAction([parentNode], checked);
                    unchecked = true;
                    parentNode = this.getNode(parentNode.parentId);
                } else {
                    return;
                }
            }
        }
    }

    /**
     * 复选关联节点操作
     * @param  {Array} nodes - 数组节点
     * @param  {Boolean} checked - 是否选中
     * @return {Void}
     */
    Tree.prototype.checkAction = function (nodes, checked) {
        for (var i = 0, node, $elm; i < nodes.length; i++) {
            node = nodes[i];
            node.checked = checked;
            $elm = this.$tree.find('#chk_' + node.nodeId);
            if (node.chkDisabled) {
                continue;
            }
            view.replaceChkClass($elm, checked);
        }
    };

    /**
     * 获取父子节点
     * @param  {Object} node - 当前节点
     * @return {Array}
     */
    Tree.prototype.getParentChildNodes = function (node) {
        var nodes = this.getParentNodes(node);
        this.getChildNodes(node, nodes);
        return nodes;
    };

    /**
     * 获取父节点
     * @param  {Object} node - 当前节点
     * @return {Array}
     */
    Tree.prototype.getParentNodes = function (node) {
        var parentNode = this.nodes[this.prefix + node.parentId];
        var nodes = [];

        while (parentNode) {
            nodes.push(parentNode);
            parentNode = this.nodes[this.prefix + parentNode.parentId];
        }

        return nodes;
    };

    /**
     * 获取子节点
     * @param  {Object} node - 当前节点
     * @param  {Array} nodes - 存数子节点的数组
     * @return {Array}
     */
    Tree.prototype.getChildNodes = function (node, nodes) {

        if (!nodes) {
            nodes = [];
        }

        if (!utils.isArray(node.nodes)) {
            return nodes;
        }

        for (var i = 0; i < node.nodes.length; i++) {
            nodes.push(node.nodes[i]);
            this.getChildNodes(node.nodes[i], nodes);
        }

        return nodes;
    };

    /**
     * 获取选择的节点
     * @return {Object}
     */
    Tree.prototype.getSelectedNode = function () {
        var $selected = this.$tree.find('a.selected');
        if ($selected.length === 0) { return null; }
        var id = $selected.attr('nId');
        return this.getNode(id);
    };

    /**
    * 获取勾选节点
    * @return {Array}
    */
    Tree.prototype.getCheckedNodes = function () {
        var nodes = [];

        for (var key in this.nodes) {
            if (this.nodes[key].checked) {
                nodes.push(this.nodes[key]);
            }
        }
        return nodes;
    }

    /**
     * 根据ID获取节点
     * @return {Object}
     */
    Tree.prototype.getNode = function (id) {
        return this.nodes[this.prefix + id];
    };

    /**
     * 判断当前节点是否有子节点
     * @param  {Object} node - 当前节点
     * @return {Boolean}
     */
    Tree.prototype.hasChildren = function (node) {
        if (node && utils.isArray(node.nodes) && node.nodes.length > 0) {
            return true;
        }
        return false;
    };

    return Tree;
});

/**
 * 
 * @module kotenei/util 
 * @author vfasky (vfasky@gmail.com)
 */
define('kotenei/util', function(){
    var exports = {};

    var Ctor = function () {};
    exports.createProto = Object.__proto__ ? function(proto) {
        return {
            __proto__: proto
        };
    } : function(proto) {
        Ctor.prototype = proto;
        return new Ctor();
    };

    return exports;
});
/*
 * 表单验证模块 用法和jqeury.validate一样 轻量级
 * @date:2014-09-04
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/validate', ['jquery'], function ($) {

    /**
     * 表单验证模块
     * @param {JQuery} $form - dom
     * @param {Object} options - 参数
     */
    function Validate($form, options) {
        this.$form = $form;
        this.options = $.extend({}, Validate.DEFAULTS, options);
        this.rules = this.options.rules;
        this.messages = this.options.messages;
        this.init();
    }

    /**
     * 默认参数
     * @type {Object}
     */
    Validate.DEFAULTS = {
        errorClass: 'error',
        errorElement: 'label',
        rules: {},
        messages: {},
        focusClear: true,
        keyupClear: true,
        errorPlacement: null
    }

    /**
     * 初始化
     * @return {Void} 
     */
    Validate.prototype.init = function () {
        this.getValidFields();
        if (this.validFields.count === 0) {
            return;
        }
        this.eventBind();
    };

    /**
     * 获取验证的元素
     * @return {Void} 
     */
    Validate.prototype.getValidFields = function () {
        this.validFields = { data: {}, count: 0 };
        var self = this;
        var $elements = this.$form.find('input,select,textarea')
        .filter(function () {
            if (!(this.name in self.rules)) {
                return false;
            } else {
                return true;
            }
        }).each(function () {
            if (!self.validFields.data[this.name]) {
                self.validFields.data[this.name] = $(this);
                self.validFields.count++;
            }
        });
    };

    /**
     * 事件绑定
     * @return {Void} 
     */
    Validate.prototype.eventBind = function () {
        var self = this;
        this.$form.on('submit', function (e) {
            return self.validateFrom(e);
        }).on('focus blur keyup',
        ':text, [type="password"], [type="file"], select, textarea, ' +
        '[type="number"], [type="search"] ,[type="tel"], [type="url"], ' +
        '[type="email"], [type="datetime"], [type="date"], [type="month"], ' +
        '[type="week"], [type="time"], [type="datetime-local"], ' +
        '[type="range"], [type="color"]', function (e) {
            self.validate(e);
        }).on('click', '[type="radio"], [type="checkbox"], select, option', function (e) {
            self.validate(e);
        });
    };

    /**
     * 验证
     * @param  {Object} e - 事件
     * @return {Boolean}   
     */
    Validate.prototype.validate = function (e) {

        var element = e.target,
            $element = $(element),
            rules = this.rules[element.name],
            result, val;
        if (this.options.focusClear && e.type === "focusin"
            || this.options.keyupClear && e.type === "keyup") {
            this.hideError($element);
            return;
        }

        if (!rules) { return; }

        val = this.elementValue($element);

        for (var method in rules) {
            var rule = { method: method, parameters: rules[method] };

            result = this.methods[method].call(this, val, $element, rule.parameters);

            if (!result) {
                this.formatAndAdd(element, rule);
                return false;
            } else {
                this.hideError($element);
            }

        }
        return true;
    };

    /**
     * 表单提交时验证
     * @return {Boolean} 
     */
    Validate.prototype.validateFrom = function () {
        var self = this, pass = true;

        for (var item in this.validFields.data) {
            if (!self.validate({ target: this.validFields.data[item][0] })) { pass = false; }
        }
        return pass;
    };

    Validate.prototype.valid = function () {
        return this.validateFrom();
    };

    /**
     * 判断元素类别是不是单选或者复选框
     * @param  {Object} element - dom
     * @return {Boolean}        
     */
    Validate.prototype.checkable = function (element) {
        return (/radio|checkbox/i).test(element.type);
    };

    /**
     * 处理错误
     * @param  {Object} element - dom
     * @param  {Object} rule  - 验证规则
     * @return {Void}        
     */
    Validate.prototype.formatAndAdd = function (element, rule) {
        var $element = $(element);
        var message = this.defaultMessage(element, rule.method);
        message = this.format(message, rule.parameters);
        this.showError($element, message);
    };

    /**
     * 显示错误
     * @param  {JQuery} $element - dom
     * @param  {String} message - 错误信息
     * @return {Void}         
     */
    Validate.prototype.showError = function ($element, message) {
        if (this.checkable($element[0])) {
            $element = this.validFields.data[$element[0].name];
        }
        var $error = $element.data('error');
        if (!$error) {
            $error = $("<" + this.options.errorElement + ">").addClass(this.options.errorClass);
            $element.data('error', $error);
        }
        $error.html(message).show();
        $element.addClass(this.options.errorClass);
        if ($.isFunction(this.options.errorPlacement)) {
            this.options.errorPlacement($element, $error);
        } else {
            $error.insertAfter($element);
        }
    };

    /**
     * 隐藏错误
     * @param  {JQuery} $element - dom
     * @return {Void}        
     */
    Validate.prototype.hideError = function ($element) {
        if (this.checkable($element[0])) {
            $element = this.validFields.data[$element[0].name];
        }
        var $error = $element.data('error');
        $element.removeClass(this.options.errorClass);
        if ($.isFunction(this.options.errorPlacement)) {
            this.options.errorPlacement($element, $([]));
        }
        if (!$error) { return; }
        $error.hide();
    };

    /**
     * 获取默认提示
     * @param  {Object} element - dom
     * @param  {String} method  验证规则
     * @return {String}         
     */
    Validate.prototype.defaultMessage = function (element, method) {

        if (!this.messages[element.name]) {
            this.messages[element.name] = {};
            this.messages[element.name][method] = this.errorMessages[method];
        }

        if (!this.messages[element.name][method]) {
            this.messages[element.name][method] = this.errorMessages[method];
        }

        return this.messages[element.name][method];
    };

    /**
     * 获取格式化错误提示
     * @param  {String} message - 错误提示
     * @param  {Object} params - 格式化参数
     * @return {String}        
     */
    Validate.prototype.format = function (message, params) {
        if (message.indexOf('{0}') != -1) {
            if (params.constructor !== Array) {
                params = [params];
            }
            $.each(params, function (i, n) {
                message = message.replace(new RegExp("\\{" + i + "\\}", "g"), function () {
                    return n;
                });
            });
        }
        return message;
    };

    /**
     * 添加自定义验证规则
     * @param  {String} name - 验证名称
     * @param  {Function} name - 验证方法
     * @param  {String} name - 验证出错提示
     * @return {String}  
     */
    Validate.prototype.addMethod = function (name, method, message) {
        this.methods[name] = method;
        this.errorMessages[name] = message !== undefined ? message : this.errorMessages[name];
    }

    /**
     * 默认错误提示信息
     * @type {Object}
     */
    Validate.prototype.errorMessages = {
        required: '该字段不能为空',
        email: '电子邮箱格式错误',
        url: 'url格式错误',
        date: '请输入一个有效日期',
        dateISO: '请输入一个有效日期（ISO）',
        mobile: '手机号码格式错误',
        phone: '电话号码格式错误',
        number: '请输入一个有效的数字',
        digits: '请输入正整数',
        minLength: '请输入一个长度不小于{0}个字符的值',
        maxLength: '请输入一个长度不大于{0}个字符的值',
        rangeLength: '请输入一个长度介于{0}到{1}个字符的值',
        min: '请输入一个大于或等于{0}的值',
        max: '请输入一个小于或等于{0}的值',
        range: '请输入一个介于{0}到{1}之间的数值',
        equalTo: '请再输入一个相同的值',
        remote: '远程验证失败'
    };


    /**
     * 验证的规则
     * @type {Object}
     */
    Validate.prototype.methods = {
        required: function (value, $element) {
            if ($element[0].nodeName.toLowerCase() === "select") {
                var val = $.trim($element.val());
                return val && val.length > 0;
            }
            if (this.checkable($element[0])) {
                return this.getLength(value, $element[0]) > 0;
            }
            return $.trim(value).length > 0;
        },
        email: function (value, $element) {
            return this.optional($element) || /^(?:[a-z0-9]+[_\-+.]+)*[a-z0-9]+@(?:([a-z0-9]+-?)*[a-z0-9]+.)+([a-z]{2,})+$/i.test(value);
        },
        url: function (value, $element) {
            return this.optional($element) || /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
        },
        date: function (value, $element) {
            return this.optional($element) || !/Invalid|NaN/.test(new Date(value).toString());
        },
        dateISO: function (value, $element) {
            return this.optional($element) || /^\d{4}[\/-]\d{1,2}[\/-]\d{1,2}|\d{4}[\/-]\d{1,2}[\/-]\d{1,2}\s\d{1,2}[:]\d{1,2}[:]\d{1,2}\w$/.test(value);
        },
        mobile: function (value, $element) {
            return this.optional($element) || /^((13[0-9])|(15[^4,\\D])|(18[0,5-9]))\d{8}$/.test(value);
        },
        phone: function (value, $element) {
            return this.optional($element) || /^((0\d{2,3}\-)[1-9]\d{7}(\-\d{1,4})?)$/.test(value);
        },
        number: function (value, $element) {
            return this.optional($element) || /^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value);
        },
        digits: function (value, $element) {
            return this.optional($element) || /^\d+$/.test(value);
        },
        minLength: function (value, $element, param) {
            var length = $.isArray(value) ? value.length : this.getLength($.trim(value), $element[0]);
            return this.optional($element) || length >= param;
        },
        maxLength: function (value, $element, param) {
            var length = $.isArray(value) ? value.length : this.getLength($.trim(value), $element[0]);
            return this.optional($element) || length <= param;
        },
        rangeLength: function (value, $element, param) {
            var length = $.isArray(value) ? value.length : this.getLength($.trim(value), $element[0]);
            return this.optional($element) || (length >= param[0] && length <= param[1]);
        },
        min: function (value, $element, param) {
            return this.optional($element) || value >= param;
        },
        max: function (value, $element, param) {
            return this.optional($element) || value <= param;
        },
        range: function (value, $element, param) {
            return this.optional($element) || (value >= param[0] && value <= param[1]);
        },
        equalTo: function (value, $element, param) {
            var $element = $(param);
            return value === this.elementValue($element);
        },
        remote: function (value, $element, param) {
            var url, data = {}, self = this;

            var previous = this.previousValue($element[0]);

            if (previous.old === value) {
                return previous.valid;
            }

            previous.old = value;

            if (typeof param === "string") {
                url = param;
            } else {
                url = param.url;
                data = param.data;
            }

            data[$element[0].name] = value;
            data["rnd"] = Math.random();

            $.post(url, data)
            .success(function (msg) {
                var valid = msg === true || msg === "true";
                if (valid) {
                    self.hideError($element);
                } else {
                    self.showError($element, previous.message)
                }
                previous.valid = valid;
            })
            .error(function () { return false; });

            return true;
        }
    };

    /**
     * 记录之前的远程验证信息
     * @param  {Object} element - dom
     * @return {Object}       
     */
    Validate.prototype.previousValue = function (element) {
        return $.data(element, "previousValue") || $.data(element, "previousValue", {
            old: null,
            valid: true,
            message: this.defaultMessage(element, "remote")
        });
    }

    /**
     * 可选方法，验证时值非必填
     * @param  {JQuery} $element - dom
     * @return {Boolean}        
     */
    Validate.prototype.optional = function ($element) {
        var val = this.elementValue($element);
        return !this.methods.required.call(this, val, $element);
    };

    /**
     * 取元素值
     * @param  {JQuery} $element - dom
     * @return {String}      
     */
    Validate.prototype.elementValue = function ($element) {
        var type = $element.attr("type"),
            val = $element.val();

        if (type === "radio" || type === "checkbox") {
            return $("input[name='" + $element.attr("name") + "']:checked").val();
        }

        if (typeof val === "string") {
            return val.replace(/\r/g, "");
        }
        return val;
    };

    /**
     * 获取选中项元素的长度
     * @param  {String} value  - 元素值
     * @param  {Object} element - dom
     * @return  {Number}         
     */
    Validate.prototype.getLength = function (value, element) {
        switch (element.nodeName.toLowerCase()) {
            case "select":
                return $("option:selected", element).length;
            case "input":
                if (this.checkable(element)) {
                    return this.$form.find("[name='" + (element.name) + "']").filter(":checked").length;
                }
        }
        return value.length;
    };


    /**
     * 取表单数据
     * @return {Object}
     */
    Validate.prototype.getData = function () {
        var data = {};
        var self = this;
        self.$form.find('input[name], textarea[name]').each(function () {
            var $el = $(this);
            if ($el.is('[type=checkbox]') === false && $el.is('[type=radio]') === false) {
                data[$el.attr('name')] = $.trim($el.val());
            }
            else if ($el.is('[type=radio]:checked')) {
                data[$el.attr('name')] = $.trim($el.val());
            }
            else if ($el.is('[type=checkbox]:checked')) {
                var name = $el.attr('name');
                if (!data[name]) {
                    data[name] = [];
                }
                data[name].push($el.val());
            }
        });
        return data;
    };

    return Validate;

});
/*
 * validate扩展  使用tooltips显示错误
 * @date:2014-09-06
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/validateTooltips', ['jquery', 'kotenei/validate', 'kotenei/tooltips', 'kotenei/util'], function ($, Validate, Tooltips, util) {


    /**
     * Tooltips表单验证
     * @param {JQuery} $form - dom
     * @param {Object} options - 参数
     */
    var ValidateTooltips = function ($form, options) {
        Validate.call(this, $form, options);
    };

    ValidateTooltips.prototype = util.createProto(Validate.prototype);


    /**
	 * 获取元素错误提示定位
	 * @param  {object} element - dom
	 * @return {String}       
	 */
    ValidateTooltips.prototype.getTipsPlacement = function (element) {
        var name = element.name, placement = "right";
        if (!this.tipsPlacement) {
            this.tipsPlacement = this.options.tipsPlacement || {};
        }
        if (!this.tipsPlacement[name]) {
            this.tipsPlacement[name] = placement;
        } else {
            placement = this.tipsPlacement[name];
        }
        return placement;
    };

    /**
	 * 显示tips错误
	 * @param  {JQuery} $element - dom
	 * @param  {String} message - 错误信息
	 * @return {Void}        
	 */
    ValidateTooltips.prototype.showError = function ($element, message) {
        if (this.checkable($element[0])) {
            $element = this.validFields.data[$element[0].name];
        }
        var placement = this.getTipsPlacement($element[0]);
        var tooltips = Tooltips.Get($element);
        if (!tooltips) {
            tooltips = new Tooltips($element, {
                content: message,
                tipClass: 'danger',
                trigger: 'manual',
                placement: placement,
                container: this.options.container || document.body,
                scrollContainer: this.options.scrollContainer 
            });
            Tooltips.Set($element, tooltips);
        } else {
            tooltips.setContent(message);
        }
        tooltips.show();
        $element.addClass(this.options.errorClass);
    };

    /**
	 * 隐藏tips错误
	 * @param  {JQuery} $element -dom
	 * @return {Void}  
	 */
    ValidateTooltips.prototype.hideError = function ($element) {
        if (this.checkable($element[0])) {
            $element = this.validFields.data[$element[0].name];
        }
        var tooltips = Tooltips.Get($element);
        if (tooltips) {
            tooltips.hide();
        }
        $element.removeClass(this.options.errorClass);

    };

    return ValidateTooltips;
});
/**
 * 瀑布流模块
 * @date :2014-09-24
 * @author kotenei (kotenei@qq.com)
 */
define('kotenei/waterfall', ['jquery', 'kotenei/infiniteScroll', 'kotenei/popTips'], function ($, InfiniteScroll, popTips) {

    /**
     * 瀑布流模块
     * @param {JQuery} $element - dom
     * @param {Object} options - 参数
     */
    var Waterfall = function ($element, options) {
        this.$element = $element;
        this.options = $.extend({}, {
            width: 200,
            margin: 10,
            nodeTag: 'li',
            resize: false,
            url: null,
            loaded: $.noop
        }, options);

        this.$window = $(window);
        this.$document = $(document);
        this.node_w = this.options.width + this.options.margin;
        this.loading = false;
        this.noMore = false;
        this.init();
    };

    /**
     * 初始化
     * @return {Void}
     */
    Waterfall.prototype.init = function () {
        var self = this;

        this.arrangementInit();

        this.infiniteScroll = new InfiniteScroll({
            $watchElement: this.$element,
            scrollDistance: 0,
            callback: function () {
                if (self.options.url) {
                    self.remote();
                    return;
                }
                if (self.options.data && self.options.data.length > 0) {
                    self.options.loaded.call(self, self.$element, self.options.data);
                }
            }
        });

        if (this.options.resize) {
            this.$element.css('position', 'static');
            this.$window.on('resize.waterfall', $.proxy(this.arrangementInit, this));
        }
    };

    /**
     * 排列初始化
     * @return {Void}
     */
    Waterfall.prototype.arrangementInit = function () {
        this.arrHeight = [];
        this.nodes = this.$element.children(this.options.nodeTag);
        var n = this.options.resize ? (this.$document.width() / this.node_w | 0) : (this.$element.width() / this.node_w | 0);
        var len = 0;
        for (var i = 0, node_h, $node; i < this.nodes.length; i++) {
            $node = this.nodes.eq(i);
            node_h = $node.outerHeight();

            //n表示一行有多少个节点，i<n表示第一行开始
            if (i < n) {
                this.arrHeight[i] = node_h;         //记录每个节点的高度
                $node.css({
                    top: 0,                         //第一行每个节点的TOP值都为0
                    left: i * this.node_w           //第一行每个节点的left都为当前节点下标与区域宽度的乘积
                });
            } else {
                this.set($node, node_h);
            }
        }
        this.adpHeight();
    };

    /**
     * 排列
     * @param  {JQuery} $items - dom
     * @return {Void}
     */
    Waterfall.prototype.arrangement = function ($items) {
        var self = this;
        if (this.arrHeight.length === 0) {
            this.arrangementInit();
            return;
        }

        if (!$items || $items.length === 0) {
            return;
        }

        $items.each(function () {
            var $this = $(this),
                node_h = $this.outerHeight();
            self.set($this, node_h);
        });
        this.adpHeight();
    };


    /**
     * 设置节点排列
     * @param {JQuery} $node  - dom
     * @param {Number} node_h - 高度
     */
    Waterfall.prototype.set = function ($node, node_h) {
        var min_h = this.getMinHeight();

        var index = this.getMinHeightIndex(min_h);
        index = index == -1 ? 0 : index;

        this.arrHeight[index] += (node_h + this.options.margin);  //更新最小值的那个高度，形成新的高度值、
        $node.css({
            top: min_h + this.options.margin,
            left: index * this.node_w
        });
    };

    /**
     * 获取最小高度的索引
     * @param  {Number} min_h - 最小高度
     * @return {Number}      
     */
    Waterfall.prototype.getMinHeightIndex = function (min_h) {

        if (Array.indexOf) {
            var index = this.arrHeight.indexOf(min_h);
            return index;
        } else {
            for (var i = 0; i < this.arrHeight; i++) {
                if (this.arrHeight[i] === min_h) {
                    return i;
                }
            }
        }
    };

    /**
     * 远程取数据
     * @return {Void} 
     */
    Waterfall.prototype.remote = function () {
        if (this.noMore) { return; }
        if (this.loading) { return; }
        var self = this;
        this.loading = true;
        $.get(this.options.url, {
            rnd: Math.random()
        }).done(function (ret) {
            if (!ret || ret.length === 0) {
                self.noMore = true;
                return false;
            }
            self.options.loaded.call(self, self.$element, ret);
            self.loading = false;
        }).fail(function () {
            popTips.error('网络错误！');
            self.loading = false;
        })
    };


    /**
     * 销毁
     * @return {Void} 
     */
    Waterfall.prototype.destory = function () {
        this.infiniteScroll.destory();
    };

    /**
     * 图片加载
     * @param  {JQuery}   $img - dom
     * @param  {String}   src - 图片路径
     * @param  {Function} callback [description]
     * @return {Void}
     **/
    Waterfall.prototype.imgLoad = function ($img, src, callback) {
        var img = new Image();
        var self = this;
        img.onload = function () {
            $img.attr('src', src);
            callback(self.zoom(img.width, img.height));
        }
        img.onerror = function () {
            callback({ width: self.options.width, height: 300 });
        }
        img.src = src;
    };

    /**
     * 获取缩放图片尺寸
     * @param  {Number} width - 宽度
     * @param  {Number} height- 高度
     * @return {Object}     
     */
    Waterfall.prototype.zoom = function (width, height) {
        var ratio;
        if (width > height || width == height) {
            ratio = width / height;
            height = this.options.width / ratio;
        } else {
            ratio = height / width;
            height = this.options.width * ratio;
        }
        return {
            width: this.options.width,
            height: height
        };
    };

    /**
     * 获取最小高度
     * @return {Number}
     */
    Waterfall.prototype.getMinHeight = function () {
        return Math.min.apply(null, this.arrHeight);
    }

    /**
     * 获取最大高度
     * @return {Number} 
     */
    Waterfall.prototype.getMaxHeight = function () {
        return Math.max.apply(null, this.arrHeight);
    };

    /**
     * 设置容器高度
     * @return {Void}
     */
    Waterfall.prototype.adpHeight = function () {
        this.$element.height(this.getMaxHeight());
    }

    return Waterfall;

});

/*
 * 窗体模块
 * @date:2014-09-17
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/window', ['jquery', 'kotenei/dragdrop', 'kotenei/popTips'], function ($, DragDrop, popTips) {

    /**
     * 窗体模块
     * @param {Object} options - 参数
     */
    var Window = function (options) {
        this.options = $.extend({}, {
            url: null,
            params: null,
            title: '弹出框',
            content: null,
            width: '600',
            height: null,
            backdrop: true,
            backdropClose: false
        }, options);

        this._event = {
            open: $.noop,
            ok: $.noop,
            close: $.noop
        };

        this.loading = false;
        this.template = '<div class="k-window">' +
                            '<h4 class="k-window-header"><span class="k-window-title"></span><span class="k-window-close">×</span></h4>' +
                            '<div class="k-window-container"></div>' +
                            '<div class="k-window-footer">' +
                                '<button type="button" class="btn btn-primary k-window-ok">确定</button>' +
                                '<button type="button" class="btn btn-default k-window-cancel">取消</button>' +
                            '</div>' +
                        '</div>';
        this.backdrop = '<div class="k-window-backdrop"></div>';
        this.$document = $(document);
        this.$window = $(window)
        this.init();
    };

    /**
     * 初始化
     * @return {Void} 
     */
    Window.prototype.init = function () {
        this.build();
        this.setTitle(this.options.title);
        if (this.options.content !== null) { this.setContent(this.options.content); }
        this.eventBind();
    };

    /**
     * 事件绑定
     * @return {Void}
     */
    Window.prototype.eventBind = function () {
        var self = this;
        this.$window.on('resize.window', function () {
            self.layout();
        });
        this.$backdrop.on('click', function () {
            if (self.options.backdropClose) {
                self.close();
            }
        });
        this.$win.on('click', '.k-window-cancel,.k-window-close', function () {
            self.close();
        }).on('click', '.k-window-ok', function () {
            if (self._event.ok.call(self) !== false) {
                self.hide();
            }
        });
    };

    /**
     * 设置事件回调
     * @param  {String}   type  - 事件名
     * @param  {Function} callback - 回调方法
     * @return {Void}           
     */
    Window.prototype.on = function (type, callback) {
        if (this._event.hasOwnProperty(type)) {
            this._event[type] = callback || $.noop;
        }
    };

    /**
     * 设置标题
     * @param {String} title - 标题 
     */
    Window.prototype.setTitle = function (title) {
        this.$header.find('.k-window-title').text(title);
    };

    /**
     * 设置内容
     * @param {String} content - 内容
     */
    Window.prototype.setContent = function (content) {
        content = content || this.options.content;
        this.$container.html(content);
    };

    /**
     * 远程取内容
     * @return {Object} 
     */
    Window.prototype.remote = function () {
        if (typeof this.options.url !== 'string' || this.options.content != null) { return; }
        var self = this;
        var dtd = $.Deferred();
        this.loading = true;
        this.$container.load(this.options.url + "?rnd=" + Math.random(), this.options.params, function () {
            self.loading = false;
            dtd.resolve();
        });
        return dtd.promise();
    };

    /**
     * 打开窗体
     * @return {Void}
     */
    Window.prototype.open = function () {
        var self = this;
        $.when(
            this.remote()
        ).done(function () {
            self.$win.show();
            if (self.options.backdrop) { self.$backdrop.show(); }
            self.layout();
            self._event.open(self.$win);

            var z=zIndex.get();
            self.$win.css('zIndex',z);
            self.$backdrop.css('zIndex',--z);

        });
    };

    /**
     * 关闭窗体
     * @param  {Boolean} enforce - 是否强制关闭
     * @return {Void}  
     */
    Window.prototype.close = function (enforce) {
        if (enforce) {
            this.hide()
            return;
        }

        if (this._event.close() !== false) {
            this.hide();
        }
    };

    /**
     * 隐藏窗体方法
     * @return {Void}
     */
    Window.prototype.hide = function () {
        this.$win.hide();
        this.$backdrop.hide();
        zIndex.pop();
    };




    /**
     * 设置窗体高度
     * @return {Void}
     */
    Window.prototype.layout = function () {
        //屏幕高度
        var screenHeight = this.$window.height();
        //最大弹窗高度
        var maxWinHeight = screenHeight - 100;
        //头部高度
        var headerHeight = this.$header.height();
        //底部高度
        var footerHeight = this.$footer.height();
        //最大容器高度
        var maxContainerHeight = maxWinHeight - headerHeight - footerHeight;

        var newHeight, containerHeight;

        if (this.options.height) {
            // 最大弹窗高度小于设置的高度
            if (maxWinHeight < this.options.height) {
                newHeight = maxWinHeight;
                containerHeight = maxContainerHeight;
            } else {
                newHeight = this.options.height;
                containerHeight = newHeight - headerHeight - footerHeight;
            }
        } else {

            this.orgHeight = this.orgHeight || this.$win.height();
            // 最大弹窗高度小于当前窗体高度
            if (maxWinHeight < this.orgHeight) {
                newHeight = maxWinHeight;
                containerHeight = maxContainerHeight;
            } else {
                newHeight = this.orgHeight;
                containerHeight = this.orgHeight - headerHeight - footerHeight;
            }
        }

        this.$container.css("height", containerHeight);
        this.$win.css({
            height: newHeight,
            marginLeft: -this.$win.width() / 2,
            marginTop: -newHeight / 2
        });
    };

    /**
     * 创建窗体
     * @return {Void} 
     */
    Window.prototype.build = function () {
        this.$win = $(this.template).css({
            width: this.options.width,
            height: this.options.height
        });
        this.$backdrop = $(this.backdrop);
        this.$header = this.$win.find('.k-window-header');
        this.$container = this.$win.find('.k-window-container');
        this.$footer = this.$win.find('.k-window-footer');
        this.$win.appendTo(document.body);
        this.$backdrop.appendTo(document.body);
    };

    /**
     * 提示对话框
     * @param  {String} title  - 标题
     * @param  {String} content - 内容
     * @param  {Function} onOk   -  确定回调函数
     * @return {Void}   
     */
    Window.alert = function (title, content, onOk) {
        if ($.isFunction(content)) {
            onOk = content;
            content = title;
            title = "提示";
        }
        /*var win = window.winAlert;
        if (!win) {
            win = new Window({ width: 400, backdropClose: false });
            win.$win.find(".window-cancel").hide();
            window.winAlert = win;
        }*/
        var win = new Window({ width: 400, backdropClose: false });
        win.$win.find(".k-window-cancel").hide();
        win.setTitle(title);
        win.setContent(content);
        win.on('ok', onOk || $.noop);
        win.open();
    };

    /**
     * 确认对话框
     * @param  {String} title  - 标题
     * @param  {String} content - 内容
     * @param  {Function} onOk  - 确定回调函数
     * @param  {Function} onClose - 关闭回调函数
     * @return {Void}    
     */
    Window.confirm = function (title, content, onOk, onClose) {
        if ($.isFunction(content)) {
            onClose = onOk;
            onOk = content;
            content = title;
            title = "确认提示";
        }
        /*var win = window.winConfirm;
        if (!win) {
            win = new Window({ width: 400, backdropClose: false });
            window.winConfirm = win;
        }*/
        var win =new Window({ width: 400, backdropClose: false });
        win.setTitle(title);
        win.setContent(content);
        win.on('ok', onOk || $.noop);
        win.on('close', onClose || $.noop);
        win.open();
    };

    /**
     * 窗体堆叠顺序设置
     * @return {Object}
     */
    var zIndex = (function () {
        var zIndex = [];

        return {
            get: function () {
                var ret;
                if (zIndex.length === 0) {
                    ret = 1000;
                    zIndex.push(ret);
                } else {
                    ret = zIndex[zIndex.length - 1];
                    ret += 2;
                    zIndex.push(ret);
                }
                return ret;
            },
            pop: function () {
                if (zIndex.length === 0) { return; }
                zIndex.pop();
            }
        };

    })();

    return Window;

});
/*
 * 字符限制模块
 * @date:2014-09-8
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/wordLimit', ['jquery'], function ($) {

    /**
     * 字符限制模块
     * @param {JQuery} $element - dom
     * @param {Object} options - 参数设置
     */
    var WordLimit = function ($element, options) {
        this.$element = $element;
        this.options = $.extend({}, {
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
        this.$element.on('keyup', function () {
            var val = $.trim($(this).val());
            self.update(val);
        });
        this.update($.trim(this.$element.val()));
    };

    /**
     * 更新字符长度和反馈状态
     * @param  {[type]} value [description]
     * @return {[type]}       [description]
     */
    WordLimit.prototype.update = function (value) {
        var len = value.length,
            limit = this.maxLength,
            count = limit - len;
        if (len >= limit) {
            this.$element.val(value.substring(0, limit));
        }
        this.$feedback.html(count < 0 ? 0 : count)
    };

    /**
     * 全局初始化
     * @param {JQuery} $elements - dom
     */
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

    /**
     * 获取缓存对象
     * @param {JQuery} $element - dom
     */
    WordLimit.Get = function ($element) {
        return $element.data('wordLimit');
    }

    /**
     * 设置缓存对象
     * @param {JQuery} $element  - dom
     * @param {Object} wordLimit - 被缓存的对象
     */
    WordLimit.Set = function ($element, wordLimit) {
        $element.data("wordLimit", wordLimit);
    }

    return WordLimit;
});
;
define("kotenei", ["kotenei/autoComplete", "kotenei/cache", "kotenei/clipZoom", "kotenei/datepicker", "kotenei/dragdrop", "kotenei/dropdown", "kotenei/dropdownDatepicker", "kotenei/highlight", "kotenei/infiniteScroll", "kotenei/lazyload", "kotenei/loading", "kotenei/pager", "kotenei/placeholder", "kotenei/popTips", "kotenei/router", "kotenei/slider", "kotenei/switch", "kotenei/tooltips", "kotenei/tree", "kotenei/util", "kotenei/validate", "kotenei/validateTooltips", "kotenei/waterfall", "kotenei/window", "kotenei/wordLimit"], function(_autoComplete, _cache, _clipZoom, _datepicker, _dragdrop, _dropdown, _dropdownDatepicker, _highlight, _infiniteScroll, _lazyload, _loading, _pager, _placeholder, _popTips, _router, _slider, _switch, _tooltips, _tree, _util, _validate, _validateTooltips, _waterfall, _window, _wordLimit){
    return {
        "AutoComplete" : _autoComplete,
        "cache" : _cache,
        "ClipZoom" : _clipZoom,
        "Datepicker" : _datepicker,
        "Dragdrop" : _dragdrop,
        "Dropdown" : _dropdown,
        "DropdownDatepicker" : _dropdownDatepicker,
        "highlight" : _highlight,
        "InfiniteScroll" : _infiniteScroll,
        "lazyload" : _lazyload,
        "Loading" : _loading,
        "Pager" : _pager,
        "placeholder" : _placeholder,
        "popTips" : _popTips,
        "Router" : _router,
        "Slider" : _slider,
        "Switch" : _switch,
        "Tooltips" : _tooltips,
        "Tree" : _tree,
        "Util" : _util,
        "Validate" : _validate,
        "ValidateTooltips" : _validateTooltips,
        "Waterfall" : _waterfall,
        "Window" : _window,
        "WordLimit" : _wordLimit
    };
});