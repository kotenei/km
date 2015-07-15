/*
 * ajax 模块
 * @date:2014-12-05
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/ajax', ['jquery', 'kotenei/loading', 'kotenei/popTips', 'kotenei/validate', 'kotenei/validateTooltips'], function ($, Loading, popTips, Validate, ValidateTooltips) {

    /**
     * ajax 通用操作封装
     * @return {Object} 
     */
    var Ajax = (function () {

        var _instance;

        //完整路径
        function getFullUrl(urlPath) {
            var loc = window.location;
            var url = "" + loc.protocol + "//" + loc.host + urlPath;
            return url;
        }

        function init() {

            /**
            * ajax 返回数据类型约定： String([JSON,HTML]) || Object(JSON)
            * json 字符串或json对象须包含以下参数，属性大写开头:
            * {
            *     Status:Boolean,           （操作成功与否）
            *     Message:String|Null,      （操作成功提示信息）
            *     ErrorMessage:String/Null, （操作失败错误信息）
            *     Data:Object|Null          （返回的数据对象）
            * }
            */
            var ajax = function (type, url, data, config) {

                var config = $.extend({}, {
                    returnUrl: {
                        enable: true,
                        url: location.href
                    },
                    loadingEnable: true,
                    popTips: {
                        delay: 600,
                        callback: true
                    }
                }, config);

                data = data || {};


                if (config.returnUrl.enable && typeof data == 'object') {
                    var href = config.returnUrl.url;

                    if (href.indexOf('#') != -1
                        && href.lastIndexOf('?') != -1
                        && href.lastIndexOf('?') > href.indexOf('#')) {
                        href = href.substr(0, href.lastIndexOf('?'));
                    }

                    data.returnUrl = href;
                }

                var dtd = $.Deferred();

                if (config.loadingEnable) {
                    Loading.show();
                }

                $.ajax({
                    url: url,
                    type: type,
                    data: data,
                    dataType: 'json',
                    traditional: true,
                    cache: false
                }).done(function (ret) {

                    if (typeof ret === 'string') {
                        try {
                            ret = eval('(' + ret + ')');
                        } catch (e) {
                            dtd.resolve(ret);
                            return dtd.promise();
                        }
                    }

                    ret.Url = $.trim(ret.Url || '');


                    if (ret.Status) {

                        if (ret.Message) {
                            if (config.popTips.callback) {
                                popTips.success(ret.Message, config.popTips.delay, function () {
                                    if (ret.Url && ret.Url.length > 0) {
                                        window.location.href = ret.Url;
                                    } else {
                                        dtd.resolve(ret);
                                    }
                                });
                            } else {
                                popTips.success(ret.Message, config.popTips.delay);
                                if (ret.Url && ret.Url.length > 0) {
                                    window.location.href = ret.Url;
                                } else {

                                    dtd.resolve(ret);
                                }
                            }

                        } else if (ret.Url && ret.Url.length > 0) {
                            window.location.href = ret.Url;
                        } else {
                            dtd.resolve(ret);
                        }

                    } else {


                        if (ret.ErrorMessage) {
                            if (config.popTips.callback) {
                                popTips.error(ret.ErrorMessage || "发生了未知错误", config.popTips.delay, function () {
                                    if (ret.Url && ret.Url.length > 0) {
                                        window.location.href = ret.Url;
                                    } else {
                                        dtd.resolve(ret);
                                    }
                                });
                            } else {
                                popTips.error(ret.ErrorMessage || "发生了未知错误", config.popTips.delay);
                                if (ret.Url && ret.Url.length > 0) {
                                    window.location.href = ret.Url;
                                } else {
                                    dtd.resolve(ret);
                                }
                            }
                        } else if (ret.Url && ret.Url.length > 0) {
                            window.location.href = ret.Url;
                        } else {
                            dtd.resolve(ret);
                        }


                    }
                }).fail(function () {
                    popTips.error("服务器发生错误", config.popTips.delay);
                    dtd.reject();
                }).always(function () {
                    Loading.hide();
                });

                return dtd.promise();
            };

            return {
                post: function (url, data, config) {
                    return ajax("POST", url, data, config);
                },
                get: function (url, data, config) {
                    return ajax("GET", url, data, config);
                },
                ajaxForm: function ($form, config) {
                    var validate, url, type, data;

                    if (!($form instanceof $) && $form instanceof Validate || $form instanceof ValidateTooltips) {
                        validate = $form;
                        $form = $form.$form;
                    }

                    url = $form.attr('action');
                    type = $form.attr('method');
                    data = $form.serialize();


                    var href = location.href;

                    if (href.indexOf('#') != -1
                        && href.lastIndexOf('?') != -1
                        && href.lastIndexOf('?') > href.indexOf('#')) {
                        href = href.substr(0, href.lastIndexOf('?'));
                    }

                    data += "&returnUrl=" + encodeURIComponent(href);

                    var dtd = $.Deferred();
                    var ret = {
                        Status: false,
                        ErrorMessage: '验证失败'
                    };

                    if (validate && validate.valid) {
                        if (validate.valid()) {
                            return ajax(type, url, data, config);
                        } else {
                            dtd.reject(ret);
                            return dtd.promise();
                        }
                    } else if ($form.valid) {
                        if ($form.valid()) {
                            return ajax(type, url, data, config);
                        } else {
                            dtd.reject(ret);
                            return dtd.promise();
                        }
                    } else {
                        return ajax(type, url, data, config);
                    }


                }
            };

        };

        return {
            getInstance: function () {
                if (!_instance) {
                    _instance = init();
                }

                return _instance;
            }
        }

    })();

    return Ajax.getInstance();
});
/**
 * @module kotenei/app 
 * @author kotenei (kotenei@qq.com)
 * @author vfasky (vfasky@gmail.com)
 */
define('kotenei/app', ['jquery', 'kotenei/router', 'kotenei/util', 'kotenei/popTips', 'kotenei/loading', 'kotenei/event'], function ($, Router, util, popTips, loading, event) {

    var App = function ($el, config) {
        this.$el = $el;
        //路由
        this._route = {};
        //配置
        this.config = $.extend({
            idPrefx: 'app-view-',
            viewClass: 'app-view',
            animateClass: 'animated bounceInRight',
            Template: null
        }, config || {});
        //视图
        this._view = {};
        //视图编号
        this.viewId = -1;
        this.window = window;
    };

    //配置路由
    App.prototype.route = function (path, constraints, viewName) {
        if (!viewName) {
            viewName = constraints,
            constraints = null;
        }
        this._route[path] = [constraints, viewName];
        return this;
    };

    //启动app
    App.prototype.run = function () {
        var self = this;
        var router = new Router();

        for (var path in self._route) {
            (function (path) {
                var info = self._route[path];
                router.map(path, info[0], function (params) {
                    self.callView(info[1], params || {});
                });
            })(path);
        }

        router.init();
    };

    //配置路由函数
    App.prototype.callView = function (viewName, params, callback) {
        var self = this;
        var isFirst = false;
        var $view, hash, curHash = this.window.location.hash;
        var instance;
        var $curView;

        //判断是否存在视图
        if (!this._view[viewName]) {
            $view = $('<div id="' + this.config.idPrefx + (++this.viewId) + '" class="' + this.config.viewClass + '"></div>');
            hash = curHash;
            this._view[viewName] = { $el: $view, params: params, hash: hash, instance: null };
            this.$el.append($view);
            isFirst = true;
        } else {
            $view = this._view[viewName].$el;
            hash = this._view[viewName].hash;
            instance = this._view[viewName].instance;
        }

        //原来的hash不等于现有的hash或者首次加载，则刷新当前页
        if (hash != curHash || isFirst) {
            this._view[viewName].hash = curHash;
            instance = this._view[viewName].instance;
            require([viewName], function (View) {
                if (!instance) {
                    instance = new View($view, self);
                    self._view[viewName].instance = instance;
                }
                if (instance.destroy) {
                    instance.destroy();
                }
                instance.run(params);
            });
        }

        //隐藏旧视图
        if (this.viewName) {
            var $oldViewEl = this._view[this.viewName].$el,
                oldViewInstance = this._view[this.viewName].instance;
   
            if (oldViewInstance && typeof oldViewInstance.hide === 'function') {
                oldViewInstance.hide();           
            }

            $oldViewEl.hide().removeClass(this.config.animateClass);
        }

        //显示当前视图
        $view.show().addClass(this.config.animateClass);

        if (instance && typeof instance.show === 'function') {
            instance.show();
        }     

        //设置当前视图名称
        this.viewName = viewName;
    };

    App.View = function ($el, app) {
        this.$el = $el;
        this.app = app;

        //模板引擎绑定
        if (app.config.Template) {
            this.Template = app.config.Template;
        }
    };

    App.View.prototype.run = function (context) {
        this.context = context;
    };

    App.View.extend = function (definition) {

        definition = $.extend({
            initialize: function () { }
        }, definition || {});

        var View = function ($el, app) {
            App.View.call(this, $el, app);
        };

        View.prototype = util.createProto(App.View.prototype);

        for (var k in definition) {
            View.prototype[k] = definition[k];
        }

        return View;
    };

    return App;
});
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

/*
 * 右键菜单模块
 * @date:2015-07-15
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/contextMenu', ['jquery'], function ($) {

    /**
     * 右键菜单模块
     * @constructor
     * @alias kotenei/contextMenu
     * @param {JQuery} $el - dom
     * @param {Object} options - 参数设置
     */
    var ContextMenu = function ($el, options) {
        this.$el = $el;
        this.options = $.extend({}, {
            target: '',
            className: 'k-contextMenu',
            items: [],
            callback: {
                onShow: $.noop
            }
        }, options);
        this.$curTarget = null;
        this.tm = null;
        this.init();
    };

    /**
     * 初始化
     * @return {Void}   
     */
    ContextMenu.prototype.init = function () {
        if (this.options.items.length == 0 || this.$el.length == 0) {
            return;
        }
        this.build();
        this.watch();
    };

    /**
     * 事件监控
     * @return {Void}   
     */
    ContextMenu.prototype.watch = function () {
        var self = this;

        this.$el.on('contextmenu',this.options.target, function (e) {
            var left = e.pageX,
                top = e.pageY;

            self.$curTarget = $(this);

            self.tm = setTimeout(function () {
                self.$contextMenu.css({
                    left: left,
                    top: top,
                    display: 'block'
                });

                self.options.callback.onShow.call(self);

            }, 100);

            return false;
        });

        this.$contextMenu.on('click', 'li', function () {
            var $el = $(this),
                text = $el.text(),
                item = self.items[text];
            if (item && typeof item.func === 'function') {
                item.func(self.$curTarget);
            }
        });

        $(document.body).on('click', function () {
            self.$contextMenu.hide();
            self.$curTarget = null;
        });
    };

    /**
     * 创建菜单
     * @return {Void}   
     */
    ContextMenu.prototype.build = function () {
        var html = [];
        this.items = {};
        html.push('<ul class="' + this.options.className + '">');
        for (var i = 0; i < this.options.items.length; i++) {
            html.push('<li>' + this.options.items[i].text + '</li>');
            this.items[this.filterHtml(this.options.items[i].text)] = this.options.items[i];
        }
        html.push('</ul>');
        this.$contextMenu = $(html.join(''));
        this.$contextMenu.appendTo(document.body);
    };

    /**
     * 过滤html
     * @return {String}   
     */
    ContextMenu.prototype.filterHtml = function (str) {
        return str.replace(/<[^>]*>/ig, '');
    };


    return ContextMenu;
});

