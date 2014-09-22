/**
 * 日历下拉框 
 * @module kotenei/dropdownDatepicker 
 * @author vfasky (vfasky@gmail.com)
 */
define('kotenei/dropdownDatepicker', 
['jquery', 'kotenei/dropdown', 'kotenei/util', 'foundation-datepicker'],
function($, Dropdown, util){

    $.fn.fdatepicker.dates['zh-CN'] = {
        days: ["日", "一", "二", "三", "四", "五", "六", "日"],
        daysShort: ["日", "一", "二", "三", "四", "五", "六", "日"],
        daysMin: ["日", "一", "二", "三", "四", "五", "六", "日"],
        months: ["1 月", "2 月", "3 月", "4 月", "5 月", "6 月", "7 月", "8 月", "9 月", "10 月", "11 月", "12 月"],
        monthsShort: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
        today: "今天"
    };

    var Datepicker = function($el, setting){
        Dropdown.call(this, $el, setting);
    };

    Datepicker.prototype = util.createProto(Dropdown.prototype);

    Datepicker.prototype.buildDrop = function(){
        if(this.$drop){
            return;
        }
        var self = this;
        self.$drop = $('<div class="widget-dropbox-drop"/>').css({
            width: 242,
            height: 252
        }).hide();

        self.$el.fdatepicker($.extend({
            format: 'yyyy-mm-dd',
            language: 'zh-CN'
        }, self.setting)).on('changeDate', function(val){
            var date = self.datepicker.getFormattedDate();
            self.setVal(date);
            self.setLabel(date);
        });
        self.datepicker = self.$el.data('datepicker');
        self.datepicker.picker.appendTo(self.$drop);
        self.$drop.appendTo($('body'));
        self.syncPosition(); 
        self.sync();
    };

    Datepicker.prototype.watch = function(){
        var self = this;
        this.$el.on('click', function(){
            self.showDrop();
        });
    };

    Datepicker.prototype.sync = function(){
        var date = this.getVal();
        if(date){
            this.$el.data('date', date);
            this.datepicker.update();
            this.setLabel(date);
        }
        else{
            var placeholder = this.$soure.attr('placeholder') || '选择日期';
            this.setLabel(placeholder);
        }
    };

    return Datepicker;
});