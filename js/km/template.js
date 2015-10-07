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

    var method={
        script: function (code) {
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
                    code= '_each(' + arr + ',function(index,' + obj + '){';
                    break;
                case '/each':
                    code='});';
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

            }


            return code;
        },
        html: function (code) { }
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

        var main = "'use strict';";

        main += "var $out='';";



        utils.each(this.source.split(tags.open), function (index, item) {
            var code = item.split(tags.close);
            var script = code[0];
            var html = code[1];
            
            if (code.length==1) {

            } else {
                main += method.script(script);
            }

        });

        console.log(main)


        return;

        this.regSettings = {
            forStart: new RegExp(tags.open + '\\s*each\\s*(\\w*?)\\s*in\\s*(\\w*?)\\s*' + tags.close, 'igm'),
            forEnd: new RegExp(tags.open + '\\s*\\/each\\s*' + tags.close, 'igm'),
            ifStart: new RegExp(tags.open + '\\s*if\\s*([^}]*?)' + tags.close, 'igm'),
            ifEnd: new RegExp(tags.open + '\\s*\\/if\\s*' + tags.close, 'igm'),
            elseifStart: new RegExp(tags.open + '\\s*else if\\s*([^}]*?)' + tags.close, 'igm'),
            elseStart: new RegExp(tags.open + '\\s*else\\s*' + tags.close, 'igm'),
            interpolate: new RegExp(tags.open + '([\\s\\S]+?)' + tags.close, 'igm'),
            html: new RegExp('<[^>]*?(.*?)<\/\1>', 'igm')
        };



        this.source = this.source.replace(this.regSettings.forStart, function (source, item, list) {
            return 'util.each(' + list + ',function(index,' + item + '){';
        }).replace(this.regSettings.forEnd, function (source) {
            return '});';
        }).replace(this.regSettings.ifStart, function (source, condition) {
            return 'if ( ' + condition + ' ) {';
        }).replace(this.regSettings.ifEnd, function () {
            return '}';
        }).replace(this.regSettings.elseifStart, function (source, condition) {
            return '} else if (' + condition + ') {';
        }).replace(this.regSettings.elseStart, function () {
            return '} else {';
        }).replace(this.regSettings.interpolate, function (source, exp) {
            return "$out+=" + exp + ";";
        }).replace(/<span>(.*)<\/span>/igm, function (source, content) {
            console.log(source)
        }).replace(/(<\/?[^>]+?\s*?\/?>)/igm, function (source) {
            return "$out+='" + source + "';";
        })

        this.source = code + this.source;

        console.log(this.source);
    };



    Template.prototype.render = function () {
        var html = '';

        return html;
    };

    return Template;

});
