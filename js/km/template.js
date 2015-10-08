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
        }
    };

    var method = {
        //脚本处理
        script: function (headerCode, code) {
            //删除左侧空格
            code = code.replace('^\s', '');
            //以空格分割字符串
            var split = code.split(' ');
            var key = split.shift();
            var args = split.join(' ');

            switch (key) {
                case 'each':
                    var arr = split[2];
                    var obj = split[0];
                    code = 'each(' + arr + ',function($index,' + obj + '){';

                    break;
                case '/each':
                    code = '});';
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
                    code = "$out+=" + code + ";";
                    break;
            }

            method.getVariable(headerCode, code);

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
        //取变量名
        getVariable: function (headerCode, code) {
            //code=code.replace()
        }
    };

    var Template = function ($el, data) {
        ++index;
        this.$el = $el;
        this.data = data;
        this.source = this.$el[0].innerHTML;
        this.fileName = fileName;
        this.init();
    };

    Template.prototype.init = function () {
        var headerCode = "'use strict';var each=utils.each,";
        var mainCode = "$out='';";
        var footerCode = 'return new String($out);';

        utils.each(this.source.split(tags.open), function (index, item) {

            var code = item.split(tags.close);

            var script = code[0];

            var html = code[1];

            if (code.length == 1) {

                mainCode += method.html(code[0]);

            } else {

                mainCode += method.script(headerCode, script);



                if (html) {
                    mainCode += method.html(html);
                }
            }

        });

        this.code = headerCode + mainCode + footerCode;

        try {
            this.Render = new Function('utils', 'data', this.code);

        } catch (e) {
            throw e;
        }
    };

    Template.prototype.render = function () {
        //return this.Render(utils, this.data);
        return '';
    };

    return Template;

});
