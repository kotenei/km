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
