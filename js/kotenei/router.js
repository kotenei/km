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