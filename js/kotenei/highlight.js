/**
 * 高亮模块
 * @date :2014-10-30
 * @author kotenei (kotenei@qq.com)
 */
define('kotenei/highlight', ['jquery'], function ($) {

    var exports = {};

    var $body = $(document.body);

    exports.highlight = function ($elm, keywords, className) {

        if ($.isArray($elm)) {
            className = keywords;
            keywords = $elm;
            $elm = $body;
        }

        if (!$.isArray(keywords)) {
            keywords = [keywords];
        }

        className = className || "k-highlight"

        var html = this.highlightText($elm.html(), keywords, className);

        $elm.html(html);
    };

    exports.highlightText = function (source, keywords, className) {
        for (var i = 0,keyword; i < keywords.length; i++) {
            keyword = keywords[i];
            source = source.replace(new RegExp('('+keyword+")","igm"), '<mark class="'+className+'">$1</mark>');
        }
        return source;
    }

    exports.clean = function (source) {

    };

    return exports;
});
