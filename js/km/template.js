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
            if (!arr) {
                arr = [];
            }
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
            if (typeof val === 'undefined' || val == null || val == 'null') {
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

        try {

            this.Render = compile(this.tpl, this.options.partial);
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

    //加载模板
    Template.load = function (tplName, callback) {
        var dtd = $.Deferred();
        var info = tplName.split('/');

        if (info.length >= 2) {
            var fileName = info.pop();
            var root = info.join('/');
            require(["tpl/" + root], function (tpl) {
                var html;
                html = tpl[fileName] ? $.trim(tpl[fileName]) : '';
                if (callback) {
                    callback(html);
                }
                else {
                    dtd.resolve(html);
                }
            });
        }
        return dtd.promise();
    };

    //添加过滤
    Template.addFilter = function (name, callback) {
        filters[name] = callback;
    };

    //编译
    Template.compile = function (tpl, data, partial) {
        return compile(tpl, partial)(utils, filters, data);
    }

    function compile(tpl, partial) {
        var headerCode = "'use strict';var $each=$utils.each,$output=$utils.output,";
        var mainCode = "$out='';";
        var footerCode = 'return new String($out);';
        var variable = [];
        var tmpTpl = method.partial(tpl, partial, 0);
        utils.each(tmpTpl.split(tags.open), function (index, item) {

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
        var code = headerCode + variable.join('') + mainCode + footerCode;
        var render = new Function('$utils', '$filter', '$data', code);
        return render;
    }

    return Template;

});
