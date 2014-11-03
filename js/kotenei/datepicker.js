/**
 * 日期模块
 * @date :2014-10-31
 * @author kotenei (kotenei@qq.com)
 */
define('kotenei/datepicker', ['jquery'], function ($) {

    var dates = {
        months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一", "十二"],
        days: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
        daysShort: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
        daysMin: ["日", "一", "二", "三", "四", "五", "六"]
    };

    var DatePicker = function ($element, options) {
        this.$element = $element;
        this.options = $.extend({}, {
            appendTo: $(document.body),
            year: { min: 1900, max: 2050 },
            format: 'yyyy-mm-dd'
        }, options);
        this.year = new Date().getFullYear();
        this.month = new Date().getMonth() + 1;
        this.day = new Date().getDate();
        this.index = 0;
        this.init();
        this.eventBind();
    };

    DatePicker.prototype.init = function () {
        this.createPanel();
        this.$datepicker.appendTo(this.options.appendTo);
    };

    DatePicker.prototype.eventBind = function () {
        var self = this;

        this.$element.on('click.datepicker', function () {
            self.show();
            return false;
        });

        this.$datepicker.on('click', function () {
            return false;
        }).on('click', '#month', function () {
            //点击月份
            self.monthBoxToggle(true);
            self.yearBoxToggle(false);
        }).on('click', '.month-box li', function () {
            //选择月份
            var $this = $(this),
                text = $this.text(),
                month = $this.attr("data-month");

            self.month = parseInt($.trim(month));
            self.monthBoxToggle(false);
            self.createDays();
        }).on('click', '#year', function () {
            //点击年份
            self.yearBoxToggle(true);
            self.monthBoxToggle(false);
        }).on('click', '.year-box li', function () {
            //选择年份
            var $this = $(this),
                text = parseInt($.trim($this.text()));
            if ($this.hasClass("cur")) { return; }
            self.$yearBox.find("li").removeClass("cur");
            $this.addClass("cur");
            self.year = text;
            self.createDays();
            self.yearBoxToggle(false);
        }).on('click', '[role="yearPrev"]', function () {
            //向前选择年份
            if (self.index == 0) {
                return;
            }
            self.index--;
            self.toCurYearPanel();

        }).on('click', '[role="yearNext"]', function () {
            //向后选择年份
            if (self.index == self.$yearItems.length - 1) {
                return;
            }
            self.index++;
            self.toCurYearPanel();
        });

        $(document).on('click.datepicker', function () {
            self.hide();
        });
    };

    DatePicker.prototype.createPanel = function () {
        var html = [];

        html.push('<div class="k-datepicker">');
        html.push('<div class="container">');
        html.push('<table>');

        //头部
        html.push('<thead>');
        html.push('<tr>');
        html.push('<th class="prev" role="prev"><i class="fa fa-chevron-left"></i></th>');
        html.push('<th colspan="5">');
        html.push('<span id="year" style="margin-right:20px;">' + this.year + '</span>');
        html.push('<span id="month">' + dates.months[this.month - 1] + '</span>');
        html.push('</th>');
        html.push('<th class="next" role="next"><i class="fa fa-chevron-right"></i></th>');
        html.push('</tr>');
        html.push('<tr>');
        for (var i = 0; i < dates.daysMin.length; i++) {
            html.push('<th>' + dates.daysMin[i] + '</th>');
        }
        html.push('</tr>');
        html.push('</thead>');

        html.push('<tbody>');
        html.push('</tbody>');


        html.push('</table>');
        html.push(this.getYearBox());
        html.push(this.getMonthBox());
        html.push('</div>');
        html.push('</div>');

        this.$datepicker = $(html.join(''));
        this.$year = this.$datepicker.find('#year');
        this.$yearBox = this.$datepicker.find('.year-box');
        this.$yearItems = this.$yearBox.find('ul');
        this.$month = this.$datepicker.find('#month');
        this.$monthBox = this.$datepicker.find('.month-box');
        this.index = this.$yearItems.find("li.cur").parent().show().index();
        
    };

    DatePicker.prototype.getYearBox = function () {
        var html = [], contentHtml = [], flag = 1, count = 1,
        totalCount = (this.options.year.max - this.options.year.min) + 1,
        year = this.options.year.min - 1,
        page;

        //分页
        if (totalCount % 10 == 0) {
            page = totalCount / 10;
        } else {
            page = parseInt(totalCount / 10) + 1;
        }


        for (var i = 1; i <= page; i++) {

            contentHtml.push('<ul>');

            for (var j = flag; j <= totalCount ; j++) {

                year += 1;
                contentHtml.push('<li class="' + (this.year == year ? "cur" : "") + '">' + year + '</li>');
                flag++;

                if (count % 10 === 0) {
                    count = 1;
                    break;
                }

                count++;
            }

            contentHtml.push('</ul>');
        }

        html.push('<div class="year-box">');

        html.push('<div class="year-box-container">');

        html.push(contentHtml.join(""));

        html.push('</div>');

        html.push('<div class="year-box-controls">');
        html.push('<i class="fa fa-chevron-left" style="float:left;" role="yearPrev"></i>');
        html.push('<i class="fa fa-chevron-right" style="float:right;" role="yearNext"></i>');
        html.push('</div>');
        html.push('</div>');
        return html.join('');
    };

    DatePicker.prototype.getMonthBox = function () {
        var html = [];

        html.push('<ul class="month-box">');

        for (var i = 0; i < dates.months.length; i++) {
            html.push('<li data-month="' + (i + 1) + '">' + dates.months[i] + '</li>');
        }

        html.push('</ul>');

        return html.join('');
    };

    DatePicker.prototype.createDays = function () {
        this.$year.html(this.year);
        this.$month.html(dates.months[this.month - 1]);
    };

    DatePicker.prototype.createTime = function () {

    };

    DatePicker.prototype.yearBoxToggle = function (isShow) {
        var css = { left: this.$year.position().left, top: this.$year.position().top + this.$year.outerHeight() - 2 };

        if (isShow) {
            this.$year.addClass('selected');
            this.$yearBox.show().css(css);
        } else {
            this.$year.removeClass('selected');
            this.$yearBox.hide();
        }
    };

    DatePicker.prototype.monthBoxToggle = function (isShow) {
        var css = { left: this.$month.position().left, top: this.$month.position().top + this.$month.outerHeight() - 2 };

        if (isShow) {
            this.$month.addClass('selected');
            this.$monthBox.show().css(css);
        } else {
            this.$month.removeClass('selected');
            this.$monthBox.hide();
        }
    };

    DatePicker.prototype.toCurYearPanel = function () {
        this.$yearItems.hide().eq(this.index).show();
    };

    DatePicker.prototype.show = function () {
        this.$datepicker.show().css({
            left: this.$element.position().left,
            top: this.$element.position().top + this.$element[0].offsetHeight + 2
        })
    };

    DatePicker.prototype.hide = function () {
        this.$datepicker.hide();
        this.monthBoxToggle(false);
    };

    return DatePicker;

});
