/*
 * 模板
 * @date:2015-09-28
 * @author:kotenei(kotenei@qq.com)
 */
define('km/template', ['jquery'], function ($) {

    var index = 0;

    var fileName = 'tpl_' + index;

    var keywords =
        'break,case,catch,continue,debugger,default,delete,do,else,false'
      + ',finally,for,function,if,in,instanceof,new,null,return,switch,this'
      + ',throw,true,try,typeof,var,void,while,with';

    var tags = {
        open: '{{',
        close: '}}'
    };


    var util = {
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

        escape: function (code) {
            return "'" + code
            // 单引号与反斜杠转义
            .replace(/('|\\)/g, '\\$1')
            // 换行符转义(windows + linux)
            .replace(/\r/g, '\\r')
            .replace(/\n/g, '\\n') + "'";
        },

        html: function (code) {


            code = code.replace(/\s+/g, ' ').replace(/<!--[\w\W]*?-->/g, '');

            if (code) {
                code = "$out+=" + method.escape(code) + ";" + "\n";
            }



            return code;
        },
        logic: function (code) {

            code = method.parser(code);

            return code;

        },
        parser: function (code) {

            code = code.replace(/^\s/, '');

            var split = code.split(' ');
            var key = split.shift();
            var args = split.join(' ');

            switch (key) {
                case 'each':

                    var item = split[0],
                        data = split[2];

                    code = "util.each(data,function(index," + item + "){";

                    break;
                case '/each':

                    code = '})';

                    break;
                default:
                    code = '=' + code;
                    break;
            }

            return code;
        }
    };



    var Template = function ($el, data) {
        ++index;
        this.$el = $el;
        this.data = data;
        this.source = this.$el.html().replace(/^\s*|\s*$/g, '');
        this.fileName = fileName;
        this.init();
    };

    Template.prototype.init = function () {

        var mainCode = "$out='';";

        util.each(this.source.split(tags.open), function (index, code) {
            var code = code.split(tags.close);
            var $c0 = code[0];
            var $c1 = code[1];

            if (code.length == 1) {
                mainCode += method.html($c0);
            } else {
                mainCode += method.logic($c0);

                if ($c1) {
                    mainCode += method.html($c1);
                }
            }

        });

        console.log(mainCode)

    };

    Template.prototype.compile = function () {

    };

    Template.prototype.render = function () {
        var html = '';

        return html;
    };

    return Template;

});
