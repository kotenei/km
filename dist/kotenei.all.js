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
            direction: '',// h:水平  v:垂直
            callback: {
                start: $.noop,
                move: $.noop,
                stop: $.noop
            }
        }, options);

        this.$layer = options.$layer;
        this.$handle = options.$handle;
        this.$range = options.$range;
        this.$window = $(window);
        this.$document = $(document);

        //是否移动中
        this.moving = false;
        //鼠标相对拖动层偏移值
        this.offset = { x: 0, y: 0 };
        //原来坐标
        this.originalCoord = { x: 0, y: 0 };

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
        this.eventBind();
    };

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
        });
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
                self.move(e);
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

            if (moveCoord.x < 0) { moveCoord.x = 0; }
            if (moveCoord.y < 0) { moveCoord.y = 0; }
            if (moveCoord.x > rightBoundary) { moveCoord.x = rightBoundary; }
            if (moveCoord.y > bottomBoundary) { moveCoord.y = bottomBoundary; }
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
     * 停止拖动
     * @param  {Object} e -事件
     * @return {Void}   
     */
    DragDrop.prototype.stop = function (e) {
        this.isMoving = false;

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
            className: 'pagination',
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
                        .appendTo(document.body);

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
                        html.push('<div class="pop-tips success"><span class="fa fa-check"></span>&nbsp;<span>' + content + '</span></div>');
                        break;
                    case "error":
                        html.push('<div class="pop-tips error"><span class="fa fa-close"></span>&nbsp;<span>' + content + '</span></div>');
                        break;
                    case "warning":
                        html.push('<div class="pop-tips warning"><span class="fa fa-exclamation"></span>&nbsp;<span>' + content + '</span></div>');
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
        var path = location.hash.slice(1);
        var route = this.getRoute(path);
        var values;

        if (!route) {
            location.replace('#/');
            return;
        }
        values = this.getValues(path, route);     
        route.handle.apply(route, values);
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
        this.template = '<div class="slider"><div class="slider-selection"></div><div class="slider-handle"></div></div>';
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
        this.$sliderSelection = this.$slider.find("div.slider-selection");
        this.$sliderHandle = this.$slider.find("div.slider-handle");
        this.handleWidth = this.$sliderHandle.width();
        this.sliderWidth = this.$slider.outerWidth();
        this.$bindElement = this.options.$bindElement;
        this.dragdrop = new DragDrop({
            $range: this.$slider,
            $layer: this.$slider.find(".slider-handle"),
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
        this.template = '<div class="switch"></div>';
        this.init();
    };

    /**
     * 初始化
     * @return {Void}
     */
    Switch.prototype.init = function () {
        if (this.$element[0].type !== 'checkbox') { return; }      
        this.$switch = $(this.template).append(this.build()).insertAfter(this.$element);
        this.$switchScroller = this.$switch.find('.switch-scroller');
        this.$element.hide();
        this.checked = this.$element.attr('checked') === 'checked';
        this.disabled = this.$element.attr('disabled') === 'disabled';
        this.moveLeft = this.$switch.find('.switch-left').width();
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
        html.push('<div class="switch-scroller">');
        html.push('<span class="switch-left" >' + values['on'].text + '</span>');
        html.push('<span class="switch-middle"></span>');
        html.push('<span class="switch-right">' + values['off'].text + '</span>');
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
            container: document.body
        }, options);
        this.init();
    };

    /**
     * 初始化
     * @return {Void}
     */
    Tooltips.prototype.init = function () {
        this.$tips = $('<div class="tooltips"><div class="tooltips-arrow"></div><div class="tooltips-title"></div><div class="tooltips-inner"></div></div>');
        this.$tips.addClass(this.options.placement).addClass(this.options.tipClass);
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

        this.options.container ? this.$tips.appendTo(this.options.container) : this.$tips.insertAfter(this.$element);
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
        $tips.find('.tooltips-inner').html(content);
    };

    /**
     * 定位
     */
    Tooltips.prototype.setPosition = function () {
        var pos = this.getOffset();
        this.$tips.css(pos);
    };

    /**
     * 获取定位偏移值
     * @return {Object} 
     */
    Tooltips.prototype.getOffset = function () {
        var placement = this.options.placement;
        var container = this.options.container;
        var $element = this.$element;
        var $tips = this.$tips;
        var offset = $element.offset();
        var ew = $element.outerWidth();
        var eh = $element.outerHeight();
        var tw = $tips.outerWidth();
        var th = $tips.outerHeight();

        switch (placement) {
            case 'left':
                return { top: offset.top + eh / 2 - th / 2, left: offset.left - tw };
            case 'top':
                return { top: offset.top - th, left: offset.left + ew / 2 - tw / 2 };
            case 'right':
                return { top: offset.top + eh / 2 - th / 2, left: offset.left + ew };
            case 'bottom':
                return { top: offset.top + eh, left: offset.left + ew / 2 - tw / 2 };
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

    return Validate;

});
/*
 * validate扩展  使用tooltips显示错误
 * @date:2014-09-06
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/validateTooltips', ['jquery', 'kotenei/validate', 'kotenei/tooltips'], function ($, Validate, Tooltips) {

	/**
	 * 获取元素错误提示定位
	 * @param  {object} element - dom
	 * @return {String}       
	 */
	Validate.prototype.getTipsPlacement = function (element) {
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
	Validate.prototype.showError = function ($element, message) {
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
                placement:placement
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
	Validate.prototype.hideError = function ($element) {
		if (this.checkable($element[0])) {
			$element = this.validFields.data[$element[0].name];
		}
		var tooltips = Tooltips.Get($element);
		if (tooltips) {
			tooltips.hide();
		}
		$element.removeClass(this.options.errorClass);
		
	};

	return Validate;
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
        this.template = '<div class="window">' +
                            '<h4 class="window-header"><span class="window-title"></span><span class="window-close">×</span></h4>' +
                            '<div class="window-container"></div>' +
                            '<div class="window-footer">' +
                                '<button type="button" class="btn btn-primary window-ok">确定</button>' +
                                '<button type="button" class="btn btn-default window-cancel">取消</button>' +
                            '</div>' +
                        '</div>';
        this.backdrop = '<div class="window-backdrop"></div>';
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
        this.$win.on('click', '.window-cancel,.window-close', function () {
            self.close();
        }).on('click', '.window-ok', function () {
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
        this.$header.find('.window-title').text(title);
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
        this.$header = this.$win.find('.window-header');
        this.$container = this.$win.find('.window-container');
        this.$footer = this.$win.find('.window-footer');
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
define("kotenei", ["kotenei/dragdrop", "kotenei/dropdown", "kotenei/dropdownDatepicker", "kotenei/lazyload", "kotenei/pager", "kotenei/placeholder", "kotenei/popTips", "kotenei/router", "kotenei/slider", "kotenei/switch", "kotenei/tooltips", "kotenei/util", "kotenei/validate", "kotenei/validateTooltips", "kotenei/window", "kotenei/wordLimit"], function(_dragdrop, _dropdown, _dropdownDatepicker, _lazyload, _pager, _placeholder, _popTips, _router, _slider, _switch, _tooltips, _util, _validate, _validateTooltips, _window, _wordLimit){
    return {
        "Dragdrop" : _dragdrop,
        "Dropdown" : _dropdown,
        "DropdownDatepicker" : _dropdownDatepicker,
        "lazyload" : _lazyload,
        "Pager" : _pager,
        "placeholder" : _placeholder,
        "popTips" : _popTips,
        "Router" : _router,
        "Slider" : _slider,
        "Switch" : _switch,
        "Tooltips" : _tooltips,
        "Util" : _util,
        "Validate" : _validate,
        "ValidateTooltips" : _validateTooltips,
        "Window" : _window,
        "WordLimit" : _wordLimit
    };
});