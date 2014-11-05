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
        var date = new Date();
        this.$element = $element;
        this.options = $.extend({}, {
            appendTo: $(document.body),
            showTime: false,
            year: { min: 1900, max: 2050 },
            format: 'yyyy-mm-dd'
        }, options);
        this.year = date.getFullYear();
        this.month = date.getMonth() + 1;
        this.day = date.getDate();
        this.index = 0;
        this.isSetTime = false;
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

        this.$datepicker.on('click', function (e) {
            var target = e.target,
                $target = $(target);

            if (target.id === 'year' || target.id === 'month'
                || $target.parents('.year-box:eq(0)').length > 0 || $target.parents('.month-box:eq(0)').length > 0) {
                return false;
            }

            self.yearBoxToggle(false);
            self.monthBoxToggle(false);
            self.timePanelHide();
            return false;
        }).on('click', '[role="prev"]', function () {
            //向前
            var options = self.options;
            self.month--;
            self.prevToggle();

            if (self.month < 1) {
                self.month = 12;
                self.year--;
            }
            self.$next.show();
            self.createDays();
        }).on('click', '[role="next"]', function () {
            //向后
            var options = self.options;
            self.month++
            self.nextToggle();
            if (self.month > 12) {
                self.month = 1;
                self.year++;
            }
            self.$prev.show();
            self.createDays();
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
            self.prevToggle();
            self.nextToggle();
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
            self.prevToggle();
            self.nextToggle();
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
        }).on('click', '[role="clear"]', function () {
            //清空
            self.isSetTime = false;
            self.$element.val('');
            self.setTodayInfo();
            self.createDays();
            self.setViewInfo();
            self.hide();
        }).on('click', '[role="today"]', function () {
            //今天
            self.setTodayInfo();
            self.createDays();
            self.hide();
            self.set(true);
        }).on('click', 'tbody td', function () {
            //点击天
            var $this = $(this),
                year = $this.attr('data-year'),
                month = $this.attr('data-month'),
                day = $this.attr('data-day');

            self.year = parseInt(year);
            self.month = parseInt(month);
            self.day = parseInt(day);
            self.createDays();

            if (!self.options.showTime) {
                self.set();
                self.hide();
            }
            
        }).on('click', 'span.hours', function () {
            //点击小时
            self.setTimePanelPosition($(this), self.$hoursBox);
            return false;
        }).on('click', 'span.minutes', function () {
            //点击分种
            self.setTimePanelPosition($(this), self.$minutesBox);
            return false;
        }).on('click', 'span.seconds', function () {
            //点击秒
            self.setTimePanelPosition($(this), self.$secondsBox);
            return false;
        }).on('click', '.time-box li', function () {
            //选择时、分、秒
            var $this = $(this),
                value = $this.attr('data-value'),
                text=$this.text(),
                target = $this.attr('data-target');
            switch (target) {
                case "hours":
                    self.hours = value;
                    self.$hours.text(text);
                    break;
                case "minutes":
                    self.minutes = value;
                    self.$minutes.text(text);
                    break;
                case "seconds":
                    self.seconds = value;
                    self.$seconds.text(text);
                    break;
            }
        }).on('click', '[role="confirm"]', function () {
            //点击确定
            self.isSetTime = true;
            self.hours = Number(self.$hours.text());
            self.minutes = Number(self.$minutes.text());
            self.seconds = Number(self.$seconds.text());
            self.set();
            self.hide();
        });

        $(document).on('click.datepicker', function () {
            self.hide();
        });
    };

    DatePicker.prototype.setTimePanelPosition = function ($curObj, $panel) {
        var css = { left: $curObj.position().left - 1, top: $curObj.position().top - $panel.outerHeight() };
        $panel.show().css(css).siblings('ul').hide();
    }

    DatePicker.prototype.createPanel = function () {
        var html = [];

        html.push('<div class="k-datepicker">');
        html.push('<div class="container">');
        html.push('<table>');

        //头部
        html.push('<thead>');
        html.push('<tr>');
        html.push('<th class="prev"  style="width:28px;"><i class="fa fa-chevron-left" role="prev"></i></th>');
        html.push('<th colspan="5">');
        html.push('<span id="year" style="margin-right:20px;">' + this.year + '</span>');
        html.push('<span id="month">' + dates.months[this.month - 1] + '</span>');
        html.push('</th>');
        html.push('<th class="next"  style="width:28px;"><i class="fa fa-chevron-right" role="next"></i></th>');
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
        html.push(this.getTimeBox());

        html.push('<div style="text-align:right">');
        html.push('<input type="button" value="清空" role="clear" />&nbsp;');
        html.push('<input type="button" value="今天" role="today" />&nbsp;');
        if (this.options.showTime) {
            html.push('<input type="button" value="确定" role="confirm" />&nbsp;');
        }

        html.push('</div>');
        html.push('</div>');
        html.push('</div>');

        this.$datepicker = $(html.join(''));
        this.$year = this.$datepicker.find('#year');
        this.$yearBox = this.$datepicker.find('.year-box');
        this.$yearItems = this.$yearBox.find('ul');
        this.$month = this.$datepicker.find('#month');
        this.$monthBox = this.$datepicker.find('.month-box');
        this.$timeBox = this.$datepicker.find('.time-box');
        this.$hours = this.$timeBox.find('span.hours');
        this.$minutes = this.$timeBox.find('span.minutes');
        this.$seconds = this.$timeBox.find('span.seconds');
        this.$hoursBox = this.$timeBox.find('.hours-box');
        this.$minutesBox = this.$timeBox.find('.minutes-box');
        this.$secondsBox = this.$timeBox.find('.seconds-box');
        this.$prev = this.$datepicker.find('th.prev i');
        this.$next = this.$datepicker.find('th.next i');
        this.index = this.$yearItems.find("li.cur").parent().show().index();
        this.createDays();

        if (this.options.showTime) {
            this.$timeBox.show();
        } else {
            this.$timeBox.hide();
        }
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
                contentHtml.push('<li id="li_' + year + '" class="' + (this.year == year ? "cur" : "") + '">' + year + '</li>');
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

    DatePicker.prototype.getTimeBox = function () {

        function fix(str) {

            str = String(str);

            if (str.length === 1) {
                return '0' + str;
            }

            return str;
        }

        html = [], date = new Date();

        html.push('<div class="time-box">');

        //小时
        html.push('<ul class="hours-box">');
        for (var i = 0; i < 24; i++) {
            html.push('<li data-target="hours" data-value=' + i + '>' + fix(i) + '</li>');
        }
        html.push('</ul>');

        //分
        html.push('<ul class="minutes-box">');
        for (var i = 0; i <= 55; i += 5) {
            html.push('<li data-target="minutes" data-value=' + i + '>' + fix(i) + '</li>');
        }
        html.push('</ul>');

        //秒
        html.push('<ul class="seconds-box">');
        for (var i = 0; i <= 55; i += 15) {
            html.push('<li data-target="seconds" data-value=' + i + '>' + fix(i) + '</li>');
        }
        html.push('</ul>');


        html.push('<div class="time-box-container">');
        html.push('<span>时间：</span>');
        html.push('<div >');
        html.push('<span class="hours">' + date.getHours() + '</span>');
        html.push('<span>:</span>');
        html.push('<span class="minutes">' + date.getMinutes() + '</span>');
        html.push('<span>:</span>');
        html.push('<span class="seconds">' + date.getSeconds() + '</span>');
        html.push('</div>');
        html.push('</div>');

        html.push('</div>');

        return html.join('');
    };

    DatePicker.prototype.createDays = function () {
        var day = this.day;

        //当月最后一天  new Date('2014/4/0').getDate() 表示获取2014年3月最后一天
        var curMonthLastDay = this.getMonthLastDay(this.year, this.month);

        //前一个月最后一天
        var prevMonthLastDay = this.getMonthLastDay(this.year, this.month - 1);

        //当月第一天星期几
        var fristDay = new Date(this.year, this.month - 1, 1).getDay();

        //创建42个长度的数组
        var arr = new Array(42), arrDaysHtml = [], tmp = 42 - curMonthLastDay;

        //存放天数，下标j为星期几
        for (var i = 0, j = fristDay; i < curMonthLastDay; i++, j++) {
            arr[j] = { year: this.year, month: this.month, day: i + 1, tdClass: '' };
            if (i + 1 == curMonthLastDay) {
                tmp = 42 - j;
            }
        }

        //前补位
        for (var i = fristDay, j = 0; i >= 1  ; i--, j++) {

            if (this.month == 1) {
                arr[j] = { year: this.year - 1, month: 12, day: prevMonthLastDay - i + 1, tdClass: 'old' };
            } else {
                arr[j] = { year: this.year, month: this.month - 1, day: prevMonthLastDay - i + 1, tdClass: 'old' };
            }
        }

        //后补位
        for (var i = (42 - tmp) + 1, j = 1 ; i < 42; i++, j++) {
            if (this.month == 12) {
                arr[i] = { year: this.year + 1, month: 1, day: j, tdClass: 'new' };
            } else {
                arr[i] = { year: this.year, month: this.month + 1, day: j, tdClass: 'new' };
            }
        }

        //构造表格
        var flag = 0, count = 0;
        for (var i = 0; i < 6; i++) {
            arrDaysHtml.push("<tr>");
            for (var j = flag, curValue, todayClass, tdClass; j < 42; j++) {

                curValue = arr[j];


                if (curValue.year == this.year && curValue.month == this.month && this.day == curValue.day) {
                    todayClass = "today";
                } else {
                    todayClass = "";
                }

                arrDaysHtml.push('<td id="' + curValue.year + '_' + curValue.month + '_' + curValue.day + '" class="' + curValue.tdClass + '   ' + todayClass + '  " data-year="' + curValue.year + '" data-month="' + curValue.month + '" data-day="' + curValue.day + '"><span>' + curValue.day + '</span></td>');
                flag++;
                count++;
                if (count == 7) {
                    count = 0;
                    break;
                }
            }
            arrDaysHtml.push("</tr>");
        }

        this.$datepicker.find("tbody").html(arrDaysHtml.join(""));
        this.setViewInfo();
    };

    DatePicker.prototype.getMonthLastDay = function (year, month) {
        return (new Date(new Date(year, month, 1).getTime() - 1000 * 60 * 60 * 24)).getDate();
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

    DatePicker.prototype.timePanelHide = function () {
        this.$hoursBox.hide();
        this.$minutesBox.hide();
        this.$secondsBox.hide();
    };

    DatePicker.prototype.toCurYearPanel = function () {
        this.$yearItems.hide().eq(this.index).show();
    };

    DatePicker.prototype.prevToggle = function () {
        if (this.year === this.options.year.min && this.month == 1) {
            this.$prev.hide();
        } else {
            this.$prev.show();
        }

    };

    DatePicker.prototype.nextToggle = function () {
        if (this.year == this.options.year.max && this.month == 12) {
            this.$next.hide();
        } else {
            this.$next.show();
        }
    };

    DatePicker.prototype.show = function () {
        this.$datepicker.show().css({
            left: this.$element.position().left,
            top: this.$element.position().top + this.$element[0].offsetHeight + 2
        });
        this.setTime();
    };

    DatePicker.prototype.hide = function () {
        this.$datepicker.hide();
        this.yearBoxToggle(false);
        this.monthBoxToggle(false);
        this.timePanelHide();
    };

    DatePicker.prototype.setTodayInfo = function () {
        var today = new Date();
        this.year = today.getFullYear();
        this.month = today.getMonth() + 1;
        this.day = today.getDate();
        this.hours = today.getHours();
        this.minutes = today.getMinutes();
        this.seconds = today.getSeconds();
    };

    DatePicker.prototype.setViewInfo = function () {
        this.prevToggle();
        this.nextToggle();
        this.$year.html(this.year);
        this.$month.html(dates.months[this.month - 1]);
        this.$yearBox.find("li").removeClass("cur");
        this.$yearBox.find("#li_" + this.year).addClass("cur").parent().show().siblings().hide();
        this.$datepicker.find('tbody td span').removeClass('active');
        this.$datepicker.find('#' + this.year + '_' + this.month + '_' + this.day).children().addClass('active');
        this.index = this.$yearItems.find("li.cur").parent().show().index();
    };

    DatePicker.prototype.setTime = function () {
        var date = new Date();

        var curHours = date.getHours(),
            curMinutes = date.getMinutes(),
            curSeconds = date.getSeconds();

        this.$hours.text(this.isSetTime ? (this.hours || curHours) : curHours);
        this.$minutes.text(this.isSetTime ? (this.minutes || curMinutes) : curMinutes);
        this.$seconds.text(this.isSetTime ? (this.seconds || curSeconds) : curSeconds);
    };

    DatePicker.prototype.set = function (isToday) {
        isToday = isToday || false;
        this.isSetTime = true;
        var today = new Date();
        var year = isToday ? today.getFullYear() : this.year,
            month = isToday ? today.getMonth() : this.month - 1,
            day = isToday ? today.getDate() : this.day,
            hours = isToday || !this.options.showTime ? today.getHours() : (this.hours || today.getHours()),
            minutes = isToday || !this.options.showTime ? today.getMinutes() : (this.minutes || today.getMinutes()),
            seconds = isToday || !this.options.showTime ? today.getSeconds() : (this.seconds || today.getSeconds());

        var date = new Date(year, month, day, hours, minutes, seconds);
        var value = this.format(date);
        this.$element.val(value);
    };

    DatePicker.prototype.format = function (date) {
        date = date || new Date();

        var formatStr = this.options.format.replace(/"/g, "");

        var o = {
            "y+": date.getFullYear(),
            "M+": date.getMonth() + 1,
            "d+": date.getDate(),
            "h+": date.getHours(),
            "m+": date.getMinutes(),
            "s+": date.getSeconds()
        };

        for (var k in o) {
            if (new RegExp("(" + k + ")").test(formatStr)) {
                var value = o[k];
                formatStr = formatStr.replace(RegExp.$1, value.toString().length == 1 ? ("0" + value.toString()) : value);
            }
        }

        return formatStr;
    };

    return DatePicker;

});
