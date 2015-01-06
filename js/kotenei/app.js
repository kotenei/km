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
        }

        //原来的hash不等于现有的hash或者首次加载，则刷新当前页
        if (hash != curHash || isFirst) {
            this._view[viewName].hash = curHash;
            var instance = this._view[viewName].instance;
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
            this._view[this.viewName].$el.hide().removeClass(this.config.animateClass);
        }

        //显示当前视图
        $view.show().addClass(this.config.animateClass);

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