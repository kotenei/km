/**
 * 日期模块
 * @date :2014-10-31
 * @author kotenei (kotenei@qq.com)
 */
define('km/datePicker', ['jquery'], function ($) {

    var dates = {
        months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一", "十二"],
        days: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
        daysShort: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
        daysMin: ["日", "一", "二", "三", "四", "五", "六"]
    };

    var date = new Date();
    /**
     * 日期模块
     * @param {JQuery} $element - dom
     * @param {Object} options - 参数
     */
    var DatePicker = function ($element, options) {
        var self = this;
        this.$element = $element;
        this.options = $.extend(true, {
            position: 'left',
            desktop: false,
            data: [],
            appendTo: $(document.body),
            showTime: false,
            year: { min: date.getFullYear() - 100, max: date.getFullYear() + 100 },
            format: 'yyyy-MM-dd',
            inputGroup: '.k-input-group',
            positionProxy: function () {
                return self.getPosition();
            },
            minDate: null,
            maxDate: null,
            zIndex: 2000
        }, options);

        this.isInput = this.$element[0].tagName.toLowerCase() == 'input';
        this.year = date.getFullYear();
        this.month = date.getMonth() + 1;
        this.day = date.getDate();
        this.index = 0;
        this.isSetTime = false;
        this.selectDay = false;
        this.event = {
            selected: [],
            clean: [],
            change: []
        };
        this.init();

    };

    /**
     * 添加自定义事件
     * @return {Object}
     */
    DatePicker.prototype.on = function (name, callback) {
        if ($.isArray(this.event[name])) {
            this.event[name].push(callback);
        }

        return this;
    };

    /**
     * 取位置坐标
     *
     * @return {Object}
     */
    DatePicker.prototype.getPosition = function () {
        var position = { left: 0, top: 0 };
        var container = this.options.appendTo[0];
        var parent = this.$element[0];

        do {

            position.left += parent.offsetLeft - parent.scrollLeft;

            position.top += parent.offsetTop - parent.scrollTop;
        } while ((parent = parent.offsetParent) && parent != container);

        if (this.options.position != 'left') {

            var tmp_h_1 = position.left + this.$element.outerWidth();
            var tmp_h_2 = position.left + this.$datepicker.outerWidth();

            position.left = position.left - (tmp_h_2 - tmp_h_1);

        }

        return {
            left: position.left,
            top: position.top + this.$element[0].offsetHeight + 2,
            zIndex: this.options.zIndex
        };
    };

    /**
     * 初始化
     * @return {Void}
     */
    DatePicker.prototype.init = function () {
        if (this.isInput) {
            this.$element.attr('readonly', 'readonly');
        }

        this.$groupBox = this.$element.parent(this.options.inputGroup);

        this.initMinMaxDate();

        if (this.canBuild()) {
            this.createPanel();
            this.eventBind();
        } else {
            //console.log('最大日期必须大于最小日期');
        }
    };

    /**
     * 初始化最小和最大日期
     * @return {Void}
     */
    DatePicker.prototype.initMinMaxDate = function () {

        var today = new Date();

        if (this.options.minDate) {
            if (this.options.minDate === 'today') {
                this.minDate = today;
            } else {
                this.minDate = new Date(this.options.minDate.replace(/-/g, "/"));
            }
            this.options.year.min = this.minDate.getFullYear();
        }

        if (this.options.maxDate) {
            if (this.options.maxDate === 'today') {
                this.maxDate = today;
            } else {
                this.maxDate = new Date(this.options.maxDate.replace(/-/g, "/"));
            }
            this.options.year.max = this.maxDate.getFullYear();
        }

        if (this.maxDate && this.format(this.maxDate, 'yyyyMMdd') < this.format(today, 'yyyyMMdd')) {
            this.year = this.maxDate.getFullYear();
            this.month = this.maxDate.getMonth() + 1;
            this.day = this.maxDate.getDate();

        } else if (this.minDate && this.format(this.minDate, 'yyyyMMdd') > this.format(today, 'yyyyMMdd')) {
            this.year = this.minDate.getFullYear();
            this.month = this.minDate.getMonth() + 1;
            this.day = this.minDate.getDate();
        }

    }

    /**
     * 判断是否可以创建
     * @return {Bolean}
     */
    DatePicker.prototype.canBuild = function () {

        if (this.maxDate && this.minDate && this.format(this.maxDate, 'yyyyMMdd') < this.format(this.minDate, 'yyyyMMdd')) {
            return false;
        }

        return true;
    };

    /**
     * 事件绑定
     * @return {Void}
     */
    DatePicker.prototype.eventBind = function () {
        var self = this;

        this.$groupBox.on('click.datepicker', 'button', function () {
            self.show();
            return false;
        });

        this.$element.on('click.datepicker', function () {
            if (self.options.desktop) {
                return;
            }
            self.show();
            return false;
        });

        this.$datepicker.on('click.datepicker', function (e) {
            var target = e.target,
                $target = $(target);

            if (target.id === 'year' || target.id === 'month' ||
                $target.parents('.year-box:eq(0)').length > 0 || $target.parents('.month-box:eq(0)').length > 0) {
                return false;
            }

            self.yearBoxToggle(false);
            self.monthBoxToggle(false);
            self.timePanelHide();
            return false;
        }).on('click.datepicker', '[role=prev]', function () {
            //向前
            self.month--;
            self.prevToggle();

            if (self.month < 1) {
                self.month = 12;
                self.year--;
            }
            self.$next.show();
            self.createDays();
            self.change();
        }).on('click.datepicker', '[role=next]', function () {
            //向后
            self.month++;
            self.nextToggle();
            if (self.month > 12) {
                self.month = 1;
                self.year++;
            }
            self.$prev.show();
            self.createDays();
            self.change();
        }).on('click.datepicker', '#month', function () {
            //点击月份
            self.monthBoxToggle(true);
            self.yearBoxToggle(false);
            self.timePanelHide();
        }).on('click.datepicker', '.month-box li', function () {
            //选择月份
            var $this = $(this),
                month = $this.attr("data-month");

            if ($this.hasClass('disabled')) {
                return;
            }

            self.month = Number($.trim(month));
            self.monthBoxToggle(false);
            self.createDays();
            self.prevToggle();
            self.nextToggle();
            self.change();
        }).on('click.datepicker', '#year', function () {
            //点击年份
            self.yearBoxToggle(true);
            self.monthBoxToggle(false);
            self.timePanelHide();
        }).on('click.datepicker', '.year-box li', function () {
            //选择年份
            var $this = $(this),
                text = Number($.trim($this.text()));

            if ($this.hasClass("cur") || $this.hasClass('disabled')) { return; }
            self.$yearBox.find("li").removeClass("cur");
            $this.addClass("cur");

            self.year = Number(text);
            self.createDays();
            self.yearBoxToggle(false);
            self.prevToggle();
            self.nextToggle();
            self.change();
        }).on('click.datepicker', '[role=yearPrev]', function () {
            //向前选择年份
            if (self.index === 0) {
                return;
            }
            self.index--;
            self.toCurYearPanel();

        }).on('click.datepicker', '[role=yearNext]', function () {
            //向后选择年份
            if (self.index === self.$yearItems.length - 1) {
                return;
            }
            self.index++;
            self.toCurYearPanel();
        }).on('click.datepicker', '[role=clear]', function () {
            //清空
            if (self.isInput) {
                self.$element.val('');
            }
            else {
                $.data(self.$element[0], 'value', '');
            }
            self.isSetTime = false;
            self.setTodayInfo();
            self.createDays();
            self.setViewInfo();
            self.hide();

            $.map(self.event.clean, function (v) {
                v();
            });

        }).on('click.datepicker', '[role=today]', function () {
            //今天
            self.setTodayInfo();
            self.createDays();
            self.hide();
            self.set(true);
            self.setTime();
        }).on('click.datepicker', 'tbody td', function () {
            //点击天
            var $this = $(this),
                year = $this.attr('data-year'),
                month = $this.attr('data-month'),
                day = $this.attr('data-day');

            if ($this.hasClass('disabled')) { return; }

            year = Number(year);
            month = Number(month);
            day = Number(day);

            self.year = year;
            self.month = month;
            self.day = day;
            self.createDays();

            if (!self.options.showTime) {
                self.set();
                if (self.options.desktop) {
                    return;
                }
                self.hide();
            }

        }).on('click.datepicker', 'span.hours', function () {
            //点击小时
            self.setTimePanelPosition($(this), self.$hoursBox);
            return false;
        }).on('click.datepicker', 'span.minutes', function () {
            //点击分种
            self.setTimePanelPosition($(this), self.$minutesBox);
            return false;
        }).on('click.datepicker', 'span.seconds', function () {
            //点击秒
            self.setTimePanelPosition($(this), self.$secondsBox);
            return false;
        }).on('click.datepicker', '.time-box li', function () {
            //选择时、分、秒
            var $this = $(this),
                value = $this.attr('data-value'),
                text = $this.text(),
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
        }).on('click.datepicker', '[role=confirm]', function () {
            //点击确定

            var $curDay = self.$datepicker.find('td span.active'),
                $parent = $curDay.parent(),
                year = $parent.attr('data-year'),
                month = $parent.attr('data-month'),
                day = $parent.attr('data-day');


            self.isSetTime = true;
            self.year = Number(year);
            self.month = Number(month);
            self.day = Number(day);
            self.hours = Number(self.$hours.text());
            self.minutes = Number(self.$minutes.text());
            self.seconds = Number(self.$seconds.text());
            self.set();
            self.hide();
        });

        $(document).on('click.datepicker', function () {
            if (self.options.desktop) {
                return;
            }
            self.hide();
        });
    };

    /**
     * 创建容器
     * @return {Void}
     */
    DatePicker.prototype.createPanel = function () {
        var html = [], i;

        html.push('<div class="k-datepicker k-pop-panel"  data-desktop="' + (this.options.desktop ? "true" : "") + '" >');
        html.push('<div class="k-container">');
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
        for (i = 0; i < dates.daysMin.length; i++) {
            html.push('<th>' + dates.daysMin[i] + '</th>');
        }
        html.push('</tr>');
        html.push('</thead>');

        html.push('<tbody>');
        html.push('</tbody>');


        html.push('</table>');
        html.push(this.getYearBox());
        html.push(this.getMonthBox());

        html.push('<div class="line"></div>');

        html.push(this.getTimeBox());

        html.push('<div class="operate-box" style="text-align:right;margin-bottom:5px;">');
        html.push('<input type="button" value="清空" role="clear" class="k-btn k-btn-default" />&nbsp;');

        var todayHtml = '<input type="button" value="今天" role="today" class="k-btn k-btn-success" />&nbsp;';

        if (this.minDate && this.maxDate &&
            this.format(this.maxDate, 'yyyyMMdd') >= this.format(new Date(), 'yyyyMMdd') ||
            (!this.minDate && !this.maxDate)) {
            html.push(todayHtml);
        } else if (this.minDate && !this.maxDate && this.format(this.minDate, 'yyyyMMdd') <= this.format(new Date(), 'yyyyMMdd')) {
            html.push(todayHtml);
        } else if (this.maxDate && !this.minDate && this.format(this.maxDate, 'yyyyMMdd') >= this.format(new Date(), 'yyyyMMdd')) {
            html.push(todayHtml);
        }


        if (this.options.showTime) {
            html.push('<input type="button" value="确定" role="confirm" class="k-btn k-btn-primary" />&nbsp;');
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
        this.$line = this.$datepicker.find('.line');
        this.$timeBox = this.$datepicker.find('.time-box');
        this.$operateBox = this.$datepicker.find('.operate-box');
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

        if (this.options.desktop) {

            if (this.options.footerHtml) {
                this.$datepicker.append('<div>' + this.options.footerHtml + '</div>');
            }

            this.$line.hide();
            this.$timeBox.hide();
            this.$operateBox.hide();

            this.$datepicker.appendTo(this.$element).show().css({
                boxShadow: 'none'
            });


            return;
        }

        this.$datepicker.appendTo(this.options.appendTo.length == 0 ? document.body : this.options.appendTo);
    };

    /**
     * 获取年份HTML
     * @return {String}
     */
    DatePicker.prototype.getYearBox = function () {
        var html = [], contentHtml = [], flag = 1, count = 1,
        totalCount = (this.options.year.max - this.options.year.min) + 1,
        year = this.options.year.min - 1,
        page, i, j;

        //分页
        if (totalCount % 10 === 0) {
            page = totalCount / 10;
        } else {
            page = Number(totalCount / 10) + 1;
        }

        var disabled;

        for (i = 1; i <= page; i++) {

            contentHtml.push('<ul>');

            for (j = flag; j <= totalCount ; j++) {

                year += 1;


                contentHtml.push('<li id="li_' + year + '" class="' + (this.year === year ? "cur" : "") + '" >' + year + '</li>');

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

    /**
     * 获取月份HTML
     * @return {String}
     */
    DatePicker.prototype.getMonthBox = function () {
        var html = [], i, month, monthText, disabled;

        html.push('<ul class="month-box">');

        for (i = 0; i < dates.months.length; i++) {
            monthText = dates.months[i];
            month = i + 1;
            html.push('<li class="' + disabled + '" data-month="' + (i + 1) + '">' + monthText + '</li>');
        }

        html.push('</ul>');

        return html.join('');
    };

    /**
     * 获取时间HTML
     * @return {String}
     */
    DatePicker.prototype.getTimeBox = function () {
        var html = [], /*date = new Date(),*/ i;

        html.push('<div class="time-box">');

        //小时
        html.push('<ul class="hours-box">');
        for (i = 0; i < 24; i++) {
            html.push('<li data-target="hours" data-value=' + i + '>' + this.supStr(i) + '</li>');
        }
        html.push('</ul>');

        //分
        html.push('<ul class="minutes-box">');
        for (i = 0; i <= 55; i += 5) {
            html.push('<li data-target="minutes" data-value=' + i + '>' + this.supStr(i) + '</li>');
        }
        html.push('</ul>');

        //秒
        html.push('<ul class="seconds-box">');
        for (i = 0; i <= 55; i += 15) {
            html.push('<li data-target="seconds" data-value=' + i + '>' + this.supStr(i) + '</li>');
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

    /**
     * 创建天数
     * @param {Number} year - 年
     * @param {Number} month - 月
     * @param {Number} day - 日
     * @return {Void}
     */
    DatePicker.prototype.createDays = function (year, month, day) {
        var self = this;
        var i, j, disabled;
        this.setSelectivelyDate();
        year = year || this.year;
        month = month || this.month;
        day = day || this.day;


        function getDisabledClass(curDate) {

            function getMinDisabledClass(curDate) {
                if (self.format(curDate, 'yyyyMMdd') < self.format(self.minDate, 'yyyyMMdd')) {
                    return 'disabled';
                }
                return '';
            };

            function getMaxDisabledClass(curDate) {
                if (self.format(curDate, 'yyyyMMdd') > self.format(self.maxDate, 'yyyyMMdd')) {
                    return 'disabled';
                }
                return '';
            };


            if (self.minDate && self.maxDate) {

                var minClass = getMinDisabledClass(curDate),
                    maxClass = getMaxDisabledClass(curDate);

                if (minClass.length > 0) { return minClass; }
                if (maxClass.length > 0) { return maxClass; }

            } else if (self.minDate) {
                return getMinDisabledClass(curDate);
            } else if (self.maxDate) {
                return getMaxDisabledClass(curDate);
            }

            return '';
        };


        //当月最后一天  new Date('2014/4/0').getDate() 表示获取2014年3月最后一天
        var curMonthLastDay = this.getMonthLastDay(year, month);

        //前一个月最后一天
        var prevMonthLastDay = this.getMonthLastDay(year, month - 1);

        //当月第一天星期几
        var fristDay = new Date(year, month - 1, 1).getDay();

        //创建42个长度的数组
        var arr = new Array(42), arrDaysHtml = [], tmp = 42 - curMonthLastDay;

        //存放天数，下标j为星期几
        for (i = 0, j = fristDay; i < curMonthLastDay; i++, j++) {
            arr[j] = { year: year, month: month, day: i + 1, tdClass: getDisabledClass(new Date(year, month - 1, i + 1)) };
            if (i + 1 === curMonthLastDay) {
                tmp = 42 - j;
            }

        }

        //前补位
        for (i = fristDay, j = 0; i >= 1  ; i--, j++) {
            var disabledClass;

            if (month === 1) {
                disabledClass = getDisabledClass(new Date(year - 1, 11, prevMonthLastDay - i + 1));
                arr[j] = { year: year - 1, month: 12, day: prevMonthLastDay - i + 1, tdClass: 'old ' + disabledClass };
            } else {
                disabledClass = getDisabledClass(new Date(year, month - 2, prevMonthLastDay - i + 1));
                arr[j] = { year: year, month: month - 1, day: prevMonthLastDay - i + 1, tdClass: 'old ' + disabledClass };
            }
        }

        //后补位
        for (i = (42 - tmp) + 1, j = 1 ; i < 42; i++, j++) {

            var disabledClass;

            if (month === 12) {
                disabledClass = getDisabledClass(new Date(year + 1, 0, j));
                arr[i] = { year: year + 1, month: 1, day: j, tdClass: 'new ' + disabledClass };
            } else {
                disabledClass = getDisabledClass(new Date(year, month, j));
                arr[i] = { year: year, month: month + 1, day: j, tdClass: 'new ' + disabledClass };
            }
        }

        //构造表格
        var flag = 0, count = 0, curValue, todayClass, dotHtml;
        for (i = 0; i < 6; i++) {
            arrDaysHtml.push("<tr>");
            for (j = flag; j < 42; j++) {

                curValue = arr[j];

                if (curValue.year === year &&
                    curValue.month === month &&
                    this.day === curValue.day) {
                    todayClass = "today";
                } else {
                    todayClass = "";
                }

                dotHtml = this.getDotHtml(curValue.year + '-' + this.fixZero(curValue.month) + '-' + this.fixZero(curValue.day));

                arrDaysHtml.push('<td id="' + curValue.year + '_' + curValue.month + '_' + curValue.day + '" class="' + curValue.tdClass + '   ' + todayClass + '  " data-year="' + curValue.year + '" data-month="' + curValue.month + '" data-day="' + curValue.day + '"><span>' + curValue.day + '</span>' + dotHtml + '</td>');
                flag++;
                count++;
                if (count === 7) {
                    count = 0;
                    break;
                }
            }
            arrDaysHtml.push("</tr>");
        }

        this.$datepicker.find("tbody").html(arrDaysHtml.join(""));
        this.setViewInfo(year, month, day);
    };

    /**
     * 不足两位补0
     * @param {String} value - 值
     * @return {String}
     */
    DatePicker.prototype.fixZero = function (value) {

        value = String(value);

        if (value.length === 0) {
            return '';
        }

        if (value.length === 1) {
            value = ('0' + value);

            return value;
        }

        return value;
    };

    /**
     * 取圆点HTML
     * @param {String} strDate - 日期
     * @return {String}
     */
    DatePicker.prototype.getDotHtml = function (strDate) {
        if (!this.options.data || this.options.data.length === 0) {
            return '';
        }

        for (var i = 0, data; i < this.options.data.length; i++) {
            data = this.options.data[i];
            if (data === strDate) {
                return '<em class="dot"></em>';
            }
        }
        return '';
    };

    /**
     * 获取月份最后1天
     * @param {Number} year - 年
     * @param {Number} month - 月
     * @return {Number}
     */
    DatePicker.prototype.getMonthLastDay = function (year, month) {
        return (new Date(new Date(year, month, 1).getTime() - 1000 * 60 * 60 * 24)).getDate();
    };

    /**
     * 年份选择框显示切换
     * @param {Boolean} isShow - 是否显示
     * @return {Void}
     */
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

    /**
     * 月份选择框显示切换
     * @param {Boolean} isShow - 是否显示
     * @return {Void}
     */
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

    /**
     * 隐藏时间容器
     * @return {Void}
     */
    DatePicker.prototype.timePanelHide = function () {
        this.$hoursBox.hide();
        this.$minutesBox.hide();
        this.$secondsBox.hide();
    };

    /**
     * 显示当前选中年份的选择框
     * @return {Void}
     */
    DatePicker.prototype.toCurYearPanel = function () {
        this.$yearItems.hide().eq(this.index).show();
    };

    /**
     * 向前按钮显示切换
     * @return {Void}
     */
    DatePicker.prototype.prevToggle = function () {

        var min = 1;

        if (this.minDate) {
            min = this.minDate.getMonth() + 1;
        } else if (this.maxDate) {
            min = this.maxDate.getMonth() + 1;
        }

        if (this.year === this.options.year.min && this.month === min) {
            this.$prev.hide();
        } else {
            this.$prev.show();
        }
    };

    /**
     * 向后按钮显示切换
     * @return {Void}
     */
    DatePicker.prototype.nextToggle = function () {

        var max = 12;

        if (this.maxDate) {
            max = this.maxDate.getMonth() + 1;
        } else if (this.minDate) {
            max = this.minDate.getMonth() + 1;
        }

        if (this.year === this.options.year.max && this.month === max) {
            this.$next.hide();
        } else {
            this.$next.show();
        }
    };

    /**
     * 设置可选日期
     * @return {Void}
     */
    DatePicker.prototype.setSelectivelyDate = function () {

        var minYear, maxYear, minMonth, maxMonth, minDay, maxDay;
        var $li = this.$monthBox.find('li').removeClass('disabled');
        var self = this;

        //设置最小日期
        function setMinDate($li) {
            var minYear = self.minDate.getFullYear();
            var minMonth = self.minDate.getMonth() + 1;
            var minDay = self.minDate.getDate();

            if (minYear == self.year) {

                if (minMonth > self.month) {

                    self.month = minMonth;

                    if (minDay < self.day) {
                        self.day = minDay;
                    }
                }

                if (self.month == minMonth && minDay > self.day) {
                    self.day = minDay;
                }

                setMinDisabled($li, minMonth);
            }

        };

        //设置最大日期
        function setMaxDate($li) {

            var maxYear = self.maxDate.getFullYear();
            var maxMonth = self.maxDate.getMonth() + 1;
            var maxDay = self.maxDate.getDate();

            if (maxYear == self.year) {

                if (maxMonth < self.month) {
                    self.month = maxMonth;

                    if (maxDay > self.day) {
                        self.day = maxDay;
                    }

                }
                if (maxMonth == self.month && maxDay < self.day) {
                    self.day = maxDay;
                }
                setMaxDisabled($li, maxMonth);
            }
        };

        //禁用最小月份选择
        function setMinDisabled($li, minMonth) {
            $li.each(function () {
                var $this = $(this),
                    month = $this.attr('data-month');
                if (month < minMonth) {
                    $this.addClass('disabled');
                }
            });
        };

        //禁用最大月份选择
        function setMaxDisabled($li, maxMonth) {
            $li.each(function () {
                var $this = $(this),
                    month = $this.attr('data-month');
                if (month > maxMonth) {
                    $this.addClass('disabled');
                }
            });
        };

        if (this.minDate && this.maxDate) {
            setMinDate($li);
            setMaxDate($li);
        } else if (this.minDate) {
            setMinDate($li);
        } else if (this.maxDate) {
            setMaxDate($li);
        }
    };

    /**
     * 显示日期选择器前初始化参数
     * @return {Void}
     */
    DatePicker.prototype.showInit = function () {
        var value;
        if (this.isInput) {
            value = $.trim(this.$element.val());
        }
        else {
            value = $.trim($.data(this.$element[0], 'value'));
        }

        if (value.length === 0) { return; }

        var regDate = /(\d{4}).{1}(\d{2}).{1}(\d{2})/;
        var regTime = /(\d{2}):(\d{2}):(\d{2})/;
        var dateMatches = value.match(regDate);
        var timeMatches = value.match(regTime);

        if (dateMatches && dateMatches.length > 0) {
            this.year = Number(dateMatches[1]);
            this.month = Number(dateMatches[2]);
            this.day = Number(dateMatches[3]);
        }

        if (timeMatches && timeMatches.length > 0) {
            this.hours = Number(timeMatches[1]);
            this.minutes = Number(timeMatches[2]);
            this.seconds = Number(timeMatches[3]);
        }
    };

    /**
     * 显示日期选择器
     * @return {Void}
     */
    DatePicker.prototype.show = function () {

        $('div.k-pop-panel,ul.k-pop-panel').each(function () {
            var desktop = this.getAttribute("data-desktop");
            if (!desktop || desktop != 'true') {
                $(this).hide();
            }
        });

        if (this.options.showTime && !this.isSetTime) {
            this.setTodayInfo();
            this.createDays();
            this.setViewInfo();
            this.setTime();
        } else {
            this.showInit();
            this.createDays();
            this.setViewInfo();
        }

        var position = this.options.positionProxy();
        this.$datepicker.show().css(position);
    };

    /**
     * 隐藏日期选择器
     * @return {Void}
     */
    DatePicker.prototype.hide = function () {
        this.$datepicker.hide();
        this.yearBoxToggle(false);
        this.monthBoxToggle(false);
        this.timePanelHide();
    };

    /**
     * 设置日期
     * @return {Void}
     */
    DatePicker.prototype.setValue = function (dateText) {
        if (!dateText) {
            return;
        }
        if (this.isInput) {
            this.$element.val(dateText);
        }
        else {
            $.data(this.$element[0], 'value', dateText);
        }
    };

    /**
     * 获取日期
     * @return {Void}
     */
    DatePicker.prototype.getValue = function () {
        if (this.isInput) {
            return this.$element.val();
        }
        else {
            return $.data(this.$element[0], 'value');
        }
    };

    /**
     * 设置时分秒选择框显示的位置
     * @param {JQuery} $curObj - 当前要设置时，分或秒的jquery元素
     * @param {JQuery} $panel - 时、分或秒对应的选择框
     * @return {Void}
     */
    DatePicker.prototype.setTimePanelPosition = function ($curObj, $panel) {
        var css = { left: $curObj.position().left - 1, top: $curObj.position().top - $panel.outerHeight() };
        $panel.show().css(css).siblings('ul').hide();
        this.yearBoxToggle(false);
        this.monthBoxToggle(false);
    };

    /**
     * 设置今天的日期相关参数
     * @return {Void}
     */
    DatePicker.prototype.setTodayInfo = function () {
        var today = new Date();
        this.year = today.getFullYear();
        this.month = today.getMonth() + 1;
        this.day = today.getDate();
        this.hours = today.getHours();
        this.minutes = today.getMinutes();
        this.seconds = today.getSeconds();
    };

    /**
     * 日期选择器View相关设置
     * @param {Number} year - 年
     * @param {Number} month - 月
     * @param {Number} day - 日
     * @return {Void}
     */
    DatePicker.prototype.setViewInfo = function (year, month, day) {

        year = year || this.year;
        month = month || this.month;
        day = day || this.day;

        this.prevToggle();
        this.nextToggle();
        this.$year.html(year);
        this.$month.html(dates.months[month - 1]);
        this.$yearBox.find("li").removeClass("cur");
        this.$yearBox.find("#li_" + year).addClass("cur").parent().show().siblings().hide();
        this.$datepicker.find('tbody td span').removeClass('active');
        this.$datepicker.find('#' + year + '_' + month + '_' + day).children().addClass('active');
        this.index = this.$yearItems.find("li.cur").parent().show().index();
    };

    /**
     * 设置时间
     * @return {Void}
     */
    DatePicker.prototype.setTime = function () {
        var date = new Date();

        var curHours = date.getHours(),
            curMinutes = date.getMinutes(),
            curSeconds = date.getSeconds();

        this.$hours.text(this.isSetTime ? this.supStr((this.hours || curHours)) : this.supStr(curHours));
        this.$minutes.text(this.isSetTime ? this.supStr((this.minutes || curMinutes)) : this.supStr(curMinutes));
        this.$seconds.text(this.isSetTime ? this.supStr((this.seconds || curSeconds)) : this.supStr(curSeconds));
    };

    /**
     * 设置日期到绑定元素
     * @param {Boolean} isToday - 是否设置今天日期
     * @return {Void}
     */
    DatePicker.prototype.set = function (isToday) {
        var value = this.getDateValue(isToday);
        if (this.isInput) {
            this.$element.val(value).focus().blur();
        }
        else {
            this.$element.data('value', value);
        }
        $.map(this.event.selected, function (v) {
            v(value);
        });
    };

    /**
     * 设置日期到绑定元素
     * @param {Boolean} isToday - 是否设置今天日期
     * @return {Void}
     */
    DatePicker.prototype.change = function (isToday) {
        var value = this.getDateValue(isToday);
        $.map(this.event.change, function (v) {
            v(value);
        });
    };

    /**
     * 取当前选中的日期
     * @param {Boolean} isToday - 是否当天日期
     * @return {String}
     */
    DatePicker.prototype.getDateValue = function (isToday) {

        isToday = isToday || false;
        this.isSetTime = true;
        var today = new Date();
        var year = isToday ? today.getFullYear() : this.year,
            month = isToday ? today.getMonth() : this.month - 1,
            day = isToday ? today.getDate() : this.day,
            hours = isToday || !this.options.showTime ? today.getHours() : (typeof this.hours == 'undefined' ? today.getHours() : this.hours),
            minutes = isToday || !this.options.showTime ? today.getMinutes() : (typeof this.minutes=='undefined'?  today.getMinutes():this.minutes),
            seconds = isToday || !this.options.showTime ? today.getSeconds() : (typeof this.seconds=='undefined'? today.getSeconds():this.seconds);

        var now = new Date(year, month, day, hours, minutes, seconds);
        var value = this.format(now);

        return value;
    };


    /**
     * 获取日期格式化后的字符串
     * @param {Object} date - 日期对象
     * @return {String}
     */
    DatePicker.prototype.format = function (date, formatStr) {
        date = date || new Date();

        var formatStr = formatStr || this.options.format.replace(/"/g, "");

        var o = {
            "y+": date.getFullYear(),
            "M+": date.getMonth() + 1,
            "d+": date.getDate(),
            "h+": date.getHours(),
            "m+": date.getMinutes(),
            "s+": date.getSeconds()
        }, k, value;

        for (k in o) {
            if (new RegExp("(" + k + ")").test(formatStr)) {
                value = o[k];
                formatStr = formatStr.replace(RegExp.$1, value.toString().length === 1 ? ("0" + value.toString()) : value);
            }
        }

        return formatStr;
    };

    /**
     * 不足两个字符补0
     * @param {String} str - 时分秒字符串
     * @return {String}
     */
    DatePicker.prototype.supStr = function (str) {
        str = String(str);
        if (str.length === 1) {
            return '0' + str;
        }

        return str;
    };

    /**
     * 全局日期选择器绑定
     * @param {JQuery} $elements - 全局元素
     * @return {Void}
     */
    DatePicker.Global = function ($elements) {
        $elements = $elements || $(document.body).find('input[data-module="datepicker"]');
        $elements.each(function () {
            var $this = $(this),
                options = $this.attr('data-options'),
                format = $this.attr('data-format'),
                showTime = $this.attr('data-showTime'),
                minDate = $this.attr('data-minDate'),
                maxDate = $this.attr('data-maxDate'),
                position = $this.attr('data-position'),
                appendTo = $this.attr('data-appendTo'),
                onSelected = $this.attr('data-onselected'),
                onClean = $this.attr('data-onclean');

            var data = $.data($this[0], 'datepicker');


            if (!data) {

                showTime = showTime ? showTime === "true" : false;
                onSelected = onSelected && onSelected.length > 0 ? eval('(0,' + onSelected + ')') : null;
                onClean = onClean && onClean.length > 0 ? eval('(0,' + onClean + ')') : null;


                if (options && options.length > 0) {
                    options = eval('(0,' + options + ')');
                } else {
                    options = {
                        format: format,
                        showTime: showTime,
                        minDate: minDate,
                        maxDate: maxDate,
                        position: position || 'left',
                        appendTo: $(appendTo || document.body)
                    };
                }

                data = new DatePicker($this, options);

                if (onSelected) {
                    data.on('selected', onSelected);
                }

                if (onClean) {
                    data.on('clean', onClean);
                }

                $.data($this[0], 'datepicker', data);
            }
        });
    };

    return DatePicker;

});
