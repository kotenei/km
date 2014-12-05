/*
 * ajax 模块
 * @date:2014-12-05
 * @author:kotenei(kotenei@qq.com)
 */
define('kotenei/ajax', ['jquery', 'kotenei/loading', 'kotenei/popTips'], function ($, Loading, popTips) {

    /**
     * ajax 通用操作封装
     * @return {Object} 
     */
    var Ajax = (function () {

        var _instance;

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
            var ajax = function (type, url, data) {

                var dtd = $.Deferred();

                Loading.show();

                $.ajax({
                    url: url,
                    type: type,
                    data: data || {}
                }).done(function (ret) {
                    if (typeof ret === 'string') {
                        try {
                            ret = eval('(' + ret + ')');
                        } catch (e) {
                            dtd.resolve(ret);
                            return dtd.promise();
                        }
                    }
                    if (ret.Status) {
                        if (ret.Message) {
                            popTips.success(ret.Message, 1000, function () {
                                if (ret.Url) {
                                    window.location.href = ret.Url;
                                } else {
                                    dtd.resolve(ret);
                                }
                            });
                        } else if (ret.Url) {
                            window.location.href = ret.Url;
                        } else {
                            dtd.resolve(ret);
                        }
                    } else {
                        if (ret.ErrorMessage) {
                            popTips.error(ret.ErrorMessage || "发生了未知错误", 1000, function () {
                                if (ret.Url) {
                                    window.location.href = ret.url;
                                } else {
                                    dtd.resolve(ret);
                                }
                            })
                        } else if (ret.Url) {
                            window.location.href = ret.Url;
                        } else {
                            dtd.resolve(ret);
                        }
                    }
                }).fail(function () {
                    popTips.error("服务器发生错误", 1000);
                }).always(function () {
                    Loading.hide();
                });

                return dtd.promise();
            };

            return {
                post: function (url, data) {
                    return ajax("POST", url, data);
                },
                get: function (url, data) {
                    return ajax("GET", url, data);
                },
                ajaxForm: function ($form) {
                    var url = $form.attr('action'),
                        type = $form.attr('method'),
                        data = $form.serialize();

                    if ($form.valid) {
                        if ($form.valid()) {
                            return ajax(type, url, data);
                        }
                    } else {
                        return ajax(type, url, data);
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