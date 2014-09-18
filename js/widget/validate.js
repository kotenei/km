/*
 * 表单验证模块 用法和jqeury.validate一样 轻量级
 * @date:2014-09-04
 * @email:kotenei@qq.com
 */
define('widget/validate', ['jquery'], function ($) {


    function Validate($form, options) {
        this.$form = $form;
        this.options = $.extend({}, Validate.DEFAULTS, options);
        this.rules = this.options.rules;
        this.messages = this.options.messages;
        this.init();
    }

    //默认参数
    Validate.DEFAULTS = {
        errorClass: 'error',
        errorElement: 'label',
        rules: {},
        messages: {},
        focusClear: true,
        keyupClear: true,
        errorPlacement: null
    }

    //初始化
    Validate.prototype.init = function () {
        this.getValidFields();
        if (this.validFields.count === 0) {
            return;
        }
        this.eventBind();
    };

    //获取验证的元素
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

    //事件绑定
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

    //验证
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

    //表单提交时验证
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

    //验证元素类别是不是单选或者复选框
    Validate.prototype.checkable = function (element) {
        return (/radio|checkbox/i).test(element.type);
    };

    //处理错误
    Validate.prototype.formatAndAdd = function (element, rule) {
        var $element = $(element);
        var message = this.defaultMessage(element, rule.method);
        message = this.format(message, rule.parameters);
        this.showError($element, message);
    };

    //显示错误
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

    //隐藏错误
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

    //获取默认提示
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

    //格式化提示
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

    //默认错误提示信息
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


    //验证的规则
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

    //记录之前的远程验证信息
    Validate.prototype.previousValue = function (element) {
        return $.data(element, "previousValue") || $.data(element, "previousValue", {
            old: null,
            valid: true,
            message: this.defaultMessage(element, "remote")
        });
    }

    //可选方法，验证时值非必填
    Validate.prototype.optional = function ($element) {
        var val = this.elementValue($element);
        return !this.methods.required.call(this, val, $element);
    };

    //取元素值
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

    //获取选中项元素的长度
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