/**
 * 日期模块
 * @date :2014-10-31
 * @author kotenei (kotenei@qq.com)
 */
define('kotenei/datepicker', ['jquery'], function ($) {

    var dates = {
        months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一", "十二"],
        days: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
        daysShort: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
        daysMin: ["日", "一", "二", "三", "四", "五", "六"]
    };

    var date = new Date();
    /**
     * 日期模块
     * @param {JQuery} $element - dom
     * @param {Object} options - 参数
     */
    var DatePicker = function ($element, options) {
        var self = this;
        this.$element = $element;
        this.options = $.extend({}, {
            position: 'left',
            desktop: false,
            data: [],
            appendTo: $(document.body),
            showTime: false,
            year: { min: date.getFullYear() - 100, max: date.getFullYear() + 100 },
            format: 'yyyy-MM-dd',
            positionProxy: function () {
                return self.getPosition();
            },
            minDate: null,
            maxDate: null,
            zIndex: 2000
        }, options);
        this.isInput = this.$element.is('input');
        this.year = date.getFullYear();
        this.month = date.getMonth() + 1;
        this.day = date.getDate();
        this.index = 0;
        this.isSetTime = false;
        this.selectDay = false;
        this.init();
        this.event = {
            selected: [],
            clean: [],
            change: []
        };
    };

    /**
     * 添加自定义事件
     * @return {Object}
     */
    DatePicker.prototype.on = function (name, callback) {
        if ($.isArray(this.event[name])) {
            this.event[name].push(callback);
        }

        return this;
    };

    /**
     * 取位置坐标
     *
     * @return {Object}
     */
    DatePicker.prototype.getPosition = function () {
        var position = { left: 0, top: 0 };
        var container = this.options.appendTo[0];
        var parent = this.$element[0];



        do {

            position.left += parent.offsetLeft - parent.scrollLeft;

            position.top += parent.offsetTop - parent.scrollTop;
        } while ((parent = parent.offsetParent) && parent != container);

        if (this.options.position != 'left') {

            var tmp_h_1 = position.left + this.$element.outerWidth();
            var tmp_h_2 = position.left + this.$datepicker.outerWidth();

            position.left = position.left - (tmp_h_2 - tmp_h_1);

        }

        return {
            left: position.left,
            top: position.top + this.$element[0].offsetHeight + 2,
            zIndex: this.options.zIndex
        };
    };

    /**
     * 初始化
     * @return {Void}
     */
    DatePicker.prototype.init = function () {
        if (this.isInput) {
            this.$element.attr('readonly', 'readonly');
        }
        this.initMinMaxDate();

        if (this.canBuild()) {
            this.createPanel();
            this.eventBind();
        } else {
            console.log('最大日期必须大于最小日期');
        }
    };

    /**
     * 初始化最小和最大日期
     * @return {Void}
     */
    DatePicker.prototype.initMinMaxDate = function () {

        var today = new Date();

        if (this.options.minDate) {
            if (this.options.minDate === 'today') {
                this.minDate = today;
            } else {
                this.minDate = new Date(this.options.minDate.replace(/-/g, "/"));
            }
            this.options.year.min = this.minDate.getFullYear();
        }

        if (this.options.maxDate) {
            if (this.options.maxDate === 'today') {
                this.maxDate = today;
            } else {
                this.maxDate = new Date(this.options.maxDate.replace(/-/g, "/"));
            }
            this.options.year.max = this.maxDate.getFullYear();
        }

        if (this.maxDate && this.format(this.maxDate, 'yyyyMMdd') < this.format(today, 'yyyyMMdd')) {
            this.year = this.maxDate.getFullYear();
            this.month = this.maxDate.getMonth() + 1;
            this.day = this.maxDate.getDate();

        } else if (this.minDate && this.format(this.minDate, 'yyyyMMdd') > this.format(today, 'yyyyMMdd')) {
            this.year = this.minDate.getFullYear();
            this.month = this.minDate.getMonth() + 1;
            this.day = this.minDate.getDate();
        }

    }

    /**
     * 判断是否可以创建
     * @return {Bolean}
     */
    DatePicker.prototype.canBuild = function () {

        if (this.maxDate && this.minDate && this.format(this.maxDate, 'yyyyMMdd') < this.format(this.minDate, 'yyyyMMdd')) {
            return false;
        }

        return true;
    };

    /**
     * 事件绑定
     * @return {Void}
     */
    DatePicker.prototype.eventBind = function () {
        var self = this;

        this.$element.on('click.datepicker', function () {
            if (self.options.desktop) {
                return;
            }
            self.show();
            return false;
        });

        this.$datepicker.on('click', function (e) {
            var target = e.target,
                $target = $(target);

            if (target.id === 'year' || target.id === 'month' ||
                $target.parents('.year-box:eq(0)').length > 0 || $target.parents('.month-box:eq(0)').length > 0) {
                return false;
            }

            self.yearBoxToggle(false);
            self.monthBoxToggle(false);
            self.timePanelHide();
            return false;
        }).on('click', '[role=prev]', function () {
            //向前
            self.month--;
            self.prevToggle();

            if (self.month < 1) {
                self.month = 12;
                self.year--;
            }
            self.$next.show();
            self.createDays();
            self.change();
        }).on('click', '[role=next]', function () {
            //向后
            self.month++;
            self.nextToggle();
            if (self.month > 12) {
                self.month = 1;
                self.year++;
            }
            self.$prev.show();
            self.createDays();
            self.change();
        }).on('click', '#month', function () {
            //点击月份
            self.monthBoxToggle(true);
            self.yearBoxToggle(false);
            self.timePanelHide();
        }).on('click', '.month-box li', function () {
            //选择月份
            var $this = $(this),
                month = $this.attr("data-month");

            if ($this.hasClass('disabled')) {
                return;
            }

            self.month = Number($.trim(month));
            self.monthBoxToggle(false);
            self.createDays();
            self.prevToggle();
            self.nextToggle();
            self.change();
        }).on('click', '#year', function () {
            //点击年份
            self.yearBoxToggle(true);
            self.monthBoxToggle(false);
            self.timePanelHide();
        }).on('click', '.year-box li', function () {
            //选择年份
            var $this = $(this),
                text = Number($.trim($this.text()));

            if ($this.hasClass("cur") || $this.hasClass('disabled')) { return; }
            self.$yearBox.find("li").removeClass("cur");
            $this.addClass("cur");

            self.year = Number(text);
            self.createDays();
            self.yearBoxToggle(false);
            self.prevToggle();
            self.nextToggle();
            self.change();
        }).on('click', '[role=yearPrev]', function () {
            //向前选择年份
            if (self.index === 0) {
                return;
            }
            self.index--;
            self.toCurYearPanel();

        }).on('click', '[role=yearNext]', function () {
            //向后选择年份
            if (self.index === self.$yearItems.length - 1) {
                return;
            }
            self.index++;
            self.toCurYearPanel();
        }).on('click', '[role=clear]', function () {
            //清空
            if (self.isInput) {
                self.$element.val('');
            }
            else {
                self.$element.data('value', '');
            }
            self.isSetTime = false;
            self.setTodayInfo();
            self.createDays();
            self.setViewInfo();
            self.hide();

            $.map(self.event.clean, function (v) {
                v();
            });

        }).on('click', '[role=today]', function () {
            //今天
            self.setTodayInfo();
            self.createDays();
            self.hide();
            self.set(true);
            self.setTime();
        }).on('click', 'tbody td', function () {
            //点击天
            var $this = $(this),
                year = $this.attr('data-year'),
                month = $this.attr('data-month'),
                day = $this.attr('data-day');

            if ($this.hasClass('disabled')) { return; }

            year = Number(year);
            month = Number(month);
            day = Number(day);

            self.year = year;
            self.month = month;
            self.day = day;
            self.createDays();

            if (!self.options.showTime) {
                self.set();
                if (self.options.desktop) {
                    return;
                }
                self.hide();
            }

        }).on('click', 'span.hours', function () {
            //点击小时
            self.setTimePanelPosition($(this), self.$hoursBox);
            return false;
        }).on('click', 'span.minutes', function () {
            //点击分种
            self.setTimePanelPosition($(this), self.$minutesBox);
            return false;
        }).on('click', 'span.seconds', function () {
            //点击秒
            self.setTimePanelPosition($(this), self.$secondsBox);
            return false;
        }).on('click', '.time-box li', function () {
            //选择时、分、秒
            var $this = $(this),
                value = $this.attr('data-value'),
                text = $this.text(),
                target = $this.attr('data-target');
            switch (target) {
                case "hours":
                    self.hours = value;
                    self.$hours.text(text);
                    break;
                case "minutes":
                    self.minutes = value;
                    self.$minutes.text(text);
                    break;
                case "seconds":
                    self.seconds = value;
                    self.$seconds.text(text);
                    break;
            }
        }).on('click', '[role=confirm]', function () {
            //点击确定

            var $curDay = self.$datepicker.find('td span.active'),
                $parent = $curDay.parent(),
                year = $parent.attr('data-year'),
                month = $parent.attr('data-month'),
                day = $parent.attr('data-day');


            self.isSetTime = true;
            self.year = Number(year);
            self.month = Number(month);
            self.day = Number(day);
            self.hours = Number(self.$hours.text());
            self.minutes = Number(self.$minutes.text());
            self.seconds = Number(self.$seconds.text());
            self.set();
            self.hide();
        });

        $(document).on('click.datepicker', function () {
            if (self.options.desktop) {
                return;
            }
            self.hide();
        });
    };

    /**
     * 创建容器
     * @return {Void}
     */
    DatePicker.prototype.createPanel = function () {
        var html = [], i;

        html.push('<div class="k-datepicker"  data-desktop="' + (this.options.desktop ? "true" : "") + '" >');
        html.push('<div class="container">');
        html.push('<table>');

        //头部
        html.push('<thead>');
        html.push('<tr>');
        html.push('<th class="prev"  style="width:28px;"><i class="fa fa-chevron-left" role="prev"></i></th>');
        html.push('<th colspan="5">');
        html.push('<span id="year" style="margin-right:20px;">' + this.year + '</span>');
        html.push('<span id="month">' + dates.months[this.month - 1] + '</span>');
        html.push('</th>');
        html.push('<th class="next"  style="width:28px;"><i class="fa fa-chevron-right" role="next"></i></th>');
        html.push('</tr>');
        html.push('<tr>');
        for (i = 0; i < dates.daysMin.length; i++) {
            html.push('<th>' + dates.daysMin[i] + '</th>');
        }
        html.push('</tr>');
        html.push('</thead>');

        html.push('<tbody>');
        html.push('</tbody>');


        html.push('</table>');
        html.push(this.getYearBox());
        html.push(this.getMonthBox());

        html.push('<div class="line"></div>');

        html.push(this.getTimeBox());

        html.push('<div class="operate-box" style="text-align:right;margin-bottom:5px;">');
        html.push('<input type="button" value="清空" role="clear" class="k-btn k-btn-default" />&nbsp;');

        var todayHtml = '<input type="button" value="今天" role="today" class="k-btn k-btn-success" />&nbsp;';

        if (this.minDate && this.maxDate &&
            this.format(this.maxDate, 'yyyyMMdd') >= this.format(new Date(), 'yyyyMMdd') ||
            (!this.minDate && !this.maxDate)) {
            html.push(todayHtml);
        } else if (this.minDate && !this.maxDate && this.format(this.minDate, 'yyyyMMdd') <= this.format(new Date(), 'yyyyMMdd')) {
            html.push(todayHtml);
        } else if (this.maxDate && !this.minDate && this.format(this.maxDate, 'yyyyMMdd') >= this.format(new Date(), 'yyyyMMdd')) {
            html.push(todayHtml);
        }


        if (this.options.showTime) {
            html.push('<input type="button" value="确定" role="confirm" class="k-btn k-btn-primary" />&nbsp;');
        }

        html.push('</div>');
        html.push('</div>');
        html.push('</div>');

        this.$datepicker = $(html.join(''));
        this.$year = this.$datepicker.find('#year');
        this.$yearBox = this.$datepicker.find('.year-box');
        this.$yearItems = this.$yearBox.find('ul');
        this.$month = this.$datepicker.find('#month');
        this.$monthBox = this.$datepicker.find('.month-box');
        this.$line = this.$datepicker.find('.line');
        this.$timeBox = this.$datepicker.find('.time-box');
        this.$operateBox = this.$datepicker.find('.operate-box');
        this.$hours = this.$timeBox.find('span.hours');
        this.$minutes = this.$timeBox.find('span.minutes');
        this.$seconds = this.$timeBox.find('span.seconds');
        this.$hoursBox = this.$timeBox.find('.hours-box');
        this.$minutesBox = this.$timeBox.find('.minutes-box');
        this.$secondsBox = this.$timeBox.find('.seconds-box');
        this.$prev = this.$datepicker.find('th.prev i');
        this.$next = this.$datepicker.find('th.next i');
        this.index = this.$yearItems.find("li.cur").parent().show().index();
        this.createDays();

        if (this.options.showTime) {
            this.$timeBox.show();
        } else {
            this.$timeBox.hide();
        }

        if (this.options.desktop) {

            if (this.options.footerHtml) {
                this.$datepicker.append('<div>' + this.options.footerHtml + '</div>');
            }

            this.$line.hide();
            this.$timeBox.hide();
            this.$operateBox.hide();

            this.$datepicker.appendTo(this.$element).show().css({
                boxShadow: 'none'
            });


            return;
        }

        this.$datepicker.appendTo(this.options.appendTo.length == 0 ? document.body : this.options.appendTo);
    };

    /**
     * 获取年份HTML
     * @return {String}
     */
    DatePicker.prototype.getYearBox = function () {
        var html = [], contentHtml = [], flag = 1, count = 1,
        totalCount = (this.options.year.max - this.options.year.min) + 1,
        year = this.options.year.min - 1,
        page, i, j;

        //分页
        if (totalCount % 10 === 0) {
            page = totalCount / 10;
        } else {
            page = Number(totalCount / 10) + 1;
        }

        var disabled;

        for (i = 1; i <= page; i++) {

            contentHtml.push('<ul>');

            for (j = flag; j <= totalCount ; j++) {

                year += 1;


                contentHtml.push('<li id="li_' + year + '" class="' + (this.year === year ? "cur" : "") + '" >' + year + '</li>');

                flag++;

                if (count % 10 === 0) {
                    count = 1;
                    break;
                }

                count++;
            }

            contentHtml.push('</ul>');
        }

        html.push('<div class="year-box">');

        html.push('<div class="year-box-container">');

        html.push(contentHtml.join(""));

        html.push('</div>');

        html.push('<div class="year-box-controls">');
        html.push('<i class="fa fa-chevron-left" style="float:left;" role="yearPrev"></i>');
        html.push('<i class="fa fa-chevron-right" style="float:right;" role="yearNext"></i>');
        html.push('</div>');
        html.push('</div>');
        return html.join('');
    };

    /**
     * 获取月份HTML
     * @return {String}
     */
    DatePicker.prototype.getMonthBox = function () {
        var html = [], i, month, monthText, disabled;

        html.push('<ul class="month-box">');

        for (i = 0; i < dates.months.length; i++) {
            monthText = dates.months[i];
            month = i + 1;
            html.push('<li class="' + disabled + '" data-month="' + (i + 1) + '">' + monthText + '</li>');
        }

        html.push('</ul>');

        return html.join('');
    };

    /**
     * 获取时间HTML
     * @return {String}
     */
    DatePicker.prototype.getTimeBox = function () {
        var html = [], /*date = new Date(),*/ i;

        html.push('<div class="time-box">');

        //小时
        html.push('<ul class="hours-box">');
        for (i = 0; i < 24; i++) {
            html.push('<li data-target="hours" data-value=' + i + '>' + this.supStr(i) + '</li>');
        }
        html.push('</ul>');

        //分
        html.push('<ul class="minutes-box">');
        for (i = 0; i <= 55; i += 5) {
            html.push('<li data-target="minutes" data-value=' + i + '>' + this.supStr(i) + '</li>');
        }
        html.push('</ul>');

        //秒
        html.push('<ul class="seconds-box">');
        for (i = 0; i <= 55; i += 15) {
            html.push('<li data-target="seconds" data-value=' + i + '>' + this.supStr(i) + '</li>');
        }
        html.push('</ul>');


        html.push('<div class="time-box-container">');
        html.push('<span>时间：</span>');
        html.push('<div >');
        html.push('<span class="hours">' + date.getHours() + '</span>');
        html.push('<span>:</span>');
        html.push('<span class="minutes">' + date.getMinutes() + '</span>');
        html.push('<span>:</span>');
        html.push('<span class="seconds">' + date.getSeconds() + '</span>');
        html.push('</div>');
        html.push('</div>');

        html.push('</div>');

        return html.join('');
    };

    /**
     * 创建天数
     * @param {Number} year - 年
     * @param {Number} month - 月
     * @param {Number} day - 日
     * @return {Void}
     */
    DatePicker.prototype.createDays = function (year, month, day) {
        var self = this;
        var i, j, disabled;
        this.setSelectivelyDate();
        year = year || this.year;
        month = month || this.month;
        day = day || this.day;


        function getDisabledClass(curDate) {

            function getMinDisabledClass(curDate) {
                if (self.format(curDate, 'yyyyMMdd') < self.format(self.minDate, 'yyyyMMdd')) {
                    return 'disabled';
                }
                return '';
            };

            function getMaxDisabledClass(curDate) {
                if (self.format(curDate, 'yyyyMMdd') > self.format(self.maxDate, 'yyyyMMdd')) {
                    return 'disabled';
                }
                return '';
            };


            if (self.minDate && self.maxDate) {

                var minClass = getMinDisabledClass(curDate),
                    maxClass = getMaxDisabledClass(curDate);

                if (minClass.length > 0) { return minClass; }
                if (maxClass.length > 0) { return maxClass; }

            } else if (self.minDate) {
                return getMinDisabledClass(curDate);
            } else if (self.maxDate) {
                return getMaxDisabledClass(curDate);
            }

            return '';
        };


        //当月最后一天  new Date('2014/4/0').getDate() 表示获取2014年3月最后一天
        var curMonthLastDay = this.getMonthLastDay(year, month);

        //前一个月最后一天
        var prevMonthLastDay = this.getMonthLastDay(year, month - 1);

        //当月第一天星期几
        var fristDay = new Date(year, month - 1, 1).getDay();

        //创建42个长度的数组
        var arr = new Array(42), arrDaysHtml = [], tmp = 42 - curMonthLastDay;

        //存放天数，下标j为星期几
        for (i = 0, j = fristDay; i < curMonthLastDay; i++, j++) {
            arr[j] = { year: year, month: month, day: i + 1, tdClass: getDisabledClass(new Date(year, month - 1, i + 1)) };
            if (i + 1 === curMonthLastDay) {
                tmp = 42 - j;
            }

        }

        //前补位
        for (i = fristDay, j = 0; i >= 1  ; i--, j++) {
            var disabledClass;

            if (month === 1) {
                disabledClass = getDisabledClass(new Date(year - 1, 11, prevMonthLastDay - i + 1));
                arr[j] = { year: year - 1, month: 12, day: prevMonthLastDay - i + 1, tdClass: 'old ' + disabledClass };
            } else {
                disabledClass = getDisabledClass(new Date(year, month - 2, prevMonthLastDay - i + 1));
                arr[j] = { year: year, month: month - 1, day: prevMonthLastDay - i + 1, tdClass: 'old ' + disabledClass };
            }
        }

        //后补位
        for (i = (42 - tmp) + 1, j = 1 ; i < 42; i++, j++) {

            var disabledClass;

            if (month === 12) {
                disabledClass = getDisabledClass(new Date(year + 1, 0, j));
                arr[i] = { year: year + 1, month: 1, day: j, tdClass: 'new ' + disabledClass };
            } else {
                disabledClass = getDisabledClass(new Date(year, month, j));
                arr[i] = { year: year, month: month + 1, day: j, tdClass: 'new ' + disabledClass };
            }
        }

        //构造表格
        var flag = 0, count = 0, curValue, todayClass, dotHtml;
        for (i = 0; i < 6; i++) {
            arrDaysHtml.push("<tr>");
            for (j = flag; j < 42; j++) {

                curValue = arr[j];

                if (curValue.year === year &&
                    curValue.month === month &&
                    this.day === curValue.day) {
                    todayClass = "today";
                } else {
                    todayClass = "";
                }

                dotHtml = this.getDotHtml(curValue.year + '-' + this.fixZero(curValue.month) + '-' + this.fixZero(curValue.day));

                arrDaysHtml.push('<td id="' + curValue.year + '_' + curValue.month + '_' + curValue.day + '" class="' + curValue.tdClass + '   ' + todayClass + '  " data-year="' + curValue.year + '" data-month="' + curValue.month + '" data-day="' + curValue.day + '"><span>' + curValue.day + '</span>' + dotHtml + '</td>');
                flag++;
                count++;
                if (count === 7) {
                    count = 0;
                    break;
                }
            }
            arrDaysHtml.push("</tr>");
        }

        this.$datepicker.find("tbody").html(arrDaysHtml.join(""));
        this.setViewInfo(year, month, day);
    };

    /**
     * 不足两位补0
     * @param {String} value - 值
     * @return {String}
     */
    DatePicker.prototype.fixZero = function (value) {

        value = String(value);

        if (value.length === 0) {
            return '';
        }

        if (value.length === 1) {
            value = ('0' + value);

            return value;
        }

        return value;
    };

    /**
     * 取圆点HTML
     * @param {String} strDate - 日期
     * @return {String}
     */
    DatePicker.prototype.getDotHtml = function (strDate) {
        if (!this.options.data || this.options.data.length === 0) {
            return '';
        }

        for (var i = 0, data; i < this.options.data.length; i++) {
            data = this.options.data[i];
            if (data === strDate) {
                return '<em class="dot"></em>';
            }
        }
        return '';
    };

    /**
     * 获取月份最后1天
     * @param {Number} year - 年
     * @param {Number} month - 月
     * @return {Number}
     */
    DatePicker.prototype.getMonthLastDay = function (year, month) {
        return (new Date(new Date(year, month, 1).getTime() - 1000 * 60 * 60 * 24)).getDate();
    };

    /**
     * 年份选择框显示切换
     * @param {Boolean} isShow - 是否显示
     * @return {Void}
     */
    DatePicker.prototype.yearBoxToggle = function (isShow) {
        var css = { left: this.$year.position().left, top: this.$year.position().top + this.$year.outerHeight() - 2 };

        if (isShow) {
            this.$year.addClass('selected');
            this.$yearBox.show().css(css);
        } else {
            this.$year.removeClass('selected');
            this.$yearBox.hide();
        }
    };

    /**
     * 月份选择框显示切换
     * @param {Boolean} isShow - 是否显示
     * @return {Void}
     */
    DatePicker.prototype.monthBoxToggle = function (isShow) {
        var css = { left: this.$month.position().left, top: this.$month.position().top + this.$month.outerHeight() - 2 };

        if (isShow) {
            this.$month.addClass('selected');
            this.$monthBox.show().css(css);
        } else {
            this.$month.removeClass('selected');
            this.$monthBox.hide();
        }
    };

    /**
     * 隐藏时间容器
     * @return {Void}
     */
    DatePicker.prototype.timePanelHide = function () {
        this.$hoursBox.hide();
        this.$minutesBox.hide();
        this.$secondsBox.hide();
    };

    /**
     * 显示当前选中年份的选择框
     * @return {Void}
     */
    DatePicker.prototype.toCurYearPanel = function () {
        this.$yearItems.hide().eq(this.index).show();
    };

    /**
     * 向前按钮显示切换
     * @return {Void}
     */
    DatePicker.prototype.prevToggle = function () {

        var min = 1;

        if (this.minDate) {
            min = this.minDate.getMonth() + 1;
        } else if (this.maxDate) {
            min = this.maxDate.getMonth() + 1;
        }

        if (this.year === this.options.year.min && this.month === min) {
            this.$prev.hide();
        } else {
            this.$prev.show();
        }
    };

    /**
     * 向后按钮显示切换
     * @return {Void}
     */
    DatePicker.prototype.nextToggle = function () {

        var max = 12;

        if (this.maxDate) {
            max = this.maxDate.getMonth() + 1;
        } else if (this.minDate) {
            max = this.minDate.getMonth() + 1;
        }

        if (this.year === this.options.year.max && this.month === max) {
            this.$next.hide();
        } else {
            this.$next.show();
        }
    };

    /**
     * 设置可选日期
     * @return {Void}
     */
    DatePicker.prototype.setSelectivelyDate = function () {

        var minYear, maxYear, minMonth, maxMonth, minDay, maxDay;
        var $li = this.$monthBox.find('li').removeClass('disabled');
        var self = this;

        //设置最小日期
        function setMinDate($li) {
            var minYear = self.minDate.getFullYear();
            var minMonth = self.minDate.getMonth() + 1;
            var minDay = self.minDate.getDate();

            if (minYear == self.year) {

                if (minMonth > self.month) {

                    self.month = minMonth;

                    if (minDay < self.day) {
                        self.day = minDay;
                    }
                }

                if (self.month == minMonth && minDay > self.day) {
                    self.day = minDay;
                }

                setMinDisabled($li, minMonth);
            }

        };

        //设置最大日期
        function setMaxDate($li) {

            var maxYear = self.maxDate.getFullYear();
            var maxMonth = self.maxDate.getMonth() + 1;
            var maxDay = self.maxDate.getDate();

            if (maxYear == self.year) {

                if (maxMonth < self.month) {
                    self.month = maxMonth;

                    if (maxDay > self.day) {
                        self.day = maxDay;
                    }

                }
                if (maxMonth == self.month && maxDay < self.day) {
                    self.day = maxDay;
                }
                setMaxDisabled($li, maxMonth);
            }
        };

        //禁用最小月份选择
        function setMinDisabled($li, minMonth) {
            $li.each(function () {
                var $this = $(this),
                    month = $this.attr('data-month');
                if (month < minMonth) {
                    $this.addClass('disabled');
                }
            });
        };

        //禁用最大月份选择
        function setMaxDisabled($li, maxMonth) {
            $li.each(function () {
                var $this = $(this),
                    month = $this.attr('data-month');
                if (month > maxMonth) {
                    $this.addClass('disabled');
                }
            });
        };

        if (this.minDate && this.maxDate) {
            setMinDate($li);
            setMaxDate($li);
        } else if (this.minDate) {
            setMinDate($li);
        } else if (this.maxDate) {
            setMaxDate($li);
        }
    };

    /**
     * 显示日期选择器前初始化参数
     * @return {Void}
     */
    DatePicker.prototype.showInit = function () {
        var value;
        if (this.isInput) {
            value = $.trim(this.$element.val());
        }
        else {
            value = $.trim(this.$element.data('value'));
        }

        if (value.length === 0) { return; }

        var regDate = /(\d{4}).{1}(\d{2}).{1}(\d{2})/;
        var regTime = /(\d{2}):(\d{2}):(\d{2})/;
        var dateMatches = value.match(regDate);
        var timeMatches = value.match(regTime);

        if (dateMatches && dateMatches.length > 0) {
            this.year = Number(dateMatches[1]);
            this.month = Number(dateMatches[2]);
            this.day = Number(dateMatches[3]);
        }

        if (timeMatches && timeMatches.length > 0) {
            this.hours = Number(timeMatches[1]);
            this.minutes = Number(timeMatches[2]);
            this.seconds = Number(timeMatches[3]);
        }
    };

    /**
     * 显示日期选择器
     * @return {Void}
     */
    DatePicker.prototype.show = function () {

        $('div.k-datepicker').each(function () {
            var desktop = this.getAttribute("data-desktop");
            if (!desktop || desktop != 'true') {
                $(this).hide();
            }
        });

        if (this.options.showTime && !this.isSetTime) {
            this.setTodayInfo();
            this.createDays();
            this.setViewInfo();
            this.setTime();
        } else {
            this.showInit();
            this.createDays();
            this.setViewInfo();
        }

        var position = this.options.positionProxy();
        this.$datepicker.show().css(position);
    };

    /**
     * 隐藏日期选择器
     * @return {Void}
     */
    DatePicker.prototype.hide = function () {
        this.$datepicker.hide();
        this.yearBoxToggle(false);
        this.monthBoxToggle(false);
        this.timePanelHide();
    };

    /**
     * 设置时分秒选择框显示的位置
     * @param {JQuery} $curObj - 当前要设置时，分或秒的jquery元素
     * @param {JQuery} $panel - 时、分或秒对应的选择框
     * @return {Void}
     */
    DatePicker.prototype.setTimePanelPosition = function ($curObj, $panel) {
        var css = { left: $curObj.position().left - 1, top: $curObj.position().top - $panel.outerHeight() };
        $panel.show().css(css).siblings('ul').hide();
        this.yearBoxToggle(false);
        this.monthBoxToggle(false);
    };

    /**
     * 设置今天的日期相关参数
     * @return {Void}
     */
    DatePicker.prototype.setTodayInfo = function () {
        var today = new Date();
        this.year = today.getFullYear();
        this.month = today.getMonth() + 1;
        this.day = today.getDate();
        this.hours = today.getHours();
        this.minutes = today.getMinutes();
        this.seconds = today.getSeconds();
    };

    /**
     * 日期选择器View相关设置
     * @param {Number} year - 年
     * @param {Number} month - 月
     * @param {Number} day - 日
     * @return {Void}
     */
    DatePicker.prototype.setViewInfo = function (year, month, day) {

        year = year || this.year;
        month = month || this.month;
        day = day || this.day;

        this.prevToggle();
        this.nextToggle();
        this.$year.html(year);
        this.$month.html(dates.months[month - 1]);
        this.$yearBox.find("li").removeClass("cur");
        this.$yearBox.find("#li_" + year).addClass("cur").parent().show().siblings().hide();
        this.$datepicker.find('tbody td span').removeClass('active');
        this.$datepicker.find('#' + year + '_' + month + '_' + day).children().addClass('active');
        this.index = this.$yearItems.find("li.cur").parent().show().index();
    };

    /**
     * 设置时间
     * @return {Void}
     */
    DatePicker.prototype.setTime = function () {
        var date = new Date();

        var curHours = date.getHours(),
            curMinutes = date.getMinutes(),
            curSeconds = date.getSeconds();

        this.$hours.text(this.isSetTime ? this.supStr((this.hours || curHours)) : this.supStr(curHours));
        this.$minutes.text(this.isSetTime ? this.supStr((this.minutes || curMinutes)) : this.supStr(curMinutes));
        this.$seconds.text(this.isSetTime ? this.supStr((this.seconds || curSeconds)) : this.supStr(curSeconds));
    };

    /**
     * 设置日期到绑定元素
     * @param {Boolean} isToday - 是否设置今天日期
     * @return {Void}
     */
    DatePicker.prototype.set = function (isToday) {
        var value = this.getDateValue(isToday);
        if (this.isInput) {
            this.$element.val(value).focus().blur();
        }
        else {
            this.$element.data('value', value);
        }
        $.map(this.event.selected, function (v) {
            v(value);
        });
    };

    /**
     * 设置日期到绑定元素
     * @param {Boolean} isToday - 是否设置今天日期
     * @return {Void}
     */
    DatePicker.prototype.change = function (isToday) {
        var value = this.getDateValue(isToday);
        $.map(this.event.change, function (v) {
            v(value);
        });
    };

    /**
     * 取当前选中的日期
     * @param {Boolean} isToday - 是否当天日期
     * @return {String}
     */
    DatePicker.prototype.getDateValue = function (isToday) {

        isToday = isToday || false;
        this.isSetTime = true;
        var today = new Date();
        var year = isToday ? today.getFullYear() : this.year,
            month = isToday ? today.getMonth() : this.month - 1,
            day = isToday ? today.getDate() : this.day,
            hours = isToday || !this.options.showTime ? today.getHours() : (this.hours || today.getHours()),
            minutes = isToday || !this.options.showTime ? today.getMinutes() : (this.minutes || today.getMinutes()),
            seconds = isToday || !this.options.showTime ? today.getSeconds() : (this.seconds || today.getSeconds());

        var now = new Date(year, month, day, hours, minutes, seconds);
        var value = this.format(now);

        return value;
    }

    /**
     * 获取日期格式化后的字符串
     * @param {Object} date - 日期对象
     * @return {String}
     */
    DatePicker.prototype.format = function (date, formatStr) {
        date = date || new Date();

        var formatStr = formatStr || this.options.format.replace(/"/g, "");

        var o = {
            "y+": date.getFullYear(),
            "M+": date.getMonth() + 1,
            "d+": date.getDate(),
            "h+": date.getHours(),
            "m+": date.getMinutes(),
            "s+": date.getSeconds()
        }, k, value;

        for (k in o) {
            if (new RegExp("(" + k + ")").test(formatStr)) {
                value = o[k];
                formatStr = formatStr.replace(RegExp.$1, value.toString().length === 1 ? ("0" + value.toString()) : value);
            }
        }

        return formatStr;
    };

    /**
     * 不足两个字符补0
     * @param {String} str - 时分秒字符串
     * @return {String}
     */
    DatePicker.prototype.supStr = function (str) {
        str = String(str);
        if (str.length === 1) {
            return '0' + str;
        }

        return str;
    };

    /**
     * 全局日期选择器绑定
     * @param {JQuery} $elements - 全局元素
     * @return {Void}
     */
    DatePicker.Global = function ($elements) {
        $elements = $elements || $(document.body).find('input[data-module="datepicker"]');
        $elements.each(function () {
            var $this = $(this),
                format = $this.attr('data-format'),
                showTime = $this.attr('data-showTime'),
                minDate = $this.attr('data-minDate'),
                maxDate = $this.attr('data-maxDate'),
                position = $this.attr('data-position'),
                appendTo = $this.attr('data-appendTo');

            var data = $this.data('datepicker');

            showTime = showTime ? showTime === "true" : false;

            if (!data) {
                data = new DatePicker($this, {
                    format: format,
                    showTime: showTime,
                    minDate: minDate,
                    maxDate: maxDate,
                    position: position || 'left',
                    appendTo: $(appendTo || document.body)
                });
                $this.data('datepicker', data);
            }
        });
    };

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
    Dropdown.prototype.getVal = function () {
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
['jquery', 'kotenei/dropdown', 'kotenei/datepicker', 'kotenei/util'],
function ($, Dropdown, DatePicker, util) {

    /**
     * 日历下拉框
     * @constructor
     * @alias kotenei/dropdownDatepicker
     * @param {jQuery} $el - dom
     * @param {Object} setting - 参数设置
     */
    var DropdownDatePicker = function ($el, setting) {
        Dropdown.call(this, $el, setting);
    };

    DropdownDatePicker.prototype = util.createProto(Dropdown.prototype);

    /**
     * 生成下拉框内容
     * @return {Void}
     */
    DropdownDatePicker.prototype.buildDrop = function () {    
        var self = this;

        this.datepicker = new DatePicker(self.$el, {
            format: this.setting.format,
            showTime: this.setting.showTime || false
        });

        this.datepicker.on('selected', function (date) {
            self.$el.data('value', date);
            self.setVal(date);
            self.setLabel(date);
        }).on('clean', function () {
            var placeholder = self.$soure.attr('placeholder') || '选择日期';
            self.setVal('');
            self.setLabel(placeholder);
            self.$el.data('value', null);
        });

        self.sync();
    };

    /**
     * 同步数据
     * @return {Void}
     */
    DropdownDatePicker.prototype.sync = function () {
        var date = this.getVal();

        if (date) {
            this.$el.data('value', date);
            this.setVal(date);
            this.setLabel(date);
        }
        else {
            var placeholder = this.$soure.attr('placeholder') || '选择日期';
            this.setLabel(placeholder);
        }
    };

    /**
     * 监听事件
     * @return {Void}
     */
    DropdownDatePicker.prototype.watch = function () { };


    return DropdownDatePicker;

});
/**
 * 事件
 * @date :2014-12-01
 * @author kotenei (kotenei@qq.com)
 */ 
define('kotenei/event', [], function () {

    var exports = {},
        topics = {},
        subId = -1;

    exports.on = function (topic, func) {
        if (!topics[topic]) {
            topics[topic] = [];
        }
        var token = (++subId).toString();

        topics[topic].push({
            token: token,
            func: func
        });

        return token;
    };

    exports.off = function (topic) {
        if (!topic) {
            subId = -1;
            topics = {};
            return;
        }
        if (/^\d+$/.test(topic)) {
            for (var m in topics) {
                if (topics[m]) {
                    for (var i = 0, j = topics[m].length; i < j; i++) {
                        if (topics[m][i].token === topic) {
                            topics[m].splice(i, 1);
                            return topic;
                        }
                    }
                }
            }
        } else {
            if (topics[topic]) {
                delete topics[topic];
            }
        }
    };

    exports.trigger = function (topic, args) {
        if (!topics[topic]) {
            return false;
        }
        var arr = topics[topic],
            len = arr ? arr.length : 0;

        while (len--) {
            arr[len].func(args);
        }
    };

    return exports;

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


        if (typeof $elm!='object') {
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
 * 图片预览模块
 * @date :2014-11-6
 * @author kotenei (kotenei@qq.com)
 */
/*global define, require, document*/
define('kotenei/imgPreview', ['jquery', 'kotenei/loading', 'kotenei/popTips'], function ($, Loading, popTips) {

    /**
     * 图片预览模块
     * @constructor
     * @alias kotenei/imgPreview
     * @param {JQuery} $elements - dom
     * @param {Object} options - 参数设置
     */
    var ImgPreview = function ($elements, options) {
        this.$elements = $elements;
        this.options = $.extend({}, {
            delay:500,
            showButtons: true,
            backdrop: true,
            backdropClose: true,
            tpl: '<div class="k-imgPreview">' +
                    '<div class="container">' +
                        '<span class="close" role="close"><i class="fa fa-close"></i></span>' +
                        '<span class="prev" role="prev"><i class="fa fa-chevron-left"></i></span>' +
                        '<span class="next" role="next"><i class="fa fa-chevron-right"></i></span>' +
                        '<img src="" />' +
                    '</div>' +
                    '<p class="description"></p>' +
                 '</div>'
        }, options);
        this.$win = $(window);
        this.isLoading = false;
        this.index = 0;
        this.init();
    };

    /**
     * 初始化
     * @return {Void}   
     */
    ImgPreview.prototype.init = function () {
        if (this.$elements.length === 0) { return; }

        this.$imgPreview = $(this.options.tpl).appendTo(document.body);
        this.$container = this.$imgPreview.find('.container');
        this.$img = this.$container.find('img');
        this.$prev = this.$container.find('.prev');
        this.$next = this.$container.find('.next');
        this.$backdrop = $('<div/>').addClass('k-imgPreview-backdrop').appendTo(document.body);

        this.$elements.css('cursor', 'pointer').each(function (i) {
            var $this = $(this),
                id = 'imgPreview_' + i;
            this.id = id;
            $this.attr('data-index', i);
        });

        this.eventBind();
    };

    /**
     * 事件绑定
     * @return {Void}   
     */
    ImgPreview.prototype.eventBind = function () {
        var self = this;

        this.$elements.on('click', function () {
            var $this = $(this);
            self.index = Number($this.attr('data-index'));
            self.show();
        });

        this.$backdrop.on('click', function () {
            if (self.options.backdropClose) {
                self.hide();
            }
        });

        this.$imgPreview.on('click', '[role=close]', function () {
            //关闭
            self.hide();
        }).on('click', '[role=prev]', function () {
            //向前
            if (self.index === 0) {
                return;
            }
            self.index--;
            self.showControls();
            self.show();
        }).on('click', '[role=next]', function () {
            //向后
            if (self.index >= self.$elements.length - 1) {
                return;
            }
            self.index++;
            self.showControls();
            self.show();
        }).on('mouseenter', function () {
            self.showControls();
        }).on('mouseleave', function () {
            self.$prev.hide();
            self.$next.hide();
        });

        this.$win.on('resize', function () {
            var width = self.$img.attr('data-width'),
                height = self.$img.attr('data-height');
            self.setPosition({width:width,height:height});
        });
    };

    /**
     * 按钮显示
     * @return {Void}   
     */
    ImgPreview.prototype.showControls = function () {
        var len = this.$elements.length;

        if (len === 1) {
            return;
        }

        if (this.index === 0) {
            this.$prev.hide();
            this.$next.show();
        } else if (this.index >= len - 1) {
            this.$prev.show();
            this.$next.hide();
        } else {
            this.$prev.show();
            this.$next.show();
        }
    };

    /**
     * 图片加载
     * @param {String} str - 图片路径
     * @param {Function} callback - 回调函数
     * @return {Void}   
     */
    ImgPreview.prototype.imgLoad = function (src, callback) {
        var img = new Image();

        img.onload = function () {
            callback(true, { width: img.width, height: img.height });
        };
        img.onerror = function () {
            popTips.error('图片加载失败！', 1500);
            callback(false, { width: 0, height: 0 });
        };
        img.src = src;
    };

    /**
     * 获取窗体最大尺寸
     * @return {Object}   
     */
    ImgPreview.prototype.getMaxSize = function () {
        return {
            width: this.$win.width() - 100,
            height: this.$win.height() - 100
        };
    };

    /**
     * 缩放
     * @param {Number} width - 宽度
     * @param {Number} height - 高度
     * @return {Object}   
     */
    ImgPreview.prototype.zoom = function (width, height) {

        var ratio;
        var nW, nh;
        var maxSize = this.getMaxSize();

        if (width < maxSize.width && height < maxSize.height) {
            return { width: width, height: height };
        }

        if (width >= height) {
            ratio = width / height;
            nh = maxSize.width / ratio;
        } else {
            ratio = height / width;
            nh = maxSize.width * ratio;
        }

        nw = maxSize.width;

        if (nh > maxSize.height) {
            nh = maxSize.height;
            nw = width / height * nh;
        }

        return { width: nw, height: nh };
    };

    /**
     * 显示
     * @return {Void}   
     */
    ImgPreview.prototype.show = function () {
        var self = this,
            $img = this.$elements.eq(this.index),
            src;

        if ($img.length === 0) { return; }

        src = $img.attr('data-href') || $img.attr('src');

        if (!src || this.isLoading) { return; }

        this.isLoading = true;

        Loading.show();

        this.imgLoad(src, function (result, size) {
            if (result) {
                self.$img.attr({
                    'src': src,
                    'data-width': size.width,
                    'data-height':size.height
                });
                self.setPosition(size);

                self.$imgPreview.hide().fadeIn(self.options.delay);

                if (self.options.backdrop) {
                    self.$backdrop.fadeIn(self.options.delay);
                }

            } else {
                self.hide();
            }
            Loading.hide();
            self.isLoading = false;
        });
    };

    /**
     * 隐藏
     * @return {Void}   
     */
    ImgPreview.prototype.hide = function () {
        this.$imgPreview.fadeOut(this.options.delay);
        if (this.options.backdrop) {
            this.$backdrop.fadeOut(this.options.delay);
        }
    };

    /**
     * 定位
     * @param {Object} imgSize - 图片尺寸
     * @return {Void}   
     */
    ImgPreview.prototype.setPosition = function (imgSize) {

        var win_w = this.$win.width(),
            win_h = this.$win.height(),
            iw = imgSize.width,
            ih = imgSize.height;

        var size = this.zoom(iw, ih);


        this.$container.css({
            width: size.width,
            height: size.height
        });

        this.$imgPreview.css({
            width: size.width + 20,
            height: size.height + 20,
            marginTop: -((size.height + 20) / 2),
            marginLeft: -((size.width + 20) / 2)
        });

    };

    return ImgPreview;

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
            if (this.getAttribute('hasLoad')=='true') {
                return;
            }
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
            $img.attr('hasLoad', true);
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

    var isShow = false;

    Loading.prototype.init = function () {
        this.$loading = $(this.tpl).appendTo(document.body).hide();
        this.options.top = this.$loading.outerHeight() / 2 + "px";
        this.options.left = this.$loading.outerWidth() / 2 + "px";
        this.spinner = new Spinner(this.options);
    };

    Loading.prototype.show = function () {
        if (isShow) { return; }
        isShow = true;
        this.spinner.spin(this.$loading.get(0));
        this.$loading.fadeIn('fast');
    };

    Loading.prototype.hide = function () {
        var self = this;
        this.$loading.stop().hide();
        this.spinner.stop();
        isShow = false;
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
 * 放大镜模块
 * @date:2015-07-15
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/magnifier', ['jquery', 'kotenei/dragdrop'], function ($, DragDrop) {

    var Magnifier = function ($el, options) {
        this.options = $.extend({}, {
            main: {
                width: 400,
                height: 400
            },
            selector: {
                width: 150,
                height: 150
            }
        }, options);
        this.$el = $el;
        this._isCreate = false;
        this.init();
    };

    Magnifier.prototype.init = function () {
        this.create();
        this.watch();
    };

    Magnifier.prototype.watch = function () {
        var self = this;

        this.$el.on('mousemove', function (e) {
            self.$view.show();
            self.$selector.show();
            self.setPosition(e);
        }).on('mouseleave', function (e) {
            self.$view.hide();
            self.$selector.hide();
        });
    };

    Magnifier.prototype.create = function () {

        this.$imgBox = this.$el.find('.k-magnifier-imgbox').css({
            width: this.options.main.width,
            height: this.options.main.height
        });

        this.$view = $('<div class="k-magnifier-view"><img src="../images/big.jpg" /></div>')
            .appendTo(this.$el);

        this.$viewImg = this.$view.find('img');

        this.$selector = $('<div class="k-magnifier-selector"></div>')
            .appendTo(this.$imgBox)
            .css({ width: this.options.selector.width - 2, height: this.options.selector.height - 2 });
    };

    Magnifier.prototype.setPosition = function (e) {
        var x = e.pageX,
            y = e.pageY,
            left = x - this.$el.offset().left,
            top = y - this.$el.offset().top,
            maxLeft = this.$el.width() - this.options.selector.width,
            maxTop = this.$el.height() - this.options.selector.height,
            percentX, percentY;

        left = left - this.options.selector.width / 2;
        top = top - this.options.selector.height / 2;


        if (left < 0) {
            left = 0;
        } else if (left > maxLeft) {
            left = maxLeft;
        }

        if (top < 0) {
            top = 0;
        } else if (top > maxTop) {
            top = maxTop;
        }

        percentX = left / (this.$el.width() - this.options.selector.width);
        percentY = top / (this.$el.height() - this.options.selector.height);

       
        this.$selector.css({
            left: left,
            top: top
        });

        if (!this.isSet) {
            this.$viewImg.css({
                width: this.$viewImg.width() / this.options.main.width * this.$viewImg.width(),
                height: this.$viewImg.width() / this.options.main.height * this.$viewImg.height()
            });
            this.isSet = true;
        }

        this.$viewImg.css({
            left: -percentX * (this.$viewImg.width()-this.$view.width()) ,
            top: -percentY * (this.$viewImg.height()-this.$view.height())
        })

    };


    return Magnifier;
});

/*
 * 分页模块
 * @date:2014-09-14
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/pager', ['jquery', 'kotenei/event'], function ($, event) {

    /**
     * 分页模块
     * @param {JQuery} $element - dom
     * @param {Object} options - 参数设置
     */
    var Pager = function ($element, options) {
        this.$element = $element;
        this.options = $.extend({}, {
            curPage: 1,
            totalCount: 0,
            pageSize: 20,
            className: 'k-pagination',
        }, options);
        this.canBuild = true;
        this.curPage = this.options.curPage;
        this.totalCount = this.options.totalCount;
        this.pageSize = this.options.pageSize;
        this.template = '<div class="pager-box"></div>';
        this.event = event;
        this.init();

    }

    /**
     * 初始化
     * @return {Void} 
     */
    Pager.prototype.init = function () {
        var self = this;
        this.$pager = $(this.template).appendTo(this.$element);
        this.build();
        this.$pager.on('click', 'li', function () {
            var $this = $(this),
                page = $this.attr('data-page');
            if ($this.hasClass("disabled") || $this.hasClass("active")) { return; }
            self.curPage = parseInt(page);

            self.event.trigger('click.pager', [page]);

            if (self.canBuild) {
                self.build();
            }

        });
    };

    /**
     * 事件绑定
     * @return {Void} 
     */
    Pager.prototype.on = function (name, callback) {
        var self = this;
        this.event.on(name + '.pager', function (args) {
            callback.apply(self, args);
        });
    }

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

        this.$pager.html(html.join(''));

        if (this.totalCount == 0) {
            this.$pager.hide();
        } else {
            this.$pager.show();
        }
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

/*
 * 弹出框模块
 * @date:2014-11-05
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/popover', ['jquery', 'kotenei/tooltips', 'kotenei/util'], function ($, Tooltips, util) {

    /**
     * 弹出框模块
     * @param {JQuery} $element - dom
     * @param {Object} options - 参数
     */
    var Popover = function ($element, options) {
        options = $.extend({}, {
            type:'popover',
            title: '标题',
            tpl: '<div class="k-popover">' +
                       '<div class="k-popover-arrow"></div>' +
                       '<div class="k-popover-title"></div>' +
                       '<div class="k-popover-inner"></div>' +
                   '</div>'
        }, options);
        Tooltips.call(this, $element, options);

        this.setTitle();
    };

    /**
     * 继承tooltips
     * @param {String} title - 标题
     */
    Popover.prototype = util.createProto(Tooltips.prototype);

    /**
     * 设置标题
     * @param {String} title - 标题
     */
    Popover.prototype.setTitle = function (title) {
        title = $.trim(title || this.options.title);
        if (title.length === 0) {
            title = this.$element.attr('data-title') || "";
        }
        var $tips = this.$tips;
        $tips.find('.k-popover-title').text(title);
    };

   
    /**
     * 设置内容
     * @param {String} content - 内容
     */
    Popover.prototype.setContent = function (content) {
        content = $.trim(content || this.options.content);
        if (content.length === 0) {
            content = this.$element.attr('data-content') || "";
        }
        var $tips = this.$tips;
        $tips.find('.k-popover-inner').html(content);
    };


    /**
     * 全局popover
     * @param {JQuery} $elements - dom
     */
    Popover.Global = function ($elements) {
        var $elements = $elements || $('[data-module="popover"]');
        $elements.each(function () {
            var $this = $(this);
            var popover = Popover.Get($this);
            if (!popover) {
                popover = new Popover($this, {
                    title: $this.attr('data-title'),
                    content: $this.attr('data-content'),
                    placement: $this.attr('data-placement'),
                    tipClass: $this.attr('data-tipClass'),
                    trigger: $this.attr('data-trigger')
                });
                Popover.Set($this, popover);
            }
        });
    };

    /**
     * 从缓存获取对象
     * @param {JQuery} $element - dom
     */
    Popover.Get = function ($element) {
        return $element.data("popover");
    };

    /**
     * 设置缓存
     * @param {JQuery} $element - dom
     * @param {Object} popover - 缓存对象
     */
    Popover.Set = function ($element, popover) {
        $element.data("popover", popover);
    };

    return Popover;
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

        if (this.options.scrollContainer) {
            $(this.options.scrollContainer).on('scroll.' + this.options.type, function () {

            });
        }

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

/*
 * 树型表格模块
 * @date:2015-04-29
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/treeTable', ['jquery', 'kotenei'], function ($, Kotenei) {

    //树型表格
    function TreeTable($elm, options) {
        this.$elm = $elm;
        this.options = $.extend({}, {
            expanded: true,
            className: 'k-treeTable',
            url: '',
            params: null,
            column: 0,
            columns: [],
            data: [],
            checkType: { "Y": "ps", "N": "ps" },
        }, options);
        this.init();
    }

    //初始化
    TreeTable.prototype.init = function () {
        var self = this;
        if (this.options.data && this.options.data.length > 0) {
            this.data = this.options.data;
            this.dataInit();
            this.build();
            this.watch();
        } else if (this.options.url && this.options.url.length > 0) {
            Kotenei.ajax.get(this.options.url, this.options.params).done(function (ret) {
                self.data = ret.Data;
                self.dataInit();
                self.build();
                self.watch();
            });
        }
    };

    //事件监控
    TreeTable.prototype.watch = function () {
        var self = this;
        this.$elm.on('click', '.indenter a', function () {
            var id = $(this).attr('data-nodeId'),
                $row = $('#treeRow_' + id),
                children = self.getChildren(self.objData[id]);

            if ($row.hasClass('expanded')) {
                $row.removeClass('expanded').addClass('collapsed');
                self.collapsed(children);
            } else {
                $row.removeClass('collapsed').addClass('expanded');
                self.expanded(children);
            }

            return false;
        }).on('click', 'tbody tr', function () {
            var $row = $(this),
                id = $row.attr('data-nodeId'),
                node = self.objData[id];

            if (!node.enableCheck) {
                return;
            }

            if ($row.hasClass('selected')) {
                $row.removeClass('selected');
                $row.find('td:eq(0)').find('input').prop('checked', false);
                node.checked = false;
                self.check(node, false);
            } else {
                $row.addClass('selected');
                $row.find('td:eq(0)').find('input').prop('checked', true);
                node.checked = true;
                self.check(node, true);
            }
        }).on('click', '[role=checkall]', function () {
            var $el = $(this),
                $rows = self.$elm.find('tbody tr'),
                isChecked = $el.prop('checked');

            for (var i = 0, item; i < self.data.length; i++) {
                item = self.data[i];
                if (item.enableCheck) {
                    item.checked = isChecked;

                    if (isChecked) {
                        $("#treeRow_" + item.nodeId).addClass('selected')
                        $("#treeCheckBox_" + item.nodeId).prop('checked', true);
                    } else {
                        $("#treeRow_" + item.nodeId).removeClass('selected')
                        $("#treeCheckBox_" + item.nodeId).prop('checked', false);
                    }
                }
                self.data[i].checked = isChecked;
            }
        });
    };

    //数据初始化
    TreeTable.prototype.dataInit = function () {
        var data = [];
        var tmpData = this.data;
        this.objData = {};

        function setTreeData(nodes, data) {
            var getChild = function (parentId, items, parentNode, level) {
                for (var i = 0, node; i < nodes.length; i++) {
                    node = nodes[i];
                    if (node.parentId == parentId) {

                        node.hasParent = true;

                        if (node.parentId == 0) {
                            node.isRoot = true;
                            node.level = 1;
                            node.hasParent = false;
                        }

                        if (parentNode) {
                            parentNode.hasChild = true;
                            node.level = parentNode.level + 1 || 1;
                            node.parent = parentNode;

                            if (!$.isArray(parentNode.children)) {
                                parentNode.children = [];
                            }

                            parentNode.children.push(node.nodeId);

                        }

                        items.push(node);

                        getChild(node.nodeId, items, node);
                    }
                }
            };
            getChild(0, data, null, 1);
        }

        setTreeData(this.data, data);

        if (data.length == 0) {
            data = this.data;
        }

        for (var i = 0; i < data.length; i++) {
            this.objData[data[i].nodeId] = data[i];
            if (data[i].enableCheck == null || typeof data[i].enableCheck == 'undefined') {
                data[i].enableCheck = true;
            }
        }

        this.data = data;
    };

    //创建
    TreeTable.prototype.build = function () {
        var html = [], columns = this.options.columns;

        html.push('<table class="' + this.options.className + '">');

        //创建头部
        html.push('<thead>');
        for (var i = 0, column; i < columns.length; i++) {
            column = columns[i];
            if (column.checkbox) {
                html.push('<th style="text-align:' + (column.align ? column.align : 'left') + '">');
                html.push('<input type="checkbox" role="checkall" />');
                html.push('</th>');
            } else {
                html.push('<th style="text-align:' + (column.align ? column.align : 'left') + '">' + column.title + '</th>');
            }
        }
        html.push('</thead>');


        //创建行
        html.push('<tbody>');

        for (var i = 0, item, expanded, display; i < this.data.length; i++) {

            item = this.data[i], expanded = '', display = '';

            if (item.hasChild) {
                if (this.options.expanded) {
                    expanded = 'expanded';
                } else {
                    expanded = 'collapsed';
                    if (!item.isRoot) {
                        display = 'hide';
                    }
                }
            }

            if (!this.options.expanded && item.hasParent && item.parentId > 0) {
                display = 'hide';
            }

            var trSelectClass = '';

            if (this.options.columns[0].checkbox) {
                if (item.checked) {
                    trSelectClass = 'selected';
                }
            }

            html.push('<tr class="' + expanded + ' ' + display + ' ' + trSelectClass + '" id="treeRow_' + item.nodeId + '"  data-parentId="' + item.parentId + '" data-nodeId="' + item.nodeId + '" data-level="' + item.level + '">');


            for (var j = 0,column; j < columns.length; j++) {
                column = columns[j];
                //checkbox
                if (column.checkbox) {
                    var strChecked = '';

                    if (item.checked) {
                        strChecked = ' checked="checked" ';
                    }

                    if (!item.enableCheck) {
                        strChecked += ' disabled="disabled" ';
                    }

                    html.push('<td style="text-align:' + (column.align ? column.align : 'left') + '">');
                    html.push('<input type="checkbox" id="treeCheckBox_' + (item.nodeId) + '" value="' + item[column.field] + '"  ' + strChecked + '  />');
                    html.push('</td>');

                } else {

                    var indenter = '', treeHtml = ''

                    //创建树标签样式
                    if (j == this.options.column) {

                        if (item.hasChild) {

                            indenter = '<span class="indenter" style="padding-left: ' + (item.level > 1 ? item.level * 19 : 0) + 'px;"><a href="#" title="Collapse" data-nodeId="' + item.nodeId + '">&nbsp;</a></span>';

                            treeHtml = '<span class="folder">' + (typeof column.formatter == 'function' ? column.formatter(item[column.field],item) : item[column.field]) + '</span>';

                        } else {

                            indenter = '<span class="indenter" style="padding-left: ' + (item.level > 1 ? item.level * 19 : 0) + 'px;"></span>';

                            treeHtml = '<span class="file">' + (typeof column.formatter == 'function' ? column.formatter(item[column.field],item) : item[column.field]) + '</span>';

                        }

                    }

                    if (typeof column.formatter === 'function') {
                        html.push('<td style="text-align:' + (column.align ? column.align : 'left') + '">');
                        html.push(indenter);
                        html.push(treeHtml.length > 0 ? treeHtml : column.formatter(item[column.field],item));
                        html.push('</td>');
                    } else {
                        html.push('<td style="text-align:' + (column.align ? column.align : 'left') + '">');
                        html.push(indenter);
                        html.push(treeHtml.length > 0 ? treeHtml : item[column.field]);
                        html.push('</td>');
                    }

                }
            }

            html.push('</tr>');
        }


        html.push('</tbody>');
        html.push('</table>');

        this.$elm.html(html.join(''));
    };

    //选择
    TreeTable.prototype.check = function (node,checked) {
        var parents = this.getParents(node);
        var children = this.getChildren(node);
        var brothers = this.getBrothers(node);
        var unChecked = true;
        var $curRow = $('#treeRow_' + node.nodeId),
            $curCheckBox = $('#treeCheckBox_' + node.nodeId);

        if (checked) {
            switch (this.options.checkType.Y.toLowerCase()) {
                case "p":
                    this.checkAction(parents, checked);
                    break;
                case "s":
                    this.checkAction(children, checked);
                    break;
                default:
                    this.checkAction(parents, checked);
                    this.checkAction(children, checked);
                    break;
            }
        } else {
            switch (this.options.checkType.N.toLowerCase()) {
                case "p":
                    uncheckParent.call(this, node, brothers);
                    break;
                case "s":
                    this.checkAction(children, checked);
                    break;
                default:
                    uncheckParent.call(this, node, brothers);
                    this.checkAction(children, checked);
                    break;
            }
        }


        function uncheckParent(curNode, brothers) {
            for (var i = 0; i < brothers.length; i++) {
                if (brothers[i].checked) {
                    unChecked = false;
                    break;
                }
            }

            var parentNode = node.parent;

            if (unChecked && parentNode && parentNode.enableCheck) {
                parentNode.checked = false;
                $('#treeRow_' + parentNode.nodeId).removeClass('selected');
                $('#treeCheckBox_' + parentNode.nodeId).prop('checked', false);
            }

            

            while (parentNode) {

                var siblings = this.getBrothers(parentNode);

                for (var i = 0; i < siblings.length; i++) {
                    if (siblings[i].checked) {
                        unChecked = false;
                        break;
                    }
                }

                if (unChecked && parentNode.enableCheck) {
                    parentNode.checked = false;
                    $('#treeRow_' + parentNode.nodeId).removeClass('selected');
                    $('#treeCheckBox_' + parentNode.nodeId).prop('checked', false);
                    parentNode = parentNode.parent;
                } else {
                    break;
                }
            }
        }

    };

    //复选关联节点操作
    TreeTable.prototype.checkAction = function (nodes, checked) {
        for (var i = 0, node, $row, $checkbox; i < nodes.length; i++) {
            node = nodes[i];
            $checkbox = $('#treeCheckBox_' + node.nodeId);
            $row = $('#treeRow_' + node.nodeId);

            if (node.enableCheck) {
                if (checked) {
                    node.checked = true;
                    $row.addClass('selected');
                    $checkbox.prop('checked', true);
                } else {
                    node.checked = false;
                    $row.removeClass('selected');
                    $checkbox.prop('checked', false);
                }
            }
        }
    };

    //展开
    TreeTable.prototype.expanded = function (nodes) {
        for (var i = 0, child, $child, $parent; i < nodes.length; i++) {
            child = nodes[i];
            $child = $('#treeRow_' + child.nodeId);
            $parent = $('#treeRow_' + child.parentId);

            if ($parent.hasClass('collapsed')) {
                $child.addClass('hide');
            } else {
                $child.removeClass('hide');
            }
        }
    };

    //收起
    TreeTable.prototype.collapsed = function (nodes) {
        for (var i = 0, child, $child, $parent; i < nodes.length; i++) {
            child = nodes[i];
            $child = $('#treeRow_' + child.nodeId);
            $child.addClass('hide');
        }
    };

    //取父结点
    TreeTable.prototype.getParents = function (node) {
        var nodes = [];

        var parent = node.parent;

        while (parent) {
            nodes.push(parent);
            parent = parent.parent;
        }

        return nodes;
    };

    //取同级结点
    TreeTable.prototype.getBrothers = function (node) {
        var nodes = [];
        for (var i = 0, brother; i < this.data.length; i++) {
            brother = this.data[i];
            if (node.parentId == brother.parentId && brother.nodeId != node.nodeId) {
                nodes.push(brother);
            }
        }
        return nodes;
    };

    //取孩子结点
    TreeTable.prototype.getChildren = function (node) {
        var childNodes = [];

        var getChild = function (node, childNodes, objData) {

            if (node.children) {

                for (var i = 0, child; i < node.children.length; i++) {
                    child = objData[node.children[i]];

                    childNodes.push(child);
                    if (child.hasChild) {
                        getChild(child, childNodes, objData);
                    }
                }
            }

        }

        getChild(node, childNodes, this.objData);

        return childNodes;
    };

    //重新加载
    TreeTable.prototype.reload = function () {

    };

    //加载数据
    TreeTable.prototype.loadData = function () {

    };

    return TreeTable;

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
        this.options = $.extend({}, {
            errorClass: 'k-error',
            errorElement: 'label',
            rules: {},
            messages: {},
            tipsPlacement: {},
            focusClear: true,
            keyupClear: true,
            errorPlacement: null,
            showSingleError: false
        }, options);
        this.rules = this.options.rules;
        this.messages = this.options.messages;
        this.tipsPlacement = this.options.tipsPlacement;
        this.init();
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
            if (this.getAttribute('data-rules')) {
                self.metaRules(this);
            }

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
    * 读取html的属性设置的验证规则
    * @param  {Dom} element - dom
    * @return {Void} 
    */
    Validate.prototype.metaRules = function (element) {
        var meta = element.getAttribute('data-rules');
        meta = eval('(' + meta + ')');

        if (!this.rules[element.name]) {
            this.rules[element.name] = meta.rules;
        } else {
            $.extend(meta.rules, this.rules[element.name], true);
            this.rules[element.name] = meta.rules;
        }

        if (!this.messages[element.name]) {
            this.messages[element.name] = meta.messages;
        } else {
            $.extend(meta.messages, this.messages[element.name], true);
            this.messages[element.name] = meta.messages;
        }

        if (!this.tipsPlacement[element.name]) {
            this.tipsPlacement[element.name] = meta.tipsPlacement || { position: 'right', target: element };
        }
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
        var errorList = [];


        for (var item in this.validFields.data) {
            if (!self.validate({ target: this.validFields.data[item][0] })) {
                pass = false;
                errorList.push({
                    $element: $(this.validFields.data[item][0])
                });
            }
        }

        if (this.options.showSingleError && errorList.length > 1) {
            for (var i = 1, element; i < errorList.length; i++) {
                $element = errorList[i].$element;
                this.hideError($element,false);
            }
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
    Validate.prototype.hideError = function ($element, isRemoveClass) {
        if (typeof isRemoveClass === 'undefined') {
            isRemoveClass = true;
        }
        if (this.checkable($element[0])) {
            $element = this.validFields.data[$element[0].name];
        }
        var $error = $element.data('error');
        if (isRemoveClass) {
            $element.removeClass(this.options.errorClass);
        }
        if ($.isFunction(this.options.errorPlacement)) {
            this.options.errorPlacement($element, $([]));
        }
        if (!$error) { return; }
        $error.hide();
    };

    /**
     * 隐藏所有错误
     * @return {Void}        
     */
    Validate.prototype.hideAllError = function () {
        for (var item in this.validFields.data) {
            this.hideError($(this.validFields.data[item][0]));
        }
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
    * 移除验证规则
    * @param  {Dom} element - dom
    * @param  {String} ruleName - 规则名称
    * @return {Void} 
    */
    Validate.prototype.removeRule = function (element, ruleName) {
        if (this.rules[element.name]) {
            if (this.rules[element.name][ruleName]) {
                delete this.rules[element.name][ruleName];
            }
        }
        if (this.messages[element.name]) {
            if (this.messages[element.name][ruleName]) {
                delete this.messages[element.name][ruleName];
            }
        }
    };

    /**
     * 设置验证规则
     * @param  {Dom} element - dom
     * @param  {Object} rule - 规则对象
     * @return {Void} 
     */
    Validate.prototype.setRules = function (element, rule) {
        if (!this.rules[element.name]) {
            this.rules[element.name] = rule.rules;
        } else {
            $.extend(this.rules[element.name], rule.rules, true);
        }

        if (!this.messages[element.name]) {
            this.messages[element.name] = rule.messages;
        } else {
            $.extend(this.messages[element.name], rule.messages, true);
        }
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
            //return this.optional($element) || /^((13[0-9])|(15[^4,\\D])|(18[0|1|2|5-9])|(17[0|7]))\d{8}$/.test(value);
            return this.optional($element) || /^1\d{10}$/.test(value);
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
                var valid = msg === true || String(msg).toLowerCase() === "true";
                if (valid) {
                    self.hideError($element);
                } else {
                    self.showError($element, previous.message);
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
	 * @return {Object}       
	 */
    ValidateTooltips.prototype.getTipsPlacement = function (element) {
        var name = element.name, placement = "right";
        if (!this.tipsPlacement) {
            this.tipsPlacement = this.options.tipsPlacement || {};
        }
        if (!this.tipsPlacement[name]) {
            this.tipsPlacement[name] = { position: 'right', target: element };
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

        var $target;

        if (this.checkable($element[0])) {
            $element = this.validFields.data[$element[0].name];
        }
        var placement = this.getTipsPlacement($element[0]);


        if (placement.target) {
            $target = $(placement.target);
            $element.data('$target', $target);
        } else {
            $target = $element
        }


        var tooltips = Tooltips.Get($target);
        if (!tooltips) {
            tooltips = new Tooltips($target, {
                content: message,
                tipClass: 'danger',
                trigger: 'manual',
                placement: placement.position,
                container: this.options.container || document.body,
                scrollContainer: this.options.scrollContainer
            });
            Tooltips.Set($target, tooltips);
        } else {
            tooltips.setContent(message);
        }
        tooltips.show();
        $target.addClass(this.options.errorClass);
    };

    /**
	 * 隐藏tips错误
	 * @param  {JQuery} $element -dom
	 * @return {Void}  
	 */
    ValidateTooltips.prototype.hideError = function ($element, isRemoveClass) {
        if (typeof isRemoveClass==='undefined') {
            isRemoveClass = true;
        }
        if (this.checkable($element[0])) {
            $element = this.validFields.data[$element[0].name];
        }

        var $target = $element.data('$target');
        if ($target) {
            $element = $target;
        }

        var tooltips = Tooltips.Get($element);
        if (tooltips) {
            tooltips.hide();
        }
        if (isRemoveClass) {
            $element.removeClass(this.options.errorClass);
        }
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
            left: 10,
            margin:20,
            nodeTag: 'li',
            resize: true,
            url: null,
            loaded: $.noop,
            mobilePhone: false,
            pageSize:20
        }, options);

        this.$window = $(window);
        this.$document = $(document);
        this.loading = false;
        this.noMore = false;
        this.page = 1;
        this.init();
    };

    /**
     * 初始化
     * @return {Void}
     */
    Waterfall.prototype.init = function () {
        var self = this;

        if (this.options.mobilePhone) {
            this.options.width = (this.$window.width() - this.options.margin) / 2;
        }

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

        var winWidth=this.$window.width();

        if (this.nodes.length === 0) { return; }

        if (this.options.mobilePhone) {
            this.options.width = (winWidth - this.options.margin) / 2;
        }

        var n = parseInt(winWidth / this.options.width);
        var width = n * this.options.width + (n - 1) * this.options.left;

        if (width > winWidth) {
            n = n - 1;
            width = n * this.options.width + (n - 1) * this.options.left;
        }

        if (width < this.options.width) {
            return;
        }    

        this.$element.width(width);

        if (this.options.mobilePhone) {
            this.nodes.width(this.options.width);
        }

        var len = 0;
        for (var i = 0, node_h, $node; i < this.nodes.length; i++) {
            $node = this.nodes.eq(i);
            node_h = $node.outerHeight();

            //n表示一行有多少个节点，i<n表示第一行开始
            if (i < n) {
                this.arrHeight[i] = node_h;         //记录每个节点的高度
                $node.css({
                    top: 0,                         //第一行每个节点的TOP值都为0
                    left: i * (this.options.width + this.options.left)           //第一行每个节点的left都为当前节点下标与区域宽度的乘积
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

        this.arrHeight[index] += (node_h + this.options.left);  //更新最小值的那个高度，形成新的高度值、
        $node.css({
            top: min_h + this.options.left,
            left: index * (this.options.width + this.options.left)
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
            for (var i = 0; i < this.arrHeight.length; i++) {
                if (this.arrHeight[i] === min_h) {
                    return i;
                }
            }
            return -1;
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
            rnd: Math.random(),
            page: this.page++,
            pageSize:this.options.pageSize
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
define('kotenei/window', ['jquery', 'kotenei/dragdrop', 'kotenei/popTips', 'kotenei/loading'], function ($, DragDrop, popTips, Loading) {

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
            backdropClose: false,
            iframe: false,
            appendTo: document.body,
            showFooter: true,
            btns: []
        }, options);

        this._event = {
            open: $.noop,
            ok: $.noop,
            close: $.noop
        };

        this.loading = false;
        this.template = '<div class="k-window">' +
                            '<h4 class="k-window-header"><span class="k-window-title"></span><span class="k-window-close" role="KWINCLOSE">×</span></h4>' +
                            '<div class="k-window-container"></div>' +
                            '<div class="k-window-footer">' +
                                '<button type="button" class="k-btn k-btn-primary k-window-ok" role="KWINOK">确定</button>' +
                                '<button type="button" class="k-btn k-btn-default k-window-cancel" role="KWINCLOSE">取消</button>' +
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

        if (this.options.iframe) {
            this.$container.css({
                padding: 0,
                overflowY: 'hidden'
            }).append('<iframe frameborder="0" width="100%" src="' + this.options.url + '" scrolling="auto"></iframe>');
            this.$iframe = this.$container.find('iframe');
        } else {
            this.setContent(this.options.content);
        }
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
        this.$win.on('click', '[role=KWINCLOSE]', function () {
            self.close();
        }).on('click', '[role=KWINOK]', function () {
            if (self._event.ok.call(self) !== false) {
                self.close();
            }
        });

        if (this.options.btns && this.options.btns.length > 0) {
            for (var i = 0, item; i < this.options.btns.length; i++) {
                item = this.options.btns[i];
                this.$win.on('click', '[role=' + item.actionCode + ']', function () {
                    item.func.call(self,self.$iframe);
                });
            }
        }

    };

    /**
     * 设置事件回调
     * @param  {String}   type  - 事件名
     * @param  {Function} callback - 回调方法
     * @return {Void}           
     */
    Window.prototype.on = function (type, callback) {
        this._event[type] = callback || $.noop;
        return this;
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
        if (typeof this.options.url !== 'string' || this.options.content != null || this.options.iframe) { return; }
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
        Loading.show();
        $.when(
            this.remote()
        ).done(function () {
            self.$win.show();
            if (self.options.backdrop) { self.$backdrop.show(); }
            self.layout();
            self._event.open(self.$win);

            var z = zIndex.get();
            self.$win.css('zIndex', z);
            self.$backdrop.css('zIndex', --z);
            Loading.hide();
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
        var footerHeight = this.options.showFooter ? this.$footer.height() : 4;
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
        if (this.options.iframe) {
            this.$container.find('iframe').height(containerHeight);
        }
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
        this.$win.appendTo(this.options.appendTo);
        this.$backdrop.appendTo(this.options.appendTo);
        if (!this.options.showFooter) {
            this.$footer.hide();
        }
        if (this.options.btns && this.options.btns.length > 0) {
            this.$footer.find('.k-btn').hide();
            var html = [];
            for (var i = 0,item; i < this.options.btns.length; i++) {
                item = this.options.btns[i];
                html.push('<button type="button" class="k-btn ' + (item.className || "k-btn-primary") + '" role="' + item.actionCode + '">' + item.text + '</button>');

            }
            this.$footer.append(html.join(''));
        }
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
        var win = window.winAlert;
        if (!win) {
            win = new Window({ width: 400, backdropClose: false });
            win.$win.find(".window-cancel").hide();
            window.winAlert = win;
        }
        //var win = new Window({ width: 400, backdropClose: false });
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
        var win = window.winConfirm;

        if (!win) {
            win = new Window({ width: 400, backdropClose: false });
            window.winConfirm = win;
        }
        //var win = new Window({ width: 400, backdropClose: false });
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
    };

    /**
     * 设置缓存对象
     * @param {JQuery} $element  - dom
     * @param {Object} wordLimit - 被缓存的对象
     */
    WordLimit.Set = function ($element, wordLimit) {
        $element.data("wordLimit", wordLimit);
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
;
define("kotenei", ["kotenei/ajax", "kotenei/app", "kotenei/autoComplete", "kotenei/cache", "kotenei/clipZoom", "kotenei/contextMenu", "kotenei/datepicker", "kotenei/dragdrop", "kotenei/dropdown", "kotenei/dropdownDatepicker", "kotenei/event", "kotenei/highlight", "kotenei/imgPreview", "kotenei/infiniteScroll", "kotenei/lazyload", "kotenei/loading", "kotenei/magnifier", "kotenei/pager", "kotenei/placeholder", "kotenei/popover", "kotenei/popTips", "kotenei/router", "kotenei/slider", "kotenei/switch", "kotenei/tooltips", "kotenei/tree", "kotenei/treeTable", "kotenei/util", "kotenei/validate", "kotenei/validateTooltips", "kotenei/waterfall", "kotenei/window", "kotenei/wordLimit"], function(_ajax, _app, _autoComplete, _cache, _clipZoom, _contextMenu, _datepicker, _dragdrop, _dropdown, _dropdownDatepicker, _event, _highlight, _imgPreview, _infiniteScroll, _lazyload, _loading, _magnifier, _pager, _placeholder, _popover, _popTips, _router, _slider, _switch, _tooltips, _tree, _treeTable, _util, _validate, _validateTooltips, _waterfall, _window, _wordLimit){
    return {
        "ajax" : _ajax,
        "App" : _app,
        "AutoComplete" : _autoComplete,
        "cache" : _cache,
        "ClipZoom" : _clipZoom,
        "ContextMenu" : _contextMenu,
        "Datepicker" : _datepicker,
        "Dragdrop" : _dragdrop,
        "Dropdown" : _dropdown,
        "DropdownDatepicker" : _dropdownDatepicker,
        "event" : _event,
        "highlight" : _highlight,
        "ImgPreview" : _imgPreview,
        "InfiniteScroll" : _infiniteScroll,
        "lazyload" : _lazyload,
        "Loading" : _loading,
        "Magnifier" : _magnifier,
        "Pager" : _pager,
        "placeholder" : _placeholder,
        "Popover" : _popover,
        "popTips" : _popTips,
        "Router" : _router,
        "Slider" : _slider,
        "Switch" : _switch,
        "Tooltips" : _tooltips,
        "Tree" : _tree,
        "TreeTable" : _treeTable,
        "Util" : _util,
        "Validate" : _validate,
        "ValidateTooltips" : _validateTooltips,
        "Waterfall" : _waterfall,
        "Window" : _window,
        "WordLimit" : _wordLimit
    };
});