/**
 * 日期模块
 * @date :2014-10-31
 * @author kotenei (kotenei@qq.com)
 */
define('kotenei/datepicker', ['jquery'], function ($) {

    var dates = {
        months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
        days: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
        daysShort: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
        daysMin: ["日", "一", "二", "三", "四", "五", "六"]
    };

    var DatePicker = function ($element, options) {
        this.$element = $element;
        this.options = $.extend({}, {
            year: { min: 1900, max: 2100 },
            format: 'yyyy-mm-dd'
        }, options);
    }

    DatePicker.prototype.init = function () { };

    DatePicker.prototype.eventBind = function () { };

    return DatePicker;

});
