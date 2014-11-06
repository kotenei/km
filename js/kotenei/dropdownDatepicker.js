/**
 * 日历下拉框 
 * @module kotenei/dropdownDatepicker 
 * @author vfasky (vfasky@gmail.com)
 */
define('kotenei/dropdownDatepicker',
['jquery', 'kotenei/dropdown', 'kotenei/datepicker', 'kotenei/util'],
function ($, Dropdown, DatePicker, util) {

    /**
     * 日历下拉框
     * @constructor
     * @alias kotenei/dropdownDatepicker
     * @param {jQuery} $el - dom
     * @param {Object} setting - 参数设置
     */
    var DropdownDatePicker = function ($el, setting) {
        Dropdown.call(this, $el, setting);
    };

    DropdownDatePicker.prototype = util.createProto(Dropdown.prototype);

    /**
     * 生成下拉框内容
     * @return {Void}
     */
    DropdownDatePicker.prototype.buildDrop = function () {    
        var self = this;

        this.datepicker = new DatePicker(self.$el, {
            format: this.setting.format,
            showTime: this.setting.showTime || false
        });

        this.datepicker.on('selected', function (date) {
            self.$el.data('value', date);
            self.setVal(date);
            self.setLabel(date);
        }).on('clean', function () {
            var placeholder = self.$soure.attr('placeholder') || '选择日期';
            self.setVal('');
            self.setLabel(placeholder);
            self.$el.data('value', null);
        });

        self.sync();
    };

    /**
     * 同步数据
     * @return {Void}
     */
    DropdownDatePicker.prototype.sync = function () {
        var date = this.getVal();

        if (date) {
            this.$el.data('value', date);
            this.setVal(date);
            this.setLabel(date);
        }
        else {
            var placeholder = this.$soure.attr('placeholder') || '选择日期';
            this.setLabel(placeholder);
        }
    };

    /**
     * 监听事件
     * @return {Void}
     */
    DropdownDatePicker.prototype.watch = function () { };


    return DropdownDatePicker;

});