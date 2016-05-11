/*
 * ajax 模块
 * @date:2014-12-05
 * @author:kotenei(kotenei@qq.com)
 */
define('km/ajax', ['jquery', 'km/loading', 'km/popTips', 'km/validate', 'km/validateTooltips'], function ($, Loading, popTips, Validate, ValidateTooltips) {

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

                var config = $.extend(true, {
                    returnUrl: {
                        enable: true,
                        url: location.href
                    },
                    redirectEnable: true,
                    loadingEnable: true,
                    popTips: {
                        enable: true,
                        delay: 600,
                        inCallback: true
                    },
                    ajaxConfig: {}
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

                var ajaxConfig = $.extend(true, {
                    url: url,
                    type: type,
                    data: data,
                    dataType: 'json',
                    traditional: true,
                    cache: false
                }, config.ajaxConfig);

                $.ajax(ajaxConfig).done(function (ret) {

                    if (typeof ret === 'string') {
                        try {
                            ret = eval('(0,' + ret + ')');
                        } catch (e) {
                            dtd.resolve(ret);
                            return dtd.promise();
                        }
                    }

                    ret.Url = $.trim(ret.Url || '');


                    if (ret.Status) {

                        if (ret.Message && config.popTips.enable) {

                            if (config.popTips.inCallback) {
                                popTips.success(ret.Message, config.popTips.delay, function () {
                                    if (config.redirectEnable && ret.Url && ret.Url.length > 0) {
                                        window.location.href = ret.Url;
                                    } else {
                                        dtd.resolve(ret);
                                    }
                                });
                            } else {
                                popTips.success(ret.Message, config.popTips.delay);
                                if (config.redirectEnable && ret.Url && ret.Url.length > 0) {
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

                        if (ret.ErrorMessage && config.popTips.enable) {

                            if (config.popTips.inCallback) {
                                popTips.error(ret.ErrorMessage || "发生了未知错误", config.popTips.delay, function () {
                                    if (ret.Url && ret.Url.length > 0) {
                                        window.location.href = ret.Url;
                                    } else {
                                        dtd.resolve(ret);
                                    }
                                });
                            } else {
                                popTips.error(ret.ErrorMessage || "发生了未知错误", config.popTips.delay);

                                if (config.redirectEnable && ret.Url && ret.Url.length > 0) {
                                    window.location.href = ret.Url;
                                } else {
                                    dtd.resolve(ret);
                                }
                            }

                        } else if (config.redirectEnable && ret.Url && ret.Url.length > 0) {
                            window.location.href = ret.Url;
                        } else {
                            dtd.resolve(ret);
                        }
                    }
                }).fail(function () {
                    if (popTips.enable) {
                        popTips.error("服务器发生错误", config.popTips.delay);
                    }
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

                    if (!$form.valid) {
                        validate = $form.data('validate');
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
define('km/app', ['jquery', 'km/router', 'km/util', 'km/popTips', 'km/loading', 'km/event'], function ($, Router, util, popTips, loading, event) {

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
/*
 * 区域选择器
 * @date:2016-02-25
 * @author:kotenei(kotenei@qq.com)
 */
define('km/areaSelector', ['jquery'], function ($) {
    return function (options) {
        options = $.extend(true, {
            $container: $(document.body),
            zIndex: 9999,
            autoScroll: true,
            autoScrollDealy: 5,
            isDraw: true,
            callback: {
                onStart: $.noop,
                onMove: $.noop,
                onStop: $.noop
            }
        }, options);
        var $container = options.$container;
        var doc = document;
        var $doc = $(doc);
        var $scrollWrap = $container[0].tagName.toLowerCase() == 'body' ? $(window) : $container;
        var coord = { bx: 0, by: 0, mx: 0, my: 0, ex: 0, ey: 0 };
        var containerInfo = {
            left: $container.offset().left,
            top: $container.offset().top,
            width: $container.outerWidth(),
            height: $container.outerHeight()
        };
        var autoScrollActive = false;
        var $range, w_h, d_h;

        $container.off('mousedown.rangeSelector').on('mousedown.rangeSelector', function (e) {
            if (!$range) {
                $range = $('<div class="k-areaSelector"></div>').css('zIndex', options.zIndex).appendTo(doc.body);
            }
            method.start(e);
            //禁止文档选择事件
            doc.onselectstart = function () { return false };
            e.stopPropagation();
            e.preventDefault();
            return false;
        });

        var method = {
            start: function (e) {
                var self = this;
                //获取鼠标位置
                var mouseCoord = this.getMouseCoord(e);
                coord.bx = parseInt(mouseCoord.x);
                coord.by = parseInt(mouseCoord.y);

                w_h = $scrollWrap.height();
                d_h = $doc.height();

                $doc.on('mousemove.rangeSelector', function (e) {
                    self.move(e);
                }).on('mouseup.rangeSelector', function (e) {
                    self.stop(e);
                    $doc.off('mousemove.rangeSelector');
                    $doc.off('mouseup.rangeSelector');
                });
                options.callback.onStart(e, coord);
            },
            move: function (e) {
                var mouseCoord = this.getMouseCoord(e);
                coord.mx = parseInt(mouseCoord.x);
                coord.my = parseInt(mouseCoord.y);

                if (options.isDraw) {
                    this.draw(coord);
                }

                if (options.autoScroll) {
                    if (e.clientY <= 10 || e.clientY >= w_h - 10) {
                        if (e.clientY <= 10 && !autoScrollActive) {
                            autoScrollActive = true;
                            this.scroll(-1, e.clientY);
                        }
                        if (e.clientY >= (w_h - 10) && mouseCoord.y < (d_h + 100) && !autoScrollActive) {
                            autoScrollActive = true;
                            this.scroll(1, e.clientY);
                        }
                    } else {
                        autoScrollActive = false;
                    }
                }

                options.callback.onMove(e, coord);
            },
            stop: function (e) {
                var mouseCoord = this.getMouseCoord(e);
                coord.ex = parseInt(mouseCoord.x);
                coord.ey = parseInt(mouseCoord.y);
                autoScrollActive = false;
                $range.hide();
                options.callback.onStop(e, coord);
            },
            getMouseCoord: function (e) {
                return {
                    x: e.pageX || e.clientX + document.body.scrollLeft - document.body.clientLeft,
                    y: e.pageY || e.clientY + document.body.scrollTop - document.body.clientTop
                };
            },
            scroll: function (direction, yPos) {
                var self = this;
                var scrollTop = $scrollWrap.scrollTop();
                if (direction < 0) {
                    if (scrollTop > 0) {
                        scrollTop -= 5;
                        $scrollWrap.scrollTop(scrollTop);
                    } else {
                        autoScrollActive = false;
                    }
                } else {
                    if (yPos >= (w_h - 10)) {
                        scrollTop += 5;
                        $scrollWrap.scrollTop(scrollTop);
                    } else {
                        autoScrollActive = false;
                    }
                }

                if (autoScrollActive) {
                    this.tm = setTimeout(function () {
                        self.scroll(direction, yPos);
                    }, options.autoScrollDealy);
                } else {
                    if (this.tm) {
                        clearTimeout(this.tm);
                    }
                }
            },
            draw: function (cord) {
                var css = {
                    display: 'block',
                    top: coord.by < coord.my ? coord.by : coord.my,
                    left: coord.bx < coord.mx ? coord.bx : coord.mx,
                    width: Math.abs(coord.mx - coord.bx),
                    height: Math.abs(coord.my - coord.by)
                };

                var a_h = css.top + css.height,
                    a_w = css.left + css.width,
                    c_h = containerInfo.top + containerInfo.height,
                    c_w = containerInfo.left + containerInfo.width;

                if (a_h >= c_h) {
                    css.height = c_h - css.top;
                }

                if (a_w >= c_w) {
                    css.width = c_w - css.left;
                }

                if (css.left <= containerInfo.left) {
                    css.width = css.width - (containerInfo.left - css.left);
                    css.left = containerInfo.left;
                }

                if (css.top <= containerInfo.top) {
                    css.height = css.height - (containerInfo.top - css.top);
                    css.top = containerInfo.top;
                }

                $range.css(css);
            }
        };
    };
});

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
        this.$element.on('keyup.autocomplete', function (e) {
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
            var $el = $(this),
                text = $el.text(),
                index = $el.attr('data-index');

            self.$element.val(text).focus();
            if ($.isFunction(self.options.callback.setValue)) {
                var item = self.getItem(text, index);
                self.options.callback.setValue.call(this, item);
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
            html += '<li class="' + (i == 0 ? "active" : "") + '"  data-index="' + i + '">' + this.highlight(value, data[i]) + '</li>';
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
        if (!this.$list) {
            return;
        }
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
        var $item = this.$listBox.find('li.active'),
            index = $item.attr('data-index'),
            text = $item.text();

        this.$element.val(text);
        this.hide();
        if ($.isFunction(this.options.callback.setValue)) {
            var item = this.getItem(text, index);
            this.options.callback.setValue.call(this, item);
        }
    };

    //根据值获取数据项
    AutoComplete.prototype.getItem = function (value, index) {
        var data = this.cacheData;
        if (!data || data.length === 0) { return; }

        if (index) {
            return data[index];
        }

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

/**
 * 缓存
 * @date :2014-10-11
 * @author kotenei (kotenei@qq.com)
 */
define('km/cache', [], function () {

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
define('km/clipZoom', ['jquery', 'km/dragdrop'], function ($, DragDrop) {

    /**
     * 图片剪裁模块
     * @constructor
     * @alias km/clipZoom
     * @param {JQuery} $element - dom
     * @param {Object} options - 参数设置
     */
    var ClipZoom = function ($element, options) {
        this.$element = $element;
        this.options = $.extend(true, {
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
        this.$container = this.$clipZoomBox.find('.k-container');
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

        this.$element.on('click.clipzoom', '[role="clip"]', function () {
            //裁剪
            self.clip();
        }).on('click.clipzoom', '[role="center"]', function () {
            //居中
            self.center();
        }).on('click.clipzoom', '[role="reset"]', function () {
            //重置
            self.reset();
        }).on('click.clipzoom', '[role="plus"]', function () {
            //放大
            self.zoom(true);
        }).on('click.clipzoom', '[role="minus"]', function () {
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
                    resize: function (e,css) {
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
define('km/contextMenu', ['jquery'], function ($) {

    var items = [], $curTarget;

    var identity = 1;

    var $contextMenu = $('<ul class="k-contextMenu"></ul>').appendTo(document.body);

    $contextMenu.on('click.contextmenu', 'li', function () {
        var $el = $(this),
            action = $el.attr('data-action'),
            item = items[action];


        if (item && typeof item.func === 'function') {
            item.func($curTarget);
        }
    });


    /**
     * 右键菜单模块
     * @constructor
     * @alias km/contextMenu
     * @param {JQuery} $el - dom
     * @param {Object} options - 参数设置
     */
    var ContextMenu = function ($el, options) {
        this.identity = identity++;
        this.$el = $el;
        this.options = $.extend(true, {
            target: '',
            className: 'k-contextMenu',
            items: [],
            callback: {
                onShow: $.noop
            }
        }, options);
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

        this.$el.on('contextmenu.contextmenu', this.options.target, function (e) {

            var left = e.pageX,
                top = e.pageY;

            $contextMenu.hide();

            $curTarget = $(this);

            self.build();

            items = self.items;

            self.tm = setTimeout(function () {
                $contextMenu.css({
                    left: left,
                    top: top,
                    display: 'block'
                });

                self.options.callback.onShow.call(self);

            }, 100);

            return false;
        });


        $(document).on('click.contextmenu.' + this.identity, function () {

            //if (self && self.$el.parent().length == 0) {
            //    $(document.body).off('click.contextmenu.' + self.identity);
            //    self = null;
            //}

            $contextMenu.hide();
            $curTarget = null;
        });
    };

    /**
     * 创建菜单
     * @return {Void}   
     */
    ContextMenu.prototype.build = function () {
        var html = [];
        this.items = {};
        //html.push('<ul class="' + this.options.className + '">');
        for (var i = 0, action; i < this.options.items.length; i++) {

            action = "contextMenu_" + i;

            html.push('<li data-action="'+action+'">' + this.options.items[i].text + '</li>');
            //this.items[this.filterHtml(this.options.items[i].text)] = this.options.items[i];
            this.items[action] = this.options.items[i];
        }
        //html.push('</ul>');
        //this.$contextMenu = $(html.join(''));
        //this.$contextMenu.appendTo(document.body);
        $contextMenu.html(html.join(''));
    };

    /**
     * 过滤html
     * @return {String}   
     */
    ContextMenu.prototype.filterHtml = function (str) {
        return str.replace(/<[^>]*>/ig, '');
    };

    /**
     * 销毁
     * @return {Void}   
     */
    ContextMenu.Destory = function () {
        $contextMenu.remove();
    }


    return function ($elms, settings) {

        $elms = $elms || $('[data-module=contextmenu]');

        $elms.each(function () {
            var $el = $(this),
                options = $el.attr('data-options'),
                data =$.data($el[0], 'contextMenu');

            if (!data) {

                if (options && options.length > 0) {
                    options = eval('(0,' + options + ')');
                } else {
                    options = settings;
                }

                data = new ContextMenu($el, options);

                $.data($el[0], 'contextMenu', data);
            }

        });
    };

    return ContextMenu;

});

/**
 * 日期模块
 * @date :2014-10-31
 * @author kotenei (kotenei@qq.com)
 */
define('km/datePicker', ['jquery'], function ($) {

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
        this.options = $.extend(true, {
            position: 'left',
            desktop: false,
            data: [],
            appendTo: $(document.body),
            showTime: false,
            year: { min: date.getFullYear() - 100, max: date.getFullYear() + 100 },
            format: 'yyyy-MM-dd',
            inputGroup: '.k-input-group',
            positionProxy: function () {
                return self.getPosition();
            },
            minDate: null,
            maxDate: null,
            zIndex: 2000
        }, options);

        this.isInput = this.$element[0].tagName.toLowerCase() == 'input';
        this.year = date.getFullYear();
        this.month = date.getMonth() + 1;
        this.day = date.getDate();
        this.index = 0;
        this.isSetTime = false;
        this.selectDay = false;
        this.event = {
            selected: [],
            clean: [],
            change: []
        };
        this.init();

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

        this.$groupBox = this.$element.parent(this.options.inputGroup);

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

        this.$groupBox.on('click.datepicker', 'button', function () {
            self.show();
            return false;
        });

        this.$element.on('click.datepicker', function () {
            if (self.options.desktop) {
                return;
            }
            self.show();
            return false;
        });

        this.$datepicker.on('click.datepicker', function (e) {
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
        }).on('click.datepicker', '[role=prev]', function () {
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
        }).on('click.datepicker', '[role=next]', function () {
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
        }).on('click.datepicker', '#month', function () {
            //点击月份
            self.monthBoxToggle(true);
            self.yearBoxToggle(false);
            self.timePanelHide();
        }).on('click.datepicker', '.month-box li', function () {
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
        }).on('click.datepicker', '#year', function () {
            //点击年份
            self.yearBoxToggle(true);
            self.monthBoxToggle(false);
            self.timePanelHide();
        }).on('click.datepicker', '.year-box li', function () {
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
        }).on('click.datepicker', '[role=yearPrev]', function () {
            //向前选择年份
            if (self.index === 0) {
                return;
            }
            self.index--;
            self.toCurYearPanel();

        }).on('click.datepicker', '[role=yearNext]', function () {
            //向后选择年份
            if (self.index === self.$yearItems.length - 1) {
                return;
            }
            self.index++;
            self.toCurYearPanel();
        }).on('click.datepicker', '[role=clear]', function () {
            //清空
            if (self.isInput) {
                self.$element.val('');
            }
            else {
                $.data(self.$element[0], 'value', '');
            }
            self.isSetTime = false;
            self.setTodayInfo();
            self.createDays();
            self.setViewInfo();
            self.hide();

            $.map(self.event.clean, function (v) {
                v();
            });

        }).on('click.datepicker', '[role=today]', function () {
            //今天
            self.setTodayInfo();
            self.createDays();
            self.hide();
            self.set(true);
            self.setTime();
        }).on('click.datepicker', 'tbody td', function () {
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

        }).on('click.datepicker', 'span.hours', function () {
            //点击小时
            self.setTimePanelPosition($(this), self.$hoursBox);
            return false;
        }).on('click.datepicker', 'span.minutes', function () {
            //点击分种
            self.setTimePanelPosition($(this), self.$minutesBox);
            return false;
        }).on('click.datepicker', 'span.seconds', function () {
            //点击秒
            self.setTimePanelPosition($(this), self.$secondsBox);
            return false;
        }).on('click.datepicker', '.time-box li', function () {
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
        }).on('click.datepicker', '[role=confirm]', function () {
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

        html.push('<div class="k-datepicker k-pop-panel"  data-desktop="' + (this.options.desktop ? "true" : "") + '" >');
        html.push('<div class="k-container">');
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
            value = $.trim($.data(this.$element[0], 'value'));
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

        $('div.k-pop-panel,ul.k-pop-panel').each(function () {
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
     * 设置日期
     * @return {Void}
     */
    DatePicker.prototype.setValue = function (dateText) {
        if (!dateText) {
            return;
        }
        if (this.isInput) {
            this.$element.val(dateText);
        }
        else {
            $.data(this.$element[0], 'value', dateText);
        }
    };

    /**
     * 获取日期
     * @return {Void}
     */
    DatePicker.prototype.getValue = function () {
        if (this.isInput) {
            return this.$element.val();
        }
        else {
            return $.data(this.$element[0], 'value');
        }
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
    };


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
                options = $this.attr('data-options'),
                format = $this.attr('data-format'),
                showTime = $this.attr('data-showTime'),
                minDate = $this.attr('data-minDate'),
                maxDate = $this.attr('data-maxDate'),
                position = $this.attr('data-position'),
                appendTo = $this.attr('data-appendTo'),
                onSelected = $this.attr('data-onselected'),
                onClean = $this.attr('data-onclean');

            var data = $.data($this[0], 'datepicker');


            if (!data) {

                showTime = showTime ? showTime === "true" : false;
                onSelected = onSelected && onSelected.length > 0 ? eval('(0,' + onSelected + ')') : null;
                onClean = onClean && onClean.length > 0 ? eval('(0,' + onClean + ')') : null;


                if (options && options.length > 0) {
                    options = eval('(0,' + options + ')');
                } else {
                    options = {
                        format: format,
                        showTime: showTime,
                        minDate: minDate,
                        maxDate: maxDate,
                        position: position || 'left',
                        appendTo: $(appendTo || document.body)
                    };
                }

                data = new DatePicker($this, options);

                if (onSelected) {
                    data.on('selected', onSelected);
                }

                if (onClean) {
                    data.on('clean', onClean);
                }

                $.data($this[0], 'datepicker', data);
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
define('km/dragdrop', ['jquery'], function ($) {

    var zIndex = 1000,
        droppables = [],
        dropMethod = {
            start: function () {
                if (droppables.length == 0) {
                    return;
                }

                for (var i = 0; i < droppables.length; i++) {
                    droppables[i].setInfo();
                }
            },
            move: function (e, moveCoord) {


                if (droppables.length == 0) {
                    return;
                }

                var left, top, width, height;

                for (var i = droppables.length - 1, droppable; i >= 0; i--) {

                    droppable = droppables[i];

                    left = droppable.info.offset.left - this.$range.offset().left;
                    top = droppable.info.offset.top - this.$range.offset().top;
                    width = droppable.info.width;
                    height = droppable.info.height;


                    if (left <= moveCoord.x + this.dragParms.width / 2
                        && top <= moveCoord.y + this.dragParms.height / 2
                        && left + width >= moveCoord.x + this.dragParms.width / 2
                        && top + height >= moveCoord.y + this.dragParms.height / 2) {


                        if (this.overDrop != droppable) {

                            if (this.overDrop) {
                                this.overDrop.out(this.$layer, moveCoord);
                            }

                            this.overDrop = droppable;
                            this.overDrop.over(this.$layer, moveCoord);
                        }
                        break;
                    } else {
                        if (this.overDrop && this.overDrop == droppable) {
                            this.overDrop.out(this.$layer, moveCoord);
                            this.overDrop = null;
                        }
                    }
                }
            },
            drop: function (e, moveCoord) {


                if (droppables.length == 0) {
                    return;
                }

                var left, top, width, height;


                for (var i = droppables.length - 1, droppable; i >= 0; i--) {

                    droppable = droppables[i];

                    left = droppable.info.offset.left - this.$range.offset().left;
                    top = droppable.info.offset.top - this.$range.offset().top;
                    width = droppable.info.width;
                    height = droppable.info.height;

                    if (left <= moveCoord.x + this.dragParms.width / 2
                        && top <= moveCoord.y + this.dragParms.height / 2
                        && left + width >= moveCoord.x + this.dragParms.width / 2
                        && top + height >= moveCoord.y + this.dragParms.height / 2) {

                        droppable.drop(this.$layer, moveCoord);

                        break;
                    }
                }
            }
        },
        util = {
            getPosition: function ($cur, $target) {

                var curOffset = $cur.offset(),
                    targetOffset = $target.offset();

                return {
                    left: curOffset.left - targetOffset.left,
                    top: curOffset.top - targetOffset.top,
                    offsetLeft: curOffset.left,
                    offsetTop: curOffset.top
                };
            },
            getOffsetParent: function ($cur, $target) {
                var isRoot = true;
                var $parent = $cur.parent();

                var info = {
                    isRoot: false,
                    left: 0,
                    top: 0,
                    pLeft: 0,
                    pTop: 0,
                    $el: null
                };

                var offset, position;


                while ($parent[0] != $target[0]) {
                    position = $parent.css('position');

                    if (position == 'relative' || position == 'absolute') {
                        info.left = $parent.offset().left;
                        info.top = $parent.offset().top;
                        info.pLeft = info.left - $target.offset().left + util.getNum($cur.css('marginLeft'));
                        info.pTop = info.top - $target.offset().top + util.getNum($cur.css('marginTop'));
                        info.$el = $parent;
                        info.isRoot = true;

                        return info;
                    }
                    $parent = $parent.parent();
                }

                return info;
            },
            getNum: function (val) {
                var ret = parseInt(val);

                if (isNaN(ret)) {
                    return 0;
                }

                return ret;
            }
        };

    /**
     * 拖放模块
     * @constructor
     * @alias km/dragdrop
     * @param {Object} options - 参数设置
     */
    var DragDrop = function (options) {

        this.options = $.extend(true, {
            $layer: null,
            $handle: null,
            $range: null,
            $scrollWrap: null,
            direction: '',          // h:水平  v:垂直
            resizable: false,       //是否可拖放
            scale: false,           //是否按比例缩放
            boundary: false,        //是否可移出边界
            sortable: false,        //是否可排序
            minWidth: 100,
            autoScroll: true,
            autoScrollDealy: 5,
            zIndex: {
                increase: false
            },
            callback: {
                start: $.noop,
                move: $.noop,
                stop: $.noop,
                resize: $.noop
            }
        }, options);

        this._event = {
            start: $.noop,
            move: $.noop,
            stop: $.noop,
            resize: $.noop
        };

        this.$window = $(window);
        this.$document = $(document);
        this.$body = $(document.body);

        this.$layer = this.options.$layer;
        this.$handle = this.options.$handle && this.options.$handle.length > 0 ? this.options.$handle : this.options.$layer;
        this.$range = this.options.$range;

        this.$scrollWrap = this.options.$scrollWrap || this.$window;

        this.autoScrollActive = false;
        this.tm = null;

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

        this.$handle.css('cursor', 'move');

        if (!this.options.sortable) {
            this.$layer.css({ position: 'absolute', zIndex: zIndex });
        } else {
            this.$layer.css({});
        }

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

    };

    /**
     * 事件监控
     * @return {Void} 
     */
    DragDrop.prototype.eventBind = function () {
        var self = this;

        this.$handle.off('mousedown.dragdrop').on('mousedown.dragdrop', function (e) {

            if (self.options.zIndex.increase) {
                zIndex++;
            }

            self.dragParms = {
                left: parseInt(self.$layer.position().left),
                top: parseInt(self.$layer.position().top),
                //width: parseInt(self.$layer.outerWidth()) + util.getNum(self.$layer.css('borderLeftWidth')) + util.getNum(self.$layer.css('borderRightWidth')),
                //height: parseInt(self.$layer.outerHeight()) + util.getNum(self.$layer.css('borderTopWidth')) + util.getNum(self.$layer.css('borderBottomWidth'))
                width: self.$layer.outerWidth(),
                height: self.$layer.outerHeight()
            };



            self.$layer.css({
                zIndex: zIndex,
                width: self.dragParms.width
            });

            e.stopPropagation();
            e.preventDefault();
            self.start(e);
            //禁止文档选择事件
            document.onselectstart = function () { return false };
            return false;
        }).on('mousedown.dragdrop', '.k-resizable', function () {
            self.isResize = true;
            self.resizeParams.type = $(this).attr("data-type");
            self.resizeParams.left = parseInt(self.$layer.position().left);
            self.resizeParams.top = parseInt(self.$layer.position().top);
            self.resizeParams.width = parseInt(self.$layer.outerWidth());
            self.resizeParams.height = parseInt(self.$layer.outerHeight());
            self.resizeParams.ratio = self.resizeParams.width >= self.resizeParams.height ? self.resizeParams.width / self.resizeParams.height : self.resizeParams.height / self.resizeParams.width;

        });
    };

    /**
    * 添加事件
    * @return {Void} 
    */
    DragDrop.prototype.on = function (type, callback) {
        this._event[type] = callback || $.noop;
        return this;
    };

    /**
     * 开始拖动
     * @param  {Object} e - 事件
     * @return {Boolean}  
     */
    DragDrop.prototype.start = function (e) {
        var self = this;

        this.isMoving = true;

        this.winHeight = this.$scrollWrap.height();
        this.docHeight = this.$document.height();

        //给文档绑定事件
        this.$document.on('mousemove.dragdrop', function (e) {
            if (self.isMoving) {
                if (self.isResize) {
                    self.resize(e);
                }
                else {
                    self.move(e);
                }
            }
            return false;
        }).on('mouseup.dragdrop', function (e) {
            self.stop(e);
            self.$document.off('mousemove.dragdrop');
            self.$document.off('mouseup.dragdrop');
            return false;
        });

        //获取鼠标位置
        var mouseCoord = this.getMouseCoord(e);

        var position = util.getPosition(this.$layer, this.$range ? this.$range : this.$body);

        //记录鼠标在拖动层的坐标位置
        this.offset.x = mouseCoord.x - position.left;
        this.offset.y = mouseCoord.y - position.top;

        this.offset.click = {
            left: mouseCoord.x - position.offsetLeft,
            top: mouseCoord.y - position.offsetTop
        };

        this.offset.parent = util.getOffsetParent(this.$layer, this.$range ? this.$range : this.$body);

        //记录鼠标点击后的坐标
        this.originalCoord.x = mouseCoord.x;
        this.originalCoord.y = mouseCoord.y;

        this.moveCoord = { x: 0, y: 0 };

        //捕捉鼠标的作用范围，防止鼠标移动过快丢失
        if (this.$handle[0].setCapture) {
            this.$handle[0].setCapture();
        }


        dropMethod.start.call(this, e);

        //开始拖动回调函数
        if ($.isFunction(this.options.callback.start)) {
            this.options.callback.start.call(this, e, this.$layer);
        }

        this._event.start.call(this, e);

        return false;

    };

    /**
     * 移动中
     * @param  {Object} e -事件
     * @return {Void}   
     */
    DragDrop.prototype.move = function (e) {

        var self = this;

        var $range = this.$range;

        var boundary = { right: 0, bottom: 0 };

        var mouseCoord = this.getMouseCoord(e);

        var moveCoord = {
            x: mouseCoord.x - this.offset.x,
            y: mouseCoord.y - this.offset.y
        };

        if (this.options.autoScroll) {


            if (e.clientY <= 10 || e.clientY >= this.winHeight - 10) {

                if (e.clientY <= 10 && !this.autoScrollActive) {
                    this.autoScrollActive = true;
                    this.autoScroll(-1, e.clientY);
                }

                if (e.clientY >= (this.winHeight - 10) && mouseCoord.y < (this.docHeight + 100) && !this.autoScrollActive) {

                    this.autoScrollActive = true;
                    this.autoScroll(1, e.clientY);
                }

            } else {
                this.autoScrollActive = false;
            }
        }

        if (this.options.sortable) {
            if (!this.$placeholder) {
                this.$placeholder = $('<div/>');
                this.$placeholder.attr('class', this.$layer.attr('class')).addClass('k-sortable-placeholder').css({
                    opacity: '0.5',
                    height: this.dragParms.height,
                    //width: this.dragParms.width,
                    background: 'white'
                }).insertAfter(this.$layer);
            }
            this.$layer.css({
                position: 'absolute'
            });
        }

        var position = {
            left: mouseCoord.x - this.offset.click.left - this.offset.parent.left,
            top: mouseCoord.y - this.offset.click.top - this.offset.parent.top
        };

        if ($range) {
            //元素范围内移动
            boundary.right = parseInt($range.outerWidth() - util.getNum(this.$range.css('borderLeftWidth')) - util.getNum(this.$range.css('borderRightWidth')) - this.$layer.outerWidth());
            boundary.bottom = parseInt($range.outerHeight() - util.getNum(this.$range.css('borderTopWidth')) - util.getNum(this.$range.css('borderBottomWidth')) - this.$layer.outerHeight());


            if (!this.options.boundary) {
                this.setMoveCoord(moveCoord, boundary, position);
            }

        } else {
            //窗体内移动
            boundary.right = parseInt(this.$window.width() - this.$layer.outerWidth() + this.$document.scrollLeft());
            boundary.bottom = parseInt(this.$window.height() - this.$layer.outerHeight() + this.$document.scrollTop());
            this.setMoveCoord(moveCoord, boundary, position);
        }

        this.moveCoord = moveCoord;

        this.setPosition(moveCoord, position);

        dropMethod.move.call(this, e, moveCoord);

        if ($.isFunction(this.options.callback.move)) {
            this.options.callback.move.call(this, e, moveCoord);
        }

        this._event.move.call(this, e, moveCoord, position);
    };

    /**
     * 设置移动时的坐标定位
     * @param  {object} moveCoord - 坐标 
     * @param  {object} boundary - 边界
     * @return {objet}  position - 定位
     */
    DragDrop.prototype.setMoveCoord = function (moveCoord, boundary, position) {

        if (moveCoord.x < 0) {

            moveCoord.x = 0;

            if (this.offset.parent.isRoot) {
                position.left = -this.offset.parent.pLeft;
            }

        }

        if (moveCoord.y < 0) {

            moveCoord.y = 0;

            if (this.offset.parent.isRoot) {
                position.top = -this.offset.parent.pTop;
            }
        }

        if (moveCoord.x > boundary.right) {

            moveCoord.x = boundary.right;

            if (this.offset.parent.isRoot) {
                position.left = parseInt(moveCoord.x - this.offset.parent.pLeft);
            }
        }

        if (moveCoord.y > boundary.bottom) {

            moveCoord.y = boundary.bottom;

            if (this.offset.parent.isRoot) {
                position.top = parseInt(moveCoord.y - this.offset.parent.pTop);
            }
        }
    };

    /**
     * 自动滚动滚动条
     * @param  {Int} direction -方向 
     * @param  {Int} yPos - 鼠标移动时的y值
     * @return {Void}   
     */
    DragDrop.prototype.autoScroll = function (direction, yPos) {
        var self = this;

        var scrollTop = this.$scrollWrap.scrollTop();

        if (direction < 0) {
            if (scrollTop > 0) {
                scrollTop -= 5;
                this.$scrollWrap.scrollTop(scrollTop);
            } else {
                this.autoScrollActive = false;
            }
        } else {
            if (yPos >= (this.winHeight - 10)) {
                scrollTop += 5;
                this.$scrollWrap.scrollTop(scrollTop);
            } else {
                this.autoScrollActive = false;
            }
        }

        if (this.autoScrollActive) {
            this.tm = setTimeout(function () {
                self.autoScroll(direction, yPos);
            }, this.options.autoScrollDealy);
        } else {
            if (this.tm) {
                clearTimeout(this.tm);
            }
        }
    };

    /**
     * 停止拖动
     * @param  {Object} e -事件
     * @return {Void}   
     */
    DragDrop.prototype.stop = function (e) {
        this.isMoving = false;
        this.isResize = false;
        this.autoScrollActive = false;

        if (this.$handle[0].releaseCapture) {
            this.$handle[0].releaseCapture();
        }

        if (this.options.sortable && this.$placeholder) {
            this.$layer.insertAfter(this.$placeholder).css('position', 'static');
            this.$placeholder.remove();
            this.$placeholder = null;
        }

        dropMethod.drop.call(this, e, this.moveCoord);


        if ($.isFunction(this.options.callback.stop)) {
            this.options.callback.stop.call(this, e, this.$layer);
        }

        this._event.stop.call(this, e);
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
            rw = $range.outerWidth();
            rh = $range.outerHeight();
        } else {
            rw = this.$window.width() + this.$document.scrollLeft();
            rh = this.$window.height() + this.$document.scrollTop();
        }


        switch (this.resizeParams.type) {
            case "topLeft":

                css.width = resizeParams.width + (resizeParams.left - (this.offset.parent.isRoot ? mouseCoord.x - this.offset.click.left - this.offset.parent.left : moveCoord.x));
                css.width = css.width < this.minWidth ? this.minWidth : css.width;
                css.height = this.getScaleHeight(css.width);

                css.top = resizeParams.top - (css.height - resizeParams.height);
                css.left = resizeParams.left - (css.width - resizeParams.width);

                if (css.left <= -this.offset.parent.pLeft) {
                    css.left = -this.offset.parent.pLeft;
                    css.width = resizeParams.width + this.offset.parent.pLeft + resizeParams.left;
                    css.height = this.getScaleHeight(css.width);
                    css.top = resizeParams.top - (css.height - resizeParams.height);
                }

                if (css.top <= -this.offset.parent.pTop) {
                    css.top = -this.offset.parent.pTop;
                    css.height = resizeParams.height + this.offset.parent.pTop + resizeParams.top;
                    css.width = this.getScaleWidth(css.height);
                    css.left = resizeParams.left - (css.width - resizeParams.width);
                }

                break;
            case "topRight":
                css.left = resizeParams.left;
                css.width = resizeParams.width - (this.originalCoord.x - mouseCoord.x);
                css.width = css.width < this.minWidth ? this.minWidth : css.width;
                css.height = this.getScaleHeight(css.width);


                if ((css.width + this.offset.parent.pLeft + css.left) >= rw) {
                    css.width = rw - this.offset.parent.pLeft - css.left;
                    css.height = this.getScaleHeight(css.width);
                }

                css.top = resizeParams.top - (css.height - resizeParams.height);

                if (css.top <= -this.offset.parent.pTop) {
                    css.top = -this.offset.parent.pTop;
                    css.height = resizeParams.height + this.offset.parent.pTop + resizeParams.top;
                    css.width = this.getScaleWidth(css.height);
                }

                break;
            case "leftCenter":
                css.top = resizeParams.top;
                css.height = resizeParams.height;

                if (moveCoord.x <= 0) {
                    css.left = -this.offset.parent.pLeft;
                    css.width = resizeParams.width + this.offset.parent.pLeft + resizeParams.left;
                } else {
                    css.left = this.offset.parent.isRoot ? mouseCoord.x - this.offset.click.left - this.offset.parent.left : moveCoord.x;
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


                if ((css.width + this.offset.parent.pLeft + css.left) >= rw) {
                    css.width = rw - this.offset.parent.pLeft - css.left;
                }
                if (css.width <= this.minWidth) {
                    css.width = this.minWidth;
                }
                break;
            case "topCenter":
                css.top = this.offset.parent.isRoot ? mouseCoord.y - this.offset.click.top - this.offset.parent.top : moveCoord.y;
                css.left = resizeParams.left;
                css.width = resizeParams.width;
                css.height = resizeParams.height + (this.originalCoord.y - mouseCoord.y);

                if (css.top < -this.offset.parent.pTop) {
                    css.top = -this.offset.parent.pTop;
                    css.height = resizeParams.height + this.offset.parent.pTop + resizeParams.top;
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

                if ((css.height + this.offset.parent.pTop + css.top) >= rh) {
                    css.height = rh - this.offset.parent.pTop - css.top;
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


                if (css.left <= -this.offset.parent.pLeft) {
                    css.left = -this.offset.parent.pLeft;
                    css.width = resizeParams.width + this.offset.parent.pLeft + resizeParams.left;
                    css.height = this.getScaleHeight(css.width);
                }

                if ((css.height + this.offset.parent.pTop + css.top) >= rh) {
                    css.height = rh - this.offset.parent.pTop - css.top;
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


                if ((css.width + this.offset.parent.pLeft + css.left) >= rw) {
                    css.width = rw - this.offset.parent.pLeft - css.left;
                    css.height = this.getScaleHeight(css.width);
                }

                if ((css.height + this.offset.parent.pTop + css.top) >= rh) {
                    css.height = rh - this.offset.parent.pTop - css.top;
                    css.width = this.getScaleWidth(css.height);
                }

                break;
            default:
                break;
        }

        this.$layer.css(css);

        if ($.isFunction(this.options.callback.resize)) {
            this.options.callback.resize.call(this, e, css);
        }

        this._event.resize.call(this, e, css);
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
    DragDrop.prototype.setPosition = function (moveCoord, position) {

        var left, top;

        if (this.options.direction === 'h') {
            this.$layer.css('left', this.offset.parent.isRoot ? position.left : moveCoord.x);
        } else if (this.options.direction === 'v') {
            this.$layer.css('top', this.offset.parent.isRoot ? position.top : moveCoord.y);
        } else {

            left = this.offset.parent.isRoot ? position.left : moveCoord.x - util.getNum(this.$layer.css('marginLeft'));
            top = this.offset.parent.isRoot ? position.top : moveCoord.y - util.getNum(this.$layer.css('marginTop'));

            this.$layer.css({
                left: left,
                top: top
            });

        }
    };

    /**
    * 销毁
    * @return {Void} 
    */
    DragDrop.prototype.destory = function () {
        this._event = {
            start: $.noop,
            move: $.noop,
            stop: $.noop,
            resize: $.noop
        };
        this.$handle.css('cursor', 'default').off('mousedown.dragdrop');
        this.$layer.css('cursor', 'default').find('.k-resizable').remove();
    };

    /**
     * droppable
     * @param {Dom} $elms - jquery对象
     * @param {Object} options - 设置
     */
    DragDrop.droppable = function ($elms, options) {

        var Droppable = function ($el, options) {
            this.$drop = $el;
            this.options = $.extend(true, {
                overClass: 'droppable-over',
                callback: {
                    over: $.noop,
                    out: $.noop,
                    drop: $.noop
                }
            }, options);



            this.setInfo();
        };

        /**
         * 设置放置区相关信息
         * @return {Void}   
         */
        Droppable.prototype.setInfo = function () {

            var offset = this.$drop.offset(),
                position = this.$drop.position();

            this.info = {
                width: this.$drop.outerWidth() + util.getNum(this.$drop.css('borderLeftWidth')) + util.getNum(this.$drop.css('borderRightWidth')),
                height: this.$drop.outerHeight() + util.getNum(this.$drop.css('borderTopWidth')) + util.getNum(this.$drop.css('borderBottomWidth')),
                offset: { left: offset.left, top: offset.top },
                position: { left: position.left, top: position.left }
            };
        };

        /**
         * 滑动时的函数
         * @param  {Dom} $drag -被拖动的对象
         * @param  {Object} moveCoord - 鼠标的坐标
         * @return {Void}   
         */
        Droppable.prototype.over = function ($drag, moveCoord) {
            this.$drop.addClass(this.options.overClass);
            this.options.callback.over.call(this, $drag, moveCoord);
        };

        /**
         * 移出时的函数
         * @param  {Dom} $drag -被拖动的对象
         * @param  {Object} moveCoord - 鼠标的坐标
         * @return {Void}   
         */
        Droppable.prototype.out = function ($drag, moveCoord) {
            this.$drop.removeClass(this.options.overClass);
            this.options.callback.out.call(this, $drag, moveCoord);
        };


        /**
         * 放置时的函数
         * @param  {Dom} $drag -被拖动的对象
         * @param  {Object} moveCoord - 鼠标的坐标
         * @return {Void}   
         */
        Droppable.prototype.drop = function ($drag, moveCoord) {
            this.options.callback.drop.call(this, $drag, moveCoord);
        };

        $elms = $elms || $('[data-module=droppable]');

        $elms.each(function () {
            var $el = $(this),
                data = $.data($el[0], 'droppable');

            if (!data) {
                data = new Droppable($el, options);
                $.data($el[0], 'droppable', data);
                droppables.push(data);
            }
        });
    };

    /**
     * sortable
     * @param {Dom} $container - jquery对象
     * @param {Object} options - 设置
     */
    DragDrop.sortable = function ($container, options) {

        var groups = [],
            sortables = [],
            hasSwap = false,
            $groups,
            method;

        var method = {
            _getInfo: function ($elm) {
                var offset = $elm.offset(),
                    position = $elm.position(),
                    width = $elm.outerWidth(),
                    height = $elm.outerHeight();

                return {
                    offset: {
                        left: offset.left,
                        top: offset.top
                    },
                    position: {
                        left: position.left,
                        top: position.top
                    },
                    width: width,
                    height: height,
                    h_half: offset.left + width / 2,        //水平
                    v_half: offset.top + height / 2         //垂直
                };
            },
            _setGroupInfo: function (groups) {

                if (!groups || groups.length == 0) {
                    return;
                }


                var draggableInfo,
                    droppableInfo;

                for (var i = 0, group; i < groups.length; i++) {

                    draggableInfo = [];
                    droppableInfo = [];

                    group = groups[i];

                    group.offset = {
                        left: group.$group.offset().left,
                        top: group.$group.offset().top,
                        width: group.$group.outerWidth() + util.getNum(group.$group.css('borderLeftWidth')) + util.getNum(group.$group.css('borderRightWidth')),
                        height: group.$group.outerHeight() + util.getNum(group.$group.css('borderTopWidth')) + util.getNum(group.$group.css('borderBottomWidth'))
                    };

                    

                    group.$draggable = group.$group.find(options.draggable).each(function () {
                        var $drag = $(this),
                            info = method._getInfo($drag);

                        info.$drag = $drag;
                        draggableInfo.push(info);
                    });


                    group.$droppable = group.$group.find(options.droppable).each(function () {
                        var $drop = $(this),
                            info = method._getInfo($drop);

                        info.$drop = $drop;
                        droppableInfo.push(info);
                    });

                    group.draggableInfo = draggableInfo;

                    group.droppableInfo = droppableInfo;

                }
            },
            _setSortableInfo: function (resetSortNum) {

                for (var i = 0, sortable; i < sortables.length; i++) {

                    sortable = sortables[i];

                    if (resetSortNum) {
                        sortable.sortNum = i;
                    }

                    sortable.info = method._getInfo(sortable.$layer);
                }



            }
        };

        options = $.extend(true, {
            $scrollWrap: null,
            draggable: '.k-draggable',
            droppable: '.k-droppable',
            group: '.k-sortable-group',
            handle: null,
            boundary: false,
            model: 'default',
            direction: '',
            callback: {
                init: $.noop,
                start: $.noop,
                move: $.noop,
                stop: $.noop
            }
        }, options);

        $groups = $container.find(options.group);

        if ($groups.length == 0) {
            $groups = $container;
        }

        $groups.each(function () {

            var $group = $(this),
                $draggable = $group.find(options.draggable),
                $droppable = $group.find(options.droppable);

            $draggable.each(function () {

                var $el = $(this),
                    $handle = $el.find(options.handle);


                sortable = new DragDrop({
                    $scrollWrap: options.$scrollWrap,
                    $range: $container,
                    $layer: $el,
                    $handle: $handle.length > 0 ? $handle : null,
                    sortable: true,
                    boundary: options.boundary,
                    direction: options.direction
                });

                sortable.on('start', function (e) {
                    options.callback.start.call(this, e, $el);
                }).on('move', function (e, moveCoord, position) {

                    var mouseCoord = this.getMouseCoord(e);

                    for (var i = 0, group; i < groups.length; i++) {

                        group = groups[i];

                        //分组范围内
                        if (mouseCoord.y >= group.offset.top && mouseCoord.y <= group.offset.top + group.offset.height
                            && mouseCoord.x >= group.offset.left && mouseCoord.x <= group.offset.left + group.offset.width) {


                            //放置区域
                            for (var j = 0, dropInfo; j < group.droppableInfo.length; j++) {

                                dropInfo = group.droppableInfo[j];

                                if (mouseCoord.y >= dropInfo.offset.top + dropInfo.height
                                    && mouseCoord.x >= dropInfo.offset.left && mouseCoord.x <= dropInfo.offset.left + dropInfo.width
                                    && dropInfo.$drop.find('.k-sortable-placeholder').length == 0) {

                                    dropInfo.$drop.append(this.$placeholder);

                                    method._setGroupInfo(groups);
                                    method._setSortableInfo();
                                    options.callback.move.call(this, e, $el);
                                    return;
                                }
                            }


                            //排序项
                            for (var k = 0, tmpNum, sortable; k < sortables.length; k++) {

                                sortable = sortables[k];

                                if (sortable == this) {
                                    continue;
                                }



                                if (mouseCoord.x >= sortable.info.offset.left
                                    && mouseCoord.x <= sortable.info.offset.left + sortable.info.width
                                    && mouseCoord.y >= sortable.info.offset.top
                                    && mouseCoord.y <= sortable.info.offset.top + sortable.info.height) {


                                    if (this.dragParms.height < sortable.info.height) {

                                        if (mouseCoord.y >= sortable.info.offset.top
                                            && mouseCoord.y <= sortable.info.v_half) {

                                            hasSwap = this.$placeholder.next()[0] == sortable.$layer[0];

                                            this.$placeholder.insertBefore(sortable.$layer);

                                            if (hasSwap) {
                                                return;
                                            }

                                        } else {

                                            hasSwap = this.$placeholder.prev()[0] == sortable.$layer[0];

                                            this.$placeholder.insertAfter(sortable.$layer);

                                            if (hasSwap) {
                                                return;
                                            }
                                        }


                                    } else if (this.dragParms.width < sortable.info.width && options.mode == 'float') {

                                        if (mouseCoord.x >= sortable.info.offset.left
                                            && mouseCoord.x <= sortable.info.h_half) {

                                            hasSwap = this.$placeholder.next()[0] == sortable.$layer[0];

                                            this.$placeholder.insertBefore(sortable.$layer);

                                            if (hasSwap) {
                                                return;
                                            }

                                        } else {
                                            hasSwap = this.$placeholder.prev()[0] == sortable.$layer[0];

                                            this.$placeholder.insertAfter(sortable.$layer);

                                            if (hasSwap) {
                                                return;
                                            }
                                        }

                                    } else {

                                        if (this.sortNum > sortable.sortNum) {
                                            this.$placeholder.insertBefore(sortable.$layer);
                                        } else {
                                            this.$placeholder.insertAfter(sortable.$layer);
                                        }

                                        tmpNum = this.sortNum;
                                        this.sortNum = sortable.sortNum;
                                        sortable.sortNum = tmpNum;
                                    }

                                    method._setGroupInfo(groups);
                                    method._setSortableInfo();
                                    options.callback.move.call(this, e, $el);
                                    return;
                                }
                            }

                            options.callback.move.call(this, e, $el);

                            return;
                        }

                    }

                }).on('stop', function (e) {
                    this.$layer.css('width', 'auto');
                    hasSwap = false;
                    method._setGroupInfo(groups);
                    method._setSortableInfo(true);
                    options.callback.stop.call(this, e, $el);
                });

                sortables.push(sortable);

                options.callback.init.call(this, sortable);
            });

            groups.push({
                $group: $group,
                $draggable: $draggable,
                $droppable: $droppable
            });
        });

        method._setGroupInfo(groups);
        method._setSortableInfo(true);

        return {
            getGroups: function () { return groups; },
            getSortables: function () { return sortables; },
            setInfo: function () {
                method._setGroupInfo(groups);
                method._setSortableInfo(true);
            },
            removeSortable: function (sortable) {
                var index = -1;
                for (var i = 0; i < sortables.length; i++) {
                    if (sortables[i] == sortable) {
                        index = i;
                        break;
                    }
                }

                if (index == -1) {
                    return;
                }

                sortables[index].$layer.remove();
                sortables.splice(index, 1);
                method._setGroupInfo(groups);
                method._setSortableInfo(true);
            },
            removeSortables: function (arrSortable) {
                if (arrSortable.length == 0) {
                    return;
                }

                var tmpSortables = [],
                    has = false;

                for (var i = 0; i < sortables.length; i++) {

                    has = false;

                    for (var j = 0; j < arrSortable.length; j++) {
                        if (sortables[i] == arrSortable[j]) {
                            has = true;
                            break;
                        }
                    }

                    if (!has) {
                        tmpSortables.push(sortables[i]);
                    }
                }

                sortables = tmpSortables;
                method._setGroupInfo(groups);
                method._setSortableInfo(true);
            },
            removeGroup: function ($el) {

                if (!$el || $el.length == 0) {
                    return;
                }
                var index = -1;

                for (var i = 0; i < groups.length; i++) {

                    if ($el[0] == groups[i].$group[0]) {
                        index = i;
                        break;
                    }
                }
                if (index == -1) {
                    return;
                }
                groups.splice(index, 1);
            },
            destory: function () {
                for (var i = 0; i < sortables.length; i++) {
                    sortables[i].destory();
                }
            }
        };

    };

    return DragDrop;
});

/*
 * 下拉列表模块
 * @date:2015-11-06
 * @author:kotenei(kotenei@qq.com)
 */
define('km/dropDownList', ['jquery'], function ($) {

    /**
     * 下拉列表类
     * @param {JQuery} $el - dom
     * @param {Object} options - 参数
     */
    var DropDownList = function ($el, options) {



        this.$el = $el;
        this.options = $.extend(true, {
            $target: null,
            bindElement: null,
            direction: 'left',
            width: 'auto',
            zIndex: 20
        }, options);
        this._event = {
            select: $.noop
        };

        this.init();
    };

    /**
     * 初始化
     * @return {Void}
     */
    DropDownList.prototype.init = function () {

        var $dropDownList = this.$el.parent().children('.k-dropDownList');

        if ($dropDownList.length == 0) {
            return;
        }



        this.isInputGroup = this.$el.hasClass('input-group') || this.$el.hasClass('k-input-group');

        this.isTextBox = this.isInputGroup ? false : this.$el[0].type == 'text';

        this.$el.parent().css('position', 'relative');

        this.$dropDownList = $dropDownList.addClass('k-pop-panel').css('z-index', this.options.zIndex);

        this.$bindElement = $(this.options.bindElement);

        this.$hidden = this.$dropDownList.next('input:hidden');

        this.$body = $(document.body);

        if (this.isInputGroup) {
            this.$el.find('input').attr('readonly', 'readonly');
        }

        this.watch();
    };

    /**
     * 事件监控
     * @return {Void}
     */
    DropDownList.prototype.watch = function () {
        var self = this;

        this.$el.on('click.dropdownlist', function (e) {
            $('ul.k-dropDownList').hide();
            self.show(e);
            e.stopPropagation();
            return false;
        });

        this.$dropDownList.on('click.dropdownlist', 'li', function (e) {
            var $el = $(this),
                text = $el.attr('data-text'),
                value = $el.attr('data-value'),
                data = {
                    text: text || '',
                    value: value || ''
                };

            if (self.isTextBox) {
                self.$el.val(data.text).focus().blur();
                $el.addClass('active').siblings().removeClass('active');
            }

            if (self.isInputGroup) {
                self.$el.find('input').val(data.text).focus().blur();
                $el.addClass('active').siblings().removeClass('active');
            }

            if (self.$bindElement) {
                self.$bindElement.val(data.text).focus().blur();
            }

            if (self.$hidden.length > 0) {
                self.$hidden.val(data.value);
            }

            self._event.select.call(self, $el, data);
        });

        $(document).on('click.dropdownlist', function () {
            self.hide();
        });

        $(window).on('resize.dropdownlist', function () {
            self.sysPosition();
        });
    };

    /**
     * 添加回调函数
     * @param  {String} type - 事件名称
     * @param  {Function} callback - 回调函数
     * @return {Void}
     */
    DropDownList.prototype.on = function (name, callback) {
        this._event[name] = callback || $.noop;
        return this;
    }

    /**
     * 显示
     * @return {Void}
     */
    DropDownList.prototype.show = function (e) {
        var self = this;
        $('div.k-pop-panel,ul.k-pop-panel').hide();
        this.$dropDownList.show();
        this.sysPosition(e);
    };

    /**
     * 隐藏
     * @return {Void}
     */
    DropDownList.prototype.hide = function () {
        this.$dropDownList.hide();
    };

    /**
     * 同步定位
     * @return {Void}
     */
    DropDownList.prototype.sysPosition = function (e, $el) {

        var position = {
            left: 0,
            top: 0,
            width: this.options.width == '100%' ? this.$el.outerWidth() : this.options.width
        };

        this.$dropDownList.css('width', position.width);

        switch (this.options.direction) {

            case 'left':
                position.left = this.$el.position().left;
                position.top = this.$el.position().top + this.$el.outerHeight(true) + 2;
                break;
            case 'right':
                position.left = this.$el.position().left + this.$el.outerWidth(true) - this.$dropDownList.outerWidth();
                position.top = this.$el.position().top + this.$el.outerHeight(true) + 2;
                break;
            case 'left up':
                position.left = this.$el.position().left;
                position.top = this.$el.position().top - this.$dropDownList.outerHeight(true);
                break;
            case 'right up':
                position.left = this.$el.position().left + this.$el.outerWidth(true) - this.$dropDownList.outerWidth();
                position.top = this.$el.position().top - this.$dropDownList.outerHeight();
                break;
            case 'mouse':
                if (e) {
                    var info = this.getElmPosition();
                    position.left = e.pageX-info.left,
                    position.top = e.pageY-info.top;
                } else {
                    position.display = 'none';
                }
                break;
            default:
                position.left = this.$el.position().left;
                position.top = this.$el.position().top + this.$el.outerHeight(true) + 2;
                break;
        }

        this.$dropDownList.css(position);
    };

    //取鼠标定位
    DropDownList.prototype.getElmPosition = function () {
        var info = {
            left: 0,
            top: 0,
            pLeft: 0,
            pTop: 0
        },
        $target = this.$body,
        $cur = this.$el,
        $parent = $cur.parent(),
        position;

        

        while ($parent[0] != $target[0]) {
            position = $parent.css('position');
            if (position == 'relative' || position == 'absolute') {
                info.left = $parent.offset().left;
                info.top = $parent.offset().top;
                return info;
            }
            $parent = $parent.parent();
        }

        return info;
    };

    /**
     * 全局调用
     * @param  {Jquery} $elms - dom
     * @return {Void}
     */
    DropDownList.Global = function ($elms, options) {
        $elms = $elms || $('[data-module=dropdownlist]');



        $elms.each(function () {
            var $el = $(this),
                settings = $el.attr('data-options'),
                onSelect = $el.attr('data-onselect'),
                data = $.data($el[0], 'dropdownlist');

            if (!data) {

                if (settings && settings.length > 0) {
                    settings = eval('(0,' + settings + ')');
                }

                if (options) {
                    options = $.extend(true, options, settings || {});
                } else {
                    options = settings;
                }

                if (onSelect && onSelect.length > 0) {
                    onSelect = eval('(0,' + onSelect + ')');
                }

                data = new DropDownList($el, options);

                data.on('select', onSelect);

                $.data($el[0], 'dropdownlist', data);
            }

        });
    };

    return DropDownList;

});

/*
 * 下拉树模块
 * @date:2015-07-28
 * @author:kotenei(kotenei@qq.com)
 */
define('km/dropDownTree', ['jquery', 'km/tree'], function ($, Tree) {

    var identity = 1;

    /**
     * 下拉树类
     * @param {JQuery} $element - dom
     * @param {Object} options - 参数
     */
    var DropDownTree = function ($elm, options) {
        this.identity = identity++;
        this.$elm = $elm;
        this.options = $.extend(true, {
            data: [],
            url: null,
            width: null,
            height: 200,
            zIndex: 999,
            appendTo: $(document.body),
            isTree: true,
            multiple: false,
            inputGroup: '.k-input-group',
            bindElement: null,
            callback: {
                select: $.noop,
                check: $.noop,
                hide: $.noop
            }
        }, options);
        this.tm = null;
        this.$treePanel = $('<div class="k-dropDownTree k-pop-panel"></div>');
        this.init();
    };

    /**
     * 初始化
     * @return {Void}
     */
    DropDownTree.prototype.init = function () {

        var self = this;

        if ((!this.options.url || this.options.url.length == 0) &&
            (!this.options.data || this.options.data.length == 0)) {
            return;
        }

        this.$bindElement = $(this.options.bindElement);

        this.$inputGroup = this.$elm.parent(this.options.inputGroup);

        this.$elm.attr('readonly', 'readonly');
        this.$elm.attr('data-moduleId', this.identity);

        this.elmWidth = this.$elm.outerWidth();

        this.$treePanel.css({
            width: this.options.width || this.$inputGroup.outerWidth() || this.elmWidth,
            height: this.options.height,
            zIndex: this.options.zIndex
        }).appendTo(this.options.appendTo);

        if (!this.options.isTree) {
            this.options.view = {
                showLine: false,
                showIcon: false
            }

            this.$treePanel.addClass('k-dropDownTree-list');
        }

        if (this.options.multiple) {
            this.options.check = {
                enable: true,
                chkType: 'checkbox',
                chkBoxType: { Y: "", N: "" }
            };
        }

        this.options.callback.onCheck = function (nodes) {
            self.check(nodes);
        };

        this.options.callback.onSelect = function (node) {
            self.select(node);
        };

        if (this.options.url) {
            $.get(this.options.url, {
                value: this.$bindElement && this.$bindElement.length > 0 ? this.$bindElement.val() : this.$elm.val(),
                rand: Math.random()
            }, function (data) {

                if (typeof data === 'string') {
                    data = eval('(0,' + data + ')');
                }

                self.options.data = data;
                self.tree = new Tree(self.$treePanel, self.options);
                self.watch();
            });
        } else {
            this.tree = new Tree(this.$treePanel, this.options);
            this.watch();
        }

    };

    /**
     * 事件监控
     * @return {Void}
     */
    DropDownTree.prototype.watch = function () {
        var self = this;

        this.$elm.on('click.dropDownTree', function (e) {
            self.show();
            return false;
        });

        this.$inputGroup.on('click.dropDownTree', 'button', function (e) {
            self.show();
            return false;
        });

        $(document).on('click.dropDownTree.' + this.identity, function (e) {

            //if (self && self.$elm.parent().length == 0) {
            //    $(window).off('resize.dropDownTree.' + self.identity);
            //    $(document).off('click.dropDownTree.' + self.identity);
            //    self = null;
            //    return;
            //}

            var $target = $(e.target);
            if ($target.hasClass('k-dropDownTree') ||
                $target.parents('.k-dropDownTree').length > 0) {
                return;
            }
            self.hide();
        });

        $(window).on('resize.dropDownTree.' + this.identity, function () {

            if (self.tm) {
                clearTimeout(self.tm);
            }

            self.tm = setTimeout(function () {

                //if (self && self.$elm.parent().length == 0) {
                //    $(window).off('resize.dropDownTree.' + self.identity);
                //    $(document).off('click.dropDownTree.' + self.identity);
                //    self = null;
                //    return;
                //}

                self.setPosition();

            }, 300);

        });
    };

    /**
     * 单选操作
     * @return {Void}
     */
    DropDownTree.prototype.select = function (node) {
        if (this.options.multiple) {
            this.tree.$tree.find('a.selected').removeClass('selected');
            return;
        }

        if (this.$bindElement) {
            this.$bindElement.val(node.value || node.nodeId || node.text);
        }

        this.$elm.val(node.text).attr('title', node.text).focus().blur();

        this.options.callback.select(node);

        this.hide();
    };


    /**
     * 复选操作
     * @return {Void}
     */
    DropDownTree.prototype.check = function (node) {

        var nodes = this.tree.getCheckedNodes();
        var arrValue = [],
            arrText = [];

        for (var i = 0; i < nodes.length; i++) {
            arrText.push(nodes[i].text);
            arrValue.push(nodes[i].value || nodes[i].nodeId || nodes[i].text);
        }

        if (this.$bindElement) {
            this.$bindElement.val(arrValue.join(','));
        }

        this.$elm.val(arrText.join(',')).attr('title', arrText.join(',')).focus().blur();
        this.options.callback.check(nodes);
    };

    /**
     * 设置位置
     * @return {Void}
     */
    DropDownTree.prototype.setPosition = function () {
        this.$treePanel.css({
            left: this.$elm.offset().left,
            top: this.$elm.offset().top + this.$elm.outerHeight() + 2,
            width: this.options.width || this.$inputGroup.outerWidth() || this.elmWidth
        });
    };

    /**
     * 显示
     * @return {Void}
     */
    DropDownTree.prototype.show = function () {

        if (this.$treePanel[0].style.display == 'block') {
            return;
        }
        $('div.k-pop-panel,ul.k-pop-panel').hide();
        this.$treePanel.show();
        this.setPosition();
    };

    /**
     * 隐藏
     * @return {Void}
     */
    DropDownTree.prototype.hide = function () {
        if (this.$treePanel[0].style.display == 'block') {
            this.options.callback.hide();
        }
        this.$treePanel.hide();
    };

    /**
     * 销毁
     * @param {int} moduleId - 模板编号
     * @return {Void}
     */
    DropDownTree.Destory = function (moduleId) {
        moduleId = moduleId || "";
        var key = moduleId ? 'resize.dropDownTree.' + moduleId : 'resize.dropDownTree';
        $(window).off(key);
    }


    /**
     * 全局调用
     * @return {Void}
     */
    DropDownTree.Global = function ($elms) {
        $elms = $elms || $('input[data-module=dropdowntree]');

        $elms.each(function () {
            var $elm = $(this),
                options = $elm.attr('data-options'),
                url = $elm.attr('data-url'),
                width = $elm.attr('data-width'),
                height = $elm.attr('data-height'),
                zIndex = $elm.attr('data-zIndex'),
                appendTo = $elm.attr('data-appendTo'),
                isTree = $elm.attr('data-isTree') || true,
                multiple = $elm.attr('data-multiple') || false,
                array = $elm.attr('data-data'),
                callback = $elm.attr('data-callback'),
                bindElm = $elm.attr('data-bindelement') || null,
                data;

            data = $.data($elm[0], 'dropDownTree');


            if (!data) {

                if (options && options.length > 0) {
                    options = eval('(0,' + options + ')');
                } else {
                    options = {
                        data: eval(array),
                        url: url,
                        width: width && width.length > 0 ? parseInt(width) : null,
                        height: height && height.length > 0 ? parseInt(height) : 200,
                        zIndex: zIndex && zIndex.length > 0 ? parseInt(zIndex) : 999,
                        appendTo: $(appendTo || document.body),
                        isTree: isTree && isTree == 'false' ? false : true,
                        multiple: multiple && multiple == 'true' ? true : false,
                        $bindElement: $(bindElm),
                        callback: callback && callback.length > 0 ? eval('(0,' + callback + ')') : {}
                    };
                }

                data = new DropDownTree($elm, options);

                $.data($elm[0], 'dropDownTree', data);
            }

        });
    };


    return DropDownTree;

});

/**
 * 事件
 * @date :2014-12-01
 * @author kotenei (kotenei@qq.com)
 */ 
define('km/event', [], function () {

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

/*
 * 焦点图模块
 * @date:2015-07-16
 * @author:kotenei(kotenei@qq.com)
 */
define('km/focusMap', ['jquery'], function ($) {

    /**
     * 焦点图模块
     * @constructor
     * @alias km/focusmap
     * @param {JQuery} $el - dom
     * @param {Object} options - 参数设置
     */
    var FocusMap = function ($el, options) {
        this.$el = $el;
        this.options = $.extend(true, {
            containerWidth: null,
            width: 600,
            height: 300,
            delay: 3000
        }, options);
        this.tm = null;
        this.isStop = false;
        this.index = 0;
        this.init();
    };

    /**
     * 初始化
     * @return {Void}   
     */
    FocusMap.prototype.init = function () {
        var tmpLength;
        this.winWidth = $(window).width();

        if (this.winWidth<this.options.width) {
            this.options.width = this.winWidth;
            this.options.height='auto';
        }

        this.$el.css({
            width: this.options.containerWidth || this.options.width,
            height:this.options.height
        })

        this.$ul = this.$el.find('ul'); 
        this.$lis = this.$ul.find('li');
        if (this.$lis.length == 1) {
            return;
        }
        this.$ul.append(this.$lis.eq(0).clone(true));
        this.$ul.prepend(this.$lis.eq(this.$lis.length - 1).clone(true));
        this.$lis = this.$ul.find('li').width(this.options.width);
        this.total = this.$lis.length;
        this.max = this.total - 2;
        this.$ul.width(this.total * this.options.width).css("marginLeft", -(this.index + 1) * this.options.width);
        this.create();
        this.watch();
        if (this.max > 1) {
            this.$el.append('<div class="k-focusmap-prev"><</div><div class="k-focusmap-next">></div>');
            this.run();
        }
    };

    /**
     * 创建圆点
     * @return {Void}   
     */
    FocusMap.prototype.create = function () {
        var html = [], marginLeft = this.max * 16 / 2;
        html.push('<div class="k-focusmap-dot" style="margin-left:-' + marginLeft + 'px;">');
        for (var i = 0; i < this.max; i++) {
            html.push('<span class="' + (i == 0 ? "current" : "") + '"></span>');
        }
        html.push('</div>');

        this.$el.append(html.join(''));
        this.$dots = this.$el.find('.k-focusmap-dot span');
    };

    /**
     * 事件监控
     * @return {Void}   
     */
    FocusMap.prototype.watch = function () {
        var self = this;
        if (this.isWatch) {
            return;
        }
        this.isWatch = true;
        this.$el.on('mouseenter.focusmap', function () {
            self.stop();
        }).on('mouseleave.focusmap', function () {
            self.run();
        }).on('click.focusmap', '.k-focusmap-prev', function () {
            self.index--;
            self.active();
        }).on('click.focusmap', '.k-focusmap-next', function () {
            self.index++;
            self.active();
        }).on('click.focusmap', 'span', function () {
            var $el = $(this),
                index = $el.index();
            self.index = index;
            self.active();
        });
    };

    /**
     * 运行焦点图
     * @return {Void}   
     */
    FocusMap.prototype.run = function () {
        var self = this;
        this.isStop = false;
        this.tm = setTimeout(function () {
            self.index++;
            self.active(function () {
                if (!self.isStop) {
                    self.run();
                }
            });
        }, this.options.delay);
    };

    /**
     * 停止运行
     * @return {Void}   
     */
    FocusMap.prototype.stop = function () {
        if (this.tm) {
            clearTimeout(this.tm);
            this.isStop = true;
        }
    };

    /**
     * 切换图片
     * @return {Void}   
     */
    FocusMap.prototype.active = function (callback) {
        var self = this;

        var tmpIndex = this.index + 1;

        if (this.index == this.max) {
            this.index = 0;
        }

        if (this.index < 0) {
            this.index = this.max - 1;
        }

        this.$ul.stop().animate({
            marginLeft: -tmpIndex * this.options.width
        }, function () {

            if (tmpIndex == self.total - 1) {
                self.$ul.css('marginLeft', -1 * self.options.width);
            }

            if (tmpIndex==0) {
                self.$ul.css('marginLeft', -(self.max) * self.options.width);
            }

            self.$dots.removeClass('current').eq(self.index).addClass('current');

            if (typeof callback === 'function') {
                callback();
            }

        });
    };

    return function ($elm, options) {
        var focusMap = new FocusMap($elm, options);
        return focusMap;
    }
});

/**
 * 高亮模块
 * @date :2014-10-30
 * @author kotenei (kotenei@qq.com)
 */
define('km/highlight', ['jquery'], function ($) {

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
                matches[i] = matches[i].replace(new RegExp('(' + keywords.join('|') + ')', 'ig'), '<span class="' + className + '">$1</span>');
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

        var reg = new RegExp('<span class="?' + className + '"?>(.*?)<\/span>', 'ig');

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
define('km/imgPreview', ['jquery', 'km/loading', 'km/popTips'], function ($, Loading, popTips) {

    /**
     * 图片预览模块
     * @constructor
     * @alias km/imgPreview
     * @param {JQuery} $elements - dom
     * @param {Object} options - 参数设置
     */
    var ImgPreview = function ($elements, options) {
        this.$elements = $elements;
        this.options = $.extend(true, {
            delay: 500,
            showButtons: true,
            backdrop: true,
            backdropClose: true,
            tpl: '<div class="k-imgPreview">' +
                    '<div class="k-container">' +
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
        this.$container = this.$imgPreview.find('.k-container');
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

        this.$elements.on('click.imgpreview', function () {
            var $this = $(this);
            self.index = Number($this.attr('data-index'));
            self.show();
        });

        this.$backdrop.on('click.imgpreview', function () {
            if (self.options.backdropClose) {
                self.hide();
            }
        });

        this.$imgPreview.on('click.imgpreview', '[role=close]', function () {
            //关闭
            self.hide();
        }).on('click.imgpreview', '[role=prev]', function () {
            if (self.isLoading) {
                return;
            }
            //向前
            if (self.index === 0) {
                return;
            }
            self.index--;
            self.showControls();
            self.show();
        }).on('click.imgpreview', '[role=next]', function () {

            if (self.isLoading) {
                return;
            }

            //向后
            if (self.index >= self.$elements.length - 1) {
                return;
            }
            self.index++;
            self.showControls();
            self.show();
        }).on('mouseenter.imgpreview', function () {
            self.showControls();
        }).on('mouseleave.imgpreview', function () {
            self.$prev.hide();
            self.$next.hide();
        });

        this.$win.on('resize.imgpreview', function () {
            var width = parseInt(self.$img.attr('data-width')),
                height = parseInt(self.$img.attr('data-height'));

            if (self.tm) {
                clearTimeout(self.tm);
            }

            if (self.isShow) {
                self.tm = setTimeout(function () {
                    self.setPosition({ width: width, height: height });
                }, 300);
            }

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

        this.isShow = true;

        this.isLoading = true;

        Loading.show();

        this.imgLoad(src, function (result, size) {

            if (result) {
                self.$img.attr({
                    'src': src,
                    'data-width': size.width,
                    'data-height': size.height
                });

                //self.$imgPreview.hide().fadeIn(self.options.delay);  

                if (self.options.backdrop && self.$backdrop[0].style.display != 'block') {
                    self.$backdrop.css({
                        opacity: 0,
                        display: 'block'
                    }).stop().animate({
                        opacity: 0.8
                    }, self.options.delay)
                }

                self.setPosition(size);

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
        this.isLoading = false;
        Loading.hide();
        this.isShow = false;
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

        this.$container.show().stop().animate({
            width: size.width,
            height: size.height
        });

        this.$imgPreview.show().stop().animate({
            width: size.width + 20,
            height: size.height + 20,
            marginTop: -((size.height + 20) / 2),
            marginLeft: -((size.width + 20) / 2)
        });

    };

    return function ($elms, options) {
        $elms = $elms || $('img');
        var imgPreview = new ImgPreview($elms, options);
        return imgPreview;
    }

});

/**
 * 无限滚动模块
 * @date :2014-09-24
 * @author kotenei (kotenei@qq.com)
 */
define('km/infiniteScroll', ['jquery'], function ($) {

    /**
     * 无限滚动模块
     * @param {Object} options - 参数
     */
    var InfiniteScroll = function (options) {
        var self = this;
        this.options = $.extend(true, {
            $scrollElement: $(window),
            $watchElement: null,
            scrollDistance:0.3,
            callback: $.noop
        }, options);
        this.$scrollElement = this.options.$scrollElement;
        this.$watchElement = this.options.$watchElement;

        if (!this.$watchElement) { return; }
 
        this.top = this.$watchElement.position().top;

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
        var watchElmBottom = this.top + this.$watchElement.height();
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
 * 布局模块
 * @date:2015-08-23
 * @author:kotenei(kotenei@qq.com)
 */
define('km/layout', ['jquery', 'km/panel', 'km/cache'], function($, Panel, cache) {

    /**
     * 布局模块
     * @param {JQuery} $elm - dom
     * @param {Object} options - 参数
     */
    var Layout = function($elm, options) {
        this.$layout = $elm;
        this.options = $.extend(true, {
            cache: false,
            resizeMin: 5,
            panel: {
                left: { width: 100 },
                top: { height: 100 },
                right: { width: 100 },
                bottom: { height: 100 }
            }
        }, options);
        this.$parent = this.$layout.parent();
        this.init();
        this._event = {
            show: $.noop,
            hide: $.noop
        };
    };

    /**
     * 初始化
     * @return {Void}
     */
    Layout.prototype.init = function() {
        var self = this;
        this.$win = $(window);
        this.$panels = this.$layout.children('.k-panel');
        this.$leftPanel = this.$panels.filter('.k-panel-left');
        this.$topPanel = this.$panels.filter('.k-panel-top');
        this.$rightPanel = this.$panels.filter('.k-panel-right');
        this.$bottomPanel = this.$panels.filter('.k-panel-bottom');
        this.$centerPanel = this.$panels.filter('.k-panel-center');
        this.$panels.each(function() {
            var $panel = $(this),
                type = $panel.attr('data-type'),
                $expand = $(self.getExpandHtml(type)).appendTo(self.$layout);

            $.data($panel[0], 'expand', $expand);
        });
        this.setSize();
        this.panelInit();
        this.watch();
    };

    /**
     * 面板初始化
     * @return {Void}
     */
    Layout.prototype.panelInit = function() {
        var self = this;
        this.$panels.each(function() {

            var $panel = $(this).show(),
                type = $panel.attr('data-type'),
                resizable = $panel.attr('data-resizable'),
                min = self.options.resizeMin,
                options = {
                    resizable: {
                        enabled: !resizable || resizable == 'true' ? true : false,
                        cover: true,
                        border: {
                            left: false,
                            top: false,
                            right: false,
                            bottom: false
                        },
                        callback: {
                            stop: function() {
                                if (self.$centerPanel.length > 0) {
                                    self.$centerPanel.resize();
                                } else {
                                    self.setSize();
                                }
                            }
                        }
                    },
                    width: $panel.width(),
                    height: $panel.height()
                };

            switch (type) {
                case 'top':
                    options.minHeight = min;
                    options.resizable.border.bottom = true;
                    break;
                case 'left':
                    options.minWidth = min;
                    options.resizable.border.right = true;
                    break;
                case 'right':
                    options.minWidth = min;
                    options.resizable.border.left = true;
                    break;
                case 'bottom':
                    options.minHeight = min;
                    options.resizable.border.top = true;
                    break;
            }
            var panel = new Panel($panel, options);

            $.data($panel[0], 'panel', panel);
        });
    };

    /**
     * 事件监控
     * @return {Void}
     */
    Layout.prototype.watch = function() {
        var self = this;
        this.$win.on('resize.layout', function() {
            self.setSize();
        });
        this.$panels.on('click.layout', 'span[role=hide]', function() {
            self.hide($(this).attr('data-type'));
            return false;
        });
        this.$layout.on('click.layout', 'span[role=show]', function() {
            self.show($(this).attr('data-type'));
            return false;
        });
    };

    /**
     * 事件添加
     * @return {Void}
     */
    Layout.prototype.on = function(type, callback) {
        this._event[type] = callback || $.noop;
        return this;
    };

    /**
     * 展开
     * @param {String} type - 面板类型
     * @return {Void}
     */
    Layout.prototype.show = function(type) {
        var self = this,
            panelsInfo = this.getPanelsInfo(),
            info = panelsInfo[type],
            $panel = info.$panel.attr('data-isHide', false),
            $expand = info.$expand,
            css;

        $expand.hide();
        $panel.show();

        switch (type) {
            case 'top':
                css = { top: 0 };
                break;
            case 'left':
                css = { left: 0 };
                break;
            case 'right':
                css = { right: 0 };
                break;
            case 'bottom':
                css = { bottom: 0 };
                break;
        }

        $panel.stop().animate(css, function() {
            self.setSize();
            if (self.$centerPanel) {
                self.$centerPanel.resize();
            }
        });

        this._event.show.call(this, info);
    };

    /**
     * 隐藏
     * @param {String} type - 面板类型
     * @return {Void}
     */
    Layout.prototype.hide = function(type) {

        var self = this,
            panelsInfo = this.getPanelsInfo(),
            info = panelsInfo[type],
            css;

        info.$panel.attr('data-isHide', true);

        self.setSize();
        if (self.$centerPanel) {
            self.$centerPanel.resize();
        }

        switch (type) {
            case 'top':
                css = { top: -info.height };
                break;
            case 'left':
                css = { left: -info.width };
                break;
            case 'right':
                css = { right: -info.width };
                info.$panel.css('right', 0);
                break;
            case 'bottom':
                css = { bottom: -info.height };
                info.$panel.css('bottom', 0);
                break;
        }

        info.$panel.stop().animate(css, function() {
            info.$panel.hide();
            info.$expand.show();
            self._event.hide.call(self, info);
        });
    };

    /**
     * 获取面板隐藏后占位图层HTML
     * @param {String} type - 面板类别
     * @return {String}
     */
    Layout.prototype.getExpandHtml = function(type) {
        var ret = '',
            className = '',
            faClassName = '';

        switch (type) {
            case 'left':
                className = "panel-expand panel-expand-left";
                faClassName = "fa fa-angle-double-right";
                break;
            case 'top':
                className = "panel-expand panel-expand-top";
                faClassName = "fa fa-angle-double-down";
                break;
            case 'right':
                className = "panel-expand panel-expand-right";
                faClassName = "fa fa-angle-double-left";
                break;
            case 'bottom':
                className = "panel-expand panel-expand-bottom";
                faClassName = "fa fa-angle-double-up";
                break;
        }
        return '<div class="' + className + '"><span class="' + faClassName + '" role="show" data-type="' + type + '"></span></div>';
    };

    /**
     * 设置所有面板尺寸
     * @return {Void}
     */
    Layout.prototype.setSize = function() {
        var $parent = this.$parent,
            width = $parent.width(),
            height = $parent.height(),
            info = this.getPanelsInfo(),
            t = 0,
            l = 0,
            w = 0,
            h = 0;


        if ($parent[0].tagName.toLowerCase() == 'body') {
            $parent.addClass('k-layout-body');
            height = this.$win.height();
        }


        this.$layout.css({ width: width, height: height });


        if (info.top) {

            info.top.$panel.css({ height: info.top.height, width: '100%' });
            info.top.setBodyHeight();

            if (!info.top.isHide) {
                h += info.top.height;
            } else {
                h += info.top.expandHeight;
            }
        }


        //计算中间面板距离顶部距离
        t += h;

        if (info.bottom) {
            info.bottom.$panel.css({ height: info.bottom.height, width: '100%', top: 'none' });
            info.bottom.setBodyHeight();

            if (!info.bottom.isHide) {
                info.bottom.$panel.css("bottom", 0);
                h += info.bottom.height;
            } else {
                info.bottom.$panel.css("bottom", -info.bottom.height);
                h += info.bottom.expandHeight;
            }
        }

        //计算中间面板的高度
        h = height - h;

        if (info.left) {

            info.left.$panel.css({ width: info.left.width, top: t, height: h });
            info.left.setBodyHeight();
            info.left.$expand.css({ top: t, height: h });

            if (!info.left.isHide) {
                w += info.left.width;
                l += w;
            } else {
                w += info.left.expandWidth;
                l += w;
            }
        }


        if (info.right) {

            info.right.$panel.css({ width: info.right.width, top: t, height: h, left: 'none' });
            info.right.setBodyHeight();
            info.right.$expand.css({ top: t, height: h });

            if (!info.right.isHide) {
                info.right.$panel.css('right', 0);
                w += info.right.width;
            } else {
                info.right.$panel.css('right', -info.right.width);
                w += info.right.expandWidth;
            }
        }

        if (info.center) {
            w = width - w;
            info.center.$panel.css({ top: t, left: l, width: w, height: h });
            info.center.setBodyHeight();
        }

    };

    /**
    * 获取所有面板相关信息
    * @param {String} type - 面板类别
    * @return {Object}
    */
    Layout.prototype.getPanelsInfo = function(type) {
        var ret = {};

        this.$panels.each(function() {
            var $panel = $(this),
                $expand = $.data($panel[0], 'expand'),
                panel = $.data($panel[0], 'panel'),
                type = $panel.attr('data-type');

            ret[type] = {
                left: $panel.position().left,
                top: $panel.position().top,
                width: $panel.outerWidth(),
                height: $panel.outerHeight(),
                isHide: $panel.attr('data-ishide') == 'true',
                $panel: $panel,
                $expand: $expand,
                panel: panel,
                expandWidth: $expand.outerWidth(),
                expandHeight: $expand.outerHeight(),
                setBodyHeight: function() {
                    if (panel) {
                        panel.setBodyHeight();
                    }
                }
            };

        });

        if (type) {
            return ret[type];
        }

        return ret;
    };

    /**
     * 全局初始化
     * @return {Void}
     */
    Layout.Global = function($elms) {
        $elms = $elms || $('div[data-module=layout]');
        $elms.each(function() {
            var $el = $(this),
                options = $el.attr('data-options'),
                onShow = $el.attr('data-onshow'),
                onHide = $el.attr('data-onhide'),
                data = $.data($el[0], 'layout');



            if (!data) {

                if (options && options.length > 0) {
                    options = eval('(0,' + options + ')');
                }

                onShow = onShow && onShow.length > 0 ? eval('(0,' + onShow + ')') : $.noop;
                onHide = onHide && onHide.length > 0 ? eval('(0,' + onHide + ')') : $.noop;

                data = new Layout($el, options);
                data.on('show', function(info) {
                    onShow.call(this, info);
                }).on('hide', function(info) {
                    onHide.call(this, info);
                });


                $.data($el[0], 'layout', data);
            }

        });
    };

    return Layout;

});
/*
 * 图片延迟加载模块
 * @date:2014-09-01
 * @author:kotenei(kotenei@qq.com)
 */
define('km/lazyload', ['jquery'], function ($) {

/**
 * 图片延迟加载模块
 * @param {JQuery} $elements -dom
 * @param {Object} options  - 参数设置
 */
    function LazyLoad($elements, options) {
        this.$elements = $elements;
        this.options = $.extend(true, {
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
define('km/loading', ['jquery', 'spin'], function ($, Spinner) {

    var global;


    var Loading = function (options) {
        this.options = $.extend(true, {
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
            className: 'k-spinner', // css 样式名称
            zIndex: 2e9, // spinner的z轴 (默认是2000000000)
            top: '50%', // spinner 相对父容器Top定位 单位 px
            left: '50%'// spinner 相对父容器Left定位 单位 px
        }, options);
        this.tpl = '<div class="k-loading"></div>';
        this.init();
    }

    var isShow = false;

    Loading.prototype.init = function () {
        this.$loading = $(this.tpl).appendTo(document.body).hide();
        //this.options.top = this.$loading.outerHeight() / 2 + "px";
        //this.options.left = this.$loading.outerWidth() / 2 + "px";
        this.spinner = new Spinner(this.options);
    };

    Loading.prototype.show = function (isImg,isFull) {
        if (isShow) { return; }
        isShow = true;

        if (isFull) {
            this.$loading.addClass('k-loading-full');
        } else {
            this.$loading.removeClass('k-loading-full');
        }

        isImg = typeof isImg == 'undefined' ? true : isImg;

        if (isImg) {
            this.$loading.addClass('k-loading-img');
            this.$loading.show();
        }else{
            this.spinner.spin(this.$loading.get(0));
            this.$loading.removeClass('k-loading-img');
            this.$loading.fadeIn('fast');
        }
        

    };

    Loading.prototype.hide = function () {
        var self = this;
        this.$loading.stop().hide();
        this.spinner.stop();
        isShow = false;
    };

    Loading.show = function (isPic, isFull) {
        if (!global) {
            global = new Loading();
        }
        global.show(isPic,isFull);
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
define('km/magnifier', ['jquery'], function ($) {

    /**
     * 放大镜模块
     * @constructor
     * @alias km/magnifier
     * @param {JQuery} $el - dom
     * @param {Object} options - 参数设置
     */
    var Magnifier = function ($el, options) {
        this.options = $.extend(true, {
            offset: 10,
            width: 400,
            height: 250,
            zoomWidth: 400,
            zoomHeight: 400,
            zIndex: 100
        }, options);
        this.$el = $el;
        this._isLoading = false;
        this.init();
    };

    /**
     * 初始化
     * @return {Void}   
     */
    Magnifier.prototype.init = function () {
        this.create();
        this.watch();
    };

    /**
     * 事件监控
     * @return {Void}   
     */
    Magnifier.prototype.watch = function () {
        var self = this;
       

        this.$el.on('mousemove.magnifier', function (e) {
            var src = self.$img.attr('data-big-img');

            self.$view.show();

            if (self.$viewImg.attr('data-isLoad') == 'true') {
                self.$selector.show();
                self.setPosition(e);
            } else {

                self.$viewImg.hide();

                if (self._isLoading) {
                    return;
                }

                self._isLoading = true;

                self.loadImg(src, function (success, size) {

                    self.$viewLoading.hide();

                    self._isLoading = false;

                    self.$viewImg.attr({
                        'src': src,
                        'data-isLoad': true
                    }).show();

                    self.$selector.width(self.options.zoomWidth / (size.width / self.options.width))
                                  .height(self.options.zoomHeight / (size.height / self.options.height));
                    
                });
            }


        }).on('mouseleave.magnifier', function (e) {
            self.$view.hide();
            self.$selector.hide();
        });
    };

    /**
     * 创建
     * @return {Void}   
     */
    Magnifier.prototype.create = function () {

        this.$el.width(this.options.width).height(this.options.height);

        this.$imgBox = this.$el.find('.k-magnifier-imgbox').css({
            width: this.options.width,
            height: this.options.height
        });

        this.$img = this.$el.find('.k-magnifier-imgbox img');

        this.$view = $('<div class="k-magnifier-view"><img src="" /><div class="k-magnifier-loading"><span class="fa fa-spinner fa-spin"></span><br/>图片加载中，请稍候...</div></div>')
            .appendTo(this.$el)
            .css({
                width: this.options.zoomWidth,
                height: this.options.zoomHeight,
                left: this.$imgBox.position().left + this.options.width + this.options.offset,
                top: this.$imgBox.position().top,
                zIndex:this.options.zIndex
            });

        this.$viewLoading = this.$view.find('.k-magnifier-loading');
        this.$viewImg = this.$view.find('img');

        this.$selector = $('<div class="k-magnifier-selector"></div>')
            .appendTo(this.$imgBox)
            .css({
                left: 0,
                top:0
            });
    };

    /**
     * 加载图片
     * @return {Void}   
     */
    Magnifier.prototype.loadImg = function (src, callback) {
        var img = new Image();

        img.onload = function () {
            callback(true, { width: img.width, height: img.height });
        };
        img.onerror = function () {
            callback(false, { width: 0, height: 0 });
        };

        img.src = src;
    };

    /**
     * 设置位置
     * @return {Void}   
     */
    Magnifier.prototype.setPosition = function (e) {
        var x = e.pageX,
            y = e.pageY,
            left = x - this.$el.offset().left,
            top = y - this.$el.offset().top,
            selectorWidth = this.$selector.outerWidth(),
            selectorHeight = this.$selector.outerHeight(),
            maxLeft = this.options.width - selectorWidth,
            maxTop = this.options.height - selectorHeight,
            percentX, percentY;

        left = left - selectorWidth / 2;
        top = top - selectorHeight / 2;

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



        percentX = left / (this.$el.width() - selectorWidth);
        percentY = top / (this.$el.height() - selectorHeight);


        this.$selector.css({
            left: left,
            top: top
        });


        this.$viewImg.css({
            width: this.options.zoomWidth / selectorWidth * this.options.width,
            height: this.options.zoomHeight / selectorHeight * this.options.height,
            left: -percentX * (this.$viewImg.width() - this.$view.width()),
            top: -percentY * (this.$viewImg.height() - this.$view.height())
        })
    };

    return function ($elm,options) {
        var magnifier =new Magnifier($elm,options);
        return magnifier;
    }
});

/*
 * 遮罩模块
 * @date:2016-05-09
 * @author:kotenei(kotenei@qq.com)
 */
define('km/mask', ['jquery'], function ($) {
    
    var $mask=$('<div class="k-mask"></div>').appendTo(document.body);
    
    var exports={
        show:function (content) {
            $mask.html(content).fadeIn();
        },
        hide:function () {
            if($mask) {
                $mask.fadeOut();
            }
        }
    };
    return exports;
});
/*
 * 分页模块
 * @date:2014-09-14
 * @author:kotenei(kotenei@qq.com)
 */
define('km/pager', ['jquery', 'km/event'], function ($, event) {

    /**
     * 分页模块
     * @param {JQuery} $element - dom
     * @param {Object} options - 参数设置
     */
    var Pager = function ($element, options) {
        this.$element = $element;
        this.options = $.extend(true, {
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
        this.$pager.on('click.pager', 'li', function () {
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
        html.push('<li class="' + className + '" data-page="' + info.pre + '" ><a href="javascript:void(0);"><<</a></li>');

        for (var i = info.start; i <= info.end; i++) {
            className = (i === this.curPage) ? 'active' : '';
            html.push('<li class="' + className + '" data-page="' + i + '" ><a href="javascript:void(0);">' + i + '</a></li>');
        }

        className = this.curPage !== info.allPage ? '' : 'disabled';
        html.push('<li class="' + className + '" data-page="' + info.next + '" ><a href="javascript:void(0);">>></a></li>');

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
 * ����ģ��
 * @date:2015-08-21
 * @author:kotenei(kotenei@qq.com)
 */
define('km/panel', ['jquery', 'km/resizable'], function ($, Resizable) {

    /**
     * ������
     * @param {JQuery} $elm - dom
     * @param {Object} options - ����
     */
    var Panel = function ($elm, options) {
        this.$panel = $elm;
        this.options = $.extend(true, {
            width: 'auto',
            height: 'auto',
            minWidth: 100,
            minHeight: 100,
            resizable: {
                enabled: false,
                cover: false,
                border: {
                    left: true,
                    top: true,
                    right: true,
                    bottom: true
                },
                callback: {
                    resize: $.noop,
                    stop: $.noop
                }
            },
        }, options);
        this.init();
    };

    /**
     * ��ʼ��
     * @return {Void}
     */
    Panel.prototype.init = function () {
        var self = this;
        this.$panel.css({
            width: this.options.width,
            height: this.options.height
        });

        this.$header = this.$panel.find('.k-panel-head');
        this.$title = this.$header.find('.k-panel-title');
        this.$body = this.$panel.find('.k-panel-body');
        this.$body.css('height', this.$panel.height() - this.$title.height());

        this.headHeight = this.$header.outerHeight();

        if (this.options.resizable.enabled) {
            this.resizable = new Resizable(this.$panel, {
                border: this.options.resizable.border,
                cover: this.options.resizable.cover,
                minWidth: this.options.minWidth,
                minHeight: this.options.minHeight,
                $range: this.$panel.parent()
            });
        }

        this._event = {
            slideDown: $.noop,
            slideUp: $.noop
        };

        this.watch();
    };

    /**
     * �¼�����
     * @return {Void}
     */
    Panel.prototype.watch = function () {
        var self = this;
        this.$panel.on('click.panel', 'span[role=slideup]', function () {
            self.slideUp($(this));
        })
        .on('click.panel', 'span[role=slidedown]', function () {
            self.slideDown($(this));
        });

        if (this.resizable) {
            this.resizable.on('resize', function (css) {
                self.setBodyHeight(css.height);
                self.options.resizable.callback.resize.call(self, css);
            }).on('stop', function (css) {
                self.options.resizable.callback.stop.call(self, css);
            });
        }
    };

    /**
     * �����Զ����¼�
     * @return {Void}
     */
    Panel.prototype.on = function (type, callback) {
        this._event[type] = callback || $.noop;
        return this;
    };

    /**
     * �������ݸ߶�
     * @return {Void}
     */
    Panel.prototype.setBodyHeight = function (height) {
        height = height || this.$panel.height();
        var h = height - this.headHeight;
        this.$body.css('height', h);
    };

    /**
     * ���������ߴ�
     * @return {Void}
     */
    Panel.prototype.setSize = function (size) {
        this.$panel.css({
            width: size.width,
            height: size.height
        });
        this.setBodyHeight(size.height);
    };

    /**
     * չ��
     * @return {Void}
     */
    Panel.prototype.slideDown = function ($el) {
        var self = this;
        $el.attr('role', 'slideup');
        if ($el.hasClass('fa-angle-double-down')) {
            $el.removeClass('fa-angle-double-down').addClass('fa-angle-double-up');

            this.$panel.stop().animate({
                height: this.orgHeight
            });
            this.$body.stop().animate({
                height: this.orgHeight - this.headHeight,
                display: 'block'
            }, function () {
                if (self.resizable) {
                    self.resizable.$bottomHandle.show();
                }
            });

            this._event.slideDown.call(this);

            return;
        }
    };

    /**
     * �۵�
     * @return {Void}
     */
    Panel.prototype.slideUp = function ($el) {
        var h, self = this;

        this.orgHeight = this.$panel.outerHeight();

        $el.attr('role', 'slidedown');
        if ($el.hasClass('fa-angle-double-up')) {
            $el.removeClass('fa-angle-double-up').addClass('fa-angle-double-down');

            this.$panel.stop().animate({
                height: this.headHeight
            });
            this.$body.stop().animate({
                height: 0
            }, function () {
                self.$body.hide();
                if (self.resizable) {
                    self.resizable.$bottomHandle.hide();
                }
            });

            this._event.slideUp.call(this);

            return;
        }
    };

    /**
     * ȫ�ֳ�ʼ������
     * @return {Void}
     */
    Panel.Global = function ($elms) {
        $elms = $elms || $('div[data-module=panel]');
        $elms.each(function () {
            var $el = $(this),
                options = $el.attr('data-options'),
                onSlideDown = $el.attr('data-onslidedown'),
                onSlideUp = $el.attr('data-onslideup'),
                data = $.data($el[0], 'panel');



            if (!data) {

                if (options && options.length > 0) {
                    options = eval('(0,' + options + ')');
                }

                onSlideDown = onSlideDown && onSlideDown.length > 0 ? eval('(0,' + onSlideDown + ')') : $.noop;
                onSlideUp = onSlideUp && onSlideUp.length > 0 ? eval('(0,' + onSlideUp + ')') : $.noop;

                data = new Panel($el, options);

                data.on('slideDown', function () {
                    onSlideDown.call(this);
                }).on('slideUp', function () {
                    onSlideUp.call(this);
                });

                $.data($el[0], 'panel', data);
            }

        });
    }

    return Panel;
});
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
/*
 * 弹出框模块
 * @date:2014-11-05
 * @author:kotenei(kotenei@qq.com)
 */
define('km/popover', ['jquery', 'km/tooltips', 'km/util'], function ($, Tooltips, util) {

    /**
     * 弹出框模块
     * @param {JQuery} $element - dom
     * @param {Object} options - 参数
     */
    var Popover = function ($element, options) {
        options = $.extend(true, {
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

                var options = $this.attr('data-options');

                if (options && options.length > 0) {
                    options = eval('(0,' + options + ')');
                } else {
                    options = {
                        title: $this.attr('data-title'),
                        content: $this.attr('data-content'),
                        placement: $this.attr('data-placement'),
                        tipClass: $this.attr('data-tipClass'),
                        trigger: $this.attr('data-trigger')
                    };
                }

                popover = new Popover($this, options);
                Popover.Set($this, popover);
            }
        });
    };

    /**
     * 从缓存获取对象
     * @param {JQuery} $element - dom
     */
    Popover.Get = function ($element) {
        return $.data($element[0],'popover');
    };

    /**
     * 设置缓存
     * @param {JQuery} $element - dom
     * @param {Object} popover - 缓存对象
     */
    Popover.Set = function ($element, popover) {
        $.data($element[0], 'popover', popover);
    };

    return Popover;
});
/*
 * 弹出提示模块
 * @date:2014-09-10
 * @author:kotenei(kotenei@qq.com)
 */
define('km/popTips', ['jquery'], function ($) {

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

define('km/portlets', ['jquery', 'km/window', 'km/dragdrop'], function ($, Window, Dragdrop) {

    var groupSortable,
        webPartSortable;

    var groupMoving = false,
        isSetGroup = false;

    var method = {
        group: {
            init: function ($container, options) {
                //组排序
                groupSortable = Dragdrop.sortable($container, {
                    $scrollWrap:options.$scrollWrap,
                    draggable: 'div.group',
                    handle: 'div.group-head-handle',
                    boundary: true,
                    direction: 'v',
                    callback: {
                        init: function () {

                        },
                        start: options.callback.start,
                        move: options.callback.move,
                        stop: options.callback.stop
                    }
                });
            },
            toggle: function ($el, options) {
                var $group = $el.parents('div.group:eq(0)'),
                    $body = $group.find('div.group-body');

                if ($el.hasClass('fa-minus-square-o')) {
                    $el.removeClass('fa-minus-square-o').addClass('fa-plus-square-o');
                    options.callback.hide($el);
                } else {
                    $el.removeClass('fa-plus-square-o').addClass('fa-minus-square-o');
                    options.callback.show($el);
                }

                $group.toggleClass('group-hide');

                webPartSortable.setInfo();
                groupSortable.setInfo();
            },
            refresh: function () {

            },
            close: function ($el) {
                var $group = $el.parents('div.group:eq(0)'),
                    sortable = $group.data('sortable');
                Window.confirm('删除', '您确认要删除该模块吗？', function () {

                    var $webParts = sortable.$layer.find('div.webPart'),
                        sortables = [];

                    $webParts.each(function () {
                        var sortable = $(this).data('sortable');
                        if (sortable) {
                            sortables.push(sortable);
                        }
                    });

                    //删除组排序项
                    groupSortable.removeSortable(sortable);

                    //删除部件中的组
                    webPartSortable.removeGroup($group);

                    //删除部件排序项
                    webPartSortable.removeSortables(sortables);

                });
            }
        },
        webpart: {
            init: function ($container, options) {

                //项排序
                webPartSortable = Dragdrop.sortable($container, {
                    $scrollWrap: options.$scrollWrap,
                    draggable: 'div.webPart',
                    droppable: 'div.column',
                    group: 'div.group',
                    handle: 'div.webPart-head-handle',
                    boundary: true,
                    callback: {
                        init: function (sortable) {
                            sortable.portletsOptions = eval('(0,' + sortable.$layer.attr('data-options') + ')');
                        },
                        start: options.callback.start,
                        move: options.callback.move,
                        stop: options.callback.stop
                    }
                });
            },
            toggle: function ($el, options) {
                var $panel = $el.parents('div.webPart:eq(0)'),
                    $body = $panel.find('div.webPart-body');

                if ($el.hasClass('fa-minus-square-o')) {
                    $el.removeClass('fa-minus-square-o').addClass('fa-plus-square-o');
                    options.callback.hide($el);
                } else {
                    $el.removeClass('fa-plus-square-o').addClass('fa-minus-square-o');
                    options.callback.show($el);
                }

                $panel.toggleClass('webPart-hide');

                webPartSortable.setInfo();
                groupSortable.setInfo();
            },
            refresh: function () {

            },
            setting: function () {

            },
            close: function ($el) {
                var $layer = $el.parents('div.webPart:eq(0)'),
                    sortable = $layer.data('sortable');

                Window.confirm('删除', '您确认要删除该模块吗？', function () {
                    webPartSortable.removeSortable(sortable);
                });
            }
        }
    };




    return function ($container, options) {

        var tm;

        options = $.extend(true, {
            group: {
                callback: {
                    init: $.noop,
                    hide: $.noop,
                    show: $.noop,
                    start: $.noop,
                    move: $.noop,
                    stop: $.noop
                }
            },
            webpart: {
                callback: {
                    init: $.noop,
                    hide: $.noop,
                    show: $.noop,
                    start: $.noop,
                    move: $.noop,
                    stop: $.noop
                }
            }
        }, options);


        method.group.init($container, options.group);

        method.webpart.init($container, options.webpart);


        //事件监控
        $container.off('click.portlets').on('click.portlets', '[data-role=gtoggle]', function () {
            //组显示隐藏
            method.group.toggle($(this), options.group);
            return false;
        }).on('click.portlets', '[data-role=grefresh]', function () {
            //组刷新
            method.group.refresh();
            return false;
        }).on('click.portlets', '[data-role=gclose]', function () {
            //组关闭
            method.group.close($(this));
            return false;
        }).on('click.portlets', '[data-role=wtoggle]', function () {
            //部件显示隐藏
            method.webpart.toggle($(this), options.webpart);
            return false;
        }).on('click.portlets', '[data-role=wrefresh]', function () {
            //部件刷新
            method.webpart.refresh();
            return false;
        }).on('click.portlets', '[data-role=wsetting]', function () {
            //部件设置
            method.webpart.setting();
            return false;
        }).on('click.portlets', '[data-role=wclose]', function () {
            //部件关闭
            method.webpart.close($(this));
            return false;
        })

        $(window).off('resize.portlets')
                .on('resize.portlets', function () {
                    if (tm) {
                        clearTimeout(tm);
                    }
                    tm = setTimeout(function () {
                        groupSortable.setInfo();
                        webPartSortable.setInfo();
                    }, 300);
                });

        return {
            groupSortable: groupSortable,
            webPartSortable: webPartSortable,
            destory: function () {
                groupSortable.destory();
                webPartSortable.destory();
            }
        };
    };
});
/*
 * 评级模块
 * @date:2015-07-17
 * @author:kotenei(kotenei@qq.com)
 */
define('km/rating', ['jquery', 'km/event'], function ($, event) {

    /**
     * 私有方法
     * @Object   
     */
    var method = {
        _createStar: function () {
            var html = [],
                icon,
                title;

            for (var i = 1; i <= this.options.number; i++) {
                title = method._getTitle.call(this, i);
                icon = (this.options.score && this.options.score >= i) ? 'starOn' : 'starOff';
                icon = this.options.path + this.options[icon];
                html.push('<img src="' + icon + '" alt="' + i + '" title="' + title + '" style="padding-left:' + this.options.space + 'px;" />');
            }

            this.$stars = $(html.join('')).appendTo(this.$starBox);
        },
        _createScore: function () {
            if (!this.options.scoreName || !this.options.score) {
                return;
            }
            this.$score = $('<input/>', {
                type: 'hidden',
                name: this.options.scoreName,
                value: this.options.score
            }).appendTo(this.$el);
        },
        _getMin: function (value, min, max) {
            return Math.min(Math.max(parseFloat(value), min), max);
        },
        _getTitle: function (score) {
            var value = this.options.values[parseInt(score) - 1];
            return (value === '') ? '' : (value || score);
        },
        _setStar: function (score) {

            var rest = (score - Math.floor(score)).toFixed(2);

            if (rest > this.options.round.down) {

                var icon = 'starOn';

                if (this.options.half && rest < this.options.round.up) {
                    icon = 'starHalf';
                } else if (rest < this.options.round.full) {
                    icon = 'starOff';
                }

                this.$stars.eq(Math.ceil(score) - 1).attr('src', this.options.path + this.options[icon]);
            }

        },
        _fill: function (score) {
            var self = this,
                icon;

            this.$stars.each(function (index) {
                icon = index <= (score - 1) ? 'starOn' : 'starOff';
                $(this).attr('src', self.options.path + self.options[icon]);
            });
        },
        _setScore: function (score) {
            if (!this.$score) {
                return;
            }
            this.$score.val(score);
        },
        _setValue: function (value) {
            if (!this.$target || this.$target[0].tagName.toLowerCase() !== 'input') {
                return;
            }
            this.$target.val(value);
        }
    };

    /**
     * 评级模块
     * @constructor
     * @alias kotenei/rating
     * @param {JQuery} $el - dom
     * @param {Object} options - 参数设置
     */
    var Rating = function ($el, options) {
        this.$el = $el;
        this.options = $.extend(true, {
            path: '../images/star',
            starOff: 'star-off.png',
            starHalf: 'star-half.png',
            starOn: 'star-on.png',
            target: '.k-rating-target',
            number: 3,
            values: [1, 2, 3],
            score: 0,
            scoreName: undefined,
            round: { down: .25, full: .6, up: .76 },
            half: true,
            size: 24,
            space: 4
        }, options);
        this.event = event;
        this._tmpScore = 0;
        this.init();
    };

    /**
     * 初始化
     * @return {Void}   
     */
    Rating.prototype.init = function () {
        this.options.score = this.options.score < 0 ? 0 : this.options.score;
        this._tmpScore = this.options.score;
        this.$starBox = this.$el.find('.k-rating-star');
        this.$target = this.$el.find(this.options.target);

        if (this.options.path &&
            this.options.path.slice(this.options.path.length - 1, this.options.path.length) !== '/') {
            this.options.path += '/';
        }

        method._createStar.call(this);
        method._createScore.call(this);
        method._setStar.call(this, this.options.score);

        this.watch();
    };

    /**
     * 事件监控
     * @return {Void}   
     */
    Rating.prototype.watch = function () {
        var self = this;
        this.$el.on('mousemove.rating', 'img', function (e) {
            var $el = $(this),
                score = parseInt($el.attr('alt')),
                left = $el.offset().left,
                x = e.pageX,
                position = (x - left) / (self.options.size),
                plus = (position > .5) ? 1 : .5,
                value;

            if (self.options.half) {

                score = score - 1 + plus;

                method._fill.call(self, score);

                method._setStar.call(self, score);

                method._setScore.call(self, score);

            } else {
                method._fill.call(self, score);
            }

            value = method._getTitle.call(self, $el.attr('alt'));

            self._tmpScore = score;

            method._setValue.call(self, value);

            self.event.trigger('mousemove.rating', [score, value]);

        }).on('mouseleave.rating', '.k-rating-star', function () {
            var icon,
                value;

            self._tmpScore = self.options.score;

            self.$stars.each(function (index) {
                icon = (self.options.score && self.options.score - 1 >= index) ? 'starOn' : 'starOff';
                $(this).attr('src', self.options.path + self.options[icon]);
            });

            method._setStar.call(self, self.options.score);

            method._setScore.call(self, self.options.score);

            if (self.options.score > self.options.round.down) {
                value = method._getTitle.call(self, Math.ceil(self.options.score));
            } else {
                value = "";
            }

            method._setValue.call(self, value);

            self.event.trigger('mouseleave.rating', [self.options.score, value]);

        }).on('click.rating', 'img', function () {
            var value;
            self.options.score = self._tmpScore;
            method._setStar.call(self, self.options.score);
            method._setScore.call(self, self.options.score);
            value = method._getTitle.call(self, Math.round(self.options.score));
            method._setValue.call(self, value);
            self.event.trigger('click.rating', [self.options.score, value]);
        });
    };

    /**
     * 事件添加
     * @return {Void}   
     */
    Rating.prototype.on = function (name, callback) {
        var self = this;
        this.event.on(name + '.rating', function (args) {
            callback.apply(self, args);
        });
        return this;
    };


    return Rating;
});

/*
 * ����ģ��
 * @date:2015-08-21
 * @author:kotenei(kotenei@qq.com)
 */
define('km/resizable', ['jquery'], function ($) {

    var $cover = $('<div class="k-resizable-cover"></div>').appendTo(document.body);

    var util = {
        getPosition: function ($cur, $target) {

            var curOffset = $cur.offset(),
                targetOffset = $target.offset();

            return {
                left: curOffset.left - targetOffset.left,
                top: curOffset.top - targetOffset.top,
                offsetLeft: curOffset.left,
                offsetTop: curOffset.top
            };
        },
        getOffsetParent: function ($cur, $target) {
            var isRoot = true;
            var $parent = $cur.parent();

            var info = {
                isRoot: false,
                left: 0,
                top: 0,
                pLeft: 0,
                pTop: 0,
                $el: null
            };

            var offset, position;

            while ($parent[0] != $target[0]) {
                position = $parent.css('position');
                if (position == 'relative' || position == 'absolute') {
                    info.left = $parent.offset().left;
                    info.top = $parent.offset().top;
                    info.pLeft = info.left - $target.offset().left;
                    info.pTop = info.top - $target.offset().top;
                    info.$el = $parent;
                    info.isRoot = true;
                    return info;
                }
                $parent = $parent.parent();
            }

            return info;
        }
    };

    /**
     * ������
     * @param {JQuery} $elm - dom
     * @param {Object} options - ����
     */
    var Resizable = function ($elm, options) {
        this.$elm = $elm;
        this.options = $.extend(true, {
            $range: this.$elm.parent(),
            minBar: false,
            scale: false,
            cover: true,
            minWidth: 100,
            minHeight: 100,
            border: {
                left: true,
                top: true,
                right: true,
                bottom: true
            }
        }, options);

        //ԭ������
        this.originalCoord = { x: 0, y: 0 };
        //���������϶���ƫ��ֵ
        this.offset = { x: 0, y: 0 };
        //���Ų���
        this.resizeParams = { left: 0, top: 0, width: 0, height: 0, ratio: 1, type: 'bottom' };

        this.moving = false;
        this.minWidth = this.options.minWidth;
        this.minHeight = this.options.minHeight;

        this._event = {
            resize: $.noop,
            stop: $.noop
        };

        this.init();
    };

    /**
     * ��ʼ��
     * @return {Void}
     */
    Resizable.prototype.init = function () {

        var html = [];
        html.push('<div class="k-resizable-handle k-resizable-handle-left" role="resizable" data-type="left"></div>');
        html.push('<div class="k-resizable-handle k-resizable-handle-top" role="resizable" data-type="top"></div>');
        html.push('<div class="k-resizable-handle k-resizable-handle-right" role="resizable" data-type="right"></div>');
        html.push('<div class="k-resizable-handle k-resizable-handle-bottom" role="resizable" data-type="bottom"></div>');
        html.push('<div class="k-resizable-handle-minbar" role="resizable" data-type="bottomRight"></div>');
        this.$elm.addClass('k-resizable-container').append(html.join(''));
        this.$leftHandle = this.$elm.find('.k-resizable-handle-left');
        this.$topHandle = this.$elm.find('.k-resizable-handle-top');
        this.$rightHandle = this.$elm.find('.k-resizable-handle-right');
        this.$bottomHandle = this.$elm.find('.k-resizable-handle-bottom');
        this.$minbar = this.$elm.find('.k-resizable-handle-minbar');

        this.$range = this.options.$range.css("position", "relative");
        this.$doc = $(document);
        this.$win = $(window);
        this.$body = $(document.body);

        if (this.options.border.left) {
            this.$leftHandle.show();
        }

        if (this.options.border.top) {
            this.$topHandle.show();
        }

        if (this.options.border.right) {
            this.$rightHandle.show();
        }

        if (this.options.border.bottom) {
            this.$bottomHandle.show();
        }

        if (this.options.minBar) {
            this.$minbar.show();
        }

        this.watch();
    };

    /**
     * �¼�����
     * @return {Void}
     */
    Resizable.prototype.watch = function () {
        var self = this;

        this.$elm.on('mousedown.resizable', '[role=resizable]', function (e) {
            var $el = $(this);
            self.resizeParams.top = parseInt(self.$elm.position().top);
            self.resizeParams.left = self.$elm.position().left;
            self.resizeParams.width = parseInt(self.$elm.outerWidth(true));
            self.resizeParams.height = parseInt(self.$elm.outerHeight(true));
            self.resizeParams.ratio = self.resizeParams.width >= self.resizeParams.height ? self.resizeParams.width / self.resizeParams.height : self.resizeParams.height / self.resizeParams.width;
            self.resizeParams.type = $el.attr('data-type');
            self.showCover();
            e.stopPropagation();
            e.preventDefault();
            self.start(e, $el);
            document.onselectstart = function () { return false };
        });
    };

    /**
     * �����Զ����¼�
     * @param {String} type - �¼�����
     * @param {Function} options - �¼��ص�
     * @return {Void}
     */
    Resizable.prototype.on = function (type, callback) {
        this._event[type] = callback || $.noop;
        return this;
    };

    /**
     * ��ʼ����
     * @return {Void}
     */
    Resizable.prototype.start = function (e, $handle) {
        var self = this;

        this.$doc.on('mousemove.resizable', function (e) {
            self.resize(e)
        }).on('mouseup.resizable', function (e) {
            self.stop(e, $handle);
            self.$doc.off('mousemove.resizable');
            self.$doc.off('mouseup.resizable');
        });

        this.moving = true;

        this.winHeight = this.$win.height();
        this.docHeight = this.$doc.height();

        //��ȡ����λ��
        var mouseCoord = this.getMouseCoord(e);

        var position = util.getPosition(this.$elm, this.$range ? this.$range : this.$body);

        //��¼�������϶���������λ��
        this.offset.x = mouseCoord.x - position.left;
        this.offset.y = mouseCoord.y - position.top;

        this.offset.click = {
            left: mouseCoord.x - position.offsetLeft,
            top: mouseCoord.y - position.offsetTop
        };

        this.offset.parent = util.getOffsetParent(this.$elm, this.$range ? this.$range : this.$body);


        //��¼����������������
        this.originalCoord.x = mouseCoord.x;
        this.originalCoord.y = mouseCoord.y;


        //��׽���������÷�Χ����ֹ�����ƶ����춪ʧ
        if ($handle[0].setCapture) {
            $handle[0].setCapture();
        }

        this.css = {
            left: this.resizeParams.left,
            top: this.resizeParams.top,
            width: this.resizeParams.width,
            height:this.resizeParams.height
        };

    };

    /**
     * ����
     * @return {Void}
     */
    Resizable.prototype.resize = function (e) {

        var mouseCoord = this.getMouseCoord(e),
            moveCoord = {
                x: parseInt(mouseCoord.x - this.offset.x),
                y: parseInt(mouseCoord.y - this.offset.y)
            },
            css = {},
            resizeParams = this.resizeParams,
            $range = this.options.$range,
            rw, rh;

        if ($range) {
            rw = $range.outerWidth();
            rh = $range.outerHeight();
        } else {
            rw = this.$win.width() + this.$doc.scrollLeft();
            rh = this.$win.height() + this.$doc.scrollTop();
        }

        switch (this.resizeParams.type) {
            case 'left':
                css.top = resizeParams.top;
                css.height = resizeParams.height;

                if (moveCoord.x <= 0) {
                    css.left = -this.offset.parent.pLeft;
                    css.width = resizeParams.width + this.offset.parent.pLeft + resizeParams.left;
                } else {
                    css.left = this.offset.parent.isRoot ? mouseCoord.x - this.offset.click.left - this.offset.parent.left : moveCoord.x;
                    css.width = resizeParams.width + (this.originalCoord.x - mouseCoord.x);
                }

                if (css.width <= this.minWidth) {
                    css.width = this.minWidth;
                    css.left = resizeParams.left + (resizeParams.width - css.width);
                }
                break;
            case 'top':
                css.top = this.offset.parent.isRoot ? mouseCoord.y - this.offset.click.top - this.offset.parent.top : moveCoord.y;
                css.left = resizeParams.left;
                css.width = resizeParams.width;
                css.height = resizeParams.height + (this.originalCoord.y - mouseCoord.y);

                if (css.top < -this.offset.parent.pTop) {
                    css.top = -this.offset.parent.pTop;
                    css.height = resizeParams.height + this.offset.parent.pTop + resizeParams.top;
                }

                if (css.height <= this.minHeight) {
                    css.height = this.minHeight;
                    css.top = resizeParams.top + (resizeParams.height - css.height);
                }
                break;
            case 'right':
                css.top = resizeParams.top;
                css.left = resizeParams.left;
                css.height = resizeParams.height;
                css.width = resizeParams.width - (this.originalCoord.x - mouseCoord.x);

                if ((css.width + this.offset.parent.pLeft + css.left) >= rw) {
                    css.width = rw - this.offset.parent.pLeft - css.left;
                }
                if (css.width <= this.minWidth) {
                    css.width = this.minWidth;
                }
                break;
            case 'bottom':
                css.top = resizeParams.top;
                css.left = resizeParams.left;
                css.width = resizeParams.width;
                css.height = resizeParams.height - (this.originalCoord.y - mouseCoord.y);

                if ((css.height + this.offset.parent.pTop + css.top) >= rh) {
                    css.height = rh - this.offset.parent.pTop - css.top;
                }

                if (css.height <= this.minHeight) {
                    css.height = this.minHeight;
                }
                break;
            case 'bottomRight':
                css.top = resizeParams.top;
                css.left = resizeParams.left;
                css.width = resizeParams.width - (this.originalCoord.x - mouseCoord.x);
                css.width = css.width < this.minWidth ? this.minWidth : css.width;
                css.height = this.getScaleHeight(css.width);


                if ((css.width + this.offset.parent.pLeft + css.left) >= rw) {
                    css.width = rw - this.offset.parent.pLeft - css.left;
                    css.height = this.getScaleHeight(css.width);
                }

                if ((css.height + this.offset.parent.pTop + css.top) >= rh) {
                    css.height = rh - this.offset.parent.pTop - css.top;
                    css.width = this.getScaleWidth(css.height);
                }
                break;
        }

        this.css = css;


        if (this.options.cover) {
            $cover.css(css);
        } else {
            this.$elm.css(css);
        }

        this._event.resize.call(this, css);
    };

    /**
     * ֹͣ����
     * @return {Void}
     */
    Resizable.prototype.stop = function (e, $handle) {

        this.moving = false;
        this.hideCover();

        if (this.options.cover) {
            this.$elm.css(this.css);
        }

        if ($handle[0].releaseCapture) {
            $handle[0].releaseCapture();
        }

        this._event.stop.call(this, this.css);
    };

    /**
     * ��ʾ���ǲ�
     * @return {Void}
     */
    Resizable.prototype.showCover = function () {

        if (!this.options.cover) {
            return;
        }

        var $el = this.$elm;

        $cover.insertAfter(this.$elm).show().css({
            width: $el.outerWidth(),
            height: $el.outerHeight(),
            left: $el.position().left,
            top: $el.position().top
        });
    };

    /**
     * ���ظ��ǲ�
     * @return {Void}
     */
    Resizable.prototype.hideCover = function () {
        $cover.hide();
    };

    /**
     * ȡ��������
     * @return {Object}
     */
    Resizable.prototype.getMouseCoord = function (e) {
        return {
            x: parseInt(e.pageX || e.clientX + document.body.scrollLeft - document.body.clientLeft),
            y: parseInt(e.pageY || e.clientY + document.body.scrollTop - document.body.clientTop)
        };
    };

    /**
     * ȡ���ſ���
     * @return {Int}
     */
    Resizable.prototype.getScaleWidth = function (height, ratio) {
        ratio = ratio || this.resizeParams.ratio;
        if (this.resizeParams.width >= this.resizeParams.height) {
            return height * ratio;
        } else {
            return height / ratio;
        }
    };

    /**
    * ȡ���Ÿ߶�
    * @return {Int}
    */
    Resizable.prototype.getScaleHeight = function (width, ratio) {
        ratio = ratio || this.resizeParams.ratio;
        if (this.resizeParams.width >= this.resizeParams.height) {
            return width / ratio;
        } else {
            return width * ratio;
        }
    };

    /**
     * ȫ�ֳ�ʼ������
     * @return {Void}
     */
    Resizable.Global = function ($elms) {
        $elms = $elms || $('[data-module=resizable]');
        $elms.each(function () {
            var $el = $(this),
                options = $el.attr('data-options'),
                onResize = $el.attr('data-onresize'),
                onStop = $el.attr('data-onstop'),
                data =$.data($el[0],'resizable');

            if (options && options.length > 0) {
                options = eval('(0,' + options + ')');
            }

            onResize = onResize && onResize.length > 0 ? eval('(0,' + onResize + ')') : $.noop;
            onStop = onStop && onStop.length > 0 ? eval('(0,' + onStop + ')') : $.noop;

            if (!data) {

                data = new Resizable($el, options);

                data.on('resize', function (css) {
                    onResize.call(this, css);
                }).on('stop', function (css) {
                    onStop.call(this, css);
                });

                $.data($el[0], 'resizable', data);
            }

        });
    }

    return Resizable;

});
/**
 * 路由
 * @date :2014-09-21
 * @author kotenei(kotenei@qq.com)
 */
define('km/router', [], function () {
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
     * @param  {String} constraints - 正则约束
     * @param  {Function} callback - 回调函数
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

    return Router;
});
/*
 * 滚动图片
 * @date:2016-03-17
 * @author:kotenei(kotenei@qq.com)
 */
define('km/scrollImg', ['jquery'], function ($) {

    var ScrollImg = function ($el, options) {
        this.$el = $el;
        this.options = $.extend(true, {
            padding: 30,
            delay: 3000,
            width: 'auto',
            height: 150,
            showNum: 3,
            toggleDealy:700
        }, options);
        this.init();
    };

    /**
     * 初始化
     * @return {Void}   
     */
    ScrollImg.prototype.init = function () {
        var $lis;
        this.tm = null;
        this.isStop = false;
        this.$prev = this.$el.find('div.k-scrollImg-prev');
        this.$next = this.$el.find('div.k-scrollImg-next');
        this.$container = this.$el.find('div.k-scrollImg-container').css({
            width: this.options.width,
            height: this.options.height
        });
        this.$el.css({
            paddingLeft: this.options.padding,
            paddingRight: this.options.padding,
            width: this.options.padding * 2 + this.$container.outerWidth()
        });
        this.$ul = this.$container.find('ul');
        var $lis = this.$ul.children('li');
        if ($lis.length <= this.options.showNum) {
            this.options.showNum = $lis.length;
        }
        this.crateItem();
        $lis = this.$ul.children('li');
        this.total = $lis.length / this.options.showNum;
        this.max = this.total - 2;
        this.index = 0;
        if (this.max > 1) {
            this.$ul.css("marginLeft", -(this.index + 1) * this.options.showNum * this.i_w);
            this.run();
            this.watch();
        }
    };

    /**
     * 创建项
     * @return {Void}   
     */
    ScrollImg.prototype.crateItem = function () {
        var $lis = this.$ul.children('li');
        var width = this.$container.outerWidth();
        var html = [];
        var margin = 10;
        var flag = 0;
        var totalWidth = 0;
        var li_w = width / this.options.showNum - margin;
        var len = $lis.length;
        this.i_w = li_w + margin;

        if (len % this.options.showNum != 0) {
            for (var i = 0; i < len; i++) {
                for (var j = 0; j < this.options.showNum; j++) {
                    html.push($lis[flag].outerHTML);
                    totalWidth += this.i_w;
                    flag++;
                    if (flag >= len) { flag = 0 }
                }
            }
        }

        if (html.length) {
            var pre = [];
            var next = [];
            for (var i = 0; i < this.options.showNum; i++) {
                next.push(html[i]);
            }
            for (var i = html.length - this.options.showNum ; i < html.length ; i++) {
                pre.push(html[i]);
            }
            Array.prototype.push.apply(html, next);
            Array.prototype.push.apply(pre, html);
            totalWidth += (this.i_w) * this.options.showNum * 2;
            this.$ul.html(pre.join('')).width(totalWidth);
        } else {
            if (len > this.options.showNum) {
                var pre = [];
                var next = [];
                for (var i = 0; i < this.options.showNum; i++) {
                    next.push($lis[i].outerHTML);
                }
                for (var i = len - this.options.showNum ; i < len ; i++) {
                    pre.push($lis[i].outerHTML);
                }
                len += this.options.showNum * 2;
                this.$ul.append(next.join(''));
                this.$ul.prepend(pre.join(''));
            }
            this.$ul.width(len * (this.i_w));
        }
        this.$ul.children('li').css('width', li_w);
    };

    /**
     * 事件监控
     * @return {Void}   
     */
    ScrollImg.prototype.watch = function () {
        var self = this;
        if (this.isWatch) {
            return;
        }
        this.isWatch = true;
        this.$el.on('mouseenter.scrollImg', function () {
            self.stop();
        }).on('mouseleave.scrollImg', function () {
            self.run();
        }).on('click.scrollImg', '.k-scrollImg-prev', function () {
            self.index--;
            self.active();
        }).on('click.scrollImg', '.k-scrollImg-next', function () {
            self.index++;
            self.active();
        });
    };

    /**
     * 运行
     * @return {Void}   
     */
    ScrollImg.prototype.run = function () {
        var self = this;
        this.isStop = false;
        this.tm = setTimeout(function () {
            self.index++;
            self.active(function () {
                if (!self.isStop) {
                    self.run();
                }
            });
        }, this.options.delay);
    };

    /**
     * 停止运行
     * @return {Void}   
     */
    ScrollImg.prototype.stop = function () {
        if (this.tm) {
            clearTimeout(this.tm);
            this.isStop = true;
        }
    };

    /**
     * 切换图片
     * @return {Void}   
     */
    ScrollImg.prototype.active = function (callback) {
        var self = this;
        var tmpIndex = this.index + 1;
        var width = this.i_w * this.options.showNum;
        if (this.index == this.max) {
            this.index = 0;
        }
        if (this.index < 0) {
            this.index = this.max - 1;
        }
        this.$ul.stop().animate({
            marginLeft: -tmpIndex * width
        },this.options.toggleDealy, function () {
            if (tmpIndex == self.total - 1) {
                self.$ul.css('marginLeft', -1 * width);
            }
            if (tmpIndex == 0) {
                self.$ul.css('marginLeft', -(self.max) * width);
            }
            if (typeof callback === 'function') {
                callback();
            }
        });
    };

    return function ($elms, settings) {
        $elms.each(function () {
            var $el = $(this),
                options = $el.attr('data-options'),
                data = $.data(this, 'scrollerImg');
            if (!data) {
                if (options) {
                    options = eval('(0,' + options + ')');
                } else {
                    options = settings;
                }
                data = new ScrollImg($(this), options);
                $.data(this, 'scrollerImg', data);
            }
        });
    }
});

/*
 * 滑块模块
 * @date:2014-09-15
 * @author:kotenei(kotenei@qq.com)
 */
define('km/slider', ['jquery', 'km/dragdrop'], function ($, DragDrop) {

    /**
     * 滑块模块
     * @param {JQuery} $element - dom
     * @param {Object} options  - 参数设置
     */
    var Slider = function ($element, options) {
        this.$element = $element;
        this.options = $.extend(true, {
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
                move: function (e,moveCoord) {
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

        if (type.indexOf('select') !== -1) {
            this.$bindElement.on('change.slider', function () {
                var $this = $(this),
                    val = $.trim(self.getFilterValue($this.val()));
                self.setValue(val);
            });
        } else {
            this.$bindElement.on('keyup.slider', function (e) {
                var $this = $(this),
                    val = $.trim(self.getFilterValue($this.val()));
                if (e.keyCode === 13) {
                    self.setValue(val);
                }
            }).on('blur.slider', function () {
                var $this = $(this),
                    val = $.trim(self.getFilterValue($this.val()));
                self.setValue(val);
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

    return function ($elm, options) {
        var slider = new Slider($elm, options);
        return slider;
    };

});

/*
 * 开关模块
 * @date:2014-09-14
 * @author:kotenei(kotenei@qq.com)
 */
define('km/switch', ['jquery'], function ($) {

    /**
    * 开关模块
    * @param {JQuery} $element - dom
    * @param {Object} options - 参数设置
    */
    var Switch = function ($element, options) {
        this.$element = $element;
        this.options = $.extend(true, {
            values: {
                on: { text: '是', value: true, className: '' },
                off: { text: '否', value: false, className: '' }
            },
            callback: {
                onClick: $.noop
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
        this.$switch.on('click.switch', $.proxy(this.toggle, this));
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
        this.options.callback.onClick(this.getVal());
    };

    /**
     * 开操作
     * @return {Void}
     */
    Switch.prototype.on = function () {
        if (this.disabled) { return; }
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
    Switch.prototype.getVal = function () {
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

    /**
     * 全局Switch绑定
     * @param {JQuery} $elms - 全局元素
     * @return {Void}
     */
    Switch.Global = function ($elms) {
        $elms = $elms || $('input[data-module="switch"]');
        $elms.each(function () {
            var $el = $(this),
                options=$el.attr('data-options'),
                values = $el.attr('data-values'),
                funcName = $el.attr('data-onClick');

            var data =$.data($el[0],'switch');

            


            if (!data) {

                if (options && options.length > 0) {
                    options = eval('(0,' + options + ')');
                } else {
                    options = {
                        values: values && values.length > 0 ? eval('(0,' + values + ')') : undefined,
                        callback: {
                            onClick: funcName && funcName.length > 0 ? eval('(0,' + funcName + ')') : $.noop
                        }
                    };
                }

                data = new Switch($el, options);

                $.data($el[0], 'switch', data);
            }

        });
    };

    return Switch;

});

/**
 * 标签页
 * @date :2015-10-20
 * @author kotenei (kotenei@qq.com)
 */
define('km/tab', ['jquery', 'km/ajax', 'km/contextMenu', 'km/loading'], function ($, ajax, contextMenu, Loading) {

    var identity = 1;

    /**
     * tab 标签模块
     * @param {JQuery} $elm - dom
     * @param {Object} options - 参数
     */
    var Tab = function ($elm, options) {
        this.identity = identity++;
        this.$elm = $elm;
        this.options = $.extend(true, {
            keepOne: true,
            contextMenu: {
                items: []
            }
        }, options);
        this.tabCount = 0;
        this.curIndex = -1;
        this._event = {
            click: $.noop,
            close: $.noop,
            refresh: $.noop
        };
        this.isLoading = false;
        this.tm = null;
        this.init();
    }

    /**
     * 初始化
     * @return {Void}
     */
    Tab.prototype.init = function () {
        this.$elm.attr('data-moduleId', this.identity);
        this.$tabHead = this.$elm.children('div.k-tab-head');
        this.$btnLeft = this.$tabHead.find('div.left');
        this.$btnRight = this.$tabHead.find('div.right');
        this.$tabScroller = this.$tabHead.find('div.k-tab-scroller');
        this.$tabNav = this.$tabScroller.find('ul.k-tab-nav');
        this.$tabContainer = this.$elm.children('div.k-tab-container');
        this.tabCount = this.$tabNav.find('li').length;

        this.contextMenuInit();
        
        this.setSize();

        this.watch();
        this.toggle(0);
    };

    /**
     * 右键菜单初始化
     * @return {Void}
     */
    Tab.prototype.contextMenuInit = function () {

        if (this.options.contextMenu.items.length == 0) {
            return;
        }

        var self = this;

        contextMenu(this.$tabNav.children(), {
            items: this.options.contextMenu.items
        });
    };

    /**
     * 事件监控
     * @return {Void}
     */
    Tab.prototype.watch = function () {
        var self = this;

        this.$elm.on('click.tab', '[role=tab]', function () {
            var $el = $(this),
                index = $el.index();
            self.toggle(index);
            self._event.click.call(this, $el);
            self.childResize();
            return false;
        }).on('click.tab', '[role=refresh]', function () {
            self.refresh($(this).parents('li:eq(0)').index());
            return false;
        }).on('click.tab', '[role=close]', function () {
            self.close($(this).parents('li:eq(0)').index());
            return false;
        }).on('click.tab', '[role=left]', function () {
            self.scroll('left');
            return false;
        }).on('click.tab', '[role=right]', function () {
            self.scroll('right');
            return false;
        });

        $(window).on('resize.tab.' + this.identity, function () {

            if (self.tm) {
                clearTimeout(self.tm);
            }
            self.tm = setTimeout(function () {

                //if (self && self.$elm.parent().length == 0) {
                //    $(window).off('resize.tab.' + self.identity);
                //    self = null;
                //    return;
                //}

                self.setSize();
            }, 300)
        });

    };

    /**
     * 设置尺寸
     * @return {Void}
     */
    Tab.prototype.setSize = function () {

        var headWidth = this.$tabHead.outerWidth(),
            btnLeftWidth = this.$btnLeft.outerWidth(),
            btnRightWidth = this.$btnRight.outerWidth(),
            scrollWidth = headWidth - btnLeftWidth - btnRightWidth,
            tabsWidth = 0;



        this.$tabNav.children().each(function () {
            tabsWidth += $(this).outerWidth(true);
        });


        if (tabsWidth > headWidth) {
            this.isScroller = true;
            this.$btnLeft.show();
            this.$btnRight.show();
            this.$tabScroller.css('width', scrollWidth-30);
        } else {
            this.isScroller = false;
            this.$btnLeft.hide();
            this.$btnRight.hide();
            this.$tabScroller.css('width', 'auto');
            this.$tabNav.css('margin-left', '0');
        }

        this.$tabNav.css('width', tabsWidth);

        this.maxLeft =( tabsWidth - scrollWidth)+30;

        this.scrollTo();
    };

    /**
     * 回调函数绑定
     * @param {String} type - 事件名称
     * @param {Function} callback - 回调函数
     * @return {Void}
     */
    Tab.prototype.on = function (type, callback) {
        this._event[type] = callback || $.noop;
        return this;
    };

    /**
     * 添加tab
     * @param {Object} data - 数据项
     * @return {Void}
     */
    Tab.prototype.add = function (data) {
        //数据格式
        //data = {
        //    url: 'ajax地址',
        //    title: '标签标题',
        //    content: '标签内容',   
        //    canClose: true,       //是否启用关闭
        //    canRefresh: true      //是否启用刷新
        //};

        if (!data) {
            return;
        }

        var self = this,
            tabHtml = [],
            contentHtml = [];

        this.tabCount++;

        //标签头
        tabHtml.push('<li ' + (data.url ? 'data-url="' + data.url + '" ' : "") + ' role="tab" class="' + (this.tabCount == 1 ? 'active' : '') + '"  >');
        tabHtml.push('<a href="javascript:void(0);">');
        if (data.canRefresh) {
            tabHtml.push('<span class="fa fa-refresh" role="refresh"></span>');
        }
        tabHtml.push('<span class="k-tab-nav-title" title="' + data.title + '">' + data.title + '</span>');
        if (data.canClose) {
            tabHtml.push('<span class="fa fa-close" role="close"></span>');
        }
        tabHtml.push('</a>');
        tabHtml.push('</li>');

        //标签内容
        contentHtml.push('<div class="k-tab-content" ' + (this.tabCount == 1 ? 'style="display:block;"' : '') + '>');
        contentHtml.push(data.content);
        contentHtml.push('</div>');

        var $content = contentHtml.join('');

        this.$tabNav.append(tabHtml.join(''));
        this.$tabContainer.append($content);

        if (this.tabCount == 1 && data.url && !this.isLoading) {

            this.isLoading = true;

            Loading.show();

            $.get(data.url, { rand: new Date().getTime() }).success(function (ret) {
                $content.html(ret);
            }).complete(function () {
                self.isLoading = false;
                Loading.hide();
            });

        }

        this.setSize();
    };

    /**
     * 切换tab
     * @param {Int} index - tab索引
     * @return {Void}
     */
    Tab.prototype.toggle = function (index) {

        if (this.curIndex == index) {
            return;
        }

        if (this.$tabContainer.children().length==0) {
            return;
        }

        var self = this;

        this.curIndex = index;

        var $el = this.$tabNav.children().removeClass('active').eq(index).addClass('active');
        var url = $el.attr('data-url');
        var $content = this.$tabContainer.children().hide().eq(index).show();
        var content = $content.html().replace(/\s+/g, '');

        if (url && content.length == 0) {

            if (this.isLoading) {
                return;
            }

            this.isLoading = true;

            Loading.show();

            $.get(url, { rand: new Date().getTime() }).success(function (ret) {
                $content.html(ret);
            }).complete(function () {
                self.isLoading = false;
                Loading.hide();
            });
        }

        this.scrollTo(index);

    };

    /**
     * 关闭tab
     * @param {Int} index - tab索引
     * @return {Void}
     */
    Tab.prototype.close = function (index) {

        if (this.tabCount == 1 && this.options.keepOne) {
            return;
        }

        this.tabCount--;
        var $el = this.$tabNav.children().eq(index).remove();
        this.$tabContainer.children().eq(index).remove();

        if (this.curIndex == index) {

            if (index != 0) {
                index--;
            } else {
                this.curIndex = -1;
            }

            if (this.tabCount > 0) {
                this.toggle(index);
            }
        } else if (this.curIndex != index && index < this.curIndex) {
            this.curIndex--;
        }

        this._event.close.call(this, $el);
        this.setSize();
    };

    /**
     * 刷新tab
     * @param {Int} index - tab索引
     * @return {Void}
     */
    Tab.prototype.refresh = function (index) {
        var self = this;
        var $el = this.$tabNav.children().eq(index);
        var url = $el.attr('data-url');
        var $content = this.$tabContainer.children().eq(index);


        if (url) {

            if (this.isLoading) {
                return;
            }

            $content.html('');

            this.isLoading = true;

            Loading.show();

            $.get(url, { rand: new Date().getTime() }).success(function (ret) {
                $content.html(ret);
            }).complete(function () {
                Loading.hide();
                self.isLoading = false;
                self._event.refresh.call(this, $el);
            });
        }


    };

    /**
     * 左右滑动
     * @param {String} poition - 滑动方向
     * @return {Void}
     */
    Tab.prototype.scroll = function (position) {
        var left = parseInt(this.$tabNav.css('margin-left'));

        if (position == 'left') {
            left += 70;

            if (left > 0) {
                left = 0;
            }

        } else {

            left -= 70;

            if (left < -this.maxLeft) {
                left = -this.maxLeft;
            }
        }

        this.$tabNav.stop().animate({
            marginLeft: left
        }, 300);
    };

    /**
     * 滑动某个tab
     * @param {Int} index - tab索引
     * @return {Void}
     */
    Tab.prototype.scrollTo = function (index) {
        index = index || this.curIndex;

        if (index < 0) {
            index = 0;
        }

        if (index > this.tabCount - 1) {
            index = this.tabCount - 1;
        }

        var left = 0;

        this.$tabNav.children().each(function (i) {
            if (i == index) {
                return false;
            }
            left += $(this).outerWidth();
        });

        if (left >= Math.abs(this.maxLeft)) {
            left = this.maxLeft;
        }

        if (!this.isScroller) {
            left = 0;
        }

        this.$tabNav.stop().animate({
            marginLeft: -left
        }, 300);
    };

    /**
     * 子级tab重置尺寸
     * @return {Void}
     */
    Tab.prototype.childResize = function () {
        var $tabs = this.$tabContainer.find('div.k-tab');
        $tabs.each(function () {
            var tab = $.data(this, 'tab');
            if (tab) {
                tab.setSize();
            }
        });
    }

    /**
     * 全局调用
     * @param {JQuery} $elms - dom
     * @param {Object} options - 参数
     * @return {Void}
     */
    Tab.Global = function ($elms, options) {

        $elms = $elms || $('div.k-tab');

        $elms.each(function () {
            var $el = $(this),
                setting = $el.attr('data-options'),
                onClick = $el.attr('data-onclick'),
                onClose = $el.attr('data-onlose'),
                onRefresh = $el.attr('data-onrefresh'),
                data = $.data($el[0], 'tab');

            if (!data) {

                if (setting && setting.length > 0) {
                    options = eval('(0,' + setting + ')');
                }

                data = new Tab($el, options);

                data.on('click', onClick && onClick.length > 0 ? eval('(0,' + onClick + ')') : $.noop)
                        .on('close', onClose && onClose.length > 0 ? eval('(0,' + onClose + ')') : $.noop)
                        .on('refresh', onRefresh && onRefresh.length > 0 ? eval('(0,' + onRefresh + ')') : $.noop);

                $.data($el[0], 'tab', data);
            }

        });
    };

    return Tab;
});

/*
 * 标签选择模块
 * @date:2015-08-16
 * @author:kotenei(kotenei@qq.com)
 */
define('km/tagSelector', ['jquery'], function ($) {

    var identity = 1,
        $selector,
        $layer,
        $left, $top, $right, $bottom;

    var method = {
        setSidePosition: function ($target) {

            var info = {
                width: $target.outerWidth(),
                height: $target.outerHeight(),
                top: $target.offset().top,
                left: $target.offset().left
            };

            var offset = 0;

            $left.css({ left: info.left - offset, top: info.top, height: info.height }).show();
            $top.css({ left: info.left, top: info.top - offset, width: info.width + offset * 2 }).show();
            $right.css({ left: info.left + info.width + offset, top: info.top, height: info.height }).show();
            $bottom.css({ left: info.left, top: info.top + info.height + offset, width: info.width + offset * 2 }).show();

        },
        sideHide: function () {
            $left.hide();
            $top.hide();
            $right.hide();
            $bottom.hide();
        },
        showLayer: function ($target) {
            var info = {
                width: $target.outerWidth(),
                height: $target.outerHeight(),
                top: $target.offset().top,
                left: $target.offset().left
            };

            $layer.show().css(info);
        },
        hideLayer: function () {
            $layer.hide();
        }
    };

    return function ($elms, options) {

        if ($elms && ! ($elms instanceof $)) {
            options = $elms;
            $elms = $('[data-module=tagselector]');
        }

        options = $.extend(true, {
            callback: {
                onClick: $.noop
            }
        }, options || {});

        $elms = $elms || $('[data-module=tagselector]');

        $elms = $elms.map(function () {
            if (!this.getAttribute('data-isInit')) {
                this.setAttribute('data-isInit', true);
                return this;
            }
        });


        if (!$elms || $elms.length == 0) {
            return;
        }

        if (!$selector) {
            var html = '<div class="k-tagSelector-layer"></div>' +
                        '<div class="k-tagSelector-leftside"></div>' +
                        '<div class="k-tagSelector-topside"></div>' +
                        '<div class="k-tagSelector-rightside"></div>' +
                        '<div class="k-tagSelector-bottomside"></div>';

            $selector = $(html).appendTo(document.body);
            $layer = $selector.filter('div.k-tagSelector-layer');
            $left = $selector.filter('div.k-tagSelector-leftside');
            $top = $selector.filter('div.k-tagSelector-topside');
            $right = $selector.filter('div.k-tagSelector-rightside');
            $bottom = $selector.filter('div.k-tagSelector-bottomside');
        }

        var $curElm;

        $elms.on('mouseover.tagSelector', function () {
            method.setSidePosition($(this).addClass('k-tagSelector-curr'));
            return false;
        }).on('mouseout.tagSelector', function () {
            $(this).removeClass('k-tagSelector-curr');
            method.sideHide();
        }).on('click.tagSelector', function () {
            var $el = $(this),
                onclick = $el.attr('data-onclick');

            $curElm = $el;

            method.showLayer($el, $layer);

            if (onclick && onclick.length > 0) {
                onclick = eval('(0,' + onclick + ')');
                onclick($el);
            } else {
                options.callback.onClick($el, $layer);
            }

            return false;
        });

        $layer.on('click.tagSelector', function () {
            $layer.hide();
            return false;
        });

        $(window).on('resize.tagSelector', function () {
            if (!$curElm) {
                return;
            }
            method.showLayer($curElm, $layer);
        });

        $(document).on('click.tagSelector', function () {
            $layer.hide();
            $curElm = null;
        });

    };

});
/*
 * 模板
 * @date:2015-09-28
 * @author:kotenei(kotenei@qq.com)
 */
define('km/template', ['jquery'], function ($) {

    var index = 0;

    var fileName = 'tpl_' + index;

    var tags = {
        open: '{{',
        close: '}}'
    };

    var utils = {
        each: function (arr, callback) {
            for (var i = 0, item; i < arr.length; i++) {
                item = arr[i];
                if (callback(i, item) == false) {
                    break;
                }
            }
        },
        dateFormat: function (date, format) {

            date = date || new Date();

            var format = format || "yyyy-MM-dd";

            var o = {
                "y+": date.getFullYear(),
                "M+": date.getMonth() + 1,
                "d+": date.getDate(),
                "h+": date.getHours(),
                "m+": date.getMinutes(),
                "s+": date.getSeconds()
            }, k, value;

            for (k in o) {
                if (new RegExp("(" + k + ")").test(format)) {
                    value = o[k];
                    format = format.replace(RegExp.$1, value.toString().length === 1 ? ("0" + value.toString()) : value);
                }
            }

            return format;
        },
        output: function (val) {
            if (!val) {
                return '';
            }
            return val;
        }
    };

    //默认过滤器
    var filters = {
        escape: function (str) {
            return String(str)
                    .replace(/&/g, '&amp;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
        },
        nl2br: function (str) {
            return String(str).replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br/>' + '$2');
        },
        toText: function (str) {
            return String(str).replace(/<[^>]+>/g, "");
        },
        subString: function (str, maxLength, tail) {
            var r = /[^\x00-\xff]/g;

            if (!maxLength) {
                maxLength = 80;
            }

            if (!tail) {
                tail = '...';
            }

            if (str.replace(r, "mm").length <= maxLength) { return str; }
            var m = Math.floor(maxLength / 2);
            for (var i = m; i < str.length; i++) {
                if (str.substr(0, i).replace(r, "mm").length >= maxLength) {
                    return str.substr(0, i) + tail;
                }
            }
            return str;
        },
        jsonDateFormat: function (str, format) {

            if (!str) {
                return '';
            }

            if (str.indexOf('/Date') != -1) {
                var date = new Date(parseInt(str.replace("/Date(", "").replace(")/", ""), 10));
                return utils.dateFormat(date, format);
            }
            return str;
        }
        
    };

    var variable = {};

    // 模板变量
    var KEYWORDS =
        // 关键字
        'break,case,catch,continue,debugger,default,delete,do,else,false'
        + ',finally,for,function,if,in,instanceof,new,null,return,switch,this'
        + ',throw,true,try,typeof,var,void,while,with'

        // 保留字
        + ',abstract,boolean,byte,char,class,const,double,enum,export,extends'
        + ',final,float,goto,implements,import,int,interface,long,native'
        + ',package,private,protected,public,short,static,super,synchronized'
        + ',throws,transient,volatile'

        // ECMA 5 - use strict
        + ',arguments,let,yield'

        + ',undefined';

    var method = {
        //脚本处理
        script: function (variable, code) {

            //删除左侧空格
            code = code.replace(/^\s/, '');

            //以空格分割字符串
            var split = code.split(' ');
            var key = split.shift();
            var args = split.join(' ');



            switch (key) {
                case 'each':
                    var arr = split[2];
                    var obj = split[0];
                    code = '$each(' + arr + ',function(index,' + obj + ') {';
                    break;
                case '/each':
                    code = '});';
                    break;
                case 'for':
                    code = 'for ( var ' + args + ') {';
                    break;
                case '/for':
                    code = '}';
                    break;
                case 'if':
                    code = 'if (' + args + ') {';
                    break;
                case 'else':

                    if (split.shift() === 'if') {
                        split = ' if(' + split.join(' ') + ')';
                    } else {
                        split = '';
                    }

                    code = '}else' + split + '{';

                    break;
                case '/if':
                    code = '}';
                    break;
                default:
                    if (/^[^\s]+\s*\|\s*[a-z]+\s*:?/.test(code)) {

                        var filterStr = method.filtered(key, args);

                        if (filterStr) {
                            code = "$out+=$output(" + filterStr + ");";
                        } else {
                            code = "$out+=$output(" + key + ");";
                        }
                    } else if (code.indexOf('?') != -1 && code.indexOf(':') != -1) {
                        code = "$out+=$output(" + code + ");";
                    } else {
                        code = "$out+=$output(" + key + ");";
                    }

                    break;
            }


            method.setVariable(variable, code);

            return code + "\n";

        },
        //HTML处理
        html: function (code) {

            code = code.replace('/\s+/g', ' ').replace(/<!--.*?-->/g, '');

            if (code) {
                code = '$out+=' + method.stringify(code) + ';' + "\n";
            }

            return code;
        },
        //字符串处理
        stringify: function (code) {
            return "'" + code
            // 单引号与反斜杠转义
            .replace(/('|\\)/g, '\\$1')
            // 换行符转义(windows + linux)
            .replace(/\r/g, '\\r')
            .replace(/\n/g, '\\n') + "'";
        },
        //过滤器设置
        filtered: function (key, args) {

            var tmpCode = "", i = 0;

            utils.each(args.split('|'), function (index, value) {

                var arr = value.split(':');
                var fName = arr.shift();
                var parms = arr.join(':') || '';

                if (parms) {
                    parms = ',' + parms;
                }

                fName = fName.replace(/\s+/g, '');

                if (fName && filters[fName]) {

                    if (i == 0) {
                        tmpCode = "$filter." + fName + '(' + key + parms + ')';
                    } else {
                        tmpCode = "$filter." + fName + '(' + tmpCode + parms + ')';
                    }

                    i++;
                }
            });

            return tmpCode;
        },
        //设置变量名
        setVariable: function (variable, code) {

            //console.log(code)

            code = code.replace(/\s*\.\s*[$\w\.]+/g, '')
                       .replace(/[^\w$]+/g, ',')
                       .replace(new RegExp(["\\b" + KEYWORDS.replace(/,/g, '\\b|\\b') + "\\b"].join('|'), 'g'), '')
                       .replace(/^\d[^,]*|,\d[^,]*/g, '')
                       .replace(/^,+|,+$/g, '')
                       .split(/^$|,+/);

            //console.log(code)

            if (!code) {
                return;
            }

            utils.each(code, function (index, name) {

                if (!name || variable[name] || name.indexOf('$') == 0) {
                    return;
                }

                var value = "$data." + name;

                variable.push(name + "=" + value + ",");

                variable[name] = true;

            });

        },
        partial: function (source, partial, count) {
            var slef = this;
            var reg;
            if (source.indexOf('partial') == -1 || !partial || count >= 5) {
                return source;
            }
            for (var key in partial) {
                reg = new RegExp(tags.open + '\\s*partial\\s*(\'|\")' + key + '(\'|\")\\s*' + tags.close, 'ig');
                source = source.replace(reg, partial[key]);
            }
            count++;
            return this.partial(source, partial, count);
        }
    };

    var Template = function ($el, options) {
        ++index;
        this.$el = $el;
        this.options = $.extend(true, {
            tpl: '',
            data: {},
            partial: null
        }, options);
        this.data = this.options.data;
        this.tpl = this.options.tpl;
        this.fileName = fileName;
        this.init();
    };

    //初始化
    Template.prototype.init = function () {
        if (!this.tpl) {
            return;
        }
        var headerCode = "'use strict';var $each=$utils.each,$output=$utils.output,";
        var mainCode = "$out='';";
        var footerCode = 'return new String($out);';
        var variable = [];
        this.tpl = method.partial(this.tpl, this.options.partial, 0);
        utils.each(this.tpl.split(tags.open), function (index, item) {

            var code = item.split(tags.close);

            var script = code[0];

            var html = code[1];

            if (code.length == 1) {

                mainCode += method.html(code[0]);

            } else {

                mainCode += method.script(variable, script);

                if (html) {
                    mainCode += method.html(html);
                }
            }

        });
        this.code = headerCode + variable.join('') + mainCode + footerCode;
        try {
            this.Render = new Function('$utils', '$filter', '$data', this.code);
        } catch (e) {
            throw e;
        }
    };

    //输出
    Template.prototype.render = function () {
        if (!this.tpl) {
            return;
        }
        var html = this.Render(utils, filters, this.data);
        if (this.$el) {
            this.$el.html(html);
        }
        //不能使用，IE8出现未指定错误
        //this.$el[0].innerHTML = html;
        return html;
    };

    //更新子模板
    Template.prototype.updatePartial = function () { };

    //加载模板
    Template.load = function (tplName, callback) {
        var dtd = $.Deferred();
        var info = tplName.split('/');

        if (info.length === 2) {
            require(["tpl/" + info[0]], function (tpl) {
                var html;
                html = tpl[info[1]];
                if (html) {
                    html = $.trim(html);
                    if (callback) {
                        callback(html);
                    }
                    else {
                        dtd.resolve(html);
                    }
                }
            });
        }
        return dtd.promise();
    };

    //添加过滤
    Template.addFilter = function (name, callback) {
        filters[name] = callback;
    };


    return Template;

});

/*
 * 消息提示模块
 * @date:2014-09-05
 * @author:kotenei(kotenei@qq.com)
 */
define('km/tooltips', ['jquery'], function ($) {


    /**
     * 消息提示模块
     * @param {JQuery} $element - dom
     * @param {Object} options - 参数
     */
    function Tooltips($element, options) {
        this.$element = $element;
        this.options = $.extend(true, {
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

        //if (this.options.scrollContainer) {
        //    $(this.options.scrollContainer).on('scroll.' + this.options.type, function () {

        //    });
        //}

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

                var options = $this.attr('data-options');

                if (options && options.length > 0) {
                    options = eval('(0,' + options + ')');
                } else {
                    options = {
                        title: $this.attr('data-title'),
                        content: $this.attr('data-content'),
                        placement: $this.attr('data-placement'),
                        tipClass: $this.attr('data-tipClass'),
                        trigger: $this.attr('data-trigger')
                    };
                }

                tooltips = new Tooltips($this, options);
                Tooltips.Set($this, tooltips);
            }
        });
    };

    /**
     * 从缓存获取对象
     * @param {JQuery} $element - dom
     */
    Tooltips.Get = function ($element) {
        return $.data($element[0], 'tooltips');
    };

    /**
     * 设置缓存
     * @param {JQuery} $element - dom
     * @param {Object} tooltips - 缓存对象
     */
    Tooltips.Set = function ($element, tooltips) {
        $.data($element[0], 'tooltips', tooltips);
    }

    return Tooltips;
});
/*
 * 树型模块
 * @date:2014-10-22
 * @author:kotenei(kotenei@qq.com)
 */
define('km/tree', ['jquery', 'km/dragdrop'], function ($, DragDrop) {

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
        getLineHtml: function (node, options) {

            if (!options.view.showLine) {
                return;
            }

            var lineType = _consts.line.CENTER;


            if (node.isSingle) {
                lineType = _consts.line.ROOT;
            } else if (node.isFirst && node.parentId === 0) {
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
        getIconHtml: function (node, options) {


            if (!options.view.showIcon) {
                return;
            }


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

            var checked = String(node.isChecked === true);
            var className;

            if (options.check.chkType === 'radio') {
                if (!isCheckRadio) {
                    isCheckRadio = true;
                } else {
                    checked = false;
                }
            }

            className = options.check.chkType + '_' + checked + '_' + (node.checkDisabled ? 'part' : 'full');

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

            if (!$element || $element.length == 0) {
                return;
            }

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


        this.options = $.extend(true, {
            selectLimit: false,
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
                chkBoxType: { Y: "ps", N: "ps" },       // Y：选中时对父与子级的关联关系，N：取消选中时对父与子级的关联关系，p:父级,s:子级
                keepSearch: false
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
            },
            view: {
                showLine: true,
                showIcon: true
            }
        }, options);

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
    Tree.prototype.initNodes = function (data, parent) {
        if (!utils.isArray(data) || data.length === 0) {
            return;
        }

        for (var i = 0, node; i < data.length; i++) {
            node = data[i];

            if (i === 0 && (i + 1) < data.length) {
                node.isFirst = true;
            } else if (i === 0 && (i + 1) == data.length) {
                node.isSingle = true;
            } else if ((i + 1) === data.length) {
                node.isLast = true;
            }

            if (!node.parentId && parent) {
                node.parentId = parent.nodeId;
            }

            node.hasChildren = this.hasChildren(node);
            node.isParent = node.hasChildren;
            node.parent = parent;

            this.nodes[this.prefix + node.nodeId] = node;
            this.initNodes(node.nodes, node);
        }
    };

    /**
     * 事件绑定
     * @return {Void}       
     */
    Tree.prototype.eventBind = function () {
        var self = this;

        this.$element.on('click.tree', "." + _consts.className.SWITCH, function () {
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

        }).on('click.tree', '.chk', function () {
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

            if (node.checkDisabled) { return; }

            node.isChecked = checked;
            view.replaceChkClass($this, node.isChecked);

            if (self.options.check.chkType === "checkbox") {
                self.check(node);
            } else {
                for (var i = 0; i < checkedNodes.length; i++) {
                    if (checkedNodes[i] != node) {
                        checkedNodes[i].isChecked = false;
                        view.replaceChkClass(self.$tree.find('#chk_' + checkedNodes[i].nodeId), false);
                    }
                }
            }

            self.options.callback.onCheck(node);

        }).on('click.tree', 'a', function () {
            //选择
            var $this = $(this),
                nodeId = $this.attr('nid'),
                node = self.getNode(nodeId);


            if (node.selectDisabled) {
                return;
            }

            if (self.options.callback.beforeSelect() === false) {
                return;
            }

            if ($this.hasClass(_consts.node.SELECTED) && self.options.selectLimit) { return; }
            self.$element.find('a').removeClass(_consts.node.SELECTED);
            $this.addClass(_consts.node.SELECTED);

            self.options.callback.onSelect(self.getSelectedNode());

        }).on('click.tree', '.add', function () {
            //添加
            var $this = $(this);
        }).on('click.tree', '.edit', function () {
            //编辑
            var $this = $(this);
        }).on('click.tree', '.remove', function () {
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

            if (parentNode.canBuild == false) {
                return;
            }

            if (parentNode.isLast || parentNode.isSingle) {
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
            if (node && node.canBuild != false) {
                html.push('<li id="li_' + node.nodeId + '" nId="' + node.nodeId + '">');
                html.push(view.getLineHtml(node, this.options));
                html.push(view.getChkHtml(node, this.options));
                html.push('<a href="javascript:void(0);" id="a_' + node.nodeId + '" nId="' + node.nodeId + '" class="' + (node.selected ? _consts.node.SELECTED : "") + ' ' + (node.selectDisabled ? "disabled" : "") + '" >');
                html.push(view.getIconHtml(node, this.options));
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

        if (node.isChecked) {
            switch (options.check.chkBoxType.Y.toLowerCase()) {
                case "p":
                    this.checkAction(parentNodes, node.isChecked);
                    break;
                case "s":
                    this.checkAction(childNodes, node.isChecked);
                    break;
                case "ps":
                    this.checkAction(parentNodes, node.isChecked);
                    this.checkAction(childNodes, node.isChecked);
                    break;
            }
        } else {
            switch (options.check.chkBoxType.N.toLowerCase()) {
                case "p":
                    uncheckParent.call(this, parentNode, node.isChecked);
                    break;
                case "s":
                    this.checkAction(childNodes, node.isChecked);
                    break;
                case "ps":
                    uncheckParent.call(this, parentNode, node.isChecked);
                    this.checkAction(childNodes, node.isChecked);
                    break;
            }
        }

        //取消选择父节点
        function uncheckParent(parentNode, checked) {
            var unchecked = true;
            while (parentNode && utils.isArray(parentNode.nodes)) {
                for (var i = 0, siblingNode; i < parentNode.nodes.length; i++) {
                    siblingNode = parentNode.nodes[i];
                    if (siblingNode.isChecked) {
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
            node.isChecked = checked;
            $elm = this.$tree.find('#chk_' + node.nodeId);
            if (node.checkDisabled) {
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
        var $selected = this.$tree.find('a.' + _consts.node.SELECTED);
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
            if (this.nodes[key].isChecked) {
                nodes.push(this.nodes[key]);
            }
        }
        return nodes;
    }

    /**
     * 根据ID获取节点
     * @return {Object}
     */
    Tree.prototype.getNode = function (nodeId) {
        return this.nodes[this.prefix + nodeId];
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

    /**
     * 选择节点
     * @param  {Int} nodeId - 节点编号
     * @return {Void}
     */
    Tree.prototype.selectNode = function (nodeId) {

        if (!nodeId) {
            return;
        }

        var node = this.getNode(nodeId);

        if (!node || node.selectDisabled) {
            return;
        }

        this.$tree.find('#a_' + nodeId).click();

    };


    /**
     * 取消选择节点
     * @param  {Int} nodeId - 节点编号
     * @param  {Function} callback - 取消节点回调函数
     * @return {Void}
     */
    Tree.prototype.unSelectNode = function (nodeId, callback) {
        callback = callback || $.noop;
        var $selected = this.$tree.find('#a_' + nodeId),
            nodeId = $selected.attr('nid'),
            node;

        if ($selected.length == 0 || !$selected.hasClass(_consts.node.SELECTED)) {
            return;
        }

        node = this.getNode(nodeId);

        //if (node.selectDisabled) {
        //    return;
        //}

        $selected.removeClass(_consts.node.SELECTED);
        callback(this.getNode(nodeId));
    };

    /**
     * 复选节点
     * @param  {Int} nodeId - 节点编号
     * @return {Void}
     */
    Tree.prototype.checkNode = function (nodeId) {
        var $checked = this.$tree.find('#chk_' + nodeId),
            className = $checked.attr('class');
        if ($checked.length == 0 || className.indexOf('false') == -1) {
            return;
        }
        $checked.click();
    }

    /**
     * 反选节点
     * @param  {Int} nodeId - 节点编号
     * @return {Void}
     */
    Tree.prototype.unCheckNode = function (nodeId) {
        var $checked = this.$tree.find('#chk_' + nodeId),
            className = $checked.attr('class');

        if ($checked.length == 0 || className.indexOf('true') == -1) {
            return;
        }
        $checked.click();
    };

    /**
     * 查找
     * @param  {String} text - 查找文本
     * @return {Void}
     */
    Tree.prototype.search = function (text) {
        if (!this.options.data) {
            return;
        }
        var self = this;
        var tmpData = [];
        var html = [];
        initData(this.options.data, text,this.options)
        function initData(data, text,options) {
            var setParent = function (parent) {
                if (!parent || parent.canBuild) {
                    return;
                } else {
                    parent.canBuild = true;
                    setParent(parent.parent);
                }
            }
            var set = function (data, text, options) {
                if (!utils.isArray(data) || data.length === 0) {
                    return;
                }
                for (var i = 0, node; i < data.length; i++) {
                    node = data[i];
                    node.canBuild = false;
                    if (!options.check.keepSearch) {
                        node.isChecked = false;
                    }

                    if (!text) {
                        node.canBuild = true;
                    } else {
                        if (node.text.indexOf(text)==-1) {
                            node.canBuild = false;
                        } else {
                            node.canBuild = true;
                            setParent(node.parent);
                        }
                    }
                    set(node.nodes, text,options);
                }
            }
            set(data, text, options);
        }
        this.createNode(this.options.data, html);
        this.$tree.children('li').remove().end().html(html.join(''));
    }



    /**
     * 重新加载
     * @param  {Array} data - 节点数据
     * @return {Void}
     */
    Tree.prototype.reload = function (data) {
        data = data || this.options.data;
        var html = [];
        this.initNodes(data);
        this.options.data = data;
        this.createNode(this.options.data, html);
        this.$tree.children('li').remove().end().html(html.join(''));
    };

    return Tree;
});

/*
 * 树型表格模块
 * @date:2015-04-29
 * @author:kotenei(kotenei@qq.com)
 */
define('km/treeTable', ['jquery', 'km/ajax'], function ($, ajax) {

    //树型表格
    function TreeTable($elm, options) {
        this.$elm = $elm;
        this.options = $.extend(true, {
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
            self.reload();
        }
    };

    

    //事件监控
    TreeTable.prototype.watch = function () {
        var self = this;
        this.$elm.on('click.treetable', '.indenter a', function () {
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
        }).on('click.treetable', 'tbody tr', function () {
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
        }).on('click.treetable', '[role=checkall]', function () {
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
        var self = this;

        ajax.get(this.options.url, this.options.params).done(function (data) {

            if (!data) {
                data = [];
                return;
            }



            for (var i = 0,item; i < data.length; i++) {
                item = data[i];
                if (item.Checked) {
                    item.checked = item.Checked;
                }
                if (item.EnableCheck) {
                    item.enableCheck = item.EnableCheck;
                }
                if (item.Level) {
                    item.level = item.Level;
                }
            }

            self.data = data;
            self.dataInit();
            self.build();
            self.watch();
        });
    };

    //加载数据
    TreeTable.prototype.loadData = function () {

    };

    //取选择的数据
    TreeTable.prototype.getSelectRows = function () {
        var items = [];

        if (!this.data) {
            return items;
        }

        for (var i = 0, item; i < this.data.length; i++) {
            item = this.data[i];
            if (item.checked) {
                items.push(item);
            }
        }

        return items;
    };

    return TreeTable;

});
/**
 * 上传
 * @date :2015-07-30
 * @author kotenei (kotenei@qq.com)
 */
define('km/upload', ['jquery', 'spin', 'km/window', 'km/ajax', 'km/event','km/popTips','jqueryForm'], function ($, Spinner, Window, ajax, event,popTips) {

    var method = {
        showLoading: function () {
            this.spinner.spin(this.$loadingBox.get(0));
            this.$loadingBox.css('display', 'inline-block');
            this.$uploadIcon.hide();
        },
        hideLoading: function () {
            this.$loadingBox.hide();
            this.spinner.stop();
            this.$uploadIcon.show();
        }
    };

    /**
     * upload 上传模块
     * @param {JQuery} $element - dom
     * @param {Object} options - 参数
     */
    var Upload = function ($elm, options) {
        this.$elm = $elm;
        this.options = $.extend(true, {
            uploadUrl: null,
            removeUrl: null,
            $target: null,
            fontClassName: 'fa fa-upload',
            text: '上传',
            name: 'file',
            uploadedUrls: [],
            //loadingEnable: true,
            popTips: {
                enable: true,
                delay: 600
            }
        }, options);
        this.isLoading = false;
        this.isButton = this.$elm[0].type.toLowerCase() == 'text' ? false : true;
        this._event = {
            success: $.noop,
            error: $.noop
        };
        this.init();
    };

    /**
     * 初始化
     * @return {Void}
     */
    Upload.prototype.init = function () {
        this.spinner = new Spinner({
            lines: 9, // 花瓣数目
            length: 3, // 花瓣长度
            width: 2, // 花瓣宽度
            radius: 2, // 花瓣距中心半径
            scale: 0.2,
            corners: 0.6, // 花瓣圆滑度 (0-1)
            rotate: 4, // 花瓣旋转角度
            direction: 1, // 花瓣旋转方向 1: 顺时针, -1: 逆时针    
            color: '#222222', // 花瓣颜色
            speed: 1, // 花瓣旋转速度
            trail: 60, // 花瓣旋转时的拖影(百分比)
            shadow: false, // 花瓣是否显示阴影
            hwaccel: false, // 是否启用硬件加速及高速旋转            
            className: 'spinner', // css 样式名称
            zIndex: 2e9, // spinner的z轴 (默认是2000000000)
            top: '5px', // spinner 相对父容器Top定位 单位 px
            left: '10px'// spinner 相对父容器Left定位 单位 px
        });

        this.uploadedUrls = this.options.uploadedUrls;
        this.build();
        this.watch();

    };

    /**
     * 事件监控
     * @return {Void}
     */
    Upload.prototype.watch = function () {
        var self = this;

        this.$uploadBox.on('change.upload', 'input', function () {
            self.upload();
        }).on('click.upload', '.fa-close', function () {
            var $el = $(this),
                $parent = $el.parents('.k-upload-result:eq(0)'),
                removeUrl = $parent.attr('data-url');

            if (self.isLoading) {
                return;
            }

            Window.confirm('您确认要删除该文件吗？', function () {
                self.removeFile(self.isButton ? { filePath: removeUrl } : null);
            });
        });
    };

    /**
     * 构造上传HTML
     * @return {Void}
     */
    Upload.prototype.build = function () {
        var html = [],
            groupHtml = [];

        html.push('<div class="k-upload-box">');

        if (this.isButton) {

            html.push('<div class="k-upload-result-box">');

            if (this.options.uploadedUrls.length > 0) {

                for (var i = 0; i < this.options.uploadedUrls.length; i++) {
                    html.push('<div class="k-upload-result" data-url="' + this.options.uploadedUrls[i] + '">');
                    html.push('<span title="' + this.options.uploadedUrls[i] + '">' + this.options.uploadedUrls[i] + '</span>');
                    html.push('<i class="fa fa-close" style="display:' + (this.options.removeUrl ? "block" : "none") + ';"></i>');
                    html.push('</div>');
                }

            }

            html.push('</div>');
        }

        html.push('<div class="button-box">');
        html.push('<button type="button" class="k-btn k-btn-default">');
        html.push('<div class="loading-box"></div>');
        html.push('<span class="k-upload-icon ' + this.options.fontClassName + '"></span>&nbsp;');
        html.push(this.options.text);
        html.push('</button>');
        html.push('<form action="' + this.options.uploadUrl + '" enctype="multipart/form-data" method="post">');
        html.push('<input type="file" name="' + this.options.name + '" />');
        html.push('</form>');
        html.push('</div>');
        html.push('</div>');

        if (!this.isButton) {
            var val = $.trim(this.$elm.val());

            groupHtml.push('<div class="k-input-group k-input-group-upload">');
            groupHtml.push('<i class="fa fa-close" style="display:' + (this.options.removeUrl && val.length > 0 ? "block" : "none") + ';"></i>');
            groupHtml.push('<span class="k-input-group-btn">');
            groupHtml.push(html.join(''));
            groupHtml.push('</span>');
            groupHtml.push('</div>');
        }

        this.$uploadBox = $(groupHtml.length == 0 ? html.join('') : groupHtml.join(''));
        this.$buttonBox = this.$uploadBox.find('.button-box');
        this.$button = this.$uploadBox.find('button');
        this.$file = this.$uploadBox.find('input[type=file]');
        this.$form = this.$uploadBox.find('form');
        this.$resultBox = this.$uploadBox.find('.k-upload-result-box');
        this.$txtResult = this.isButton ? null : this.$elm;
        this.$close = this.$uploadBox.find('.fa-close');
        this.$uploadBox.appendTo(this.$elm.parent());
        this.$uploadIcon = this.$uploadBox.find('.k-upload-icon');
        this.$loadingBox = this.$buttonBox.find('.loading-box');


        if (this.isButton) {
            this.$elm.hide();
        } else {
            this.$elm.attr({
                'class': 'k-form-control',
                //'readonly': 'readonly'
            }).prependTo(this.$uploadBox);
            this.$close.css('right', this.$button.outerWidth() + 10);
        }

    };

    /**
     * 上传
     * @return {Void}
     */
    Upload.prototype.upload = function () {
        var self = this;
        if (this.isLoading) {
            return;
        }

        this.isLoading = true;
        method.showLoading.call(this);

        this.$form.ajaxSubmit({
            url: this.$form.attr('action'),
            cache: false,
            success: function (ret) {

                if (typeof ret==='string') {
                    ret=JSON.parse(ret);
                }

                if (self.isButton && ret.Url && ret.Url.length > 0) {
                    self.uploadedUrls.push(ret.Url);
                }
                self.showResult(ret.Url || '');

                self._event.success(ret);
            },
            error: function () {
                self._event.error();
            },
            complete: function () {
                self.isLoading = false;
                method.hideLoading.call(self);
            }
        });
    };

    /**
     * 删除
     * @return {Void}
     */
    Upload.prototype.removeFile = function (data) {
        var self = this;

        if (this.isLoading) {
            return;
        }

        this.isLoading = true;

        data = data || { filePath: this.url }

        ajax.post(this.options.removeUrl, data, {
            redirectEnable: false,
            loadingEnable: true,
            popTips: {
                enable: this.options.popTips.enable,
                delay: this.options.delay,
                inCallback: false
            }
        }).done(function (ret) {
            if (ret.Status || ret.status) {
                self.hideResult(data.filePath);
            }
        }).always(function () {
            self.isLoading = false;
        });
    };

    /**
     * 显示结果
     * @return {Void}
     */
    Upload.prototype.showResult = function (url) {
        this.url = url;
        if (this.isButton) {
            this.$resultBox.append('<div class="k-upload-result" data-url="' + url + '"><span title="' + url + '">' + url + '</span><i class="fa fa-close" style="display:' + (this.options.removeUrl ? "block" : "none") + ';"></i></div>');

            if (this.options.$target) {
                this.options.$target.val(this.uploadedUrls.join(','));
            }


        } else {

            this.$txtResult.val(url);

            if (this.options.removeUrl) {
                this.$close.fadeIn();
            }

            if (this.options.$target) {
                this.options.$target.val(url);
            }
        }
    };

    /**
     * 隐藏结果
     * @return {Void}
     */
    Upload.prototype.hideResult = function (url) {
        var index = -1;
        if (this.isButton) {
            this.$resultBox.children('div[data-url="' + url + '"]').remove();

            for (var i = 0; i < this.uploadedUrls.length; i++) {
                if (this.uploadedUrls[i] == url) {
                    index = i;
                    break;
                }
            }
            if (i >= 0) {
                this.uploadedUrls.splice(index, 1);
            }

            if (this.options.$target) {
                this.options.$target.val(this.uploadedUrls.join(','));
            }

        } else {
            this.$txtResult.val('');
            this.$close.hide();
            if (this.options.$target) {
                this.options.$target.val('');
            }
        }
    }


    /**
     * 事件添加
     * @return {Void}
     */
    Upload.prototype.on = function (type, callback) {
        this._event[type] = callback || $.noop;
        return this;
    };

    /**
     * 全局调用
     * @return {Void}
     */
    Upload.Global = function ($elms) {
        $elms = $elms || $('button[data-module=upload],input[data-module=upload]');
        $elms.each(function () {
            var $el = $(this),
                options = $el.attr('data-options'),
                uploadUrl = $el.attr('data-uploadurl'),
                removeUrl = $el.attr('data-removeurl'),
                name = $el.attr('data-name'),
                text = $el.attr('data-text'),
                loadingEnable = $el.attr('data-loadingEnable'),
                popTips = $el.attr('data-popTips'),
                success = $el.attr('data-success'),
                error = $el.attr('data-error'),
                data = $.data($el[0], 'upload');

            if (!data) {

                if (options && options.length > 0) {
                    options = eval('(0,' + options + ')');
                } else {
                    options = {
                        uploadUrl: uploadUrl && uploadUrl.length > 0 ? uploadUrl : '',
                        removeUrl: removeUrl && removeUrl.length > 0 ? removeUrl : '',
                        name: name && name.length > 0 ? name : 'file',
                        text: text && text.length > 0 ? text : '上传',
                        loadingEnable: loadingEnable && loadingEnable == 'false' ? false : true,
                        popTips: popTips && popTips.length > 0 ? eval('(0,' + popTips + ')') : {}
                    };
                }

                data = new Upload($el, options);

                data.on('success', success && success.length > 0 ? eval('(0,' + success + ')') : $.noop)
                    .on('error', error && error.length > 0 ? eval('(0,' + error + ')') : $.noop);

                $.data($el[0], 'upload', data);
            }
        });
    };

    return Upload;
});

/**
 * 
 * @module km/util 
 * @author vfasky (vfasky@gmail.com)
 */
define('km/util', function(){
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
define('km/validate', ['jquery'], function ($) {

    /**
     * 表单验证模块
     * @param {JQuery} $form - dom
     * @param {Object} options - 参数
     */
    function Validate($form, options) {
        this.$form = $form;
        this.options = $.extend(true, {
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
        this.setValidFields();
        if (this.validFields.count === 0) {
            return;
        }
        this.eventBind();
        $.data(this.$form[0], 'validate', this);
    };

    /**
     * 获取验证的元素
     * @return {Void} 
     */
    Validate.prototype.setValidFields = function () {
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
                var $el = $(this);

                $.data($el[0], '$form', self.$form);

                self.validFields.data[this.name] = $el;
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
        meta = eval('(0,' + meta + ')');

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
        this.$form.on('submit.validate', function (e) {
            return self.validateFrom(e);
        }).on('focus.validate blur.validate keyup.validate',
        ':text, [type="password"], [type="file"], select, textarea, ' +
        '[type="number"], [type="search"] ,[type="tel"], [type="url"], ' +
        '[type="email"], [type="datetime"], [type="date"], [type="month"], ' +
        '[type="week"], [type="time"], [type="datetime-local"], ' +
        '[type="range"], [type="color"]', function (e) {
            self.validate(e);
        }).on('click.validate', '[type="radio"], [type="checkbox"], select, option', function (e) {
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
        

        if (!rules) { return; }

        if (this.options.focusClear && (e.type === "focusin" || e.type == 'click')
            || this.options.keyupClear && e.type === "keyup") {
            this.hideError($element);
            return;
        }

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
        var $error =$.data($element[0],'error');
        if (!$error) {
            $error = $("<" + this.options.errorElement + ">").addClass(this.options.errorClass);
            $.data($element[0], 'error', $error);
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
        var $error =$.data($element[0],'error');
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

        this.hideError($(element));
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

        this.validFields.data[element.name] = $(element);
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
        remote: '远程验证失败',
        reg:'格式错误'
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
        },
        reg: function (value, $element, param) {
            var reg = new RegExp(param, "igm");
            return this.optional($element) || reg.test(value);
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
define('km/validateTooltips', ['jquery', 'km/validate', 'km/tooltips', 'km/util'], function ($, Validate, Tooltips, util) {


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
            $.data($element[0], '$target', $target);
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

        if (placement.checkParents) {

            var $parents = $target.parents(placement.checkParents+":eq(0)");

            if ($parents.length > 0 && $parents[0].style.display != 'none') {
                tooltips.show();
                $target.addClass(this.options.errorClass);
            }

        } else {
            tooltips.show();
            $target.addClass(this.options.errorClass);
        }
        
    };

    /**
	 * 隐藏tips错误
	 * @param  {JQuery} $element -dom
	 * @return {Void}  
	 */
    ValidateTooltips.prototype.hideError = function ($element, isRemoveClass) {
        if (typeof isRemoveClass === 'undefined') {
            isRemoveClass = true;
        }
        if (this.checkable($element[0])) {
            $element = this.validFields.data[$element[0].name];
        }

        var $target = $.data($element[0], '$target');
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
define('km/waterfall', ['jquery', 'km/infiniteScroll', 'km/popTips'], function ($, InfiniteScroll, popTips) {

    var identity = 1;

    /**
     * 瀑布流模块
     * @param {JQuery} $element - dom
     * @param {Object} options - 参数
     */
    var Waterfall = function ($element, options) {
        this.identity = identity++;
        this.$element = $element;
        this.options = $.extend(true, {
            $scrollElement: $(window),
            scrollDistance: 0,
            width: 200,
            left: 10,
            margin: 20,
            nodeTag: 'li',
            resize: true,
            url: null,
            loaded: $.noop,
            mobilePhone: false,
            pageSize: 20
        }, options);

        this.$panel = this.options.$scrollElement;
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
            this.options.width = (this.$panel.width() - this.options.margin) / 2;
        }

        this.arrangementInit();

        this.infiniteScroll = new InfiniteScroll({
            $watchElement: this.$element,
            $scrollElement: this.options.$scrollElement,
            scrollDistance: this.options.scrollDistance,
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

            this.$panel.on('resize.waterfall.' + this.identity, function () {
                
                self.arrangementInit();
            });
        }
    };

    /**
     * 排列初始化
     * @return {Void}
     */
    Waterfall.prototype.arrangementInit = function () {
        this.arrHeight = [];
        this.nodes = this.$element.children(this.options.nodeTag);

        var winWidth = this.$panel.width();

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
            pageSize: this.options.pageSize
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
define('km/window', ['jquery', 'km/dragdrop', 'km/popTips', 'km/loading'], function ($, DragDrop, popTips, Loading) {


    /**
     * 窗体模块
     * @param {Object} options - 参数
     */
    var Window = function (options) {
        this.options = $.extend(true, {
            id: null,
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
            borderRadius: '6px',
            space:50,
            btns: []
        }, options);

        if (this.options.btns.length == 0) {
            this.options.btns = [
                { text: '确定', className: 'k-btn-primary', action: 'ok' },
                { text: '取消', className: 'k-btn-default', action: 'close' }
            ];
        }

        this._event = {
            open: $.noop,
            ok: $.noop,
            close: $.noop,
            afterClose: $.noop
        };
        this.identity = this.options.id || ids.get();
        this.isClose = true;
        this.loading = false;
        this.template = '<div class="k-window" id="k-window-' + (this.identity) + '">' +
                            '<h4 class="k-window-header"><span class="k-window-title"></span><span class="k-window-close" role="kwin_close">×</span></h4>' +
                            '<div class="k-window-container"></div>' +
                            '<div class="k-window-footer">' +

                                //'<div class="k-btn-box">'+

                                //'<button type="button" class="k-btn k-btn-primary k-window-ok k-btn-inner" role="kwin_ok">确定</button>' +
                                //'<div class="insert-btn-box"></div>' +

                                //'<button type="button" class="k-btn k-btn-default k-window-cancel k-btn-inner" role="kwin_close">取消</button>' +

                                //'</div>'+

                                 //'<div class="append-btn-box"></div>' +

                            '</div>' +
                        '</div>';
        this.backdrop = '<div class="k-window-backdrop"></div>';
        this.$document = $(document);
        this.$window = $(window);
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
            }).append('<iframe frameborder="0" width="100%" src="about:blank" scrolling="auto"></iframe>');
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

        this.$window.on('resize.window.' + this.identity, function () {

            if (self.tm) {
                clearTimeout(self.tm);
            }

            self.tm = setTimeout(function () {
                self.layout();
            }, 300);

        });

        this.$backdrop.on('click.window', function () {
            if (self.options.backdropClose) {
                self.close();
            }
        });


        this.$win.on('click.window', '[role=kwin_close],[role=kwin_cancel]', function () {
            if (self._event.close.call(self) !== false) {
                self.close();
            }
        }).on('click.window', '[role=kwin_ok]', function () {

            if (self._event.ok.call(self) !== false) {
                self.close();
            }
        });


        if (this.options.btns && this.options.btns.length > 0) {
            for (var i = 0, item, action; i < this.options.btns.length; i++) {
                item = this.options.btns[i];
                action = item.action.toLowerCase();

                if (action == 'ok' || action == "cancel" || action == 'close') {
                    continue;
                }


                (function (item, action, self) {

                    self.$win.off('click.window', '[role=kwin_' + action + ']')
                        .on('click.window', '[role=kwin_' + action + ']', function () {
                            if (item.func && item.func.call(self, self.$iframe) !== false) {
                                self.close();
                            }
                        });

                })(item, action, this);



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
     * 设置大小
     * @param {Object} size - 尺寸
     */
    Window.prototype.setSize = function (size) {
        this.options.width = size.width;
        this.options.height = size.height;
        this.$win.css(size);
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

        this.show();
        this.$footer.hide();

        this.loadingShow();
        $.when(
            this.remote()
        ).done(function () {

            if (self.options.iframe) {
                var url = self.options.url;
                if (url.indexOf('?') != -1) {
                    url += '&rand=' + Math.random();
                } else {
                    url += '?rand=' + Math.random();
                }
                self.$iframe.attr('src', url);

                if (!self.bindIframeLoad) {
                    self.$iframe.on('load', function () {

                        var url = self.$iframe.attr('src');

                        if (url == 'about:blank') {
                            return;
                        }

                        if (self.iframeTm) {
                            clearTimeout(self.iframeTm);
                        }

                        self.bindIframeLoad = true;

                        if (self.options.showFooter) {
                            self.$footer.show();
                        }

                        self.loadingHide();
                    });
                }

            } else {
                if (self.options.showFooter) {
                    self.$footer.show();
                }
                self.loadingHide();
            }

        }).fail(function () {
            self.loadingHide();
        }).always(function () {
            
        });
    };

    /**
     * 关闭窗体
     * @param  {Boolean} enforce - 是否强制关闭
     * @return {Void}  
     */
    Window.prototype.close = function (enforce) {
        this.isClose = true;
        this.$win.css({ left: '-900px', top: '-900px' });

        if (this.options.iframe) {
            this.$iframe.attr('src', 'about:blank');
        }

        this.$backdrop.hide();
        zIndex.pop();
        this._event.afterClose.call(self);
        this.loadingHide();
    };

    /**
    * 打开窗体
    * @return {Void}
    */
    Window.prototype.show = function () {
        this.isClose = false;
        this.$win.show();
        if (this.options.backdrop) { this.$backdrop.show(); }
        this.layout();
        this._event.open(this.$win);
        var z = zIndex.get();
        this.$win.css('zIndex', z);
        this.$backdrop.css('zIndex', --z);
        //Loading.hide();
    };

    /**
     * 设置窗体高度
     * @return {Void}
     */
    Window.prototype.layout = function () {

        if (this.isClose) {
            return;
        }

        //屏幕高度
        var screenHeight = this.$window.height();
        //最大弹窗高度
        var maxWinHeight = screenHeight - this.options.space;
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
            left: '50%',
            top: '50%',
            height: newHeight,
            marginLeft: -this.options.width / 2,
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
            height: this.options.height,
            borderRadius: this.options.borderRadius
        });

        $.data(this.$win[0], 'window', this);

        this.$backdrop = $(this.backdrop);
        this.$header = this.$win.find('.k-window-header');
        this.$container = this.$win.find('.k-window-container');
        this.$footer = this.$win.find('.k-window-footer');
        this.$btnBox = this.$footer.find('.k-btn-box');
        this.$appendBtnBox = this.$footer.find('.append-btn-box');
        this.$insertBtnBox = this.$footer.find('.insert-btn-box');
        this.$win.appendTo(this.options.appendTo);
        this.$backdrop.appendTo(this.options.appendTo);
        if (!this.options.showFooter) {
            this.$footer.hide();
        }
        if (this.options.btns && this.options.btns.length > 0) {
            this.$footer.find('.k-btn-inner').hide();
            var html = this.getBtnHtml(this.options.btns);
            this.$footer.append(html);
        }
    };

    /**
     * 设置按钮
     * @return {Void} 
     */
    Window.prototype.setBtns = function (btns) {


        this.$footer.find('.k-btn-inner').show().end().find('.k-btn-custom').remove();

        if (!btns || btns.length == 0) {

            return;
        }

        var self = this;

        this.$footer.find('.k-btn-inner').hide().end().append(this.getBtnHtml(btns, true));

        for (var i = 0, item, action; i < btns.length; i++) {

            item = btns[i];
            action = item.action.toLowerCase();

            if (action == 'ok' || action == 'close' || action == 'cancel') {
                continue;
            }


            (function (item, action, self) {

                self.$win
                .off('click.window', '[role=kwin_' + action + ']')
                .on('click.window', '[role=kwin_' + action + ']', function () {

                    if (item.func && item.func.call(self, self.$iframe) !== false) {
                        self.close();
                    }
                });

            })(item, action, this)


        }
    };

    /**
     * 取创建按钮HTML
     * @return {Void} 
     */
    Window.prototype.getBtnHtml = function (btns, isSet) {

        var html = [];

        for (var i = 0, item, action, className, custom; i < btns.length; i++) {
            item = btns[i];
            action = item.action.toLowerCase();
            className = item.className;
            custom = "k-btn-custom";

            if (action == 'ok') {

                custom = isSet ? custom : "k-btn-inner";

                if (!className) {
                    className = "k-btn-primary";
                }
            }

            if (action == 'close' || action == "cancel") {

                custom = isSet ? custom : "k-btn-inner";

                if (!className) {
                    className = "k-btn-default";
                }
            }

            html.push('<button type="button" class="k-btn ' + (className || "k-btn-primary") + ' ' + custom + ' " role="kwin_' + (action == 'cancel' ? 'close' : action) + '">' + item.text + '</button>');

        }

        return html.join('');
    };

    //显示加载
    Window.prototype.loadingShow = function () {
        this.$container.addClass('k-window-loading');
    };

    //隐藏加载
    Window.prototype.loadingHide = function () {
        this.$container.removeClass('k-window-loading');
    }


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
        win.$win.find("button[role=kwin_close]").hide();
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
        win.setTitle(title);
        win.setContent(content);
        win.on('ok', onOk || $.noop);
        win.on('close', onClose || $.noop);
        win.open();
    };

    /**
     * 关闭窗体静态方法
     * @param  {String|Int} id  - 窗体的ID号
     * @return {Void}   
     */
    Window.close = function (id) {
        $win = $('#k-window-' + id);
        var win = $.data($win[0], 'window');
        if (win) {
            win.close(true);
        }
    };

    /**
     * 打开窗体静态方法
     * @param  {Object} options  - 窗体参数
     * @return {Object}   
     */
    Window.open = function (options) {
        var win = new Window(options);
        win.open();
        return win;
    };


    /**
     * 全局调用
     * @return {void}
     */
    Window.Global = function ($elms) {
        $elms = $elms || $('[data-module=window]');
        $elms.each(function () {
            var $elm = $(this),
                options = $elm.attr('data-options'),
                url = $elm.attr('data-url'),
                width = $elm.attr('data-width'),
                height = $elm.attr('data-height'),
                iframe = $elm.attr('data-iframe'),
                title = $elm.attr('data-title') || '模态窗口',
                content = $elm.attr('data-content'),
                showFooter = $elm.attr('data-showFooter'),
                buttons = $elm.attr('data-btns'),
                onOk = $elm.attr('data-onOk'),
                onClose = $elm.attr('data-onClose'),
                onAfterClose = $elm.attr('data-onAfterClose'),
                data = $.data($elm[0], 'window');




            if (!data) {

                onOk = onOk && onOk.length > 0 ? eval('(0,' + onOk + ')') : $.noop;
                onClose = onClose && onClose.length > 0 ? eval('(0,' + onClose + ')') : $.noop;
                onAfterClose = onAfterClose && onAfterClose.length > 0 ? eval('(0,' + onAfterClose + ')') : $.noop;


                if (options && options.length > 0) {
                    options = eval('(0,' + options + ')');
                } else {
                    options = {
                        url: url,
                        title: title,
                        content: content,
                        width: width && width.length > 0 ? parseInt(width) : 680,
                        height: height && height.length > 0 ? parseInt(height) : 480,
                        showFooter: showFooter && showFooter == 'false' ? false : true,
                        iframe: iframe && iframe == 'false' ? false : true,
                        btns: buttons && buttons.length > 0 ? eval('(0,' + buttons + ')') : []
                    }
                }


                data = new Window(options);

                data.on('ok', function () {
                    return onOk.call(this);
                }).on('close', function () {
                    return onClose.call(this);
                }).on('afterClose', function () {
                    return onAfterClose.call(this);
                });

                $elm.parent('.k-input-group')
                    .off('click.window', 'button')
                    .on('click.window', 'button', function () {
                        data.open();
                    });

                $elm.on('click.window', function () {
                    data.open();
                });

                $.data($elm[0], 'window', data);
            }

        });
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

    var ids = (function () {
        var ids = [];

        return {
            get: function () {
                var id;
                if (ids.length == 0) {
                    id = 1;
                    ids.push(id);
                } else {
                    id = ids[ids.length - 1];
                    id += 1;
                    ids.push(id);
                }
                return id;
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
;
define("KM", ["km/ajax", "km/app", "km/areaSelector", "km/autoComplete", "km/cache", "km/clipZoom", "km/contextMenu", "km/datePicker", "km/dragdrop", "km/dropDownList", "km/dropDownTree", "km/event", "km/focusMap", "km/highlight", "km/imgPreview", "km/infiniteScroll", "km/layout", "km/lazyload", "km/loading", "km/magnifier", "km/mask", "km/pager", "km/panel", "km/placeholder", "km/popover", "km/popTips", "km/portlets", "km/rating", "km/resizable", "km/router", "km/scrollImg", "km/slider", "km/switch", "km/tab", "km/tagSelector", "km/template", "km/tooltips", "km/tree", "km/treeTable", "km/upload", "km/util", "km/validate", "km/validateTooltips", "km/waterfall", "km/window", "km/wordLimit"], function(_ajax, _app, _areaSelector, _autoComplete, _cache, _clipZoom, _contextMenu, _datePicker, _dragdrop, _dropDownList, _dropDownTree, _event, _focusMap, _highlight, _imgPreview, _infiniteScroll, _layout, _lazyload, _loading, _magnifier, _mask, _pager, _panel, _placeholder, _popover, _popTips, _portlets, _rating, _resizable, _router, _scrollImg, _slider, _switch, _tab, _tagSelector, _template, _tooltips, _tree, _treeTable, _upload, _util, _validate, _validateTooltips, _waterfall, _window, _wordLimit){
    return window.KM={
        "ajax" : _ajax,
        "App" : _app,
        "areaSelector" : _areaSelector,
        "autoComplete" : _autoComplete,
        "cache" : _cache,
        "ClipZoom" : _clipZoom,
        "contextMenu" : _contextMenu,
        "DatePicker" : _datePicker,
        "Dragdrop" : _dragdrop,
        "DropDownList" : _dropDownList,
        "DropDownTree" : _dropDownTree,
        "event" : _event,
        "focusMap" : _focusMap,
        "highlight" : _highlight,
        "imgPreview" : _imgPreview,
        "InfiniteScroll" : _infiniteScroll,
        "Layout" : _layout,
        "lazyload" : _lazyload,
        "Loading" : _loading,
        "magnifier" : _magnifier,
        "Mask" : _mask,
        "Pager" : _pager,
        "Panel" : _panel,
        "placeholder" : _placeholder,
        "Popover" : _popover,
        "popTips" : _popTips,
        "portlets" : _portlets,
        "Rating" : _rating,
        "Resizable" : _resizable,
        "Router" : _router,
        "scrollImg" : _scrollImg,
        "slider" : _slider,
        "Switch" : _switch,
        "Tab" : _tab,
        "tagSelector" : _tagSelector,
        "Template" : _template,
        "Tooltips" : _tooltips,
        "Tree" : _tree,
        "TreeTable" : _treeTable,
        "Upload" : _upload,
        "Util" : _util,
        "Validate" : _validate,
        "ValidateTooltips" : _validateTooltips,
        "Waterfall" : _waterfall,
        "Window" : _window,
        "WordLimit" : _wordLimit
    };
});